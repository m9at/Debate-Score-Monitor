import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, X } from "lucide-react";
import type { Match, Round, Tournament } from "@/types/tournament";
import { BRAND, BRAND_GRADIENT } from "@/lib/brand";
import { revealVisibility, roomTitle, roundTitle } from "@/lib/reveal";
import Confetti from "@/components/announce/Confetti";
import RevealTeamSquares, {
  type RevealSide,
} from "@/components/present/RevealTeamSquares";

/** Ordered beats of the announcement. */
type Phase = "round" | "teams" | "scan" | "lock" | "winner";

const TIMELINE: { phase: Phase; after: number }[] = [
  { phase: "teams", after: 2200 },
  { phase: "scan", after: 4000 },
  { phase: "lock", after: 8800 },
  { phase: "winner", after: 10600 },
];

interface RevealOverlayProps {
  tournament: Tournament;
  round: Round;
  roundNumber: number;
  match: Match;
  /** Called once the winner is on screen — persists the `revealed` status. */
  onRevealed: () => void;
  onClose: () => void;
}

/**
 * Full-screen result announcement: the round and its motion in large type, the
 * two teams as equal squares, a searching light that hops between them, then
 * the winning square grows and lights up in gold. Nothing on screen hints at
 * the winner before that moment.
 */
