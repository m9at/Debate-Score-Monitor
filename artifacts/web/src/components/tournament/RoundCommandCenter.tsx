import { useMemo } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Gavel,
  Play,
  Sparkles,
} from "lucide-react";
import type {
  Match,
  MatchJudgeAssignment,
  Tournament,
} from "@/types/tournament";
import { BRAND, BTN, BTN_PRIMARY_STYLE, BTN_SIZE } from "@/lib/brand";
import { roomTitle, roundTitle } from "@/lib/reveal";
import { evaluateRoundReadiness } from "@/lib/roundReadiness";
import RoundJudgePicker from "./RoundJudgePicker";

interface RoundCommandCenterProps {
  tournament: Tournament;
  /** Round number the organiser is inspecting. */
  selectedRound: number;
  onSelectRound: (roundNumber: number) => void;
  /** Assigns judges to one room of the selected round. */
  onAssignJudges: (matchId: string, assignment: MatchJudgeAssignment) => void;
  /** Distributes all judges over the selected round's rooms automatically. */
  onAutoAssign: () => void;
  /**
   * Prepares and starts the next round: pairings → rooms → judges → current round.
   * Only offered once the selected round is finished.
   */
  onStartNextRound: () => void;
  /** Makes the selected (already prepared) round the live one. */
  onStartSelectedRound: () => void;
  canManage: boolean;
}

/**
 * The round is the unit of work, so everything needed to run it lives here:
 * which round, its rooms and pairings, its judge distribution, whether it is
 * ready, and the single button that moves the tournament forward.
 */
