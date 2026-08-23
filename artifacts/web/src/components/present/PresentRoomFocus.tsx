import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Megaphone, RotateCcw } from "lucide-react";
import type { Match } from "@/types/tournament";
import { BRAND, BRAND_GRADIENT } from "@/lib/brand";
import { roomTitle } from "@/lib/reveal";
import type { RoomStatus } from "@/lib/roomStatus";

interface Props {
  match: Match;
  status: RoomStatus;
  govName: string;
  oppName: string;
  /** Only the admin who opened the mode may announce. */
  canAnnounce: boolean;
  /** Winner name — passed ONLY once the result is officially revealed. */
  winnerName?: string | null;
  onAnnounce: () => void;
  onReplay?: () => void;
  onBack: () => void;
}

/** Public wording — identical for both teams, never hinting at a winner. */
const LABEL: Record<RoomStatus, string> = {
  notStarted: "بانتظار التحكيم",
  judging: "جاري التحكيم",
  partialResults: "بانتظار اعتماد النتيجة",
  awaitingApproval: "بانتظار اعتماد النتيجة",
  ready: "جاهزة للإعلان",
  announced: "تم إعلان النتيجة",
};

/**
 * The selected room, enlarged inside the LIVE experience — the rest of the
 * screen fades away instead of opening a dialog or navigating elsewhere. The
 * winner is still nothing on this screen; only إعلان النتيجة reveals it.
 */
export default function PresentRoomFocus({
  match,
  status,
  govName,
  oppName,
  canAnnounce,
  winnerName,
  onAnnounce,
  onReplay,
  onBack,
}: Props) {
  const sides = [
    { label: "موالاة", color: BRAND.blue, name: govName },
    { label: "معارضة", color: BRAND.purple, name: oppName },
  ];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="relative w-full max-w-6xl mx-auto"
      data-testid="present-room-focus"
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -inset-16 rounded-[4rem] blur-3xl"
        style={{ backgroundImage: BRAND_GRADIENT }}
        animate={{ opacity: [0.14, 0.26, 0.14] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      <div
        className="relative rounded-[2.5rem] border overflow-hidden px-8 py-10 md:px-16 md:py-14"
        style={{
          borderColor: "rgba(255,255,255,0.16)",
          backgroundColor: "rgba(255,255,255,0.06)",
        }}
      >
        <div
          aria-hidden
          className="absolute top-0 inset-x-0 h-2"
          style={{ backgroundImage: BRAND_GRADIENT }}
        />

        <div className="flex items-center justify-between gap-4 mb-10 flex-wrap">
          <h2 className="text-white font-black text-4xl md:text-6xl">
            {roomTitle(match)}
          </h2>
          <span
            className="px-4 h-11 inline-flex items-center rounded-full text-lg md:text-xl font-bold"
            style={{
              backgroundColor: "rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.85)",
            }}
            data-testid="focus-status"
          >
            {LABEL[status]}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-6">
          {sides.map((side, i) => (
            <div key={side.label} className={i === 1 ? "md:order-3" : "md:order-1"}>
              <div
                className="rounded-3xl px-8 py-10 text-center"
                style={{ backgroundColor: `${side.color}2e` }}
              >
                <p
                  className="text-base md:text-xl font-bold mb-3"
                  style={{ color: "rgba(255,255,255,0.7)" }}
                >
                  {side.label}
                </p>
                <p className="text-white font-black text-3xl md:text-6xl leading-tight">
                  {side.name}
                </p>
              </div>
            </div>
          ))}
          <p className="md:order-2 text-center text-white/35 font-black text-3xl md:text-5xl select-none">
            VS
          </p>
        </div>

        {status === "ready" && (
          <p
            className="mt-10 text-center font-bold text-xl md:text-2xl inline-flex items-center
                       justify-center gap-2.5 w-full"
            style={{ color: "#86EFAC" }}
            data-testid="focus-received"
          >
            <CheckCircle2 className="w-6 h-6" />
            تم استلام نتائج التحكيم — جاهزة للإعلان
          </p>
        )}

        {status === "announced" && winnerName && (
          <p
            className="mt-10 text-center font-black text-3xl md:text-5xl"
            style={{ color: BRAND.gold }}
            data-testid="focus-winner"
          >
            🏆 الفائز: {winnerName}
          </p>
        )}

        <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
          <button
            type="button"
            onClick={onBack}
            className="h-14 px-7 rounded-2xl font-bold text-lg text-white/80 border
                       border-white/20 hover:bg-white/10 inline-flex items-center gap-2.5 transition-colors"
            data-testid="button-focus-back"
          >
            <ArrowRight className="w-5 h-5" />
            العودة إلى القاعات
          </button>

          {canAnnounce && status === "ready" && (
            <button
              type="button"
              onClick={onAnnounce}
              className="h-16 px-10 rounded-2xl font-black text-2xl text-[#2B1B45]
                         inline-flex items-center gap-3 transition-transform hover:scale-[1.03] active:scale-[0.99]"
              style={{
                backgroundImage: `linear-gradient(135deg, ${BRAND.gold}, #FFE9A8)`,
                boxShadow: `0 22px 50px -20px ${BRAND.gold}`,
              }}
              data-testid="button-focus-announce"
            >
              <Megaphone className="w-7 h-7" />
              إعلان النتيجة
            </button>
          )}

          {canAnnounce && status === "announced" && onReplay && (
            <button
              type="button"
              onClick={onReplay}
              className="h-14 px-8 rounded-2xl font-bold text-lg text-white/85 border
                         border-white/25 hover:bg-white/10 inline-flex items-center gap-2.5 transition-colors"
              data-testid="button-focus-replay"
            >
              <RotateCcw className="w-5 h-5" />
              إعادة عرض الإعلان
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
