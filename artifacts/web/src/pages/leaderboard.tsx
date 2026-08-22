import { useMemo } from "react";
import { useRoute, useLocation } from "wouter";
import { useTournament } from "@/context/TournamentContext";
import { ArrowRight, Award, Mic } from "lucide-react";
import { motion } from "framer-motion";

const CYAN = "#4ECDC4";
const PURPLE = "#7B5EA7";

interface SpeakerEntry {
  name: string;
  teamName: string;
  teamId: string;
  totalScore: number;
  matchCount: number;
  avgScore: number;
}

export default function Leaderboard() {
  const [, params] = useRoute("/leaderboard/:id");
  const [, setLocation] = useLocation();
  const { getTournament } = useTournament();
  const tournament = getTournament(params?.id || "");

  const speakers = useMemo<SpeakerEntry[]>(() => {
    if (!tournament) return [];
    const map = new Map<string, SpeakerEntry>();
    for (const round of tournament.rounds) {
      for (const match of round.matches) {
        if (!match.completed) continue;
        const process = (mt: typeof match.team1) => {
          const team = tournament.teams.find((t) => t.id === mt.teamId);
          for (const sp of mt.speakers) {
            const key = `${mt.teamId}-${sp.speakerNumber}`;
            const existing = map.get(key);
            if (existing) {
              existing.totalScore += sp.score;
              existing.matchCount += 1;
              existing.avgScore = existing.totalScore / existing.matchCount;
            } else {
              map.set(key, {
                name: sp.name,
                teamName: team?.name || "",
                teamId: mt.teamId,
                totalScore: sp.score,
                matchCount: 1,
                avgScore: sp.score,
              });
            }
          }
        };
        process(match.team1);
        process(match.team2);
      }
    }
    return Array.from(map.values())
      .filter((s) => s.matchCount > 0)
      .sort((a, b) => b.totalScore - a.totalScore);
  }, [tournament]);

  if (!tournament) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">البطولة غير موجودة</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative pt-5 pb-4 overflow-hidden">
        <div
          className="absolute top-0 bottom-0 left-0"
          style={{ right: "35%", backgroundColor: CYAN }}
        />
        <div
          className="absolute top-0 bottom-0 right-0"
          style={{ left: "65%", backgroundColor: PURPLE }}
        />
        <div className="relative max-w-3xl mx-auto px-4 flex items-center gap-3">
          <button
            onClick={() => setLocation(`/tournament/${tournament.id}`)}
            aria-label="رجوع"
            className="w-10 h-10 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center"
            data-testid="button-back"
          >
            <ArrowRight className="w-4 h-4 text-white" />
          </button>
          <div className="flex-1">
            <h1 className="text-white font-bold text-base">ترتيب المتحدثين</h1>
            <p className="text-white/70 text-xs truncate">{tournament.name}</p>
          </div>
          <Award className="w-5 h-5 text-white" />
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 py-5">
        {speakers.length === 0 ? (
          <div className="text-center py-20">
            <Mic className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">لا توجد نتائج بعد</p>
          </div>
        ) : (
          <div>
            {speakers.map((sp, i) => {
              const isTop3 = i < 3;
              const medalColor =
                i === 0 ? "#FFD700" : i === 1 ? "#A8A9AD" : "#CD7F32";
              const borderColor =
                i === 0 ? CYAN : i === 1 ? PURPLE : "#9B7BC4";

              return (
                <motion.div
                  key={`${sp.teamId}-${sp.name}-${i}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center bg-card rounded-2xl p-3.5 mb-2.5 shadow-sm"
                  style={{
                    borderRightWidth: isTop3 ? 4 : 0,
                    borderRightColor: isTop3 ? borderColor : "transparent",
                    borderRightStyle: "solid",
                  }}
                  data-testid={`row-speaker-${i}`}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center ml-3 shrink-0"
                    style={{
                      backgroundColor: isTop3 ? medalColor : "var(--muted)",
                      color: isTop3 ? "#fff" : "var(--muted-foreground)",
                    }}
                  >
                    {isTop3 ? (
                      <Award className="w-4 h-4" />
                    ) : (
                      <span className="text-sm font-bold">{i + 1}</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-base truncate">
                      {sp.name}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground truncate">
                        {sp.teamName}
                      </span>
                      <span className="text-[11px] text-muted-foreground">·</span>
                      <span className="text-[11px] text-muted-foreground">
                        {sp.matchCount} مباراة
                      </span>
                    </div>
                  </div>

                  <div
                    className="text-center px-3 py-1.5 rounded-xl ml-2"
                    style={{ backgroundColor: PURPLE + "14" }}
                  >
                    <div className="text-[10px] text-muted-foreground">متوسط</div>
                    <div className="text-sm font-bold" style={{ color: PURPLE }}>
                      {sp.avgScore.toFixed(1)}
                    </div>
                  </div>

                  <div
                    className="text-center px-3 py-1.5 rounded-xl"
                    style={{ backgroundColor: CYAN + "14" }}
                  >
                    <div className="text-[10px] text-muted-foreground">المجموع</div>
                    <div className="text-base font-bold" style={{ color: CYAN }}>
                      {sp.totalScore}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
