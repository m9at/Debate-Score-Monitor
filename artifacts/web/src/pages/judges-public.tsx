import { useEffect, useState } from "react";
import { Trophy, UserCheck, Crown, Building2, Award, RefreshCw } from "lucide-react";
import { fetchSharedById } from "@/lib/sharedTournamentsApi";
import type { Tournament } from "@/types/tournament";

const CYAN = "#29ABE2";
const PURPLE = "#7B2D8E";
const GOLD = "#FFC107";

interface PublicJudge {
  id: string;
  name: string;
  institution?: string;
  experience?: string;
  canChair: boolean;
}

interface PublicAssignment {
  matchId: string;
  roomNumber: number;
  govTeamName: string;
  oppTeamName: string;
  chairName?: string;
  panelistNames: string[];
}

interface PublicRound {
  roundNumber: number;
  assignments: PublicAssignment[];
}

interface PublicJudgesPayload {
  tournamentName: string;
  judges: PublicJudge[];
  rounds: PublicRound[];
}

function b64decode(s: string) {
  return decodeURIComponent(escape(atob(s)));
}

function decodePayload(s: string): PublicJudgesPayload | null {
  try {
    return JSON.parse(b64decode(s));
  } catch {
    return null;
  }
}

function buildPayloadFromTournament(t: Tournament): PublicJudgesPayload {
  const judges = (t.judges ?? []).map((j) => ({
    id: j.id,
    name: j.name,
    institution: j.institution,
    experience: j.experience,
    canChair: j.canChair,
  }));
  const judgeMap = new Map(judges.map((j) => [j.id, j] as const));
  const teamMapLocal = new Map(t.teams.map((tm) => [tm.id, tm.name] as const));
  const rounds = (t.rounds ?? []).map((r) => ({
    roundNumber: r.roundNumber,
    assignments: r.matches.map((m) => ({
      matchId: m.id,
      roomNumber: m.roomNumber,
      govTeamName: teamMapLocal.get(m.team1.teamId) ?? "الموالاة",
      oppTeamName: teamMapLocal.get(m.team2.teamId) ?? "المعارضة",
      chairName: m.judgeAssignment?.chairJudgeId
        ? judgeMap.get(m.judgeAssignment.chairJudgeId)?.name
        : undefined,
      panelistNames: (m.judgeAssignment?.panelistJudgeIds ?? [])
        .map((id) => judgeMap.get(id)?.name)
        .filter((n): n is string => !!n),
    })),
  }));
  return { tournamentName: t.name, judges, rounds };
}

