import { useMemo } from "react";
import { Eraser, Gavel, Link as LinkIcon, Minus, Plus, Sparkles } from "lucide-react";
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
  /** Empties every room's panel in this round. */
  onClearAll: () => void;
  /** Default number of judges per room for this round. */
  onSetJudgesPerRoom: (n: number) => void;
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
  onClearAll,
  onSetJudgesPerRoom,
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
  const judgesPerRoom =
    round?.judgesPerRoom ?? tournament.settings?.judgesPerRoom ?? 1;
  const slotsOf = (m: Match) => m.judgeAssignment?.slots ?? judgesPerRoom;
  const needed = (round?.matches ?? []).reduce((s, m) => s + slotsOf(m), 0);

  /** Changes how many judges one room needs, dropping extra seats if lowered. */
  const setRoomSlots = (m: Match, n: number) => {
    const slots = Math.max(0, Math.min(9, n));
    const ids = [
      ...(m.judgeAssignment?.chairJudgeId ? [m.judgeAssignment.chairJudgeId] : []),
      ...(m.judgeAssignment?.panelistJudgeIds ?? []),
    ].slice(0, slots);
    onAssignJudges(m.id, {
      chairJudgeId: ids[0],
      panelistJudgeIds: ids.slice(1),
      slots,
    });
  };

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
          <>
            <label className="flex items-center gap-1.5 text-[12.5px] font-bold" style={{ color: BRAND.ink }}>
              محكمون لكل قاعة
              <input
                type="number"
                min={0}
                max={9}
                value={judgesPerRoom}
                onChange={(e) =>
                  onSetJudgesPerRoom(Math.max(0, Math.min(9, Math.floor(Number(e.target.value) || 0))))
                }
                className="w-14 h-9 px-2 rounded-xl border bg-white text-center font-bold outline-none"
                style={{ borderColor: BRAND.border }}
                data-testid="input-round-judges-per-room"
              />
            </label>
            <span
              className="text-[12px] font-semibold"
              style={{ color: judges.length < needed ? "#B45309" : `${BRAND.ink}8c` }}
              data-testid="text-judges-needed"
            >
              {judges.length} محكم متاح / {needed} مطلوب
            </span>
            <button
              type="button"
              onClick={onClearAll}
              className={`${BTN.base} ${BTN.secondary} ${BTN_SIZE.sm}`}
              data-testid="button-clear-judges"
            >
              <Eraser className="w-3.5 h-3.5" />
              تصفير التوزيع
            </button>
            <button
              type="button"
              onClick={onAutoAssign}
              className={`${BTN.base} ${BTN.secondary} ${BTN_SIZE.sm}`}
              data-testid="button-auto-assign-judges"
            >
              <Sparkles className="w-3.5 h-3.5" />
              توزيع تلقائي
            </button>
          </>
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
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-[11.5px] font-bold" style={{ color: `${BRAND.ink}8c` }}>
                        عدد المحكمين
                        <button
                          type="button"
                          onClick={() => setRoomSlots(m, slotsOf(m) - 1)}
                          disabled={slotsOf(m) === 0}
                          className="w-6 h-6 rounded-lg border flex items-center justify-center disabled:opacity-30"
                          style={{ borderColor: BRAND.border }}
                          aria-label="إنقاص محكم"
                          data-testid={`button-room-slots-minus-${m.id}`}
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-4 text-center" style={{ color: BRAND.ink }}>{slotsOf(m)}</span>
                        <button
                          type="button"
                          onClick={() => setRoomSlots(m, slotsOf(m) + 1)}
                          disabled={slotsOf(m) >= 9}
                          className="w-6 h-6 rounded-lg border flex items-center justify-center disabled:opacity-30"
                          style={{ borderColor: BRAND.border }}
                          aria-label="زيادة محكم"
                          data-testid={`button-room-slots-plus-${m.id}`}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <RoundJudgePicker
                        judges={judges}
                        assignment={m.judgeAssignment}
                        takenElsewhere={takenBy(m.id)}
                        slots={slotsOf(m)}
                        onChange={(a) => onAssignJudges(m.id, a)}
                      />
                    </div>
                  ) : (
                    <span className="text-[13px] font-semibold" style={{ color: BRAND.ink }}>
                      {judgesOf(m)
                        .map((j, i) => (i === 0 ? `${j.name} (رئيس الجلسة)` : j.name))
                        .join("، ") || "—"}
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
