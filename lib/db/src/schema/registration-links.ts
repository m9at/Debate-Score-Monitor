import {
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * A tournament's registration link — one per kind. The link itself is derived
 * from the tournament id, so this row only carries its lifecycle:
 *
 * `state`: open | closed | archived
 *
 * Archiving hides the link from the admin view while every registration made
 * through it stays in `tournament_participations`.
 */
export const registrationLinks = pgTable(
  "registration_links",
  {
    id: text("id").primaryKey(),
    tournamentId: text("tournament_id").notNull(),
    /** "team" | "judge" */
    kind: text("kind").notNull(),
    state: text("state").notNull().default("open"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    oneIdx: uniqueIndex("registration_links_one_idx").on(
      t.tournamentId,
      t.kind,
    ),
  }),
);

export type RegistrationLink = typeof registrationLinks.$inferSelect;
