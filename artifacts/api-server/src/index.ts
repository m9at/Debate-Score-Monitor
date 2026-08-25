import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import { randomUUID } from "node:crypto";
import {
  db,
  judgeSessions,
  publicTournaments,
  tournamentRegistrations,
  sharedTournaments,
  tournamentGroups,
} from "@workspace/db";
import { eq, and, sql, desc } from "drizzle-orm";
import { profilesRouter } from "./routes/profiles";
import { draftsRouter } from "./routes/drafts";
import { serveWebClient } from "./static";

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(profilesRouter);
app.use(draftsRouter);

const PORT = parseInt(process.env.PORT || "5050", 10);

app.get("/api/healthz", (_req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

const wrap =
  (fn: (req: Request, res: Response) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res)).catch(next);

const param = (req: Request, name: string): string => {
  const v = (req.params as Record<string, unknown>)[name];
  return typeof v === "string" ? v : Array.isArray(v) ? String(v[0] ?? "") : "";
};

const serializeGroup = (r: typeof tournamentGroups.$inferSelect) => ({
  id: r.id,
  name: r.name,
  description: r.description ?? undefined,
  kind: r.kind,
  tournamentIds: (r.tournamentIds ?? []) as string[],
  createdAt: r.createdAt,
});

app.post(
  "/api/judge/sessions",
  wrap(async (req, res) => {
    const { tournamentId, matchInfo } = req.body ?? {};
    if (typeof tournamentId !== "string" || !matchInfo) {
      res.status(400).json({ error: "missing tournamentId or matchInfo" });
      return;
    }
    const id = randomUUID();
    await db.insert(judgeSessions).values({
      id,
      tournamentId,
      kind: "match",
      info: matchInfo,
      results: {},
    });
    res.json({ id });
  }),
);

app.post(
  "/api/judge/round-sessions",
  wrap(async (req, res) => {
    const { tournamentId, roundData } = req.body ?? {};
    if (typeof tournamentId !== "string" || !roundData) {
      res.status(400).json({ error: "missing tournamentId or roundData" });
      return;
    }
    const id = randomUUID();
    await db.insert(judgeSessions).values({
      id,
      tournamentId,
      kind: "round",
      info: roundData,
      results: {},
    });
    res.json({ id });
  }),
);

app.get(
  "/api/judge/sessions/:id",
  wrap(async (req, res) => {
    const rows = await db
      .select()
      .from(judgeSessions)
      .where(
        and(eq(judgeSessions.id, param(req, "id")), eq(judgeSessions.kind, "match")),
      );
    const row = rows[0];
    if (!row) {
      res.status(404).json({ error: "session not found" });
      return;
    }
    const r = (row.results as Record<string, unknown>) || {};
    res.json({
      tournamentId: row.tournamentId,
      matchInfo: row.info,
      result: r.result,
      submittedAt: r.submittedAt,
    });
  }),
);

app.get(
  "/api/judge/round-sessions/:id",
  wrap(async (req, res) => {
    const rows = await db
      .select()
      .from(judgeSessions)
      .where(
        and(eq(judgeSessions.id, param(req, "id")), eq(judgeSessions.kind, "round")),
      );
    const row = rows[0];
    if (!row) {
      res.status(404).json({ error: "session not found" });
      return;
    }
    res.json({
      tournamentId: row.tournamentId,
      roundData: row.info,
      results: row.results || {},
    });
  }),
);

app.put(
  "/api/judge/sessions/:id/result",
  wrap(async (req, res) => {
    const result = req.body;
    if (!result) {
      res.status(400).json({ error: "missing result body" });
      return;
    }
    await db
      .update(judgeSessions)
      .set({ results: { result, submittedAt: Date.now() } })
      .where(
        and(
          eq(judgeSessions.id, param(req, "id")),
          eq(judgeSessions.kind, "match"),
        ),
      );
    res.json({ ok: true });
  }),
);

app.put(
  "/api/judge/round-sessions/by-tournament/:tid/round/:n/info",
  wrap(async (req, res) => {
    const roundData = req.body;
    if (!roundData || typeof roundData !== "object") {
      res.status(400).json({ error: "missing roundData body" });
      return;
    }
    const tid = param(req, "tid");
    const n = parseInt(param(req, "n"), 10);
    if (!Number.isFinite(n)) {
      res.status(400).json({ error: "invalid round number" });
      return;
    }
    const result = await db.execute(sql`
      UPDATE judge_sessions
      SET info = COALESCE(info, '{}'::jsonb) || ${JSON.stringify(roundData)}::jsonb
      WHERE tournament_id = ${tid}
        AND kind = 'round'
        AND (info->>'roundNumber') ~ '^[0-9]+$'
        AND (info->>'roundNumber')::int = ${n}
    `);
    res.json({ ok: true, updated: result.rowCount ?? 0 });
  }),
);

app.put(
  "/api/judge/round-sessions/:id/results/:room",
  wrap(async (req, res) => {
    const scores = req.body;
    if (!scores) {
      res.status(400).json({ error: "missing scores body" });
      return;
    }
    const entry = { ...scores, submittedAt: Date.now() };
    const room = param(req, "room");
    await db.execute(sql`
      UPDATE judge_sessions
      SET results = COALESCE(results, '{}'::jsonb) || jsonb_build_object(${room}::text, ${JSON.stringify(entry)}::jsonb)
      WHERE id = ${param(req, "id")} AND kind = 'round'
    `);
    res.json({ ok: true });
  }),
);

app.delete(
  "/api/judge/sessions/:id",
  wrap(async (req, res) => {
    await db.delete(judgeSessions).where(eq(judgeSessions.id, param(req, "id")));
    res.json({ ok: true });
  }),
);

app.delete(
  "/api/judge/round-sessions/:id/results/:room",
  wrap(async (req, res) => {
    await db.execute(sql`
      UPDATE judge_sessions
      SET results = COALESCE(results, '{}'::jsonb) - ${param(req, "room")}::text
      WHERE id = ${param(req, "id")} AND kind = 'round'
    `);
    res.json({ ok: true });
  }),
);

app.get(
  "/api/judge/tournaments/:tid/results",
  wrap(async (req, res) => {
    const rows = await db
      .select()
      .from(judgeSessions)
      .where(eq(judgeSessions.tournamentId, param(req, "tid")));
    const out: Array<{
      sessionId: string;
      kind: string;
      info: unknown;
      results: unknown;
    }> = rows.map((r) => ({
      sessionId: r.id,
      kind: r.kind,
      info: r.info,
      results: r.results,
    }));
    res.json(out);
  }),
);

app.put(
  "/api/tournaments/:id",
  wrap(async (req, res) => {
    const id = param(req, "id");
    const { name, topic } = req.body ?? {};
    if (typeof name !== "string" || !name.trim()) {
      res.status(400).json({ error: "missing name" });
      return;
    }
    const safeTopic = typeof topic === "string" ? topic : "";
    await db
      .insert(publicTournaments)
      .values({ id, name: name.trim(), topic: safeTopic })
      .onConflictDoUpdate({
        target: publicTournaments.id,
        set: { name: name.trim(), topic: safeTopic, updatedAt: new Date() },
      });
    res.json({ ok: true });
  }),
);

app.get(
  "/api/tournaments/:id",
  wrap(async (req, res) => {
    const id = param(req, "id");
    const rows = await db
      .select()
      .from(publicTournaments)
      .where(eq(publicTournaments.id, id));
    const row = rows[0];
    if (!row) {
      res.status(404).json({ error: "tournament not found" });
      return;
    }
    res.json({ id: row.id, name: row.name, topic: row.topic });
  }),
);

app.post(
  "/api/tournaments/:id/registrations",
  wrap(async (req, res) => {
    const tournamentId = param(req, "id");
    const { kind, payload } = req.body ?? {};
    if (kind !== "team" && kind !== "judge") {
      res.status(400).json({ error: "invalid kind" });
      return;
    }
    if (!payload || typeof payload !== "object") {
      res.status(400).json({ error: "missing payload" });
      return;
    }
    const id = randomUUID();
    await db.insert(tournamentRegistrations).values({
      id,
      tournamentId,
      kind,
      payload,
    });
    res.json({ id });
  }),
);

app.get(
  "/api/tournaments/:id/registrations",
  wrap(async (req, res) => {
    const tournamentId = param(req, "id");
    const rows = await db
      .select()
      .from(tournamentRegistrations)
      .where(eq(tournamentRegistrations.tournamentId, tournamentId))
      .orderBy(desc(tournamentRegistrations.createdAt));
    res.json(
      rows.map((r) => ({
        id: r.id,
        tournamentId: r.tournamentId,
        kind: r.kind,
        payload: r.payload,
        createdAt: r.createdAt,
      })),
    );
  }),
);

app.delete(
  "/api/tournaments/:id/registrations/:rid",
  wrap(async (req, res) => {
    await db
      .delete(tournamentRegistrations)
      .where(
        and(
          eq(tournamentRegistrations.id, param(req, "rid")),
          eq(tournamentRegistrations.tournamentId, param(req, "id")),
        ),
      );
    res.json({ ok: true });
  }),
);

app.get(
  "/api/shared-tournaments",
  wrap(async (_req, res) => {
    const rows = await db
      .select()
      .from(sharedTournaments)
      .orderBy(desc(sharedTournaments.updatedAt));
    res.json(
      rows.map((r) => ({
        id: r.id,
        data: r.data,
        updatedAt: r.updatedAt,
      })),
    );
  }),
);

app.get(
  "/api/shared-tournaments/:id",
  wrap(async (req, res) => {
    const id = param(req, "id");
    const rows = await db
      .select()
      .from(sharedTournaments)
      .where(eq(sharedTournaments.id, id));
    const row = rows[0];
    if (!row) {
      res.status(404).json({ error: "shared tournament not found" });
      return;
    }
    res.json({ id: row.id, data: row.data, updatedAt: row.updatedAt });
  }),
);

app.put(
  "/api/shared-tournaments/:id",
  wrap(async (req, res) => {
    const id = param(req, "id");
    const data = req.body;
    if (!data || typeof data !== "object") {
      res.status(400).json({ error: "missing data" });
      return;
    }
    const now = new Date();
    await db
      .insert(sharedTournaments)
      .values({ id, data, updatedAt: now })
      .onConflictDoUpdate({
        target: sharedTournaments.id,
        set: { data, updatedAt: now },
      });
    res.json({ ok: true, updatedAt: now.toISOString() });
  }),
);

app.delete(
  "/api/shared-tournaments/:id",
  wrap(async (req, res) => {
    await db
      .delete(sharedTournaments)
      .where(eq(sharedTournaments.id, param(req, "id")));
    res.json({ ok: true });
  }),
);

/* ---------------------------------------------------------------- folders */

app.get(
  "/api/tournament-groups",
  wrap(async (_req, res) => {
    const rows = await db
      .select()
      .from(tournamentGroups)
      .orderBy(desc(tournamentGroups.createdAt));
    res.json(rows.map(serializeGroup));
  }),
);

app.put(
  "/api/tournament-groups/:id",
  wrap(async (req, res) => {
    const id = param(req, "id");
    const { name, description, kind, tournamentIds, createdAt } = req.body ?? {};
    if (typeof name !== "string" || !name.trim()) {
      res.status(400).json({ error: "missing name" });
      return;
    }
    const values = {
      id,
      name: name.trim(),
      description: typeof description === "string" ? description : null,
      kind: kind === "archive" ? "archive" : "normal",
      tournamentIds: Array.isArray(tournamentIds) ? tournamentIds : [],
      createdAt: typeof createdAt === "number" ? createdAt : Date.now(),
      updatedAt: new Date(),
    };
    await db
      .insert(tournamentGroups)
      .values(values)
      .onConflictDoUpdate({
        target: tournamentGroups.id,
        set: {
          name: values.name,
          description: values.description,
          kind: values.kind,
          tournamentIds: values.tournamentIds,
          updatedAt: values.updatedAt,
        },
      });
    res.json({ ok: true });
  }),
);

app.delete(
  "/api/tournament-groups/:id",
  wrap(async (req, res) => {
    await db
      .delete(tournamentGroups)
      .where(eq(tournamentGroups.id, param(req, "id")));
    res.json({ ok: true });
  }),
);

if (process.env.NODE_ENV === "production") {
  serveWebClient(app);
}

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const msg = err instanceof Error ? err.message : "internal error";
  res.status(500).json({ error: msg });
});

app.listen(PORT, "0.0.0.0", () => {
  process.stdout.write(`[api-server] listening on :${PORT}\n`);
});
