import { useRoute, useLocation } from "wouter";
import { useTournament } from "@/context/TournamentContext";
import { BRAND } from "@/lib/brand";
import RevealOverlay from "@/components/present/RevealOverlay";

/**
 * Direct projector link for announcing one room's result. It renders the very
 * same full-screen reveal used inside وضع العرض, so both paths share a single
 * animation and a single reveal-status write.
 */
export default function AnnouncePage() {
  const [, params] = useRoute("/announce/:id/:round/:matchId");
  const [, setLocation] = useLocation();
  const { getTournament, markResultAnnounced } = useTournament();

  const tournament = getTournament(params?.id ?? "");
  const roundNumber = Number(params?.round ?? 0);
  const round = tournament?.rounds.find((r) => r.roundNumber === roundNumber);
  const match = round?.matches.find((m) => m.id === params?.matchId);

  if (!tournament || !round || !match) {
    return (
      <div
        className="min-h-screen flex items-center justify-center text-white text-lg font-bold"
        style={{ backgroundColor: BRAND.ink }}
        dir="rtl"
      >
        النتيجة غير متاحة
      </div>
    );
  }

  return (
    <RevealOverlay
      tournament={tournament}
      round={round}
      roundNumber={roundNumber}
      match={match}
      onRevealed={() => markResultAnnounced(tournament.id, roundNumber, match.id)}
      onClose={() => setLocation(`/tournament/${tournament.id}`)}
    />
  );
}
