import { useMemo, useState, useRef, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useTournament } from "@/context/TournamentContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Trophy,
  ChevronLeft,
  ChevronRight,
  Layers,
  Crown,
  Eye,
  RotateCcw,
  Sparkles,
} from "lucide-react";

const CYAN = "#4ECDC4";
const PURPLE = "#7B5EA7";
const GOLD = "#FFC107";

export default function ResultsPage() {
  const [, params] = useRoute("/results/:id");
  const [, setLocation] = useLocation();
  const { getTournament } = useTournament();
  const tournament = getTournament(params?.id || "");

  const initialRound = tournament?.rounds.length
    ? tournament.rounds[tournament.rounds.length - 1].roundNumber
    : 1;
  const [viewingRound, setViewingRound] = useState<number>(initialRound);
  const [revealState, setRevealState] = useState<Record<string, "suspense" | "revealed">>({});
  const timersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const [winnerPopup, setWinnerPopup] = useState<{ teamName: string; color: string } | null>(null);
  const popupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      for (const k of Object.keys(timersRef.current)) clearTimeout(timersRef.current[k]);
      if (popupTimerRef.current) clearTimeout(popupTimerRef.current);
    };
  }, []);

  const dismissPopup = () => {
    setWinnerPopup(null);
    if (popupTimerRef.current) { clearTimeout(popupTimerRef.current); popupTimerRef.current = null; }
  };

  const sortedTeams = useMemo(() => {
    if (!tournament) return [];
    return [...tournament.teams].sort((a, b) =>
      b.wins !== a.wins ? b.wins - a.wins : b.totalPoints - a.totalPoints
    );
  }, [tournament]);

  const startReveal = (id: string, matchWinnerId?: string) => {
    const cur = revealState[id];
    if (cur === "suspense") return;
    if (cur === "revealed") {
      if (timersRef.current[id]) { clearTimeout(timersRef.current[id]); delete timersRef.current[id]; }
      setRevealState((prev) => { const { [id]: _omit, ...rest } = prev; return rest; });
      return;
    }
    setRevealState((prev) => ({ ...prev, [id]: "suspense" }));
    if (timersRef.current[id]) clearTimeout(timersRef.current[id]);
    const winner = matchWinnerId ? tournament?.teams.find((t) => t.id === matchWinnerId) : null;
    timersRef.current[id] = setTimeout(() => {
      setRevealState((prev) => ({ ...prev, [id]: "revealed" }));
      delete timersRef.current[id];
      if (winner) {
        if (popupTimerRef.current) clearTimeout(popupTimerRef.current);
        setWinnerPopup({ teamName: winner.name, color: CYAN });
        popupTimerRef.current = setTimeout(() => setWinnerPopup(null), 5000);
      }
    }, 1800);
  };

  const resetReveals = () => {
    for (const k of Object.keys(timersRef.current)) clearTimeout(timersRef.current[k]);
    timersRef.current = {};
    setRevealState({});
  };

  if (!tournament) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">البطولة غير موجودة</p>
      </div>
    );
  }

  if (tournament.rounds.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center gap-4">
        <Layers className="w-16 h-16 text-muted-foreground/30" />
        <p className="text-muted-foreground">لم يتم لعب أي جولة بعد</p>
        <button
          onClick={() => setLocation(`/tournament/${tournament.id}`)}
          className="px-6 py-2 rounded-xl text-white font-bold"
          style={{ backgroundColor: PURPLE }}
        >
          العودة للبطولة
        </button>
      </div>
    );
  }

  const round = tournament.rounds.find((r) => r.roundNumber === viewingRound);
  const getState = (id: string): "hidden" | "suspense" | "revealed" =>
    revealState[id] ?? "hidden";
  const champion = tournament.finished ? sortedTeams[0] : null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Victory popup overlay */}
      <AnimatePresence>
        {winnerPopup && (
          <motion.div
            key="winner-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
            onClick={dismissPopup}
          >
            <motion.div
              initial={{ scale: 0.5, y: 60, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 220, damping: 18 }}
              className="flex flex-col items-center gap-4 px-8 py-8 rounded-3xl shadow-2xl text-center max-w-xs w-full"
              style={{ backgroundColor: "#fff" }}
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                animate={{ rotate: [0, -15, 15, -10, 10, 0], scale: [1, 1.2, 1.2, 1] }}
                transition={{ duration: 0.8, delay: 0.15 }}
                className="w-24 h-24 rounded-full flex items-center justify-center shadow-xl"
                style={{ backgroundColor: GOLD, boxShadow: `0 0 40px ${GOLD}88` }}
              >
                <Trophy className="w-12 h-12 text-white" />
              </motion.div>
              <div>
                <p className="text-xs font-bold tracking-widest mb-1" style={{ color: GOLD }}>🏆 الفائز</p>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl font-black"
                  style={{ color: PURPLE }}
                >
                  {winnerPopup.teamName}
                </motion.p>
              </div>
              {/* Confetti dots */}
              {Array.from({ length: 12 }).map((_, i) => {
                const angle = (Math.PI * 2 * i) / 12;
                const r = 120 + (i % 3) * 30;
                const colors = [GOLD, CYAN, PURPLE, "#FF6B6B", "#4ECDC4"];
                return (
                  <motion.div
                    key={i}
                    initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
                    animate={{ x: Math.cos(angle) * r, y: Math.sin(angle) * r, opacity: 0, scale: 1 }}
                    transition={{ duration: 0.9, delay: 0.05 + i * 0.03, ease: "easeOut" }}
                    className="absolute w-3 h-3 rounded-full pointer-events-none"
                    style={{ backgroundColor: colors[i % colors.length], top: "50%", left: "50%" }}
                  />
                );
              })}
              <button
                onClick={dismissPopup}
                className="mt-1 text-xs text-muted-foreground underline underline-offset-2"
              >
                اضغط للإغلاق
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Header */}
      <div className="relative pt-6 pb-6 overflow-hidden">
        <div
          className="absolute top-0 bottom-0 left-0"
          style={{ right: "35%", backgroundColor: CYAN }}
        />
        <div
          className="absolute top-0 bottom-0 right-0"
          style={{ left: "65%", backgroundColor: PURPLE }}
        />

        <div className="relative max-w-5xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => setLocation(`/tournament/${tournament.id}`)}
              aria-label="رجوع"
              className="w-10 h-10 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
              data-testid="button-back"
            >
              <ArrowRight className="w-4 h-4 text-white" />
            </button>
            <div className="flex-1 min-w-0 text-center">
              <h1
                className="text-white font-bold text-lg truncate"
                data-testid="text-tournament-name"
              >
                {tournament.name}
              </h1>
              <p className="text-white/80 text-xs">إعلان النتائج</p>
            </div>
            <button
              onClick={resetReveals}
              aria-label="إخفاء النتائج"
              title="إخفاء جميع النتائج"
              className="w-10 h-10 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
              data-testid="button-reset-reveals"
            >
              <RotateCcw className="w-4 h-4 text-white" />
            </button>
          </div>

          {champion && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl p-4 mb-3 shadow-lg flex items-center gap-3"
              data-testid="card-champion"
            >
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{ backgroundColor: GOLD + "26" }}
              >
                <Crown className="w-7 h-7" style={{ color: GOLD }} />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold" style={{ color: GOLD }}>
                  بطل البطولة
                </p>
                <p className="font-bold text-base">{champion.name}</p>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Round Navigation */}
      <div className="max-w-5xl w-full mx-auto px-4 pt-4">
        <div className="flex items-center justify-between py-3 border-b border-border mb-4">
          <button
            disabled={viewingRound <= 1}
            onClick={() => {
              setViewingRound(viewingRound - 1);
              resetReveals();
            }}
            aria-label="الجولة السابقة"
            className="w-10 h-10 rounded-lg flex items-center justify-center disabled:opacity-30"
            style={{
              backgroundColor: viewingRound > 1 ? CYAN + "26" : "transparent",
            }}
            data-testid="button-prev-round"
          >
            <ChevronRight className="w-5 h-5" style={{ color: CYAN }} />
          </button>

          <div className="flex flex-col items-center">
            <span className="text-xs text-muted-foreground">الجولة</span>
            <span className="text-lg font-bold" style={{ color: PURPLE }}>
              {viewingRound} / {tournament.rounds.length}
            </span>
          </div>

          <button
            disabled={viewingRound >= tournament.rounds.length}
            onClick={() => {
              setViewingRound(viewingRound + 1);
              resetReveals();
            }}
            aria-label="الجولة التالية"
            className="w-10 h-10 rounded-lg flex items-center justify-center disabled:opacity-30"
            style={{
              backgroundColor:
                viewingRound < tournament.rounds.length
                  ? CYAN + "26"
                  : "transparent",
            }}
            data-testid="button-next-round"
          >
            <ChevronLeft className="w-5 h-5" style={{ color: CYAN }} />
          </button>
        </div>
      </div>

      {/* Rooms */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 pb-8">
        <div className="flex flex-col gap-4 max-w-2xl mx-auto">
          {round?.matches.map((match, idx) => {
            const govTeam = tournament.teams.find(
              (t) => t.id === match.team1.teamId
            );
            const oppTeam = tournament.teams.find(
              (t) => t.id === match.team2.teamId
            );
            if (!govTeam || !oppTeam) return null;

            const state = getState(match.id);
            const isSuspense = state === "suspense";
            const isRevealed = state === "revealed";
            const winner = match.winnerId
              ? tournament.teams.find((t) => t.id === match.winnerId)
              : null;
            const govWon = isRevealed && winner?.id === govTeam.id;
            const oppWon = isRevealed && winner?.id === oppTeam.id;
            const isTie = isRevealed && match.completed && !winner;

            return (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06 }}
                className="bg-card rounded-2xl shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => match.completed && startReveal(match.id, match.winnerId ?? undefined)}
                data-testid={`card-room-${match.roomNumber}`}
              >
                {/* Room header */}
                <div
                  className="px-4 py-2.5 flex items-center justify-between"
                  style={{ backgroundColor: PURPLE + "12" }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs text-white"
                      style={{ backgroundColor: PURPLE }}
                    >
                      {match.roomNumber}
                    </span>
                    <span className="font-bold text-sm">
                      {match.roomLabel?.trim() || `القاعة ${match.roomNumber}`}
                    </span>
                  </div>
                  {!match.completed ? (
                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-semibold">
                      قيد التنفيذ
                    </span>
                  ) : isSuspense ? (
                    <motion.span
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 0.6, repeat: Infinity }}
                      className="text-[11px] px-2 py-0.5 rounded-md font-bold flex items-center gap-1"
                      style={{ backgroundColor: GOLD + "30", color: "#946200" }}
                    >
                      <Sparkles className="w-3 h-3" />
                      جاري الكشف...
                    </motion.span>
                  ) : !isRevealed ? (
                    <span
                      className="text-[11px] px-2 py-0.5 rounded-md font-semibold flex items-center gap-1"
                      style={{
                        backgroundColor: CYAN + "20",
                        color: CYAN,
                      }}
                    >
                      <Eye className="w-3 h-3" />
                      اضغط للإظهار
                    </span>
                  ) : isTie ? (
                    <span
                      className="text-[11px] px-2 py-0.5 rounded-md font-semibold"
                      style={{
                        backgroundColor: "#FF950015",
                        color: "#FF9500",
                      }}
                    >
                      تعادل
                    </span>
                  ) : (
                    <span
                      className="text-[11px] px-2 py-0.5 rounded-md font-semibold"
                      style={{
                        backgroundColor: GOLD + "20",
                        color: "#946200",
                      }}
                    >
                      الفائز ظاهر
                    </span>
                  )}
                </div>

                {/* Trophy animation row (centered initially, slides to winner side) */}
                <div className="relative h-16 flex items-center justify-center overflow-hidden">
                  {/* Suspense pulse rings */}
                  <AnimatePresence>
                    {isSuspense && (
                      <>
                        {[0, 0.3, 0.6].map((delay) => (
                          <motion.div
                            key={delay}
                            initial={{ scale: 0.4, opacity: 0.6 }}
                            animate={{ scale: 2.4, opacity: 0 }}
                            transition={{ duration: 1.3, repeat: Infinity, delay, ease: "easeOut" }}
                            className="absolute w-16 h-16 rounded-full"
                            style={{ backgroundColor: GOLD + "55" }}
                          />
                        ))}
                      </>
                    )}
                  </AnimatePresence>
                  {/* Confetti sparkles on winner */}
                  <AnimatePresence>
                    {isRevealed && !isTie && (
                      <>
                        {Array.from({ length: 10 }).map((_, i) => {
                          const angle = (Math.PI * 2 * i) / 10;
                          const dist = 60 + Math.random() * 40;
                          const dx = Math.cos(angle) * dist + (govWon ? -90 : 90);
                          const dy = Math.sin(angle) * dist;
                          const colors = [GOLD, CYAN, PURPLE, "#FF6B6B"];
                          const color = colors[i % colors.length];
                          return (
                            <motion.div
                              key={i}
                              initial={{ x: govWon ? -90 : 90, y: 0, opacity: 1, scale: 0.4 }}
                              animate={{ x: dx, y: dy, opacity: 0, scale: 1.1 }}
                              transition={{ duration: 0.9, delay: 0.2 + i * 0.02, ease: "easeOut" }}
                              className="absolute w-2 h-2 rounded-sm"
                              style={{ backgroundColor: color }}
                            />
                          );
                        })}
                      </>
                    )}
                  </AnimatePresence>

                  {match.completed && (
                    <motion.div
                      layout
                      animate={{
                        x: isRevealed
                          ? isTie
                            ? 0
                            : govWon
                            ? "-90px"
                            : "90px"
                          : 0,
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 180,
                        damping: 16,
                      }}
                      className="absolute"
                    >
                      <motion.div
                        animate={
                          isSuspense
                            ? { rotate: [0, 360], scale: [1, 1.1, 1] }
                            : isRevealed && !isTie
                            ? { scale: [1, 1.4, 1.1], rotate: [0, govWon ? -15 : 15, 0] }
                            : {}
                        }
                        transition={
                          isSuspense
                            ? { duration: 0.6, repeat: Infinity, ease: "linear" }
                            : { duration: 0.7, delay: 0.1 }
                        }
                        className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
                        style={{
                          backgroundColor: isRevealed
                            ? GOLD
                            : isSuspense
                            ? GOLD
                            : "#E5E5E5",
                          boxShadow: isRevealed
                            ? `0 0 20px ${GOLD}99`
                            : isSuspense
                            ? `0 0 14px ${GOLD}77`
                            : undefined,
                        }}
                      >
                        <Trophy
                          className="w-8 h-8"
                          style={{
                            color: isRevealed || isSuspense ? "#fff" : "#999",
                          }}
                        />
                      </motion.div>
                    </motion.div>
                  )}
                </div>

                {/* Teams */}
                <div className="divide-y divide-border">
                  {/* Government team */}
                  <motion.div
                    animate={{
                      backgroundColor: govWon
                        ? CYAN + "1f"
                        : isRevealed && !govWon && !isTie
                        ? "rgba(0,0,0,0.02)"
                        : "rgba(0,0,0,0)",
                    }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: CYAN + "26" }}
                    >
                      <span
                        className="text-xs font-bold"
                        style={{ color: CYAN }}
                      >
                        مو
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-[10px] font-semibold uppercase"
                        style={{ color: CYAN }}
                      >
                        الموالاة
                      </p>
                      <motion.p
                        animate={{
                          fontWeight: govWon ? 800 : 700,
                          opacity: isRevealed && !govWon && !isTie ? 0.55 : 1,
                        }}
                        className="text-sm truncate"
                        style={{ color: govWon ? CYAN : undefined }}
                      >
                        {govTeam.name}
                      </motion.p>
                    </div>
                  </motion.div>

                  {/* Opposition team */}
                  <motion.div
                    animate={{
                      backgroundColor: oppWon
                        ? PURPLE + "1f"
                        : isRevealed && !oppWon && !isTie
                        ? "rgba(0,0,0,0.02)"
                        : "rgba(0,0,0,0)",
                    }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: PURPLE + "26" }}
                    >
                      <span
                        className="text-xs font-bold"
                        style={{ color: PURPLE }}
                      >
                        مع
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-[10px] font-semibold uppercase"
                        style={{ color: PURPLE }}
                      >
                        المعارضة
                      </p>
                      <motion.p
                        animate={{
                          fontWeight: oppWon ? 800 : 700,
                          opacity: isRevealed && !oppWon && !isTie ? 0.55 : 1,
                        }}
                        className="text-sm truncate"
                        style={{ color: oppWon ? PURPLE : undefined }}
                      >
                        {oppTeam.name}
                      </motion.p>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
