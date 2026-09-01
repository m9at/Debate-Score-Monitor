import { useMemo } from "react";
import { Link, useRoute } from "wouter";
import { ChevronRight, Users } from "lucide-react";
import { usePublicTournament } from "@/hooks/usePublicTournaments";
import PublicShell from "@/components/public/PublicShell";
import PublicRoundCard from "@/components/public/PublicRoundCard";
import { BRAND, STATUS_META } from "@/lib/brand";
import { getTournamentStatus } from "@/lib/tournamentStatus";

/**
 * بطولة واحدة في وضع الجمهور — status, rounds with their motions, the teams and
 * the results of every announced round. Purely read-only: results appear here
 * as soon as the admin panel announces them, with no copy of the tournament.
 */
export default function PublicTournamentPage() {
  const [, params] = useRoute("/public/:id");
  const { tournament, loading, error } = usePublicTournament(params?.id ?? "");

  const teamName = useMemo(() => {
    const byId = new Map((tournament?.teams ?? []).map((t) => [t.id, t.name]));
    return (id: string) => byId.get(id) ?? "—";
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

  const status = STATUS_META[getTournamentStatus(tournament)];
  const rounds = [...tournament.rounds].sort((a, b) => a.roundNumber - b.roundNumber);

  return (
    <PublicShell
      title={tournament.name}
      subtitle={`${status.dot} ${status.label} · ${tournament.teams.length} فريق · ${rounds.length} من ${tournament.totalRounds} جولة`}
    >
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
        <p
          className="rounded-2xl bg-white border p-4 text-[13.5px] leading-relaxed"
          style={{ borderColor: BRAND.border, color: `${BRAND.ink}b3` }}
        >
          {tournament.description}
        </p>
      )}

      {/* Teams */}
      <section
        className="rounded-2xl bg-white border p-4 md:p-5 space-y-3"
        style={{ borderColor: BRAND.border }}
        data-testid="public-teams"
      >
        <h2
          className="font-black text-[17px] inline-flex items-center gap-2"
          style={{ color: BRAND.ink }}
        >
          <Users className="w-4.5 h-4.5" style={{ color: BRAND.purple }} />
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
                className="px-3 h-9 inline-flex items-center rounded-xl border text-[13px] font-bold"
                style={{ borderColor: BRAND.border, color: BRAND.ink }}
              >
                {t.name}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Rounds, motions and announced results */}
      {rounds.length === 0 ? (
        <p className="text-center py-10 font-bold" style={{ color: `${BRAND.ink}80` }}>
          لم تبدأ جولات هذه البطولة بعد.
        </p>
      ) : (
        rounds.map((r) => (
          <PublicRoundCard
            key={r.roundNumber}
            round={r}
            tournament={tournament}
            teamName={teamName}
          />
        ))
      )}
    </PublicShell>
  );
}
