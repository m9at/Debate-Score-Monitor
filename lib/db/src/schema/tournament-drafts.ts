import { pgTable, text, jsonb, integer, timestamp } from "drizzle-orm/pg-core";

/**
 * A tournament creation wizard that was left unfinished. The whole wizard setup
 * is stored as-is so the organiser resumes on the exact step they left, from
 * any device.
 */
export const tournamentDrafts = pgTable("tournament_drafts", {
  id: text("id").primaryKey(),
  name: text("name").notNull().default(""),
  /** Index of the wizard step the organiser last reached. */
  stepIndex: integer("step_index").notNull().default(0),
  setup: jsonb("setup").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type TournamentDraft = typeof tournamentDrafts.$inferSelect;
