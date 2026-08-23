import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { Tournament } from "@/types/tournament";
import { BRAND, BRAND_GRADIENT } from "@/lib/brand";
import { getRoomStatus } from "@/lib/roomStatus";
import { getRevealStatus, roundTitle } from "@/lib/reveal";
import PresentLogoHero from "@/components/present/PresentLogoHero";
import PresentRoomCard from "@/components/present/PresentRoomCard";
import PresentRoomFocus from "@/components/present/PresentRoomFocus";
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
 * وضع العرض 🎥 — the LIVE broadcast screen for the audience.
 *
 * It shows exactly the round the organiser chose in إدارة الجولات
 * (`presentedRound`) and nothing else: logo → round → motion → rooms. Selecting
 * a room enlarges it inside the same experience; only إعلان النتيجة reveals a
 * winner. It contains no tournament administration whatsoever — the round can
 * neither be switched nor started from here.
 */
export default function PresentationMode({
  tournament,
  onMarkRevealed,
  canAnnounce,
  onExit,
}: PresentationModeProps) {
  const presentedRound = Math.max(
    tournament.presentedRound ?? tournament.currentRound ?? 1,
    1,
  );
  const [focusedRoomId, setFocusedRoomId] = useState<string | null>(null);
  const [announcingId, setAnnouncingId] = useState<string | null>(null);

  const round = tournament.rounds.find(
    (r) => r.roundNumber === presentedRound,
  );
  const roundLabel = roundTitle(round, presentedRound);

  // The organiser may change the presented round from the admin panel while the
  // projector is live; the focus view must not survive that change.
  useEffect(() => {
    setFocusedRoomId(null);
    setAnnouncingId(null);
  }, [presentedRound]);

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
    [round, tournament.pendingResults, tournament.settings?.judgesPerRoom],
  );

  const revealedCount = rooms.filter(
    ({ match }) => getRevealStatus(match) === "revealed",
  ).length;

  const focused = focusedRoomId
    ? (rooms.find(({ match }) => match.id === focusedRoomId) ?? null)
    : null;
  const announcingMatch = announcingId
    ? (round?.matches.find((m) => m.id === announcingId) ?? null)
    : null;

  return (
    <div
      dir="rtl"
      className="min-h-screen relative overflow-x-hidden px-6 py-6 md:px-14 md:py-8 flex flex-col"
      style={{ backgroundColor: BRAND.ink }}
      data-testid="presentation-mode"
    >
      {/* Ambient event lighting */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -bottom-52 left-1/4 w-[52rem] h-[52rem] rounded-full blur-3xl"
        style={{ backgroundImage: BRAND_GRADIENT }}
        animate={{ opacity: [0.12, 0.22, 0.12] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
      />

      <button
        type="button"
        onClick={onExit}
        aria-label="إنهاء وضع العرض"
        className="absolute top-5 left-5 z-40 w-11 h-11 rounded-xl bg-white/[0.08] hover:bg-white/20
                   text-white/40 hover:text-white flex items-center justify-center transition-colors"
        data-testid="button-exit-presentation"
      >
        <X className="w-5 h-5" />
      </button>

      <PresentLogoHero
        tournamentName={tournament.name}
        roundLabel={roundLabel}
      />

      <AnimatePresence mode="wait">
        {focused ? (
          <motion.div
            key="focus"
            className="relative flex-1 flex items-center justify-center py-8"
          >
            <PresentRoomFocus
              match={focused.match}
              status={focused.status}
              govName={teamName(focused.match.team1.teamId)}
              oppName={teamName(focused.match.team2.teamId)}
              canAnnounce={canAnnounce}
              onAnnounce={() => setAnnouncingId(focused.match.id)}
              onBack={() => setFocusedRoomId(null)}
            />
          </motion.div>
        ) : (
          <motion.div
            key="rooms"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex-1 mt-5 space-y-8"
          >
            {round?.caseText?.trim() && (
              <PresentCaseText
                caseText={round.caseText}
                roundLabel={roundLabel}
              />
            )}

            {rooms.length === 0 ? (
              <p className="text-white/55 text-2xl md:text-3xl font-bold text-center py-24">
                لم تُجرَ قرعة هذه الجولة بعد
              </p>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 md:gap-7">
                  {rooms.map(({ match, status }) => (
                    <PresentRoomCard
                      key={match.id}
                      match={match}
                      status={status}
                      govName={teamName(match.team1.teamId)}
                      oppName={teamName(match.team2.teamId)}
                      selected={false}
                      canAnnounce={canAnnounce}
                      onSelect={() => setFocusedRoomId(match.id)}
                      onAnnounce={() => setFocusedRoomId(match.id)}
                    />
                  ))}
                </div>
                <p className="text-center text-white/35 text-base md:text-xl font-bold">
                  أُعلنت {revealedCount} من {rooms.length} قاعة
                </p>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {announcingMatch && round && (
          <RevealOverlay
            tournament={tournament}
            round={round}
            roundNumber={presentedRound}
            match={announcingMatch}
            onRevealed={() => onMarkRevealed(presentedRound, announcingMatch.id)}
            onClose={() => {
              setAnnouncingId(null);
              setFocusedRoomId(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
