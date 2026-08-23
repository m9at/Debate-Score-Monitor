import {
  CheckCircle2,
  Clock,
  Loader2,
  Megaphone,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import type { Match } from "@/types/tournament";
import { BRAND } from "@/lib/brand";
import type { RoomStatus } from "@/lib/roomStatus";
import { roomTitle } from "@/lib/reveal";

/** Public wording per state — never anything that hints at the winner. */
const PUBLIC_STATE: Record<
  RoomStatus,
  { label: string; color: string; icon: typeof Clock; pulse?: boolean }
> = {
  notStarted: { label: "بانتظار التحكيم", color: "#9CA3AF", icon: Clock },
  judging: { label: "جاري التحكيم", color: "#F59E0B", icon: Loader2, pulse: true },
  partialResults: { label: "بانتظار اعتماد النتيجة", color: "#60A5FA", icon: Clock },
  awaitingApproval: {
    label: "بانتظار اعتماد النتيجة",
    color: "#FB923C",
    icon: Clock,
  },
  ready: { label: "جاهزة للإعلان", color: BRAND.gold, icon: Sparkles },
  announced: { label: "تم إعلان النتيجة", color: "#86EFAC", icon: CheckCircle2 },
};

interface Props {
  match: Match;
  status: RoomStatus;
  govName: string;
  oppName: string;
  selected: boolean;
  /** Only the admin who opened presentation mode may announce. */
  canAnnounce: boolean;
  /** Winner name — passed ONLY once the result is officially revealed. */
  winnerName?: string | null;
  onSelect: () => void;
  onAnnounce: () => void;
  /** Replays the announcement scene for an already revealed room. */
  onReplay?: () => void;
}

/**
 * One room on the projector: teams, its state, and — for the admin only — the
 * announce action. Both teams stay visually equal until the result is revealed.
 */
export default function PresentRoomCard({
  match,
  status,
  govName,
  oppName,
  selected,
  canAnnounce,
  winnerName,
  onSelect,
  onAnnounce,
  onReplay,
}: Props) {
  const state = PUBLIC_STATE[status];
  const StateIcon = state.icon;
  const readyToAnnounce = status === "ready";
  const announced = status === "announced";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onSelect();
      }}
      className={`relative rounded-[1.75rem] border overflow-hidden text-right cursor-pointer
                  transition-all duration-300 outline-none
                  ${selected ? "-translate-y-1.5 scale-[1.02]" : "hover:-translate-y-1"}`}
      style={{
        borderColor: selected ? BRAND.gold : "rgba(255,255,255,0.12)",
        backgroundColor: selected ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.055)",
        boxShadow: selected
          ? `0 0 0 2px ${BRAND.gold}80, 0 26px 60px -24px ${BRAND.gold}66`
          : undefined,
      }}
      data-testid={`present-room-${match.roomNumber}`}
      aria-pressed={selected}
    >
      {/* Selection accent bar */}
      <div
        aria-hidden
        className="h-1.5 w-full transition-all duration-300"
        style={{
          backgroundImage: selected
            ? `linear-gradient(90deg, ${BRAND.gold}, ${BRAND.purple})`
            : `linear-gradient(90deg, ${state.color}, ${state.color}00)`,
        }}
      />

      <div className="p-6 md:p-7">
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <h2
            className={`font-black transition-all ${
              selected ? "text-2xl md:text-4xl" : "text-xl md:text-3xl"
            }`}
            style={{ color: selected ? "#fff" : "rgba(255,255,255,0.9)" }}
          >
            {roomTitle(match)}
          </h2>
          <span className="flex-1" />
          <span
            className={`inline-flex items-center gap-2 px-3.5 h-9 rounded-full text-sm md:text-base font-bold
                        ${state.pulse ? "animate-pulse" : ""}
                        ${readyToAnnounce ? "animate-[pulse_2.4s_ease-in-out_infinite]" : ""}`}
            style={{
              backgroundColor: `${state.color}26`,
              color: state.color,
              boxShadow: readyToAnnounce ? `0 0 26px ${BRAND.gold}59` : undefined,
            }}
            data-testid={`present-state-${match.roomNumber}`}
          >
            <StateIcon
              className={`w-4 h-4 ${status === "judging" ? "animate-spin" : ""}`}
            />
            {state.label}
          </span>
        </div>

        {/* Teams — identical treatment on both sides */}
        <div className="space-y-3">
          {[
            { label: "موالاة", color: BRAND.blue, name: govName },
            { label: "معارضة", color: BRAND.purple, name: oppName },
          ].map((side) => (
            <div
              key={side.label}
              className="rounded-2xl px-5 py-4 flex items-center gap-4"
              style={{ backgroundColor: `${side.color}26` }}
            >
              <span
                className="px-2.5 py-1 rounded-xl text-xs md:text-sm font-bold shrink-0 text-white/85"
                style={{ backgroundColor: `${side.color}66` }}
              >
                {side.label}
              </span>
              <span className="text-white font-black text-xl md:text-3xl truncate">
                {side.name}
              </span>
            </div>
          ))}
          <p className="text-center text-white/30 font-black text-base select-none">VS</p>
        </div>

        {/* Judging received — states the fact without hinting at the winner */}
        {readyToAnnounce && (
          <p
            className="mt-5 text-center font-bold text-base md:text-xl inline-flex items-center
                       justify-center gap-2 w-full"
            style={{ color: "#86EFAC" }}
            data-testid={`present-received-${match.roomNumber}`}
          >
            <CheckCircle2 className="w-5 h-5" />
            تم استلام نتائج التحكيم
          </p>
        )}

        {/* Winner — only after the result was officially announced */}
        {announced && winnerName && (
          <p
            className="mt-5 text-center font-black text-xl md:text-3xl"
            style={{ color: BRAND.gold }}
            data-testid={`present-winner-${match.roomNumber}`}
          >
            🏆 الفائز: {winnerName}
          </p>
        )}

        {canAnnounce && readyToAnnounce && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAnnounce();
            }}
            className="mt-5 w-full h-14 rounded-2xl font-black text-lg md:text-xl text-[#2B1B45]
                       inline-flex items-center justify-center gap-2.5 transition-transform
                       hover:scale-[1.02] active:scale-[0.99]"
            style={{
              backgroundImage: `linear-gradient(135deg, ${BRAND.gold}, #FFE9A8)`,
              boxShadow: `0 18px 40px -18px ${BRAND.gold}`,
            }}
            data-testid={`button-announce-${match.roomNumber}`}
          >
            <Megaphone className="w-5 h-5" />
            إعلان النتيجة
          </button>
        )}

        {canAnnounce && announced && onReplay && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onReplay();
            }}
            className="mt-5 w-full h-12 rounded-2xl font-bold text-base md:text-lg text-white/85
                       border border-white/25 hover:bg-white/10 inline-flex items-center
                       justify-center gap-2.5 transition-colors"
            data-testid={`button-replay-${match.roomNumber}`}
          >
            <RotateCcw className="w-5 h-5" />
            إعادة عرض النتيجة
          </button>
        )}
      </div>
    </div>
  );
}
