import { useMemo } from "react";
import { Gavel, Link as LinkIcon, Sparkles } from "lucide-react";
import type { Match, MatchJudgeAssignment, Tournament } from "@/types/tournament";
import { BRAND, BTN, BTN_SIZE } from "@/lib/brand";
import { roomTitle, roundTitle } from "@/lib/reveal";
import RoundJudgePicker from "./RoundJudgePicker";

interface RoundJudgeBoardProps {
  tournament: Tournament;
  /** Round whose distribution is being managed. */
  selectedRound: number;
  onSelectRound: (roundNumber: number) => void;
  onAssignJudges: (matchId: string, assignment: MatchJudgeAssignment) => void;
  onAutoAssign: () => void;
  /** Personal judging link for one judge of this round. */
  onJudgeLink: (judgeId: string) => void;
  canManage: boolean;
}

/**
 * "أين يحكم كل محكم" — the judge distribution of one round, living with the
 * judges themselves instead of crowding the overview: pick the round, see every
 * room, its panel, and each judge's personal link.
 */
export default function RoundJudgeBoard({
  tournament,
  selectedRound,
  onSelectRound,
  onAssignJudges,
  onAutoAssign,
  onJudgeLink,
  canManage,
}: RoundJudgeBoardProps) {
  const round = tournament.rounds.find((r) => r.roundNumber === selectedRound);
  const judges = useMemo(
    () => (tournament.judges ?? []).filter((j) => !j.disabled),
    [tournament.judges],
  );
  const teamName = (id: string) =>
    tournament.teams.find((t) => t.id === id)?.name ?? "—";
  const roundFinished = !!round?.completed;

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

  const judgesOf = (m: Match) => {
    const a = m.judgeAssignment;
    const ids = [
      ...(a?.chairJudgeId ? [a.chairJudgeId] : []),
      ...(a?.panelistJudgeIds ?? []),
    ];
    return ids.map((id) => judges.find((j) => j.id === id)).filter(Boolean) as typeof judges;
  };

  return (
    <div
      className="rounded-2xl bg-white border shadow-sm overflow-hidden mb-4"
      style={{ borderColor: BRAND.border }}
      dir="rtl"
      data-testid="round-judge-board"
    >
      <header
        className="px-4 py-3 border-b flex items-center gap-2.5 flex-wrap"
        style={{ borderColor: BRAND.border }}
      >
        <Gavel className="w-4 h-4" style={{ color: BRAND.purple }} />
        <h3 className="font-bold text-[14.5px]" style={{ color: BRAND.ink }}>
          توزيع المحكمين — أين يحكم كل محكم
        </h3>
        <select
          value={selectedRound}
          onChange={(e) => onSelectRound(Number(e.target.value))}
          className="h-9 px-3 rounded-xl border bg-white font-bold text-[13px] outline-none"
          style={{ borderColor: BRAND.border, color: BRAND.ink }}
          data-testid="select-judge-board-round"
        >
          {tournament.rounds.map((r) => (
            <option key={r.roundNumber} value={r.roundNumber}>
              {roundTitle(r, r.roundNumber)}
              {tournament.currentRound === r.roundNumber ? " (الحالية)" : ""}
            </option>
          ))}
        </select>
        <span className="flex-1" />
        {canManage && !roundFinished && (round?.matches.length ?? 0) > 0 && (
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

      {(round?.matches.length ?? 0) === 0 ? (
        <p className="px-4 py-6 text-[13px] font-semibold" style={{ color: `${BRAND.ink}8c` }}>
          لا توجد قاعات في هذه الجولة بعد.
        </p>
      ) : (
        <table className="w-full text-right">
          <thead>
            <tr className="text-[12px]" style={{ color: `${BRAND.ink}8c` }}>
              <th className="px-4 py-2 font-bold">القاعة</th>
              <th className="px-4 py-2 font-bold">الفريقان</th>
              <th className="px-4 py-2 font-bold">المحكمون</th>
              <th className="px-4 py-2 font-bold">روابط التحكيم</th>
            </tr>
          </thead>
          <tbody>
            {(round?.matches ?? []).map((m) => (
              <tr
                key={m.id}
                className="border-t align-top"
                style={{ borderColor: BRAND.border }}
                data-testid={`judge-board-room-${m.id}`}
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
                      {judgesOf(m).map((j) => j.name).join("، ") || "—"}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    {judgesOf(m).map((j) => (
                      <button
                        key={j.id}
                        type="button"
                        onClick={() => onJudgeLink(j.id)}
                        className={`${BTN.base} ${BTN.secondary} ${BTN_SIZE.sm}`}
                        data-testid={`judge-link-${j.id}`}
                      >
                        <LinkIcon className="w-3.5 h-3.5" />
                        {j.name}
                      </button>
                    ))}
                    {judgesOf(m).length === 0 && (
                      <span className="text-[12px] font-semibold" style={{ color: `${BRAND.ink}80` }}>
                        —
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