export default function RoundCommandCenter({
  tournament,
  selectedRound,
  onSelectRound,
  onAssignJudges,
  onAutoAssign,
  onStartNextRound,
  onStartSelectedRound,
  canManage,
}: RoundCommandCenterProps) {
  const round = tournament.rounds.find((r) => r.roundNumber === selectedRound);
  const judges = useMemo(
    () => (tournament.judges ?? []).filter((j) => !j.disabled),
    [tournament.judges],
  );
  const teamName = (id: string) =>
    tournament.teams.find((t) => t.id === id)?.name ?? "—";

  const readiness = useMemo(
    () => evaluateRoundReadiness(tournament, round),
    [tournament, round],
  );

  /** Judges already used by the other rooms of this round. */
  const takenBy = (exceptMatchId: string) => {
    const taken = new Set<string>();
    for (const m of round?.matches ?? []) {
      if (m.id === exceptMatchId) continue;
      const a = m.judgeAssignment;
      if (a?.chairJudgeId) taken.add(a.chairJudgeId);
      for (const id of a?.panelistJudgeIds ?? []) taken.add(id);
    }
    return taken;
  };

  const judgeNamesOf = (m: Match) => {
    const a = m.judgeAssignment;
    const ids = [...(a?.chairJudgeId ? [a.chairJudgeId] : []), ...(a?.panelistJudgeIds ?? [])];
    return ids
      .map((id) => judges.find((j) => j.id === id)?.name)
      .filter(Boolean) as string[];
  };

  const isLive = tournament.started && tournament.currentRound === selectedRound;
  const roundFinished = !!round?.completed;
  const nextRoundExists = tournament.rounds.some(
    (r) => r.roundNumber === selectedRound + 1,
  );
  const canPrepareNext =
    canManage &&
    roundFinished &&
    !tournament.finished &&
    (selectedRound < tournament.totalRounds ||
      tournament.semifinalEnabled ||
      tournament.finalEnabled);

  return (
    <section className="space-y-4" dir="rtl" data-testid="round-command-center">
      {/* Round selector — everything below follows this choice. */}
      <div
        className="rounded-2xl bg-white border shadow-sm p-4 flex flex-wrap items-center gap-3"
        style={{ borderColor: BRAND.border }}
      >
        <label className="font-bold text-[14px]" style={{ color: BRAND.ink }}>
          الجولة المعروضة
        </label>
        <select
          value={selectedRound}
          onChange={(e) => onSelectRound(Number(e.target.value))}
          className="h-10 px-3 rounded-xl border bg-white font-bold text-[13.5px] outline-none"
          style={{ borderColor: BRAND.border, color: BRAND.ink }}
          data-testid="select-round"
        >
          {tournament.rounds.map((r) => (
            <option key={r.roundNumber} value={r.roundNumber}>
              {roundTitle(r, r.roundNumber)}
              {r.completed ? " — منتهية" : ""}
              {tournament.currentRound === r.roundNumber ? " (الحالية)" : ""}
            </option>
          ))}
        </select>

        <span className="flex-1" />

        {isLive ? (
          <span
            className="h-9 px-3 rounded-xl text-[12.5px] font-bold inline-flex items-center"
            style={{ backgroundColor: `${BRAND.success}1f`, color: "#15803D" }}
          >
            🟢 الجولة الجارية الآن
          </span>
        ) : (
          canManage &&
          !roundFinished &&
          round && (
            <button
              type="button"
              onClick={onStartSelectedRound}
              disabled={!readiness.ready}
              className={`${BTN.base} ${BTN.primary} ${BTN_SIZE.lg}`}
              style={BTN_PRIMARY_STYLE}
              data-testid="button-start-selected-round"
            >
              <Play className="w-4 h-4" />
              بدء {roundTitle(round, selectedRound)}
            </button>
          )
        )}

        {canPrepareNext && (
          <button
            type="button"
            onClick={onStartNextRound}
            className={`${BTN.base} ${BTN.primary} ${BTN_SIZE.lg}`}
            style={BTN_PRIMARY_STYLE}
            data-testid="button-start-next-round"
          >
            <Play className="w-4 h-4" />
            {nextRoundExists ? "بدء الجولة التالية" : "تجهيز وبدء الجولة التالية"}
          </button>
        )}
      </div>

      {/* Readiness — the round never starts before it can actually run. */}
      <div
        className="rounded-2xl bg-white border shadow-sm p-4"
        style={{
          borderColor: readiness.ready ? `${BRAND.success}55` : `${BRAND.danger}55`,
        }}
        data-testid="round-readiness"
      >
        <h3
          className="font-bold text-[14.5px] flex items-center gap-2"
          style={{ color: readiness.ready ? "#15803D" : BRAND.danger }}
        >
          {readiness.ready ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              🟢 {round ? roundTitle(round, selectedRound) : "الجولة"} جاهزة
            </>
          ) : (
            <>
              <AlertTriangle className="w-4 h-4" />
              لا يمكن بدء الجولة
            </>
          )}
        </h3>

        {readiness.issues.length > 0 && (
          <ul className="mt-2.5 space-y-1.5">
            {readiness.issues.map((iss) => (
              <li
                key={iss.key}
                className="text-[13px] font-semibold"
                style={{ color: BRAND.danger }}
                data-testid={`readiness-issue-${iss.key}`}
              >
                • {iss.message}
              </li>
            ))}
          </ul>
        )}

        {readiness.passed.length > 0 && (
          <ul className="mt-2.5 flex flex-wrap gap-1.5">
            {readiness.passed.map((p) => (
              <li
                key={p}
                className="text-[12px] font-bold px-2.5 py-1 rounded-lg"
                style={{ backgroundColor: `${BRAND.success}14`, color: "#15803D" }}
              >
                ✓ {p}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Judge distribution — part of preparing the round, not a separate page. */}
      {round && round.matches.length > 0 && (
        <div
          className="rounded-2xl bg-white border shadow-sm overflow-hidden"
          style={{ borderColor: BRAND.border }}
          data-testid="round-judge-distribution"
        >
          <header
            className="px-4 py-3 border-b flex items-center gap-2 flex-wrap"
            style={{ borderColor: BRAND.border }}
          >
            <Gavel className="w-4 h-4" style={{ color: BRAND.purple }} />
            <h3 className="font-bold text-[14.5px]" style={{ color: BRAND.ink }}>
              توزيع المحكمين
            </h3>
            <span className="flex-1" />
            {canManage && !roundFinished && (
              <button
                type="button"
                onClick={onAutoAssign}
                className={`${BTN.base} ${BTN.secondary} ${BTN_SIZE.sm}`}
                data-testid="button-auto-assign-judges"
              >
                <Sparkles className="w-3.5 h-3.5" />
                توزيع تلقائي
              </button>
            )}
          </header>

          <table className="w-full text-right">
            <thead>
              <tr className="text-[12px]" style={{ color: `${BRAND.ink}8c` }}>
                <th className="px-4 py-2 font-bold">القاعة</th>
                <th className="px-4 py-2 font-bold">الفريقان</th>
                <th className="px-4 py-2 font-bold">المحكمون</th>
              </tr>
            </thead>
            <tbody>
              {round.matches.map((m) => (
                <tr
                  key={m.id}
                  className="border-t align-top"
                  style={{ borderColor: BRAND.border }}
                  data-testid={`round-room-${m.id}`}
                >
                  <td className="px-4 py-3 font-bold text-[13px]" style={{ color: BRAND.ink }}>
                    {roomTitle(m)}
                  </td>
                  <td className="px-4 py-3 text-[13px] font-semibold" style={{ color: BRAND.ink }}>
                    {teamName(m.team1.teamId)} × {teamName(m.team2.teamId)}
                  </td>
                  <td className="px-4 py-3">
                    {canManage && !roundFinished ? (
                      <RoundJudgePicker
                        judges={judges}
                        assignment={m.judgeAssignment}
                        takenElsewhere={takenBy(m.id)}
                        onChange={(a) => onAssignJudges(m.id, a)}
                      />
                    ) : (
                      <span className="text-[13px] font-semibold" style={{ color: BRAND.ink }}>
                        {judgeNamesOf(m).join("، ") || "—"}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
