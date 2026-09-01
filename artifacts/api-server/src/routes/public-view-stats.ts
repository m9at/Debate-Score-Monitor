import { Router, type Request, type Response } from "express";
import { db, publicViewStats } from "@workspace/db";
import { eq } from "drizzle-orm";

/**
 * إحصائيات الجمهور — a tiny counter fed exclusively by وضع الجمهور. It never
 * touches the tournament data itself, so counting a visit can never alter (or
 * overwrite) a tournament, its rounds or its results.
 */
export const publicViewStatsRouter = Router();

interface StatsRow {
  views: number;
  visitors: string[];
  roundViews: Record<string, number>;
  resultViews: number;
  lastViewAt: string | null;
}

const empty: StatsRow = {
  views: 0,
  visitors: [],
  roundViews: {},
  resultViews: 0,
  lastViewAt: null,
};

const serialize = (
  row: typeof publicViewStats.$inferSelect | undefined,
): StatsRow & { uniqueVisitors: number } => {
  const visitors = (row?.visitors as string[] | undefined) ?? [];
  return {
    views: row?.views ?? 0,
    visitors,
    uniqueVisitors: visitors.length,
    roundViews: (row?.roundViews as Record<string, number> | undefined) ?? {},
    resultViews: row?.resultViews ?? 0,
    lastViewAt: row?.lastViewAt ? row.lastViewAt.toISOString() : null,
  };
};

const load = async (tournamentId: string) => {
  const rows = await db
    .select()
    .from(publicViewStats)
    .where(eq(publicViewStats.tournamentId, tournamentId));
  return rows[0];
};

publicViewStatsRouter.get(
  "/api/public-view-stats/:id",
  async (req: Request, res: Response) => {
    try {
      res.json(serialize(await load(String(req.params.id))));
    } catch {
      res.json(serialize(undefined));
    }
  },
);

publicViewStatsRouter.post(
  "/api/public-view-stats/:id",
  async (req: Request, res: Response) => {
    const tournamentId = String(req.params.id);
    const body = (req.body ?? {}) as {
      visitorId?: string;
      round?: number;
      result?: boolean;
    };
    try {
      const existing = await load(tournamentId);
      const prev: StatsRow = existing
        ? {
            views: existing.views,
            visitors: (existing.visitors as string[]) ?? [],
            roundViews: (existing.roundViews as Record<string, number>) ?? {},
            resultViews: existing.resultViews,
            lastViewAt: null,
          }
        : { ...empty };

      const visitors =
        body.visitorId && !prev.visitors.includes(body.visitorId)
          ? [...prev.visitors, body.visitorId]
          : prev.visitors;
      const roundViews = { ...prev.roundViews };
      if (typeof body.round === "number" && body.round > 0) {
        const key = String(body.round);
        roundViews[key] = (roundViews[key] ?? 0) + 1;
      }
      const values = {
        tournamentId,
        views: prev.views + 1,
        visitors,
        roundViews,
        resultViews: prev.resultViews + (body.result ? 1 : 0),
        lastViewAt: new Date(),
      };

      await db
        .insert(publicViewStats)
        .values(values)
        .onConflictDoUpdate({
          target: publicViewStats.tournamentId,
          set: {
            views: values.views,
            visitors: values.visitors,
            roundViews: values.roundViews,
            resultViews: values.resultViews,
            lastViewAt: values.lastViewAt,
          },
        });
      res.json({ ok: true });
    } catch {
      // A counter must never break the audience's page.
      res.json({ ok: false });
    }
  },
);
