import { pgTable, text, integer, jsonb, timestamp } from "drizzle-orm/pg-core";

/**
 * إحصائيات الجمهور — counted ONLY from وضع الجمهور (the read-only public view).
 * One row per tournament; the admin panel reads it, the public pages increment
 * it. Visitor ids are anonymous random strings kept in the visitor's browser,
 * so "unique visitors" needs no account and no personal data.
 */
export const publicViewStats = pgTable("public_view_stats", {
  tournamentId: text("tournament_id").primaryKey(),
  /** Total page opens of the public view for this tournament. */
  views: integer("views").notNull().default(0),
  /** Anonymous visitor ids seen so far — their count is «الزوار الفريدون». */
  visitors: jsonb("visitors").notNull().default([]),
  /** { "<roundNumber>": opens } — drives «الجولة الأكثر مشاهدة». */
  roundViews: jsonb("round_views").notNull().default({}),
  /** Opens of an announced-results view. */
  resultViews: integer("result_views").notNull().default(0),
  lastViewAt: timestamp("last_view_at", { withTimezone: true }),
});

export type PublicViewStats = typeof publicViewStats.$inferSelect;
