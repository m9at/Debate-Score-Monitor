import { Link } from "wouter";
import { motion } from "framer-motion";
import { ChevronLeft, Clock3, Lock } from "lucide-react";
import type { Tournament } from "@/types/tournament";
import { BRAND } from "@/lib/brand";
import { roundTitle } from "@/lib/reveal";

type RoundState = "announced" | "partial" | "locked" | "upcoming";

const STATE_META: Record<RoundState, { label: string; color: string; bg: string }> = {
  announced: { label: "تم إعلان النتائج ✅", color: "#15803D", bg: `${BRAND.success}1f` },
  partial: { label: "إعلان جزئي ⏳", color: "#B45309", bg: `${BRAND.warning}1f` },
  locked: { label: "النتائج لم تعلن بعد 🔒", color: `${BRAND.ink}99`, bg: `${BRAND.ink}0f` },
  upcoming: { label: "قادمة", color: BRAND.blueDeep, bg: `${BRAND.blue}1a` },
};

/**
 * الجولات as the audience reads them: one clear row per round with its state,
 * and a link into the round's own page — only for rounds whose results are (at
 * least partly) announced. Nothing about an unannounced round is revealed here.
 */
export default function PublicRoundsList({
  tournament,
}: {
  tournament: Tournament;
}) {
  const rounds = [...tournament.rounds].sort((a, b) => a.roundNumber - b.roundNumber);
  /** Rounds the organiser planned but has not drawn yet. */
  const upcoming = Array.from(
    { length: Math.max(0, tournament.totalRounds - rounds.length) },
    (_, i) => rounds.length + i + 1,
  );

  return (
    <section className="space-y-3" data-testid="public-rounds">
      <h2 className="font-black text-xl" style={{ color: BRAND.ink }}>
        الجولات
      </h2>

      <div className="space-y-2.5">
        {rounds.map((r, i) => {
          const announcedCount = r.matches.filter((m) => m.resultAnnounced).length;
          const state: RoundState =
            r.matches.length === 0
              ? "upcoming"
              : announcedCount === r.matches.length
                ? "announced"
                : announcedCount > 0
                  ? "partial"
                  : "locked";
          const meta = STATE_META[state];
          const openable = state === "announced" || state === "partial";
          const body = (
            <div
              className="rounded-2xl bg-white border p-4 md:p-4.5 flex items-center gap-3 flex-wrap
                         transition-all"
              style={{ borderColor: BRAND.border }}
            >
              <span
                className="w-11 h-11 rounded-xl inline-flex items-center justify-center font-black text-[15px]"
                style={{ backgroundColor: `${BRAND.purple}12`, color: BRAND.purple }}
              >
                {r.roundNumber}
              </span>
              <div className="flex-1 min-w-[10rem]">
                <p className="font-black text-[15.5px]" style={{ color: BRAND.ink }}>
                  {roundTitle(r, r.roundNumber)}
                </p>
                <span
                  className="mt-1 inline-flex items-center gap-1.5 px-2 h-6 rounded-lg text-[11.5px] font-bold"
                  style={{ backgroundColor: meta.bg, color: meta.color }}
                  data-testid={`public-round-state-${r.roundNumber}`}
                >
                  {state === "locked" && <Lock className="w-3.5 h-3.5" />}
                  {state === "upcoming" && <Clock3 className="w-3.5 h-3.5" />}
                  {meta.label}
                </span>
              </div>
              {openable && (
                <span
                  className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl text-[12.5px]
                             font-bold text-white"
                  style={{ backgroundColor: BRAND.purple }}
                >
                  عرض النتائج
                  <ChevronLeft className="w-4 h-4" />
                </span>
              )}
            </div>
          );

          return (
            <motion.div
              key={r.roundNumber}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(i * 0.05, 0.3) }}
            >
              {openable ? (
                <Link
                  href={`/public/${tournament.id}/round/${r.roundNumber}`}
                  className="block hover:-translate-y-0.5 hover:shadow-md rounded-2xl transition-all"
                  data-testid={`public-round-link-${r.roundNumber}`}
                >
                  {body}
                </Link>
              ) : (
                body
              )}
            </motion.div>
          );
        })}

        {upcoming.map((n) => (
          <div
            key={`upcoming-${n}`}
            className="rounded-2xl border border-dashed p-4 flex items-center gap-3"
            style={{ borderColor: BRAND.border, backgroundColor: `${BRAND.ink}04` }}
            data-testid={`public-round-upcoming-${n}`}
          >
            <span
              className="w-11 h-11 rounded-xl inline-flex items-center justify-center font-black text-[15px]"
              style={{ backgroundColor: `${BRAND.blue}14`, color: BRAND.blueDeep }}
            >
              {n}
            </span>
            <div>
              <p className="font-black text-[15.5px]" style={{ color: BRAND.ink }}>
                الجولة {n}
              </p>
              <span
                className="mt-1 inline-flex items-center gap-1.5 px-2 h-6 rounded-lg text-[11.5px] font-bold"
                style={{ backgroundColor: STATE_META.upcoming.bg, color: STATE_META.upcoming.color }}
              >
                <Clock3 className="w-3.5 h-3.5" />
                قادمة
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
