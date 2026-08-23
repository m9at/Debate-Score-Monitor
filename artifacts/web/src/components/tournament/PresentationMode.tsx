import { useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import type { Tournament } from "@/types/tournament";
import { BRAND, BRAND_GRADIENT } from "@/lib/brand";
import { getRoomStatus } from "@/lib/roomStatus";
import { getRevealStatus, roundTitle } from "@/lib/reveal";
import PresentRoundStrip from "@/components/present/PresentRoundStrip";
import PresentRoomCard from "@/components/present/PresentRoomCard";
import PresentCaseText from "@/components/present/PresentCaseText";
import RevealOverlay from "@/components/present/RevealOverlay";

interface PresentationModeProps {
  tournament: Tournament;
  /** Persists a room's result as `revealed`. */
  onMarkRevealed: (roundNumber: number, matchId: string) => void;
  /** True for the admin who opened the mode — gates the announce action. */
  canAnnounce: boolean;
  onExit: () => void;
}

/**
 * وضع العرض 🎥 — the audience screen: pick a round, see all its rooms, and
 * announce a ready result full screen without leaving the mode. No admin
 * navigation, no scores, no judge data and never the winner before its reveal.
 */
export default function PresentationMode({
  tournament,
  onMarkRevealed,
  canAnnounce,
  onExit,
}: PresentationModeProps) {
  const liveRound = Math.max(tournament.currentRound || 1, 1);
  const [viewedRound, setViewedRound] = useState(liveRound);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [announcingId, setAnnouncingId] = useState<string | null>(null);

  const roundNumbers = useMemo(
    () => tournament.rounds.map((r) => r.roundNumber).sort((a, b) => a - b),
    [tournament.rounds]
  );
  const round = tournament.rounds.find((r) => r.roundNumber === viewedRound);

  // Real full screen; leaving it exits the mode.
  useEffect(() => {
    document.documentElement.requestFullscreen?.().catch(() => {});
    const onChange = () => {
      if (!document.fullscreenElement) onExit();
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    };
  }, [onExit]);

  const teamName = useMemo(() => {
    const byId = new Map(tournament.teams.map((t) => [t.id, t.name]));
    return (id: string) => byId.get(id) ?? "—";
  }, [tournament.teams]);

  const rooms = useMemo(
    () =>
      (round?.matches ?? []).map((match) => ({
        match,
        status: getRoomStatus({
          match,
          pending: tournament.pendingResults ?? [],
          expectedJudges:
            round?.judgesPerRoom ?? tournament.settings?.judgesPerRoom ?? 0,
        }),
      })),
    [round, tournament.pendingResults, tournament.settings?.judgesPerRoom]
  );

  const revealedCount = rooms.filter(
    ({ match }) => getRevealStatus(match) === "revealed"
  ).length;

  const announcingMatch = announcingId
    ? (round?.matches.find((m) => m.id === announcingId) ?? null)
    : null;

  return (
    <div
      dir="rtl"
      className="min-h-screen relative overflow-x-hidden px-6 py-8 md:px-12 md:py-10"
      style={{ backgroundColor: BRAND.ink }}
      data-testid="presentation-mode"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 right-1/4 w-[46rem] h-[46rem] rounded-full blur-3xl opacity-25"
        style={{ backgroundImage: BRAND_GRADIENT }}
      />

      <button
        type="button"
        onClick={onExit}
        aria-label="إنهاء وضع العرض"
        className="absolute top-5 left-5 z-40 w-11 h-11 rounded-xl bg-white/10 hover:bg-white/20
                   text-white/60 hover:text-white flex items-center justify-center transition-colors"
        data-testid="button-exit-presentation"
      >
        <X className="w-5 h-5" />
      </button>

      <header className="relative flex items-center gap-5 mb-7">
        <img
          src={`${import.meta.env.BASE_URL}logo-mark.png`}
          alt="مناظرات عُمان"
          className="w-16 h-16 md:w-24 md:h-24 object-contain shrink-0"
          style={{ filter: "drop-shadow(0 0 24px rgba(123,45,142,0.7))" }}
        />
        <div className="min-w-0">
          <h1 className="text-white font-black text-3xl md:text-5xl leading-tight truncate">
            {tournament.name}
          </h1>
          <p className="text-white/55 text-lg md:text-2xl font-bold mt-1">
            {roundTitle(round, viewedRound)}
          </p>
        </div>
      </header>

      <div className="relative mb-7">
        <PresentRoundStrip
          roundNumbers={roundNumbers}
          viewedRound={viewedRound}
          liveRound={liveRound}
          onSelect={(n) => {
            setViewedRound(n);
            setSelectedRoomId(null);
          }}
          revealedCount={revealedCount}
          totalRooms={rooms.length}
        />
      </div>

      {round?.caseText?.trim() && (
        <div className="relative mb-8">
          <PresentCaseText
            caseText={round.caseText}
            roundLabel={roundTitle(round, viewedRound)}
          />
        </div>
      )}

      {rooms.length === 0 ? (
        <p className="relative text-white/60 text-2xl font-bold text-center py-20">
          لا توجد قاعات في هذه الجولة
        </p>
      ) : (
        <div className="relative grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 md:gap-7">
          {rooms.map(({ match, status }) => (
            <PresentRoomCard
              key={match.id}
              match={match}
              status={status}
              govName={teamName(match.team1.teamId)}
              oppName={teamName(match.team2.teamId)}
              selected={selectedRoomId === match.id}
              canAnnounce={canAnnounce}
              onSelect={() =>
                setSelectedRoomId((cur) => (cur === match.id ? null : match.id))
              }
              onAnnounce={() => setAnnouncingId(match.id)}
            />
          ))}
        </div>
      )}

      <AnimatePresence>
        {announcingMatch && round && (
          <RevealOverlay
            tournament={tournament}
            round={round}
            roundNumber={viewedRound}
            match={announcingMatch}
            onRevealed={() => onMarkRevealed(viewedRound, announcingMatch.id)}
            onClose={() => setAnnouncingId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
