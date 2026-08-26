import type { Judge, MatchJudgeAssignment } from "@/types/tournament";
import { BRAND } from "@/lib/brand";

interface RoundJudgePickerProps {
  judges: Judge[];
  assignment: MatchJudgeAssignment | undefined;
  /** Ids of judges already taken by another room in the same round. */
  takenElsewhere: Set<string>;
  onChange: (assignment: MatchJudgeAssignment) => void;
  disabled?: boolean;
}

/**
 * Assigns judges to one room, inline in the round table: the first judge picked
 * chairs the panel. Judges busy in another room of the same round are greyed out.
 */
export default function RoundJudgePicker({
  judges,
  assignment,
  takenElsewhere,
  onChange,
  disabled,
}: RoundJudgePickerProps) {
  const chair = assignment?.chairJudgeId;
  const panel = assignment?.panelistJudgeIds ?? [];
  const selected = [...(chair ? [chair] : []), ...panel];

  const toggle = (id: string) => {
    const next = selected.includes(id)
      ? selected.filter((x) => x !== id)
      : [...selected, id];
    onChange({
      chairJudgeId: next[0],
      panelistJudgeIds: next.slice(1),
    });
  };

  return (
    <div className="flex flex-wrap gap-1.5" dir="rtl">
      {judges.map((j) => {
        const isSelected = selected.includes(j.id);
        const busy = !isSelected && takenElsewhere.has(j.id);
        return (
          <button
            key={j.id}
            type="button"
            disabled={disabled || busy}
            onClick={() => toggle(j.id)}
            title={busy ? "معيّن في قاعة أخرى في هذه الجولة" : undefined}
            className="h-7 px-2.5 rounded-lg text-[12px] font-bold border transition-colors
                       disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              borderColor: isSelected ? BRAND.purple : BRAND.border,
              backgroundColor: isSelected ? `${BRAND.purple}14` : "#fff",
              color: isSelected ? BRAND.purple : `${BRAND.ink}b3`,
            }}
            data-testid={`pick-judge-${j.id}`}
          >
            {j.name}
            {chair === j.id && " (رئيس)"}
          </button>
        );
      })}
      {judges.length === 0 && (
        <span className="text-[12px] font-semibold" style={{ color: `${BRAND.ink}80` }}>
          لا يوجد محكمون — أضِفهم من صفحة المحكمون
        </span>
      )}
    </div>
  );
}
