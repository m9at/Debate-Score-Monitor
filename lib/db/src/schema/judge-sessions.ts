import { pgTable, text, jsonb, timestamp, index } from "drizzle-orm/pg-core";

export const judgeSessions = pgTable(
  "judge_sessions",
  {
    id: text("id").primaryKey(),
    tournamentId: text("tournament_id").notNull(),
    kind: text("kind").notNull(),
    info: jsonb("info").notNull(),
    results: jsonb("results").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    tournamentIdx: index("judge_sessions_tournament_idx").on(t.tournamentId),
  }),
);

export type JudgeSession = typeof judgeSessions.$inferSelect;
