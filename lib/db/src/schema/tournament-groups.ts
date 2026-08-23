import { pgTable, text, jsonb, timestamp, bigint } from "drizzle-orm/pg-core";

/**
 * Folders that organise tournaments. Server-owned so every device (and every
 * admin) sees the same folder tree; the client keeps only an offline mirror.
 */
export const tournamentGroups = pgTable("tournament_groups", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  // Folders marked as archive hold tournaments taken out of the active list.
  kind: text("kind").notNull().default("normal"),
  tournamentIds: jsonb("tournament_ids").notNull().default([]),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type TournamentGroupRow = typeof tournamentGroups.$inferSelect;
