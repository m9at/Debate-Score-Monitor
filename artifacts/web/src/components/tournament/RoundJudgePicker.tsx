import type { Judge, MatchJudgeAssignment } from "@/types/tournament";
import { BRAND } from "@/lib/brand";

interface RoundJudgePickerProps {
  judges: Judge[];
  assignment: MatchJudgeAssignment | undefined;
  /** Ids of judges already taken by another room in the same round. */
  takenElsewhere: Set<string>;
  /** How many judges this room needs — one slot each, the first one chairs. */
  slots: number;
  onChange: (assignment: MatchJudgeAssignment) => void;
  disabled?: boolean;
}

/**
 * Assigns judges to one room through one labelled dropdown per seat instead of a
 * wall of name chips: the first seat is the session chair, the rest are
 * panelists. Judges busy in another room of the same round can't be picked.
 */
export default function RoundJudgePicker({
  judges,
  assignment,
  takenElsewhere,
  slots,
  onChange,
  disabled,
}: RoundJudgePickerProps) {
  const selected = [
    ...(assignment?.chairJudgeId ? [assignment.chairJudgeId] : []),
    ...(assignment?.panelistJudgeIds ?? []),
  ];
  const seatCount = Math.max(1, slots, selected.length);

  const setSeat = (seat: number, judgeId: string) => {
    const next = [...selected];
    while (next.length < seat) next.push("");
    next[seat] = judgeId;
    const clean = next.filter(Boolean);
    onChange({ chairJudgeId: clean[0], panelistJudgeIds: clean.slice(1) });
  };

  if (judges.length === 0) {
    return (
      <span className="text-[12px] font-semibold" style={{ color: `${BRAND.ink}80` }}>
        لا يوجد محكمون — أضِفهم من صفحة المحكمون
      </span>
    );
  }

  return (
    <div className="flex flex-col gap-2 min-w-[13rem]" dir="rtl">
      {Array.from({ length: seatCount }, (_, seat) => {
        const value = selected[seat] ?? "";
        const isChair = seat === 0;
        return (
          <label key={seat} className="flex items-center gap-2">
            <span
              className="text-[11.5px] font-bold w-[5.5rem] shrink-0"
              style={{ color: isChair ? BRAND.purple : `${BRAND.ink}8c` }}
            >
              {isChair ? "رئيس الجلسة" : `محكم ${seat + 1}`}
            </span>
            <select
              value={value}
              disabled={disabled}
              onChange={(e) => setSeat(seat, e.target.value)}
              className="flex-1 h-9 px-2 rounded-xl border bg-white text-[13px] font-bold outline-none
                         disabled:opacity-50"
              style={{
                borderColor: isChair && value ? BRAND.purple : BRAND.border,
                color: BRAND.ink,
              }}
              data-testid={`select-judge-seat-${seat}`}
            >
              <option value="">— بدون —</option>
              {judges.map((j) => {
                const usedHere = selected.includes(j.id) && j.id !== value;
                const busy = takenElsewhere.has(j.id) && j.id !== value;
                return (
                  <option key={j.id} value={j.id} disabled={usedHere || busy}>
                    {j.name}
                    {busy ? " (قاعة أخرى)" : usedHere ? " (مختار)" : ""}
                  </option>
                );
              })}
            </select>
          </label>
        );
      })}
    </div>
  );
}
