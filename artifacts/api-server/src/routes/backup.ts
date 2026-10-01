import { Router } from "express";
import { db, judgeSessions } from "@workspace/db";
import { sql } from "drizzle-orm";

/** Full backup of server-side tournament data (judge sessions incl. leadership tournaments). */
export const backupRouter = Router();

backupRouter.get("/api/backup", async (_req, res, next) => {
  try { res.json({ sessions: await db.select().from(judgeSessions) }); } catch (e) { next(e); }
});

/** Restores rows from a backup; existing rows with the same id are overwritten, nothing is deleted. */
backupRouter.post("/api/backup", async (req, res, next) => {
  try {
    const rows = Array.isArray(req.body?.sessions) ? req.body.sessions : [];
    for (const r of rows) {
      const row = { id: r.id, tournamentId: r.tournamentId, kind: r.kind, info: r.info, results: r.results ?? {}, createdAt: new Date(r.createdAt ?? Date.now()) };
      await db.insert(judgeSessions).values(row).onConflictDoUpdate({
        target: judgeSessions.id,
        set: { info: sql`excluded.info`, results: sql`excluded.results`, kind: sql`excluded.kind`, tournamentId: sql`excluded.tournament_id` },
      });
    }
    res.json({ restored: rows.length });
  } catch (e) { next(e); }
});
