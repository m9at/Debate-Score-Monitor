import { useMemo } from "react";
import { useRoute, useLocation } from "wouter";
import { useTournament } from "@/context/TournamentContext";
import {
  ArrowRight,
  Users,
  Layers,
  Target,
  TrendingUp,
  Award,
  Mic,
  Building2,
  Crown,
  Trophy,
} from "lucide-react";

const CYAN = "#29ABE2";
const PURPLE = "#7B2D8E";
const GOLD = "#FFC107";

export default function StatsPage() {
  const [, params] = useRoute("/stats/:id");
  const [, setLocation] = useLocation();
  const { getTournament } = useTournament();
  const tournament = getTournament(params?.id || "");

  const stats = useMemo(() => {
    if (!tournament) return null;

    const totalMatches = tournament.rounds.reduce(
      (s, r) => s + r.matches.length,
      0
    );
    const completedMatches = tournament.rounds.reduce(
      (s, r) => s + r.matches.filter((m) => m.completed).length,
      0
    );
    const totalSpeakers = tournament.teams.reduce(
      (s, t) => s + t.speakersPerTeam,
      0
    );
    const institutions = new Set(
      tournament.teams.map((t) => t.institution).filter(Boolean) as string[]
    );

    let totalSpeechPts = 0;
    let totalSpeechCount = 0;
    let totalReplyPts = 0;
    let totalReplyCount = 0;
    let highestSpeech = { score: 0, name: "", team: "" };

    type SpAgg = {
      teamId: string;
      team: string;
      name: string;
      total: number;
      speeches: number;
      bestSpeakerCount: number;
    };
    const agg = new Map<string, SpAgg>();
    tournament.teams.forEach((t) => {
      t.speakerNames.forEach((sp) => {
        const k = `${t.id}::${sp}`;
        agg.set(k, {
          teamId: t.id, team: t.name, name: sp,
          total: 0, speeches: 0, bestSpeakerCount: 0,
        });
      });
    });

    tournament.rounds.forEach((r) => {
      r.matches.forEach((m) => {
        if (!m.completed) return;
        [m.team1, m.team2].forEach((mt) => {
          const team = tournament.teams.find((t) => t.id === mt.teamId);
          mt.speakers.forEach((sp) => {
            totalSpeechPts += sp.score;
            totalSpeechCount += 1;
            if (sp.score > highestSpeech.score) {
              highestSpeech = {
                score: sp.score,
                name: sp.name,
                team: team?.name ?? "",
              };
            }
            const key = `${mt.teamId}::${sp.name}`;
            const a = agg.get(key);
            if (a) {
              a.total += sp.score;
              a.speeches += 1;
              if (sp.speakerNumber === mt.replySpeakerNumber) {
                a.total += mt.replyScore;
              }
            }
          });
          totalReplyPts += mt.replyScore;
          if (mt.replyScore > 0) totalReplyCount += 1;
        });
        if (m.bestSpeaker) {
          const key = `${m.bestSpeaker.teamId}::${m.bestSpeaker.name}`;
          const a = agg.get(key);
          if (a) a.bestSpeakerCount += 1;
        }
      });
    });

    const speakerArr = Array.from(agg.values());
    const topSpeakers = [...speakerArr]
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
    const topBest = [...speakerArr]
      .filter((s) => s.bestSpeakerCount > 0)
      .sort((a, b) => b.bestSpeakerCount - a.bestSpeakerCount)
      .slice(0, 5);

    const standings = [...tournament.teams].sort((a, b) =>
      b.wins !== a.wins ? b.wins - a.wins : b.totalPoints - a.totalPoints
    );

    return {
      totalMatches,
      completedMatches,
      totalSpeakers,
      institutionCount: institutions.size,
      avgSpeechScore: totalSpeechCount
        ? Math.round((totalSpeechPts / totalSpeechCount) * 10) / 10
        : 0,
      avgReplyScore: totalReplyCount
        ? Math.round((totalReplyPts / totalReplyCount) * 10) / 10
        : 0,
      highestSpeech,
      topSpeakers,
      topBest,
      standings,
      completionPct: totalMatches
        ? Math.round((completedMatches / totalMatches) * 100)
        : 0,
    };
  }, [tournament]);

  if (!tournament || !stats) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <p className="text-muted-foreground">البطولة غير موجودة</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Hero */}
      <div className="relative pt-6 pb-6 overflow-hidden">
        <div className="absolute inset-0 left-0" style={{ right: "35%", backgroundColor: CYAN }} />
        <div className="absolute inset-0 right-0" style={{ left: "65%", backgroundColor: PURPLE }} />
        <div className="relative max-w-5xl mx-auto px-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLocation(`/tournament/${tournament.id}`)}
              aria-label="رجوع"
              className="w-10 h-10 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center"
            >
              <ArrowRight className="w-4 h-4 text-white" />
            </button>
            <div className="flex-1 min-w-0 text-center">
              <h1 className="text-white font-bold text-lg truncate">{tournament.name}</h1>
              <p className="text-white/85 text-xs">إحصائيات شاملة</p>
            </div>
            <div className="w-10" />
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-5 space-y-4">
        {/* Top stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            icon={<Users className="w-5 h-5" />}
            label="عدد الفرق"
            value={tournament.teams.length}
            color={CYAN}
            testId="stat-teams"
          />
          <StatCard
            icon={<Mic className="w-5 h-5" />}
            label="عدد المتناظرين"
            value={stats.totalSpeakers}
            color={PURPLE}
            testId="stat-speakers"
          />
          <StatCard
            icon={<Building2 className="w-5 h-5" />}
            label="عدد المؤسسات"
            value={stats.institutionCount}
            color="#FF9500"
            testId="stat-institutions"
          />
          <StatCard
            icon={<Layers className="w-5 h-5" />}
            label="الجولات"
            value={`${tournament.rounds.length}/${tournament.totalRounds}`}
            color="#34C759"
            testId="stat-rounds"
          />
          <StatCard
            icon={<Target className="w-5 h-5" />}
            label="إجمالي المباريات"
            value={stats.totalMatches}
            color={CYAN}
            testId="stat-total-matches"
          />
          <StatCard
            icon={<Trophy className="w-5 h-5" />}
            label="مباريات مكتملة"
            value={`${stats.completedMatches} (${stats.completionPct}%)`}
            color={PURPLE}
            testId="stat-completed-matches"
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5" />}
            label="متوسط نقاط الخطاب"
            value={stats.avgSpeechScore}
            color="#34C759"
            testId="stat-avg-speech"
          />
          <StatCard
            icon={<Award className="w-5 h-5" />}
            label="متوسط نقاط الرد"
            value={stats.avgReplyScore}
            color="#FF9500"
            testId="stat-avg-reply"
          />
        </div>

        {/* Highest speech */}
        {stats.highestSpeech.score > 0 && (
          <div
            className="rounded-2xl p-4 flex items-center gap-3"
            style={{
              background: `linear-gradient(135deg, ${GOLD}26, ${GOLD}10)`,
              border: `1px solid ${GOLD}40`,
            }}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: GOLD }}
            >
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-muted-foreground">
                أعلى نقاط خطاب فردي
              </p>
              <p className="font-bold truncate">{stats.highestSpeech.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {stats.highestSpeech.team}
              </p>
            </div>
            <div className="text-2xl font-bold" style={{ color: GOLD }}>
              {stats.highestSpeech.score}
            </div>
          </div>
        )}

        {/* Top speakers */}
        <div className="bg-card rounded-2xl p-4">
          <h2 className="text-base font-bold mb-3 flex items-center gap-2">
            <Mic className="w-4 h-4" style={{ color: CYAN }} />
            أفضل 5 متحدثين بالنقاط
          </h2>
          {stats.topSpeakers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              لا توجد بيانات بعد
            </p>
          ) : (
            <div className="space-y-2">
              {stats.topSpeakers.map((s, i) => (
                <div
                  key={`${s.teamId}-${s.name}`}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/50"
                >
                  <span
                    className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0"
                    style={{
                      backgroundColor: i === 0 ? GOLD : CYAN + "26",
                      color: i === 0 ? "#fff" : CYAN,
                    }}
                  >
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{s.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {s.team}
                    </p>
                  </div>
                  <div className="text-end flex-shrink-0">
                    <p className="font-bold" style={{ color: PURPLE }}>
                      {s.total}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {s.speeches} خطاب
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top best speakers */}
        {stats.topBest.length > 0 && (
          <div className="bg-card rounded-2xl p-4">
            <h2 className="text-base font-bold mb-3 flex items-center gap-2">
              <Crown className="w-4 h-4" style={{ color: GOLD }} />
              أكثر من نال لقب أفضل متحدث
            </h2>
            <div className="space-y-2">
              {stats.topBest.map((s) => (
                <div
                  key={`${s.teamId}-${s.name}-best`}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/50"
                >
                  <Crown className="w-5 h-5 flex-shrink-0" style={{ color: GOLD }} />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{s.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {s.team}
                    </p>
                  </div>
                  <span
                    className="px-3 py-1 rounded-lg font-bold text-sm"
                    style={{ backgroundColor: GOLD + "26", color: "#946200" }}
                  >
                    × {s.bestSpeakerCount}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Standings */}
        <div className="bg-card rounded-2xl p-4">
          <h2 className="text-base font-bold mb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4" style={{ color: PURPLE }} />
            ترتيب الفرق
          </h2>
          <div className="space-y-2">
            {stats.standings.map((t, i) => (
              <div
                key={t.id}
                className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/50"
                onClick={() => setLocation(`/team-history/${tournament.id}/${t.id}`)}
                role="button"
              >
                <span
                  className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0"
                  style={{
                    backgroundColor: i === 0 ? GOLD : i < 3 ? PURPLE + "26" : "var(--muted)",
                    color: i === 0 ? "#fff" : i < 3 ? PURPLE : undefined,
                  }}
                >
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{t.name}</p>
                  {t.institution && (
                    <p className="text-[11px] text-muted-foreground truncate">
                      {t.institution}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-shrink-0">
                  <span>
                    <span className="font-bold text-foreground">{t.wins}</span> فوز
                  </span>
                  <span>
                    <span className="font-bold text-foreground">{t.totalPoints}</span> نقطة
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({
  icon, label, value, color, testId,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: string;
  testId?: string;
}) {
  return (
    <div className="bg-card rounded-2xl p-3" data-testid={testId}>
      <div className="flex items-center gap-2 mb-1.5">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: color + "26", color }}
        >
          {icon}
        </div>
      </div>
      <div className="font-bold text-2xl" style={{ color }}>{value}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}
