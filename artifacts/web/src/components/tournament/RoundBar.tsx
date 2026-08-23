import { ChevronLeft, ChevronRight, Radio, History } from "lucide-react";
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
  /** Every round number that exists, in order — rendered as jump chips. */
  roundNumbers?: number[];
  /** The tournament's live round, highlighted apart from the viewed one. */
  liveRoundNumber?: number;
  onSelectRound?: (roundNumber: number) => void;
}

/**
 * Round header: which round is on screen, whether it is the live one, its
 * progress, and direct navigation to any other round.
 */
export default function RoundBar({
  roundNumber,
  completedCount,
  totalMatches,
  allComplete,
  canPrev,
  canNext,
  onPrev,
  onNext,
  roundNumbers = [],
  liveRoundNumber,
  onSelectRound,
}: RoundBarProps) {
  const pct = totalMatches > 0 ? (completedCount / totalMatches) * 100 : 0;
  const isLive = liveRoundNumber !== undefined && roundNumber === liveRoundNumber;

  const navBtn =
    "w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 transition-all duration-200 " +
    "disabled:opacity-30 disabled:pointer-events-none hover:bg-[#7B2D8E]/[0.06] active:scale-95";

  return (
    <div
      className="rounded-2xl bg-white border shadow-sm px-3 py-2.5
                 animate-in fade-in slide-in-from-top-1 duration-300"
      style={{ borderColor: BRAND.border }}
      data-testid="round-bar"
    >
      <div className="flex items-center gap-3">
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
            className="flex items-center gap-2 shrink-0 order-last"
            data-testid="text-round-title"
          >
            <span className="text-[15px] font-bold" style={{ color: BRAND.ink }}>
              الجولة {roundNumber}
            </span>
            {liveRoundNumber !== undefined && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold"
                style={
                  isLive
                    ? {
                        backgroundColor: `${BRAND.success}1a`,
                        color: BRAND.success,
                      }
                    : {
                        backgroundColor: `${BRAND.ink}0f`,
                        color: `${BRAND.ink}99`,
                      }
                }
                data-testid="badge-round-liveness"
              >
                {isLive ? (
                  <>
                    <Radio className="w-3 h-3" />
                    الجولة الحالية
                  </>
                ) : (
                  <>
                    <History className="w-3 h-3" />
                    استعراض — الحالية {liveRoundNumber}
                  </>
                )}
              </span>
            )}
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

      {roundNumbers.length > 1 && onSelectRound && (
        <div
          className="flex flex-wrap items-center gap-1.5 mt-2.5 pt-2.5 border-t"
          style={{ borderColor: BRAND.border }}
        >
          {roundNumbers.map((n) => {
            const viewed = n === roundNumber;
            const live = n === liveRoundNumber;
            return (
              <button
                key={n}
                type="button"
                onClick={() => onSelectRound(n)}
                className="h-8 px-3 rounded-lg border text-[12.5px] font-bold
                           transition-all active:scale-95 inline-flex items-center gap-1.5"
                style={
                  viewed
                    ? {
                        borderColor: BRAND.purple,
                        backgroundColor: `${BRAND.purple}12`,
                        color: BRAND.purple,
                      }
                    : { borderColor: BRAND.border, color: `${BRAND.ink}b3` }
                }
                aria-current={viewed ? "true" : undefined}
                data-testid={`button-goto-round-${n}`}
              >
                الجولة {n}
                {live && !viewed && (
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: BRAND.success }}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
