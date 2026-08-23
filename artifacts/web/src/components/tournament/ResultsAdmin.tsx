import { useMemo, useState } from "react";
import { AlertTriangle, ChevronDown, Lock, Trophy } from "lucide-react";
import type { Match, Tournament } from "@/types/tournament";
import { BRAND, BTN, BTN_SIZE } from "@/lib/brand";
import { getRoomStatus, missingJudgeNames } from "@/lib/roomStatus";
import RoomStatusBadge from "./RoomStatusBadge";

interface ResultsAdminProps {
  tournament: Tournament;
  /** Round shown; defaults to the current round. */
  roundNumber?: number;
  onOpenMatch: (match: Match) => void;
}

const sum = (ns: number[]) => ns.reduce((a, b) => a + b, 0);

/**
 * إدارة النتائج 🔒 — the only screen that shows numbers: every judge's scores,
 * speaker points, team totals, averages, the computed winner and the gap.
 * Never meant for projection.
 */
export default function ResultsAdmin({
  tournament,
  roundNumber,
  onOpenMatch,
}: ResultsAdminProps) {
  const roundNo = roundNumber ?? tournament.currentRound;
  const round = tournament.rounds.find((r) => r.roundNumber === roundNo);
  const [openRoom, setOpenRoom] = useState<string | null>(null);

  const teamName = useMemo(() => {
    const byId = new Map(tournament.teams.map((t) => [t.id, t.name]));
    return (id: string) => byId.get(id) ?? "—";
  }, [tournament.teams]);

  const rows = useMemo(() => {
    const pending = tournament.pendingResults ?? [];
    const expectedJudges =
      round?.judgesPerRoom ?? tournament.settings?.judgesPerRoom ?? 0;

    return (round?.matches ?? []).map((match) => {
      const submissions = pending.filter((p) => p.matchId === match.id);
      const input = { match, pending, expectedJudges };
      const govTotal = match.team1.totalScore;
      const oppTotal = match.team2.totalScore;
      return {
        match,
        status: getRoomStatus(input),
        missing: missingJudgeNames(input),
        submissions,
        govTotal,
        oppTotal,
        gap: Math.abs(govTotal - oppTotal),
        computedWinner:
          govTotal === oppTotal
            ? null
            : govTotal > oppTotal
              ? teamName(match.team1.teamId)
              : teamName(match.team2.teamId),
      };
    });
  }, [round, tournament.pendingResults, tournament.settings, teamName]);

  const incomplete = rows.filter((r) => !r.match.completed).length;

  return (
    <div className="space-y-4">
      {/* Admin-only banner */}
      <div
        className="rounded-2xl p-4 flex items-start gap-3 border"
        style={{ backgroundColor: `${BRAND.purple}0a`, borderColor: `${BRAND.purple}2e` }}
        data-testid="results-admin-banner"
      >
        <Lock className="w-4.5 h-4.5 mt-0.5 shrink-0" style={{ color: BRAND.purple }} />
        <div>
          <p className="font-bold text-[14px]" style={{ color: BRAND.ink }}>
            🔒 خاص بالإدارة — إدارة النتائج
          </p>
          <p className="text-[12.5px] mt-1 leading-relaxed" style={{ color: `${BRAND.ink}99` }}>
            هذه الصفحة تعرض الدرجات التفصيلية ولا تُستخدم للعرض العام. لإعلان
            النتيجة أمام الجمهور استخدم «إعلان النتائج».
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "قاعات الجولة", value: rows.length },
          { label: "نتائج مكتملة", value: rows.length - incomplete },
          { label: "نتائج غير مكتملة", value: incomplete },
          {
            label: "محكمون لم يرسلوا",
            value: sum(rows.map((r) => r.missing.length)),
          },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl bg-white border shadow-sm p-3.5"
            style={{ borderColor: BRAND.border }}
          >
            <p className="font-bold text-2xl tabular-nums" style={{ color: BRAND.ink }}>
              {s.value}
            </p>
            <p className="text-[12px] font-semibold mt-0.5" style={{ color: `${BRAND.ink}8c` }}>
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Rooms */}
      {rows.length === 0 ? (
        <div
          className="rounded-2xl bg-white border shadow-sm py-12 text-center"
          style={{ borderColor: BRAND.border }}
        >
          <p className="font-bold text-[14px]" style={{ color: BRAND.ink }}>
            لا توجد نتائج في الجولة {roundNo}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {rows.map((row) => {
            const expanded = openRoom === row.match.id;
            return (
              <div
                key={row.match.id}
                className="rounded-2xl bg-white border shadow-sm overflow-hidden"
                style={{ borderColor: BRAND.border }}
                data-testid={`results-row-${row.match.roomNumber}`}
              >
                {/* Head */}
                <div className="p-3.5 flex items-center gap-3 flex-wrap">
                  <div className="flex-1 min-w-[10rem]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-[14px]" style={{ color: BRAND.ink }}>
                        {row.match.roomLabel?.trim() ||
                          `القاعة ${row.match.roomNumber}`}
                      </p>
                      <RoomStatusBadge status={row.status} size="sm" />
                    </div>
                    <p className="text-[12.5px] mt-1" style={{ color: `${BRAND.ink}99` }}>
                      {teamName(row.match.team1.teamId)} ×{" "}
                      {teamName(row.match.team2.teamId)}
                    </p>
                  </div>

                  {/* Numbers — admin only */}
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p
                        className="font-bold text-lg tabular-nums"
                        style={{ color: BRAND.blue }}
                      >
                        {row.govTotal}
                      </p>
                      <p className="text-[10.5px] font-semibold" style={{ color: `${BRAND.ink}80` }}>
                        موالاة
                      </p>
                    </div>
                    <div className="text-center">
                      <p
                        className="font-bold text-lg tabular-nums"
                        style={{ color: BRAND.purple }}
                      >
                        {row.oppTotal}
                      </p>
                      <p className="text-[10.5px] font-semibold" style={{ color: `${BRAND.ink}80` }}>
                        معارضة
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-lg tabular-nums" style={{ color: BRAND.ink }}>
                        {row.gap}
                      </p>
                      <p className="text-[10.5px] font-semibold" style={{ color: `${BRAND.ink}80` }}>
                        الفارق
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setOpenRoom(expanded ? null : row.match.id)}
                    className={`${BTN.base} ${BTN.secondary} ${BTN_SIZE.sm}`}
                    data-testid={`button-expand-${row.match.roomNumber}`}
                  >
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-180" : ""}`}
                    />
                    درجات المحكمين
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenMatch(row.match)}
                    className={`${BTN.base} ${BTN.secondary} ${BTN_SIZE.sm}`}
                    data-testid={`button-edit-result-${row.match.roomNumber}`}
                  >
                    تعديل النتيجة
                  </button>
                </div>

                {/* Winner + alerts */}
                <div
                  className="px-3.5 pb-3 flex flex-wrap items-center gap-2"
                  style={{ color: `${BRAND.ink}99` }}
                >
                  {row.computedWinner && (
                    <span
                      className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[11.5px] font-bold"
                      style={{ backgroundColor: `${BRAND.gold}1f`, color: "#8A6100" }}
                    >
                      <Trophy className="w-3 h-3" />
                      الفائز حسابياً: {row.computedWinner}
                    </span>
                  )}
                  {row.missing.length > 0 && (
                    <span
                      className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[11.5px] font-bold"
                      style={{ backgroundColor: `${BRAND.warning}1f`, color: "#B45309" }}
                    >
                      <AlertTriangle className="w-3 h-3" />
                      بانتظار: {row.missing.join("، ")}
                    </span>
                  )}
                </div>

                {/* Per-judge breakdown */}
                {expanded && (
                  <div
                    className="border-t px-3.5 py-3 space-y-3"
                    style={{ borderColor: BRAND.border, backgroundColor: `${BRAND.ink}04` }}
                  >
                    {row.submissions.length === 0 ? (
                      <p className="text-[12.5px]" style={{ color: `${BRAND.ink}8c` }}>
                        لم تُستلم أي نتيجة من المحكمين بعد.
                      </p>
                    ) : (
                      row.submissions.map((s) => {
                        const gov = sum(s.govSpeakers.map((x) => x.score)) + s.govReplyScore;
                        const opp = sum(s.oppSpeakers.map((x) => x.score)) + s.oppReplyScore;
                        return (
                          <div
                            key={s.id}
                            className="rounded-xl bg-white border p-3"
                            style={{ borderColor: BRAND.border }}
                            data-testid={`judge-scores-${s.id}`}
                          >
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <p className="font-bold text-[13px]" style={{ color: BRAND.ink }}>
                                المحكم: {s.judgeName}
                              </p>
                              <span className="flex-1" />
                              <span className="text-[12px] font-bold tabular-nums" style={{ color: BRAND.blue }}>
                                {gov}
                              </span>
                              <span className="text-[11px]" style={{ color: `${BRAND.ink}66` }}>
                                ×
                              </span>
                              <span className="text-[12px] font-bold tabular-nums" style={{ color: BRAND.purple }}>
                                {opp}
                              </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {[
                                { list: s.govSpeakers, color: BRAND.blue, label: "موالاة" },
                                { list: s.oppSpeakers, color: BRAND.purple, label: "معارضة" },
                              ].map((sideData) => (
                                <div key={sideData.label}>
                                  <p
                                    className="text-[10.5px] font-bold mb-1"
                                    style={{ color: sideData.color }}
                                  >
                                    {sideData.label}
                                  </p>
                                  {sideData.list.map((sp) => (
                                    <div
                                      key={`${sp.speakerNumber}-${sp.name}`}
                                      className="flex items-center justify-between text-[12px] py-0.5"
                                    >
                                      <span style={{ color: `${BRAND.ink}cc` }}>
                                        {sp.speakerNumber}. {sp.name}
                                      </span>
                                      <span
                                        className="font-bold tabular-nums"
                                        style={{ color: BRAND.ink }}
                                      >
                                        {sp.score}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ))}
                            </div>
                            {s.judgeNotes?.trim() && (
                              <p
                                className="text-[11.5px] mt-2 pt-2 border-t"
                                style={{ borderColor: BRAND.border, color: `${BRAND.ink}99` }}
                              >
                                ملاحظات: {s.judgeNotes}
                              </p>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
