import { useEffect, useMemo, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { Trophy, X } from "lucide-react";
import { useTournament } from "@/context/TournamentContext";
import { BRAND, BRAND_GRADIENT } from "@/lib/brand";
import Confetti from "@/components/announce/Confetti";

type Phase = "intro" | "suspense" | "reveal";

const SUSPENSE_MS = 4200;

/**
 * Standalone projector screen for announcing a room's result.
 * No sidebar, no admin controls, no judge data — and scores only when the
 * tournament settings explicitly allow it.
 */
export default function AnnouncePage() {
  const [, params] = useRoute("/announce/:id/:round/:matchId");
  const [, setLocation] = useLocation();
  const { getTournament, markResultAnnounced } = useTournament();

  const tournament = getTournament(params?.id ?? "");
  const roundNumber = Number(params?.round ?? 0);
  const round = tournament?.rounds.find((r) => r.roundNumber === roundNumber);
  const match = round?.matches.find((m) => m.id === params?.matchId);

  const [phase, setPhase] = useState<Phase>("intro");

  const teams = useMemo(() => {
    if (!tournament || !match) return null;
    const byId = new Map(tournament.teams.map((t) => [t.id, t]));
    return {
      gov: byId.get(match.team1.teamId)?.name ?? "—",
      opp: byId.get(match.team2.teamId)?.name ?? "—",
    };
  }, [tournament, match]);

  // Suspense timeline: intro → swinging trophy → winner.
  useEffect(() => {
    if (!match) return;
    const t1 = window.setTimeout(() => setPhase("suspense"), 1400);
    const t2 = window.setTimeout(() => setPhase("reveal"), 1400 + SUSPENSE_MS);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [match?.id]);

  // Record the announcement once the winner is on screen.
  useEffect(() => {
    if (phase === "reveal" && tournament && match) {
      markResultAnnounced(tournament.id, roundNumber, match.id);
    }
  }, [phase, tournament?.id, match?.id, roundNumber, markResultAnnounced]);

  if (!tournament || !match || !teams) {
    return (
      <div
        className="min-h-screen flex items-center justify-center text-white text-lg font-bold"
        style={{ backgroundColor: BRAND.ink }}
      >
        النتيجة غير متاحة
      </div>
    );
  }

  const winnerId = match.winnerId;
  const winnerName =
    winnerId === match.team1.teamId
      ? teams.gov
      : winnerId === match.team2.teamId
        ? teams.opp
        : null;
  const showScores = tournament.settings?.showScoresOnAnnounce === true;
  const roomText = match.roomLabel?.trim()
    ? match.roomLabel
    : `القاعة ${match.roomNumber}`;

  const roundTitle =
    round?.kind === "final"
      ? "النهائي"
      : round?.kind === "semifinal"
        ? "نصف النهائي"
        : `الجولة ${roundNumber}`;

  return (
    <div
      dir="rtl"
      className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center px-6"
      style={{ backgroundColor: BRAND.ink }}
      data-testid="announce-screen"
    >
      {/* ambient brand light */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[60rem] h-[60rem]
                   rounded-full blur-3xl animate-announce-glow"
        style={{ backgroundImage: BRAND_GRADIENT, opacity: 0.4 }}
      />

      {/* Exit — the only control, deliberately quiet */}
      <button
        type="button"
        onClick={() => setLocation(`/tournament/${tournament.id}`)}
        aria-label="إنهاء العرض"
        className="absolute top-5 left-5 z-40 w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20
                   text-white/70 hover:text-white flex items-center justify-center transition-colors"
        data-testid="button-exit-announce"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="relative w-full max-w-5xl text-center">
        {/* Header */}
        <img
          src={`${import.meta.env.BASE_URL}logo-mark.png`}
          alt="مناظرات عُمان"
          className="w-20 h-20 md:w-24 md:h-24 object-contain mx-auto mb-4 animate-in fade-in zoom-in-90 duration-700"
          style={{ filter: "drop-shadow(0 0 28px rgba(123,45,142,0.75))" }}
        />
        <p className="text-white/50 text-sm md:text-base font-bold tracking-wide">
          {tournament.name} · {roomText}
        </p>
        <h1 className="text-white font-bold text-3xl md:text-5xl mt-2 mb-8 md:mb-12">
          {roundTitle}
        </h1>

        {/* Teams + suspense trophy */}
        <div className="relative">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 md:gap-8">
            {[
              { name: teams.gov, side: "موالاة", color: BRAND.blue, score: match.team1.totalScore, id: match.team1.teamId },
              null,
              { name: teams.opp, side: "معارضة", color: BRAND.purple, score: match.team2.totalScore, id: match.team2.teamId },
            ].map((t, i) =>
              t === null ? (
                <span
                  key="vs"
                  className="text-white/40 font-bold text-2xl md:text-4xl select-none"
                >
                  VS
                </span>
              ) : (
                <div
                  key={t.side}
                  className={`rounded-3xl px-4 py-6 md:px-8 md:py-10 border transition-all duration-700
                    ${
                      phase === "reveal" && winnerId === t.id
                        ? "scale-105 shadow-2xl"
                        : phase === "reveal" && winnerId
                          ? "opacity-45"
                          : ""
                    }`}
                  style={{
                    backgroundColor: `${t.color}1f`,
                    borderColor:
                      phase === "reveal" && winnerId === t.id
                        ? BRAND.gold
                        : `${t.color}4d`,
                    animationDelay: `${i * 120}ms`,
                  }}
                  data-testid={`announce-team-${t.side}`}
                >
                  <p
                    className="text-[11px] md:text-sm font-bold mb-2 inline-block px-2.5 py-0.5 rounded-lg"
                    style={{ backgroundColor: `${t.color}33`, color: "#FFFFFFCC" }}
                  >
                    {t.side}
                  </p>
                  <p className="text-white font-bold text-2xl md:text-5xl leading-tight break-words">
                    {t.name}
                  </p>
                  {phase === "reveal" && showScores && (
                    <p
                      className="mt-3 font-bold text-xl md:text-3xl tabular-nums animate-in fade-in duration-500"
                      style={{ color: BRAND.gold }}
                    >
                      {t.score}
                    </p>
                  )}
                </div>
              )
            )}
          </div>

          {/* Swinging trophy during suspense */}
          {phase === "suspense" && (
            <div
              aria-hidden
              className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center"
              data-testid="announce-suspense"
            >
              <span className="animate-trophy-swing">
                <Trophy
                  className="w-16 h-16 md:w-24 md:h-24"
                  style={{ color: BRAND.gold, filter: "drop-shadow(0 0 24px rgba(245,183,64,0.8))" }}
                />
              </span>
            </div>
          )}
        </div>

        {/* Winner */}
        <div className="mt-10 md:mt-14 min-h-[7rem] flex flex-col items-center justify-center">
          {phase === "intro" && (
            <p className="text-white/45 text-base md:text-xl font-bold animate-pulse">
              استعدوا لإعلان النتيجة…
            </p>
          )}
          {phase === "suspense" && (
            <p className="text-white/60 text-lg md:text-2xl font-bold animate-pulse">
              ومن الفائز…؟
            </p>
          )}
          {phase === "reveal" &&
            (winnerName ? (
              <div className="animate-in fade-in zoom-in-95 duration-700">
                <p
                  className="text-base md:text-xl font-bold tracking-wide mb-2"
                  style={{ color: BRAND.gold }}
                >
                  🏆 الفائز
                </p>
                <p
                  className="text-white font-bold text-4xl md:text-7xl leading-tight"
                  style={{ textShadow: "0 0 40px rgba(245,183,64,0.55)" }}
                  data-testid="announce-winner"
                >
                  {winnerName}
                </p>
              </div>
            ) : (
              <p className="text-white/70 text-2xl md:text-4xl font-bold">تعادل</p>
            ))}
        </div>
      </div>

      {phase === "reveal" && winnerName && <Confetti />}
    </div>
  );
}
