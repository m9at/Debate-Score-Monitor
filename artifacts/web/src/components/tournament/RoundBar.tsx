import { ChevronLeft, ChevronRight } from "lucide-react";
import { BRAND, BRAND_GRADIENT } from "@/lib/brand";

interface RoundBarProps {
  roundNumber: number;
  completedCount: number;
  totalMatches: number;
  allComplete: boolean;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}

/** Round header: title, animated progress bar and prev/next navigation. */
export default function RoundBar({
  roundNumber,
  completedCount,
  totalMatches,
  allComplete,
  canPrev,
  canNext,
  onPrev,
  onNext,
}: RoundBarProps) {
  const pct = totalMatches > 0 ? (completedCount / totalMatches) * 100 : 0;

  const navBtn =
    "w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 transition-all duration-200 " +
    "disabled:opacity-30 disabled:pointer-events-none hover:bg-[#7B2D8E]/[0.06] active:scale-95";

  return (
    <div
      className="rounded-2xl bg-white border shadow-sm px-3 py-2.5 flex items-center gap-3
                 animate-in fade-in slide-in-from-top-1 duration-300"
      style={{ borderColor: BRAND.border }}
      data-testid="round-bar"
    >
      <button
        type="button"
        onClick={onPrev}
        disabled={!canPrev}
        aria-label="الجولة السابقة"
        className={navBtn}
        style={{ borderColor: BRAND.border, color: BRAND.purple }}
        data-testid="button-prev-round"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      <div className="flex-1 min-w-0 flex items-center gap-3">
        <span
          className="text-[15px] font-bold shrink-0 order-last"
          style={{ color: BRAND.ink }}
          data-testid="text-round-title"
        >
          الجولة {roundNumber}
        </span>

        <div className="flex-1 h-2 rounded-full overflow-hidden bg-[#2B1B45]/[0.07]">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${pct}%`,
              backgroundImage: allComplete
                ? `linear-gradient(135deg, ${BRAND.success} 0%, #4ADE80 100%)`
                : BRAND_GRADIENT,
            }}
          />
        </div>

        <span
          className="text-xs font-bold shrink-0 tabular-nums"
          style={{ color: allComplete ? BRAND.success : `${BRAND.ink}99` }}
          data-testid="text-round-progress"
        >
          {completedCount}/{totalMatches}
        </span>
      </div>

      <button
        type="button"
        onClick={onNext}
        disabled={!canNext}
        aria-label="الجولة التالية"
        className={navBtn}
        style={{ borderColor: BRAND.border, color: BRAND.purple }}
        data-testid="button-next-round"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
    </div>
  );
}
