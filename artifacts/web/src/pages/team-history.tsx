import { useMemo } from "react";
import { useRoute, useLocation } from "wouter";
import { useTournament } from "@/context/TournamentContext";
import { ArrowRight, History, Trophy, X as XIcon, Award } from "lucide-react";
import { motion } from "framer-motion";

const CYAN = "#4ECDC4";
const PURPLE = "#7B5EA7";
const SUCCESS = "#34C759";
const DANGER = "#FF3B30";

export default function TeamHistory() {
  const [, params] = useRoute("/team-history/:tournamentId/:teamId");
  const [, setLocation] = useLocation();
  const { getTournament } = useTournament();
  const tournament = getTournament(params?.tournamentId || "");
  const team = tournament?.teams.find((t) => t.id === params?.teamId);

  const matchHistory = useMemo(() => {
    if (!tournament || !team) return [];
    const out: Array<{
      roundNumber: number;
      matchId: string;
      roomNumber: number;
      roomLabel?: string;
      myRole: "government" | "opposition";
      myScore: number;
      oppScore: number;
      opponentName: string;
      won: boolean;
    }> = [];
    for (const round of tournament.rounds) {
      for (const match of round.matches) {
        if (!match.completed) continue;
        const isTeam1 = match.team1.teamId === team.id;
        const isTeam2 = match.team2.teamId === team.id;
        if (!isTeam1 && !isTeam2) continue;
        const myMT = isTeam1 ? match.team1 : match.team2;
        const oppMT = isTeam1 ? match.team2 : match.team1;
        const opponent = tournament.teams.find((t) => t.id === oppMT.teamId);
        out.push({
          roundNumber: round.roundNumber,
          matchId: match.id,
          roomNumber: match.roomNumber,
          roomLabel: match.roomLabel,
          myRole: myMT.role,
          myScore: myMT.totalScore,
          oppScore: oppMT.totalScore,
          opponentName: opponent?.name ?? "غير معروف",
          won: match.winnerId === team.id,
        });
      }
    }
    return out;
  }, [tournament, team]);

  if (!tournament || !team) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">البيانات غير موجودة</p>
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
          <div className="flex-1 min-w-0">
            <h1 className="text-white font-bold text-base truncate">
              {team.name}
            </h1>
            <p className="text-white/70 text-xs">سجل المباريات</p>
          </div>
          <History className="w-5 h-5 text-white" />
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 py-5">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div
            className="text-center bg-card rounded-2xl p-4 shadow-sm"
            style={{
              borderTopWidth: 3,
              borderTopColor: CYAN,
              borderTopStyle: "solid",
            }}
          >
            <Trophy className="w-5 h-5 mx-auto mb-1.5" style={{ color: CYAN }} />
            <p className="text-2xl font-bold" style={{ color: CYAN }}>
              {team.wins}
            </p>
            <p className="text-xs text-muted-foreground">فوز</p>
          </div>
          <div
            className="text-center bg-card rounded-2xl p-4 shadow-sm"
            style={{
              borderTopWidth: 3,
              borderTopColor: PURPLE,
              borderTopStyle: "solid",
            }}
          >
            <XIcon className="w-5 h-5 mx-auto mb-1.5" style={{ color: PURPLE }} />
            <p className="text-2xl font-bold" style={{ color: PURPLE }}>
              {team.losses}
            </p>
            <p className="text-xs text-muted-foreground">خسارة</p>
          </div>
          <div
            className="text-center bg-card rounded-2xl p-4 shadow-sm"
            style={{
              borderTopWidth: 3,
              borderTopColor: "#FFD700",
              borderTopStyle: "solid",
            }}
          >
            <Award className="w-5 h-5 mx-auto mb-1.5" style={{ color: "#D4A017" }} />
            <p className="text-2xl font-bold">{team.totalPoints}</p>
            <p className="text-xs text-muted-foreground">النقاط</p>
          </div>
        </div>

        {matchHistory.length === 0 ? (
          <div className="text-center py-12">
            <History className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">لا توجد مباريات مسجلة</p>
          </div>
        ) : (
          <div>
            {matchHistory.map((entry, i) => {
              const accent = entry.myRole === "government" ? CYAN : PURPLE;
              const resultColor = entry.won ? SUCCESS : DANGER;
              return (
                <motion.div
                  key={entry.matchId}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-card rounded-2xl p-4 mb-3 shadow-sm"
                  style={{
                    borderRightWidth: 4,
                    borderRightColor: resultColor,
                    borderRightStyle: "solid",
                  }}
                  data-testid={`card-history-${entry.matchId}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-semibold">
                        الجولة {entry.roundNumber}
                      </span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">
                        {entry.roomLabel?.trim() || `قاعة ${entry.roomNumber}`}
                      </span>
                    </div>
                    <div
                      className="px-2.5 py-0.5 rounded-md text-xs font-bold"
                      style={{
                        backgroundColor: resultColor + "26",
                        color: resultColor,
                      }}
                    >
                      {entry.won ? "فوز" : "خسارة"}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">
                        ضد {entry.opponentName}
                      </div>
                      <div
                        className="inline-block mt-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold"
                        style={{
                          backgroundColor: accent + "26",
                          color: accent,
                        }}
                      >
                        {entry.myRole === "government" ? "موالاة" : "معارضة"}
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="text-2xl font-bold" style={{ color: accent }}>
                        {entry.myScore}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        ضد {entry.oppScore}
                      </div>
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
