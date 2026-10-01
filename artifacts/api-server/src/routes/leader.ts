import { Router, type Request, type Response, type NextFunction } from "express";
import { randomUUID } from "node:crypto";
import { db, judgeSessions } from "@workspace/db";
import { and, eq } from "drizzle-orm";

/**
 * Leadership debate (مناظرة قيادية): individuals, not teams. One judge_sessions
 * row (kind = 'leader') holds the whole tournament: `info` is the organiser's
 * config (days → rooms → individuals + judges, score range) and `results` is
 * keyed `${roomId}::${judgeName}` → { roomId, judgeName, scores, submittedAt }.
 */
export const leaderRouter = Router();

const wrap =
  (fn: (req: Request, res: Response) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res)).catch(next);

const id = (req: Request) => String(req.params.id ?? "");

type Person = { id: string; name: string };
type Room = { id: string; locked?: boolean; individuals: Person[] };
type Info = { individualPool?: Person[]; scoreMin: number; scoreMax: number; days: { scoreMin?: number; scoreMax?: number; closed?: boolean; rooms: Room[] }[] };

const DRAFTS = "__drafts";

async function load(sessionId: string) {
  const rows = await db
    .select()
    .from(judgeSessions)
    .where(and(eq(judgeSessions.id, sessionId), eq(judgeSessions.kind, "leader")));
  return rows[0];
}

leaderRouter.post(
  "/api/leader",
  wrap(async (req, res) => {
    const info = req.body?.info;
    if (!info || !Array.isArray(info.days)) {
      res.status(400).json({ error: "missing info" });
      return;
    }
    const newId = randomUUID();
    await db.insert(judgeSessions).values({
      id: newId,
      tournamentId: newId,
      kind: "leader",
      info,
      results: {},
    });
    res.json({ id: newId });
  }),
);

leaderRouter.get(
  "/api/leader/:id",
  wrap(async (req, res) => {
    const row = await load(id(req));
    if (!row) {
      res.status(404).json({ error: "not found" });
      return;
    }
    // Judges' autosaved drafts live under a reserved key, returned separately.
    const { [DRAFTS]: drafts = {}, ...results } = (row.results || {}) as Record<string, unknown>;
    res.json({ id: row.id, info: row.info, results, drafts });
  }),
);

leaderRouter.put(
  "/api/leader/:id/info",
  wrap(async (req, res) => {
    const info = req.body?.info;
    if (!info || !Array.isArray(info.days)) {
      res.status(400).json({ error: "missing info" });
      return;
    }
    await db
      .update(judgeSessions)
      .set({ info })
      .where(and(eq(judgeSessions.id, id(req)), eq(judgeSessions.kind, "leader")));
    res.json({ ok: true });
  }),
);

leaderRouter.put(
  "/api/leader/:id/results/:roomId",
  wrap(async (req, res) => {
    const row = await load(id(req));
    if (!row) {
      res.status(404).json({ error: "not found" });
      return;
    }
    const info = row.info as Info;
    const roomId = String(req.params.roomId);
    const room = info.days.flatMap((d) => d.rooms).find((r) => r.id === roomId);
    if (!room) {
      res.status(404).json({ error: "room not found" });
      return;
    }
    if (room.locked || info.days.find((d) => d.rooms.some((r) => r.id === roomId))?.closed) {
      res.status(423).json({ error: "room locked" });
      return;
    }
    const judgeName = String(req.body?.judgeName ?? "").trim();
    if (!judgeName) {
      res.status(400).json({ error: "missing judgeName" });
      return;
    }
    const dayCfg = info.days.find((d) => d.rooms.some((r) => r.id === roomId));
    const lo = dayCfg?.scoreMin ?? info.scoreMin;
    const hi = dayCfg?.scoreMax ?? info.scoreMax;
    // The judge sends one row per debater; rows without a known id are new
    // debaters typed by the judge and get added to the room and the registry.
    const rawEntries = Array.isArray(req.body?.entries)
      ? (req.body.entries as { id?: string; name?: string; score?: number }[])
      : Object.entries((req.body?.scores ?? {}) as Record<string, number>).map(([eid, score]) => ({
          id: eid, name: room.individuals.find((i) => i.id === eid)?.name, score,
        }));
    const known = new Set((room.individuals ??= []).map((i) => i.id));
    const entries = rawEntries.map((e) => ({
      id: e.id && known.has(e.id) ? e.id : undefined,
      name: String(e.name ?? "").trim().slice(0, 100),
      score: e.score,
    }));
    const valid =
      entries.length > 0 &&
      [...known].every((k) => entries.some((e) => e.id === k)) &&
      entries.every(
        (e) =>
          (e.id || e.name) &&
          Number.isInteger(e.score) &&
          (e.score as number) >= lo &&
          (e.score as number) <= hi,
      );
    if (!valid) {
      res.status(400).json({ error: `scores must be integers ${lo}-${hi}` });
      return;
    }
    // A judge scores one room per round.
    const day = info.days.find((d) => d.rooms.some((r) => r.id === roomId));
    const sameDay = new Set((day?.rooms ?? []).map((r) => r.id));
    const prev = (row.results || {}) as Record<string, { roomId: string; judgeName: string }>;
    if (Object.values(prev).some((s) => s.roomId !== roomId && sameDay.has(s.roomId) && s.judgeName === judgeName)) {
      res.status(409).json({ error: "judge already used in this round" });
      return;
    }
    // One judge per room: the first sheet is final and locks the room.
    const key = roomId;
    const results = { ...((row.results || {}) as Record<string, unknown>) };
    if (results[key]) {
      res.status(409).json({ error: "already submitted" });
      return;
    }
    // Register the judge's new debaters in the room and the tournament registry.
    const pool = (info.individualPool ??= []);
    let infoChanged = false;
    for (const e of entries) {
      if (e.id) continue;
      e.id = Math.random().toString(36).slice(2, 10);
      room.individuals.push({ id: e.id, name: e.name });
      if (!pool.some((p) => p.name.trim() === e.name)) pool.push({ id: e.id, name: e.name });
      infoChanged = true;
    }
    // Register the judge in the tournament's judges list and on this room's panel.
    const jp = (info.judgePool ??= []);
    if (!jp.some((n) => n.trim() === judgeName)) { jp.push(judgeName); infoChanged = true; }
    if (room.chair?.trim() !== judgeName && !room.judges.some((n) => n.trim() === judgeName)) {
      if (room.chair) room.judges.push(judgeName); else room.chair = judgeName;
      infoChanged = true;
    }
    const clean = Object.fromEntries(entries.map((e) => [e.id!, e.score as number]));
    results[key] = { roomId, judgeName, scores: clean, submittedAt: Date.now() };
    const drafts = { ...((results[DRAFTS] || {}) as Record<string, unknown>) };
    delete drafts[roomId];
    results[DRAFTS] = drafts;
    await db
      .update(judgeSessions)
      .set(infoChanged ? { results, info } : { results })
      .where(eq(judgeSessions.id, row.id));
    res.json({ ok: true });
  }),
);

