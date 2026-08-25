import {
  integer,
  jsonb,
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
 * Plus the organiser's link settings: which optional form fields are required,
 * when the link closes by itself, and how many registrants it accepts.
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
    /** Optional form fields the organiser made mandatory (field keys). */
    requiredFields: jsonb("required_fields").notNull().default([]),
    /** Auto-close moment, or null for no deadline. */
    closesAt: timestamp("closes_at", { withTimezone: true }),
    /** Auto-close after this many registrants, or null for no cap. */
    maxRegistrants: integer("max_registrants"),
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
