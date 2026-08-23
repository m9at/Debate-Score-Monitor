import { Router, type Request, type Response, type NextFunction } from "express";
import { randomUUID } from "node:crypto";
import {
  db,
  judgeProfiles,
  teamProfiles,
  tournamentParticipations,
  registrationLinks,
} from "@workspace/db";
import { and, eq, inArray } from "drizzle-orm";

/**
 * Permanent judge/team profiles, their per-tournament participations, and the
 * lifecycle of each tournament's registration links.
 */
export const profilesRouter = Router();

const wrap =
  (fn: (req: Request, res: Response) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res)).catch(next);

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

/** Contact is the identity key, so it must normalise the same way every time. */
const normaliseContact = (v: unknown) =>
  str(v).toLowerCase().replace(/[\s\-()]/g, "");

const table = (role: string) =>
  role === "team" ? teamProfiles : judgeProfiles;

const ROLES = new Set(["judge", "team"]);
const STATUSES = new Set(["pending", "approved", "withdrawn"]);
const STATES = new Set(["open", "closed", "archived"]);

/* -------------------------------------------------------------- lookup */

/**
 * Does a profile already exist for this contact? The registration page calls
 * this first so a returning judge is greeted instead of re-registered.
 */
profilesRouter.get(
  "/api/profiles/:role/lookup",
  wrap(async (req, res) => {
    const role = param(req, "role");
    if (!ROLES.has(role)) {
      res.status(400).json({ error: "bad role" });
      return;
    }
    const contact = normaliseContact(req.query.contact);
    if (!contact) {
      res.status(400).json({ error: "missing contact" });
      return;
    }
    const t = table(role);
    const [profile] = await db.select().from(t).where(eq(t.contact, contact));
    if (!profile) {
      res.json({ found: false });
      return;
    }
    const participations = await db
      .select()
      .from(tournamentParticipations)
      .where(
        and(
          eq(tournamentParticipations.profileId, profile.id),
          eq(tournamentParticipations.role, role),
        ),
      );
    res.json({ found: true, profile, participations });
  }),
);

/* ----------------------------------------------------- register / join */

/**
 * Register through a tournament's link. Creates the permanent profile on the
 * first visit and reuses it afterwards; either way it attaches exactly one
 * participation for this tournament.
 */
profilesRouter.post(
  "/api/tournaments/:tournamentId/registrations/:role",
  wrap(async (req, res) => {
    const tournamentId = param(req, "tournamentId");
    const role = param(req, "role");
    if (!ROLES.has(role)) {
      res.status(400).json({ error: "bad role" });
      return;
    }

    const link = await getLink(tournamentId, role === "team" ? "team" : "judge");
    if (link.state !== "open") {
      res.status(409).json({ error: "registration_closed", state: link.state });
      return;
    }

    const { name, photoUrl, logoUrl, institution, experience, details, payload } =
      req.body ?? {};
    const contact = normaliseContact(req.body?.contact);
    if (!str(name) || !contact) {
      res.status(400).json({ error: "missing name or contact" });
      return;
    }
    const contactKind = contact.includes("@") ? "email" : "phone";
    const now = new Date();
    const t = table(role);

    const [existing] = await db.select().from(t).where(eq(t.contact, contact));
    let profileId = existing?.id ?? randomUUID();

    if (existing) {
      // Returning profile: refresh what the form is allowed to change.
      await db
        .update(t)
        .set({
          name: str(name),
          institution: str(institution) || existing.institution,
          ...(role === "team"
            ? {
                logoUrl: str(logoUrl) || (existing as typeof teamProfiles.$inferSelect).logoUrl,
                lastMembers: Array.isArray(payload?.members)
                  ? payload.members
                  : (existing as typeof teamProfiles.$inferSelect).lastMembers,
              }
            : {
                photoUrl: str(photoUrl) || (existing as typeof judgeProfiles.$inferSelect).photoUrl,
                experience:
                  str(experience) ||
                  (existing as typeof judgeProfiles.$inferSelect).experience,
              }),
          details: details && typeof details === "object" ? details : existing.details,
          updatedAt: now,
        })
        .where(eq(t.id, existing.id));
    } else if (role === "team") {
      await db.insert(teamProfiles).values({
        id: profileId,
        name: str(name),
        contact,
        contactKind,
        logoUrl: str(logoUrl) || null,
        institution: str(institution) || null,
        lastMembers: Array.isArray(payload?.members) ? payload.members : [],
        details: details && typeof details === "object" ? details : {},
      });
    } else {
      await db.insert(judgeProfiles).values({
        id: profileId,
        name: str(name),
        contact,
        contactKind,
        photoUrl: str(photoUrl) || null,
        institution: str(institution) || null,
        experience: str(experience) || null,
        details: details && typeof details === "object" ? details : {},
      });
    }

    // One participation per profile per tournament — re-submitting updates it.
    const participationId = randomUUID();
    await db
      .insert(tournamentParticipations)
      .values({
        id: participationId,
        tournamentId,
        role,
        profileId,
        status: "pending",
        payload: payload && typeof payload === "object" ? payload : {},
      })
      .onConflictDoUpdate({
        target: [
          tournamentParticipations.tournamentId,
          tournamentParticipations.role,
          tournamentParticipations.profileId,
        ],
        set: {
          payload: payload && typeof payload === "object" ? payload : {},
          updatedAt: now,
        },
      });

    const [profile] = await db.select().from(t).where(eq(t.id, profileId));
    res.json({ ok: true, reused: Boolean(existing), profile });
  }),
);

