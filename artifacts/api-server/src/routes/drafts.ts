import { Router, type Request, type Response, type NextFunction } from "express";
import { db, tournamentDrafts } from "@workspace/db";
import { desc, eq } from "drizzle-orm";

/**
 * Unfinished tournament creation wizards. Saved online so closing the wizard
 * never loses work and the draft can be resumed from another device.
 */
export const draftsRouter = Router();

const wrap =
  (fn: (req: Request, res: Response) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res)).catch(next);

const id = (req: Request) => String(req.params.id ?? "");

const serialize = (r: typeof tournamentDrafts.$inferSelect) => ({
  id: r.id,
  name: r.name,
  stepIndex: r.stepIndex,
  setup: r.setup,
  updatedAt: r.updatedAt,
});

draftsRouter.get(
  "/api/tournament-drafts",
  wrap(async (_req, res) => {
    const rows = await db
      .select()
      .from(tournamentDrafts)
      .orderBy(desc(tournamentDrafts.updatedAt));
    res.json(rows.map(serialize));
  }),
);

draftsRouter.get(
  "/api/tournament-drafts/:id",
  wrap(async (req, res) => {
    const rows = await db
      .select()
      .from(tournamentDrafts)
      .where(eq(tournamentDrafts.id, id(req)));
    const row = rows[0];
    if (!row) {
      res.status(404).json({ error: "draft not found" });
      return;
    }
    res.json(serialize(row));
  }),
);

draftsRouter.put(
  "/api/tournament-drafts/:id",
  wrap(async (req, res) => {
    const { name, stepIndex, setup } = req.body ?? {};
    if (!setup || typeof setup !== "object") {
      res.status(400).json({ error: "missing setup" });
      return;
    }
    const values = {
      id: id(req),
      name: typeof name === "string" ? name : "",
      stepIndex: Number.isInteger(stepIndex) ? (stepIndex as number) : 0,
      setup,
      updatedAt: new Date(),
    };
    await db
      .insert(tournamentDrafts)
      .values(values)
      .onConflictDoUpdate({
        target: tournamentDrafts.id,
        set: {
          name: values.name,
          stepIndex: values.stepIndex,
          setup: values.setup,
          updatedAt: values.updatedAt,
        },
      });
    res.json({ ok: true });
  }),
);

draftsRouter.delete(
  "/api/tournament-drafts/:id",
  wrap(async (req, res) => {
    await db.delete(tournamentDrafts).where(eq(tournamentDrafts.id, id(req)));
    res.json({ ok: true });
  }),
);
