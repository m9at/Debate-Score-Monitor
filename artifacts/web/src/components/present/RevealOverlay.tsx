import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, Trophy, X } from "lucide-react";
import type { Match, Round, Tournament } from "@/types/tournament";
import { BRAND, BRAND_GRADIENT } from "@/lib/brand";
import { revealVisibility, roomTitle, roundTitle } from "@/lib/reveal";
import Confetti from "@/components/announce/Confetti";

/** Ordered beats of the announcement. */
type Phase = "round" | "teams" | "trophy" | "travel" | "winner";

const TIMELINE: { phase: Phase; after: number }[] = [
  { phase: "teams", after: 2000 },
  { phase: "trophy", after: 3600 },
  { phase: "travel", after: 9200 },
  { phase: "winner", after: 11400 },
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
 * Full-screen result announcement: suspense, a trophy that travels to the
 * winning side, then the winner with confetti. Nothing on screen hints at the
 * winner before the trophy moves.
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
  const trophyMoving = phase === "travel" || phase === "winner";
  // Physical direction: the government card sits on the right in RTL.
  const travelX = isDraw ? 0 : govWins ? "34%" : "-34%";

  const sides = [
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
      className="fixed inset-0 z-[100] overflow-hidden flex flex-col items-center justify-center px-8"
      style={{ backgroundColor: BRAND.ink }}
      data-testid="reveal-overlay"
    >
      {/* Ambient light — intensifies as the moment builds */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/2 -top-1/3 w-[70rem] h-[70rem] rounded-full blur-3xl"
        style={{ backgroundImage: BRAND_GRADIENT, translateX: "-50%" }}
        animate={{ opacity: revealed ? 0.5 : phase === "trophy" ? 0.34 : 0.2 }}
        transition={{ duration: 1.6 }}
      />

      {/* Quiet exit — admin only, never a public control */}
      <button
        type="button"
        onClick={onClose}
        aria-label="إنهاء الإعلان"
        className="absolute top-6 left-6 z-40 w-11 h-11 rounded-xl bg-white/[0.08] hover:bg-white/20
                   text-white/50 hover:text-white flex items-center justify-center transition-colors"
        data-testid="button-close-reveal"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="relative w-full max-w-[92rem] text-center">
        {/* Round + room */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        >
          <p className="text-white/45 text-lg md:text-2xl font-bold tracking-wide">
            {tournament.name} · {roomTitle(match)}
          </p>
          <h1
            className="text-white font-black text-5xl md:text-7xl mt-3"
            style={{ textShadow: "0 0 46px rgba(123,45,142,0.55)" }}
            data-testid="reveal-round-title"
          >
            {roundTitle(round, roundNumber)}
          </h1>
        </motion.div>

        {/* Teams */}
        <AnimatePresence>
          {phase !== "round" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative mt-12 md:mt-16"
            >
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 md:gap-10">
                {sides.map((s, i) => (
                  <motion.div
                    key={s.key}
                    initial={{ opacity: 0, x: i === 0 ? 120 : -120 }}
                    animate={{
                      opacity: revealed && !s.isWinner && !isDraw ? 0.35 : 1,
                      x: 0,
                      scale: revealed && s.isWinner ? 1.06 : 1,
                    }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="rounded-[2rem] border px-6 py-10 md:px-10 md:py-14 relative"
                    style={{
                      backgroundColor: `${s.color}1f`,
                      // Before the reveal both sides are styled identically.
                      borderColor:
                        revealed && s.isWinner ? BRAND.gold : `${s.color}4d`,
                      boxShadow:
                        revealed && s.isWinner
                          ? `0 0 90px ${BRAND.gold}66`
                          : undefined,
                    }}
                    data-testid={`reveal-side-${s.key}`}
                  >
                    <span
                      className="inline-block px-3 py-1 rounded-xl text-sm md:text-base font-bold mb-4"
                      style={{ backgroundColor: `${s.color}33`, color: "#FFFFFFCC" }}
                    >
                      {s.label}
                    </span>
                    <p className="text-white font-black text-3xl md:text-6xl leading-tight break-words">
                      {s.name}
                    </p>
                    {revealed && canShowScores && (
                      <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        className="mt-5 font-black text-2xl md:text-4xl tabular-nums"
                        style={{ color: BRAND.gold }}
                        data-testid={`reveal-score-${s.key}`}
                      >
                        {s.score}
                      </motion.p>
                    )}
                  </motion.div>
                ))}
                <span className="text-white/35 font-black text-3xl md:text-5xl select-none order-2">
                  VS
                </span>
              </div>

              {/* Trophy: enters centre, breathes, then travels to the winner */}
              <AnimatePresence>
                {phase !== "teams" && (
                  <motion.div
                    aria-hidden
                    className="absolute inset-x-0 top-1/2 flex justify-center pointer-events-none"
                    initial={{ opacity: 0, scale: 0.3, y: "-50%" }}
                    animate={{
                      opacity: 1,
                      scale: trophyMoving ? 1.35 : [1, 1.08, 1],
                      // Suspense: right → centre → left → centre, then the
                      // final, decisive move to the winning side.
                      x: trophyMoving ? travelX : ["0%", "30%", "0%", "-30%", "0%"],
                      // Once it settles on a side it rises ABOVE the card so the
                      // team name is never covered.
                      y: trophyMoving && !isDraw ? "-170%" : "-50%",
                      rotate: trophyMoving ? 0 : [-7, 7, -7],
                    }}
                    transition={{
                      x: trophyMoving
                        ? { duration: 1.9, ease: [0.22, 1, 0.36, 1] }
                        : {
                            duration: 5.4,
                            repeat: Infinity,
                            ease: "easeInOut",
                          },
                      y: { duration: 1.4, ease: [0.22, 1, 0.36, 1] },
                      scale: trophyMoving
                        ? { duration: 1.9 }
                        : { duration: 2.6, repeat: Infinity, ease: "easeInOut" },
                      rotate: trophyMoving
                        ? { duration: 1.2 }
                        : { duration: 3.4, repeat: Infinity, ease: "easeInOut" },
                      opacity: { duration: 0.9 },
                    }}
                    data-testid="reveal-trophy"
                  >
                    <span className="relative">
                      {/* pulsing halo */}
                      <motion.span
                        className="absolute inset-0 rounded-full blur-2xl"
                        style={{ backgroundColor: `${BRAND.gold}80` }}
                        animate={{ opacity: [0.35, 0.85, 0.35], scale: [1, 1.5, 1] }}
                        transition={{ duration: 2.2, repeat: Infinity }}
                      />
                      <Trophy
                        className="relative w-24 h-24 md:w-40 md:h-40"
                        style={{
                          color: BRAND.gold,
                          filter: `drop-shadow(0 0 38px ${BRAND.gold}cc)`,
                        }}
                      />
                      {/* light sweep across the trophy */}
                      <motion.span
                        className="absolute inset-0 overflow-hidden rounded-full"
                        style={{
                          backgroundImage:
                            "linear-gradient(115deg, transparent 35%, rgba(255,255,255,0.75) 50%, transparent 65%)",
                          mixBlendMode: "screen",
                        }}
                        animate={{ x: ["-130%", "130%"] }}
                        transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 1.1 }}
                      />
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Status line / winner */}
        <div className="mt-14 md:mt-20 min-h-[9rem] flex items-center justify-center">
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
            {(phase === "teams" || phase === "trophy" || phase === "travel") && (
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
                {winnerName ? (
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
            className="mt-10 flex flex-wrap items-center justify-center gap-3"
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
