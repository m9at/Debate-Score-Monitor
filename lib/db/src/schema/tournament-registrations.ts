import { pgTable, text, jsonb, timestamp, index } from "drizzle-orm/pg-core";

export const publicTournaments = pgTable("public_tournaments", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  topic: text("topic").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const tournamentRegistrations = pgTable(
  "tournament_registrations",
  {
    id: text("id").primaryKey(),
    tournamentId: text("tournament_id").notNull(),
    kind: text("kind").notNull(),
    payload: jsonb("payload").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    tournamentIdx: index("tournament_registrations_tournament_idx").on(
      t.tournamentId,
    ),
  }),
);

export const sharedTournaments = pgTable("shared_tournaments", {
  id: text("id").primaryKey(),
  data: jsonb("data").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type PublicTournament = typeof publicTournaments.$inferSelect;
export type TournamentRegistration =
  typeof tournamentRegistrations.$inferSelect;
export type SharedTournament = typeof sharedTournaments.$inferSelect;
