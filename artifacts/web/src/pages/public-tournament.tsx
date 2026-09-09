import { Link, useRoute } from "wouter";
import { motion } from "framer-motion";
import { ChevronRight, Users } from "lucide-react";
import { usePublicTournament } from "@/hooks/usePublicTournaments";
import { usePublicViewTracker } from "@/hooks/usePublicViewTracker";
import PublicShell from "@/components/public/PublicShell";
import PublicHero from "@/components/public/PublicHero";
import PublicRoundsList from "@/components/public/PublicRoundsList";
import { BRAND, LAYOUT } from "@/lib/brand";

/**
 * بطولة واحدة في وضع الجمهور — hero (built around the tournament image when
 * there is one), the teams, then the rounds. Read-only: it reads the very same
 * tournament the admin panel edits, so an announcement shows up here on its own.
 */
export default function PublicTournamentPage() {
  const [, params] = useRoute("/public/:id");
  const id = params?.id ?? "";
  const { tournament, loading, error } = usePublicTournament(id);
  usePublicViewTracker(id);

  if (loading) {
    return (
      <PublicShell title="مناظرات عُمان">
        <p className="text-center py-16 font-bold" style={{ color: `${BRAND.ink}80` }}>
          جارٍ التحميل…
        </p>
      </PublicShell>
    );
  }

  if (!tournament || error) {
    return (
      <PublicShell title="مناظرات عُمان">
        <p
          className="text-center py-16 font-bold"
          style={{ color: `${BRAND.ink}99` }}
          data-testid="public-tournament-unavailable"
        >
          هذه البطولة غير متاحة للجمهور.
        </p>
        <p className="text-center">
          <Link href="/public" className="font-bold" style={{ color: BRAND.purple }}>
            العودة إلى بطولات الجمهور
          </Link>
        </p>
      </PublicShell>
    );
  }

  const announced = tournament.rounds.filter(
    (r) => r.matches.length > 0 && r.matches.every((m) => m.resultAnnounced),
  ).length;

  return (
    <div
      dir="rtl"
      className="min-h-[100dvh] pb-16"
      style={{ backgroundColor: BRAND.surface }}
      data-testid="public-mode"
    >
      <PublicHero
        tournament={tournament}
        meta={`${tournament.teams.length} فريق · ${tournament.rounds.length} من ${tournament.totalRounds} جولة · ${announced} جولة معلنة`}
      />

      <main className={`${LAYOUT.page} ${LAYOUT.stack} mt-6`}>
        <Link
          href="/public"
          className="inline-flex items-center gap-1.5 text-[13px] font-bold"
          style={{ color: BRAND.purple }}
          data-testid="link-back-to-public-home"
        >
          <ChevronRight className="w-4 h-4" />
          كل البطولات
        </Link>

        {tournament.description && (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-white border p-4 text-[13.5px] leading-relaxed"
            style={{ borderColor: BRAND.border, color: `${BRAND.ink}b3` }}
          >
            {tournament.description}
          </motion.p>
        )}

        <section
          className="rounded-2xl bg-white border p-4 md:p-5 space-y-3"
          style={{ borderColor: BRAND.border }}
          data-testid="public-teams"
        >
          <h2
            className="font-black text-[17px] inline-flex items-center gap-2"
            style={{ color: BRAND.ink }}
          >
            <Users className="w-4 h-4" style={{ color: BRAND.purple }} />
            الفرق المشاركة
          </h2>
          {tournament.teams.length === 0 ? (
            <p className="text-[12.5px]" style={{ color: `${BRAND.ink}99` }}>
              لم تُسجّل فرق بعد.
            </p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {tournament.teams.map((t) => (
                <li
                  key={t.id}
                  className="px-3 h-9 inline-flex items-center rounded-xl border text-[13px] font-bold
                             transition-colors hover:border-[#7B2D8E]/40"
                  style={{ borderColor: BRAND.border, color: BRAND.ink }}
                >
                  {t.name}
                </li>
              ))}
            </ul>
          )}
        </section>

        <PublicRoundsList tournament={tournament} />
      </main>
    </div>
  );
}
