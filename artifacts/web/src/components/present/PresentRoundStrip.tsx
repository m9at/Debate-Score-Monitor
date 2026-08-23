import { Eye, Radio } from "lucide-react";
import { BRAND } from "@/lib/brand";

interface Props {
  roundNumbers: number[];
  /** The round on screen. */
  viewedRound: number;
  /** The round the tournament is actually working on. */
  liveRound: number;
  onSelect: (roundNumber: number) => void;
  /** Rooms announced / total, for the viewed round. */
  revealedCount: number;
  totalRooms: number;
}

/**
 * Horizontal round selector for the projector. Viewing a round never changes
 * the live round — the strip states both plainly.
 */
export default function PresentRoundStrip({
  roundNumbers,
  viewedRound,
  liveRound,
  onSelect,
  revealedCount,
  totalRooms,
}: Props) {
  const pct = totalRooms > 0 ? (revealedCount / totalRooms) * 100 : 0;
  const viewingPast = viewedRound !== liveRound;

  return (
    <div className="space-y-3" data-testid="present-round-strip">
      <div className="flex flex-wrap items-center gap-2.5">
        {roundNumbers.map((n) => {
          const viewed = n === viewedRound;
          const live = n === liveRound;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onSelect(n)}
              className={`h-12 px-5 rounded-2xl border text-lg md:text-xl font-bold
                          inline-flex items-center gap-2.5 transition-all
                          ${viewed ? "scale-[1.03]" : "hover:bg-white/[0.08]"}`}
              style={{
                borderColor: viewed ? BRAND.gold : "rgba(255,255,255,0.16)",
                backgroundColor: viewed ? `${BRAND.gold}1f` : "rgba(255,255,255,0.05)",
                color: viewed ? "#fff" : "rgba(255,255,255,0.62)",
                boxShadow: viewed ? `0 0 34px ${BRAND.gold}40` : undefined,
              }}
              aria-current={viewed ? "true" : undefined}
              data-testid={`present-round-${n}`}
            >
              الجولة {n}
              {live && (
                <span
                  className="px-2 py-0.5 rounded-lg text-[11px] font-bold inline-flex items-center gap-1"
                  style={{ backgroundColor: `${BRAND.success}2e`, color: "#86EFAC" }}
                >
                  <Radio className="w-3 h-3" />
                  الحالية
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Progress of the viewed round */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2.5 rounded-full overflow-hidden bg-white/10">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${pct}%`,
              backgroundImage: `linear-gradient(90deg, ${BRAND.gold}, #FFE9A8)`,
            }}
          />
        </div>
        <span className="text-white/70 text-base font-bold tabular-nums shrink-0">
          {revealedCount}/{totalRooms} أُعلنت
        </span>
      </div>

      {viewingPast && (
        <p
          className="inline-flex items-center gap-2 px-4 h-10 rounded-xl text-base font-bold"
          style={{ backgroundColor: "rgba(255,255,255,0.08)", color: "#FDE68A" }}
          data-testid="present-viewing-notice"
        >
          <Eye className="w-4 h-4" />
          أنت تشاهد الجولة {viewedRound} — الجولة الحالية هي {liveRound}
        </p>
      )}
    </div>
  );
}