/* ------------------------------------------------- admin: participants */

/** Everyone registered for a tournament in one role, with their profile. */
profilesRouter.get(
  "/api/tournaments/:tournamentId/registrations/:role",
  wrap(async (req, res) => {
    const tournamentId = param(req, "tournamentId");
    const role = param(req, "role");
    if (!ROLES.has(role)) {
      res.status(400).json({ error: "bad role" });
      return;
    }
    const rows = await db
      .select()
      .from(tournamentParticipations)
      .where(
        and(
          eq(tournamentParticipations.tournamentId, tournamentId),
          eq(tournamentParticipations.role, role),
        ),
      );
    if (rows.length === 0) {
      res.json([]);
      return;
    }
    const t = table(role);
    const profiles = await db
      .select()
      .from(t)
      .where(inArray(t.id, rows.map((r) => r.profileId)));
    const byId = new Map(profiles.map((p) => [p.id, p]));
    res.json(
      rows.map((r) => ({
        id: r.id,
        status: r.status,
        payload: r.payload,
        createdAt: r.createdAt,
        profile: byId.get(r.profileId) ?? null,
      })),
    );
  }),
);

/** Approve / set back to pending / mark as not taking part. */
profilesRouter.patch(
  "/api/registrations/:id",
  wrap(async (req, res) => {
    const status = str(req.body?.status);
    if (!STATUSES.has(status)) {
      res.status(400).json({ error: "bad status" });
      return;
    }
    await db
      .update(tournamentParticipations)
      .set({ status, updatedAt: new Date() })
      .where(eq(tournamentParticipations.id, param(req, "id")));
    res.json({ ok: true });
  }),
);

/* ------------------------------------------------- registration links */

async function getLink(tournamentId: string, kind: "team" | "judge") {
  const [row] = await db
    .select()
    .from(registrationLinks)
    .where(
      and(
        eq(registrationLinks.tournamentId, tournamentId),
        eq(registrationLinks.kind, kind),
      ),
    );
  if (row) return row;
  const created = {
    id: randomUUID(),
    tournamentId,
    kind,
    state: "open" as const,
  };
  await db.insert(registrationLinks).values(created).onConflictDoNothing();
  return { ...created, updatedAt: new Date() };
}

/** Both links of a tournament, created on first read so the UI always has them. */
profilesRouter.get(
  "/api/tournaments/:tournamentId/registration-links",
  wrap(async (req, res) => {
    const tournamentId = param(req, "tournamentId");
    const [team, judge] = await Promise.all([
      getLink(tournamentId, "team"),
      getLink(tournamentId, "judge"),
    ]);
    res.json({ team, judge });
  }),
);

/** Close, reopen or archive a link. Registrations already made are untouched. */
profilesRouter.patch(
  "/api/tournaments/:tournamentId/registration-links/:kind",
  wrap(async (req, res) => {
    const tournamentId = param(req, "tournamentId");
    const kind = param(req, "kind") === "team" ? "team" : "judge";
    const state = str(req.body?.state);
    if (!STATES.has(state)) {
      res.status(400).json({ error: "bad state" });
      return;
    }
    await getLink(tournamentId, kind);
    await db
      .update(registrationLinks)
      .set({ state, updatedAt: new Date() })
      .where(
        and(
          eq(registrationLinks.tournamentId, tournamentId),
          eq(registrationLinks.kind, kind),
        ),
      );
    res.json({ ok: true, state });
  }),
);

function param(req: Request, name: string): string {
  const v = (req.params as Record<string, unknown>)[name];
  return typeof v === "string" ? v : Array.isArray(v) ? String(v[0] ?? "") : "";
}