/** Organiser resets score entry: clears every sheet and draft and reopens all rooms. */
leaderRouter.delete(
  "/api/leader/:id/results",
  wrap(async (req, res) => {
    const row = await load(id(req));
    if (!row) {
      res.status(404).json({ error: "not found" });
      return;
    }
    const info = row.info as Info & { days: { day?: number }[] };
    // ?day=N resets only that round; without it every round is reset.
    const only = Number(req.query.day) || null;
    const results = { ...((row.results || {}) as Record<string, unknown>) };
    const drafts = { ...((results[DRAFTS] || {}) as Record<string, unknown>) };
    info.days.forEach((d) => {
      if (only && d.day !== only) return;
      d.closed = false;
      d.rooms.forEach((r) => { r.locked = false; delete results[r.id]; delete drafts[r.id]; });
    });
    results[DRAFTS] = drafts;
    await db.update(judgeSessions).set({ results, info }).where(eq(judgeSessions.id, row.id));
    res.json({ ok: true });
  }),
);

/** Organiser removes one judge's sheet so it can be re-entered. */
leaderRouter.delete(
  "/api/leader/:id/results/:key",
  wrap(async (req, res) => {
    const row = await load(id(req));
    if (!row) {
      res.status(404).json({ error: "not found" });
      return;
    }
    const results = { ...((row.results || {}) as Record<string, unknown>) };
    delete results[String(req.params.key)];
    await db.update(judgeSessions).set({ results }).where(eq(judgeSessions.id, row.id));
    res.json({ ok: true });
  }),
);

/** Judge autosave: keeps unsent scores so nothing is lost and the room shows "in progress". */
leaderRouter.put(
  "/api/leader/:id/drafts/:roomId",
  wrap(async (req, res) => {
    const row = await load(id(req));
    if (!row) {
      res.status(404).json({ error: "not found" });
      return;
    }
    const roomId = String(req.params.roomId);
    const results = { ...((row.results || {}) as Record<string, unknown>) };
    if (results[roomId]) {
      res.status(409).json({ error: "already submitted" });
      return;
    }
    const scores = (req.body?.scores ?? {}) as Record<string, unknown>;
    const drafts = { ...((results[DRAFTS] || {}) as Record<string, unknown>) };
    drafts[roomId] = {
      judgeName: String(req.body?.judgeName ?? "").slice(0, 100),
      scores: Object.fromEntries(Object.entries(scores).filter(([, v]) => Number.isInteger(v))),
      // Unsent rows (incl. debaters the judge typed) so the form restores exactly.
      entries: Array.isArray(req.body?.entries)
        ? (req.body.entries as { id?: string; name?: string; score?: string }[]).slice(0, 50).map((e) => ({
            id: String(e.id ?? "").slice(0, 20),
            name: String(e.name ?? "").slice(0, 100),
            score: String(e.score ?? "").slice(0, 3),
          }))
        : undefined,
      updatedAt: Date.now(),
    };
    results[DRAFTS] = drafts;
    await db.update(judgeSessions).set({ results }).where(eq(judgeSessions.id, row.id));
    res.json({ ok: true });
  }),
);