export default function JudgesPublicPage() {
  const [payload, setPayload] = useState<PublicJudgesPayload | null>(null);
  const [error, setError] = useState(false);
  const [tournamentId, setTournamentId] = useState<string | null>(null);
  const [refreshedAt, setRefreshedAt] = useState<number>(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tid = params.get("t");
    if (tid) {
      setTournamentId(tid);
      return;
    }
    const d = params.get("d");
    if (!d) { setError(true); return; }
    const parsed = decodePayload(d);
    if (!parsed) { setError(true); return; }
    setPayload(parsed);
  }, []);

  useEffect(() => {
    if (!tournamentId) return;
    let cancelled = false;
    const load = async () => {
      try {
        const row = await fetchSharedById(tournamentId);
        if (cancelled) return;
        if (!row) {
          setError((prev) => (payload ? prev : true));
          return;
        }
        setPayload(buildPayloadFromTournament(row.data));
        setRefreshedAt(Date.now());
        setError(false);
      } catch {
        // Keep last good payload on transient errors; only surface error if we never loaded.
      }
    };
    void load();
    const interval = setInterval(() => { void load(); }, 15000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [tournamentId]);

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 text-center" dir="rtl">
        <div>
          <div className="text-5xl mb-3">⚠️</div>
          <h1 className="text-xl font-bold">رابط غير صالح</h1>
        </div>
      </div>
    );
  }

  if (!payload) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <p className="text-muted-foreground">جارٍ التحميل...</p>
      </div>
    );
  }

  const ts = refreshedAt ? new Date(refreshedAt) : null;
  const tsLabel = ts ? `${ts.getHours().toString().padStart(2,"0")}:${ts.getMinutes().toString().padStart(2,"0")}:${ts.getSeconds().toString().padStart(2,"0")}` : "";

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="relative pt-6 pb-5 overflow-hidden">
        <div className="absolute inset-0 left-0" style={{ right: "35%", backgroundColor: CYAN }} />
        <div className="absolute inset-0 right-0" style={{ left: "65%", backgroundColor: PURPLE }} />
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/20 mb-2">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-white font-bold text-lg">{payload.tournamentName}</h1>
          <p className="text-white/85 text-xs mt-0.5">قائمة المحكمين والتوزيع</p>
          {tournamentId && tsLabel && (
            <p className="text-white/70 text-[10px] mt-1 inline-flex items-center gap-1">
              <RefreshCw className="w-3 h-3" />
              يتم التحديث تلقائياً · آخر تحديث {tsLabel}
            </p>
          )}
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-5">
        <section className="bg-card rounded-2xl p-4">
          <h2 className="font-bold text-base mb-3 flex items-center gap-2">
            <UserCheck className="w-5 h-5" style={{ color: PURPLE }} />
            المحكمون ({payload.judges.length})
          </h2>
          {payload.judges.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              لم يتم اعتماد محكمين بعد.
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-2">
              {payload.judges.map((j) => (
                <div
                  key={j.id}
                  className="rounded-xl p-3 border border-border"
                  style={{ backgroundColor: "var(--muted)" }}
                  data-testid={`public-judge-${j.id}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm flex-1">{j.name}</span>
                    {j.canChair && (
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1"
                        style={{ backgroundColor: GOLD + "33", color: GOLD }}
                      >
                        <Crown className="w-3 h-3" />
                        رئيس جلسة
                      </span>
                    )}
                  </div>
                  {j.institution && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      {j.institution}
                    </p>
                  )}
                  {j.experience && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-start gap-1">
                      <Award className="w-3 h-3 mt-0.5 shrink-0" />
                      <span>{j.experience}</span>
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {payload.rounds.map((round) => (
          <section key={round.roundNumber} className="bg-card rounded-2xl p-4">
            <h2 className="font-bold text-base mb-3">
              الجولة {round.roundNumber} — توزيع المحكمين
            </h2>
            {round.assignments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                لم يُحدَّد توزيع لهذه الجولة بعد.
              </p>
            ) : (
              <div className="space-y-2">
                {round.assignments.map((a) => (
                  <div
                    key={a.matchId}
                    className="rounded-xl p-3 border border-border"
                    style={{ backgroundColor: "var(--muted)" }}
                  >
                    <div className="flex items-center gap-2 text-sm font-bold mb-1">
                      <span
                        className="w-7 h-7 rounded-md flex items-center justify-center text-xs"
                        style={{ backgroundColor: PURPLE + "26", color: PURPLE }}
                      >
                        {a.roomNumber}
                      </span>
                      <span className="flex-1 truncate">
                        {a.govTeamName} <span className="text-muted-foreground">×</span>{" "}
                        {a.oppTeamName}
                      </span>
                    </div>
                    <div className="text-xs space-y-1 mt-2">
                      {a.chairName ? (
                        <p className="flex items-center gap-1">
                          <Crown className="w-3 h-3" style={{ color: GOLD }} />
                          <span className="font-medium">رئيس الجلسة:</span> {a.chairName}
                        </p>
                      ) : (
                        <p className="text-muted-foreground">لا يوجد رئيس جلسة معيّن</p>
                      )}
                      {a.panelistNames.length > 0 ? (
                        <p>
                          <span className="font-medium">المحكمون:</span>{" "}
                          {a.panelistNames.join("، ")}
                        </p>
                      ) : (
                        <p className="text-muted-foreground">لا يوجد محكمون مساعدون</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}
      </main>
    </div>
  );
}
