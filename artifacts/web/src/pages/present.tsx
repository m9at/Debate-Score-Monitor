import { useRoute, useLocation } from "wouter";
import { useTournament } from "@/context/TournamentContext";
import { BRAND } from "@/lib/brand";
import PresentationMode from "@/components/tournament/PresentationMode";

/**
 * صفحة إعلان النتائج — a standalone full-screen stage, deliberately outside the
 * admin panel: no sidebar, no administration, just tournament → round → rooms →
 * results. Meant for a projector or a hall screen.
 */
export default function PresentPage() {
  const [, params] = useRoute("/present/:id");
  // The admin panel passes the round it is actually showing (?round=N), so
  // إعلان النتائج always opens THAT round and never a fixed one.
  const roundParam = Number(
    new URLSearchParams(window.location.search).get("round"),
  );
  const requestedRound =
    Number.isFinite(roundParam) && roundParam > 0 ? roundParam : undefined;
  const [, setLocation] = useLocation();
  const { getTournament, markResultAnnounced } = useTournament();

  const tournament = getTournament(params?.id ?? "");

  if (!tournament) {
    return (
      <div
        className="min-h-screen flex items-center justify-center text-white text-lg font-bold"
        style={{ backgroundColor: BRAND.ink }}
        dir="rtl"
      >
        البطولة غير متاحة
      </div>
    );
  }

  return (
    <PresentationMode
      tournament={tournament}
      roundNumber={requestedRound}
      canAnnounce
      onMarkRevealed={(roundNumber, matchId) =>
        markResultAnnounced(tournament.id, roundNumber, matchId)
      }
      onExit={() => setLocation(`/tournament/${tournament.id}`)}
    />
  );
}