export default function RevealOverlay({
  tournament,
  round,
  roundNumber,
  match,
  onRevealed,
  onClose,
}: RevealOverlayProps) {
  const [phase, setPhase] = useState<Phase>("round");
  /** Bumped by إعادة عرض الإعلان — replays the scene, never the result. */
  const [runId, setRunId] = useState(0);

  const teams = useMemo(() => {
    const byId = new Map(tournament.teams.map((t) => [t.id, t.name]));
    return {
      gov: byId.get(match.team1.teamId) ?? "—",
      opp: byId.get(match.team2.teamId) ?? "—",
    };
  }, [tournament.teams, match.team1.teamId, match.team2.teamId]);

  // Scores stay hidden unless the settings allow them; the winner does not.
  const { canShowScores } = revealVisibility(
    { ...match, resultAnnounced: true },
    tournament
  );

  const govWins = match.winnerId === match.team1.teamId;
  const oppWins = match.winnerId === match.team2.teamId;
  const isDraw = !govWins && !oppWins;
  const winnerName = govWins ? teams.gov : oppWins ? teams.opp : null;

  useEffect(() => {
    setPhase("round");
    const timers = TIMELINE.map((t) =>
      window.setTimeout(() => setPhase(t.phase), t.after)
    );
    return () => timers.forEach(window.clearTimeout);
  }, [match.id, runId]);

  useEffect(() => {
    if (phase === "winner") onRevealed();
  }, [phase, onRevealed]);

  const revealed = phase === "winner";
  const scanning = phase === "scan" || phase === "lock";
  const caseText = round.caseText?.trim();

  const sides: RevealSide[] = [
    {
      key: "gov",
      label: "موالاة",
      color: BRAND.blue,
      name: teams.gov,
      score: match.team1.totalScore,
      isWinner: govWins,
    },
    {
      key: "opp",
      label: "معارضة",
      color: BRAND.purple,
      name: teams.opp,
      score: match.team2.totalScore,
      isWinner: oppWins,
    },
  ];

  return (
    <motion.div
      dir="rtl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[100] overflow-y-auto flex flex-col items-center justify-center px-6 py-10"
      style={{ backgroundColor: BRAND.ink }}
      data-testid="reveal-overlay"
    >
      {/* Ambient light — intensifies as the moment builds */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed left-1/2 -top-1/3 w-[70rem] h-[70rem] rounded-full blur-3xl"
        style={{ backgroundImage: BRAND_GRADIENT, translateX: "-50%" }}
        animate={{ opacity: revealed ? 0.5 : scanning ? 0.34 : 0.2 }}
        transition={{ duration: 1.6 }}
      />

      {/* Stage light sweeping the hall while the result is still unknown */}
      {scanning && (
        <motion.div
          aria-hidden
          className="pointer-events-none fixed inset-y-0 w-[26rem] blur-3xl"
          style={{
            background: `linear-gradient(90deg, transparent, ${BRAND.gold}30, transparent)`,
          }}
          animate={{ x: ["-40vw", "40vw", "-40vw"] }}
          transition={{ duration: 4.4, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* Quiet exit — admin only, never a public control */}
      <button
        type="button"
        onClick={onClose}
        aria-label="إنهاء الإعلان"
        className="fixed top-6 left-6 z-40 w-11 h-11 rounded-xl bg-white/[0.08] hover:bg-white/20
                   text-white/50 hover:text-white flex items-center justify-center transition-colors"
        data-testid="button-close-reveal"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="relative w-full max-w-[96rem] text-center">
        {/* Round + room + motion */}
        <motion.div
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        >
          <p className="text-white/45 text-lg md:text-2xl font-bold tracking-wide">
            {tournament.name} · {roomTitle(match)}
          </p>
          <h1
            className="text-white font-black text-6xl md:text-8xl mt-3 tracking-tight"
            style={{ textShadow: `0 0 60px ${BRAND.gold}66` }}
            data-testid="reveal-round-title"
          >
            {roundTitle(round, roundNumber)}
          </h1>
          {caseText && (
            <p
              className="mx-auto mt-5 max-w-[70rem] text-white/85 font-bold
                         text-2xl md:text-4xl leading-snug"
              data-testid="reveal-case-text"
            >
              {caseText}
            </p>
          )}
        </motion.div>

        {/* Teams — equal squares until the winner is revealed */}
        <AnimatePresence>
          {phase !== "round" && (
            <motion.div key="squares" exit={{ opacity: 0 }}>
              <RevealTeamSquares
                sides={sides}
                scanning={scanning && !revealed}
                revealed={revealed}
                canShowScores={canShowScores}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Status line / winner */}
        <div className="mt-10 md:mt-14 min-h-[8rem] flex items-center justify-center">
          <AnimatePresence mode="wait">
            {phase === "round" && (
              <motion.p
                key="ready"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.35, 0.8, 0.35] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-white/60 text-xl md:text-3xl font-bold"
              >
                استعدوا لإعلان النتيجة…
              </motion.p>
            )}
            {(phase === "teams" || phase === "scan" || phase === "lock") && (
              <motion.p
                key="suspense"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.4, 0.9, 0.4] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.8, repeat: Infinity }}
                className="text-white/70 text-2xl md:text-4xl font-bold"
                data-testid="reveal-suspense"
              >
                ومن الفائز…؟
              </motion.p>
            )}
            {revealed && (
              <motion.div
                key="winner"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.9, ease: "easeOut" }}
              >
                {winnerName && !isDraw ? (
                  <>
                    <p
                      className="text-xl md:text-3xl font-black tracking-[0.25em] mb-3"
                      style={{ color: BRAND.gold }}
                    >
                      الفائز
                    </p>
                    <p
                      className="text-white font-black text-5xl md:text-8xl leading-tight"
                      style={{ textShadow: `0 0 60px ${BRAND.gold}99` }}
                      data-testid="reveal-winner"
                    >
                      {winnerName}
                    </p>
                  </>
                ) : (
                  <p
                    className="text-white font-black text-4xl md:text-7xl"
                    data-testid="reveal-draw"
                  >
                    تعادل
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Controls — appear only once the reveal is complete */}
        {revealed && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.6 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
          >
            <button
              type="button"
              onClick={onClose}
              className="h-12 px-8 rounded-2xl bg-white/10 hover:bg-white/20 text-white
                         text-base md:text-lg font-bold transition-colors"
              data-testid="button-back-to-round"
            >
              العودة إلى القاعات
            </button>
            <button
              type="button"
              onClick={() => setRunId((n) => n + 1)}
              className="h-12 px-8 rounded-2xl border border-white/25 text-white/85
                         hover:bg-white/10 text-base md:text-lg font-bold transition-colors
                         inline-flex items-center gap-2.5"
              data-testid="button-replay-reveal"
            >
              <RotateCcw className="w-5 h-5" />
              إعادة عرض الإعلان
            </button>
          </motion.div>
        )}
      </div>

      {revealed && <Confetti pieces={120} />}
    </motion.div>
  );
}
