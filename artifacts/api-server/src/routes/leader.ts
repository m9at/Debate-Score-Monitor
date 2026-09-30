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

type Room = { id: string; locked?: boolean; individuals?: { id: string }[] };
type Info = { scoreMin: number; scoreMax: number; days: { scoreMin?: number; scoreMax?: number; rooms: Room[] }[] };

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
    res.json({ id: row.id, info: row.info, results: row.results || {} });
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
    if (room.locked) {
      res.status(423).json({ error: "room locked" });
      return;
    }
    const judgeName = String(req.body?.judgeName ?? "").trim();
    if (!judgeName) {
      res.status(400).json({ error: "missing judgeName" });
      return;
    }
    const scores = req.body?.scores as Record<string, number> | undefined;
    const ids = (room.individuals ?? []).map((i) => i.id);
    const dayCfg = info.days.find((d) => d.rooms.some((r) => r.id === roomId));
    const lo = dayCfg?.scoreMin ?? info.scoreMin;
    const hi = dayCfg?.scoreMax ?? info.scoreMax;
    const valid =
      !!scores &&
      ids.length > 0 &&
      ids.every(
        (i) =>
          Number.isInteger(scores[i]) &&
          scores[i] >= lo &&
          scores[i] <= hi,
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
    const clean = Object.fromEntries(ids.map((i) => [i, scores![i]]));
    results[key] = { roomId, judgeName, scores: clean, submittedAt: Date.now() };
    await db.update(judgeSessions).set({ results }).where(eq(judgeSessions.id, row.id));
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
