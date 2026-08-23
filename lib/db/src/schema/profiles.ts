import {
  pgTable,
  text,
  jsonb,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * A judge's permanent profile — created once, on their first registration, and
 * reused for every later tournament. Identity is the contact they registered
 * with (phone or email), which is what the reuse lookup keys on.
 */
export const judgeProfiles = pgTable(
  "judge_profiles",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    /** Normalised phone or email — the identity used to find an existing profile. */
    contact: text("contact").notNull(),
    contactKind: text("contact_kind").notNull().default("phone"),
    photoUrl: text("photo_url"),
    institution: text("institution"),
    experience: text("experience"),
    /** Free-form extra fields the registration form collects. */
    details: jsonb("details").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    contactIdx: uniqueIndex("judge_profiles_contact_idx").on(t.contact),
  }),
);

/**
 * A team's permanent profile. Members live on the tournament participation, so
 * a team can keep its identity while its speakers change between tournaments.
 */
export const teamProfiles = pgTable(
  "team_profiles",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    /** Normalised contact of the team's representative. */
    contact: text("contact").notNull(),
    contactKind: text("contact_kind").notNull().default("phone"),
    logoUrl: text("logo_url"),
    institution: text("institution"),
    /** Latest known member list, offered as a starting point next time. */
    lastMembers: jsonb("last_members").notNull().default([]),
    details: jsonb("details").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    contactIdx: uniqueIndex("team_profiles_contact_idx").on(t.contact),
  }),
);

/**
 * One profile taking part in one tournament. This is the join that makes a
 * single profile reusable across many tournaments instead of duplicated.
 *
 * `status`: pending | approved | withdrawn
 */
export const tournamentParticipations = pgTable(
  "tournament_participations",
  {
    id: text("id").primaryKey(),
    tournamentId: text("tournament_id").notNull(),
    /** "judge" | "team" */
    role: text("role").notNull(),
    profileId: text("profile_id").notNull(),
    status: text("status").notNull().default("pending"),
    /** Per-tournament data: this tournament's team members, judge notes, etc. */
    payload: jsonb("payload").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    tournamentIdx: index("participations_tournament_idx").on(
      t.tournamentId,
      t.role,
    ),
    profileIdx: index("participations_profile_idx").on(t.profileId),
    onceIdx: uniqueIndex("participations_once_idx").on(
      t.tournamentId,
      t.role,
      t.profileId,
    ),
  }),
);

export type JudgeProfile = typeof judgeProfiles.$inferSelect;
export type TeamProfile = typeof teamProfiles.$inferSelect;
export type TournamentParticipation =
  typeof tournamentParticipations.$inferSelect;
