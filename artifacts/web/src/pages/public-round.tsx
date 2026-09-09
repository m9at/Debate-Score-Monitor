import { useMemo } from "react";
import { Link, useRoute } from "wouter";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { usePublicTournament } from "@/hooks/usePublicTournaments";
import { usePublicViewTracker } from "@/hooks/usePublicViewTracker";
import PublicShell from "@/components/public/PublicShell";
import PublicHero from "@/components/public/PublicHero";
import PublicRoundCard from "@/components/public/PublicRoundCard";
import { BRAND, LAYOUT } from "@/lib/brand";
import { roundTitle } from "@/lib/reveal";

/**
 * صفحة جولة واحدة للجمهور — the round's own page: its motion, its pairings, the
 * scores (when the organiser allows them) and the winners. Results appear only
 * for rooms the admin panel has actually announced.
 */
export default function PublicRoundPage() {
  const [, params] = useRoute("/public/:id/round/:round");
  const id = params?.id ?? "";
  const roundNumber = Number(params?.round ?? 0);
  const { tournament, loading } = usePublicTournament(id);
  usePublicViewTracker(id, { round: roundNumber, result: true });

  const round = tournament?.rounds.find((r) => r.roundNumber === roundNumber);

  const teamName = useMemo(() => {
    const byId = new Map((tournament?.teams ?? []).map((t) => [t.id, t.name]));
    return (tid: string) => byId.get(tid) ?? "—";
  }, [tournament?.teams]);

  if (loading) {
    return (
      <PublicShell title="مناظرات عُمان">
        <p className="text-center py-16 font-bold" style={{ color: `${BRAND.ink}80` }}>
          جارٍ التحميل…
        </p>
      </PublicShell>
    );
  }

  if (!tournament || !round) {
    return (
      <PublicShell title="مناظرات عُمان">
        <p
          className="text-center py-16 font-bold"
          style={{ color: `${BRAND.ink}99` }}
          data-testid="public-round-unavailable"
        >
          هذه الجولة غير متاحة للجمهور.
        </p>
        <p className="text-center">
          <Link href="/public" className="font-bold" style={{ color: BRAND.purple }}>
            العودة إلى بطولات الجمهور
          </Link>
        </p>
      </PublicShell>
    );
  }

  return (
    <div
      dir="rtl"
      className="min-h-[100dvh] pb-16"
      style={{ backgroundColor: BRAND.surface }}
      data-testid="public-mode"
    >
      <PublicHero
        tournament={tournament}
        meta={`${roundTitle(round, round.roundNumber)} · ${round.matches.length} قاعة`}
      />

      <main className={`${LAYOUT.page} ${LAYOUT.stack} mt-6`}>
        <Link
          href={`/public/${tournament.id}`}
          className="inline-flex items-center gap-1.5 text-[13px] font-bold"
          style={{ color: BRAND.purple }}
          data-testid="link-back-to-tournament"
        >
          <ChevronRight className="w-4 h-4" />
          كل الجولات
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          <PublicRoundCard round={round} tournament={tournament} teamName={teamName} />
        </motion.div>
      </main>
    </div>
  );
}
