import { AlertCircle, Check, Cloud, Loader2 } from "lucide-react";
import { useTournament } from "@/context/TournamentContext";
import { BRAND } from "@/lib/brand";

/** Quiet "تم الحفظ تلقائياً" pill so the director never wonders if work is lost. */
export default function AutoSaveIndicator() {
  const { saveState, lastSavedAt } = useTournament();

  const view = {
    idle: {
      icon: Cloud,
      label: "الحفظ التلقائي مُفعّل",
      color: `${BRAND.ink}80`,
      spin: false,
    },
    saving: {
      icon: Loader2,
      label: "جارٍ الحفظ…",
      color: BRAND.blueDeep,
      spin: true,
    },
    saved: {
      icon: Check,
      label: lastSavedAt
        ? `تم الحفظ تلقائياً ${new Date(lastSavedAt).toLocaleTimeString("ar", {
            hour: "2-digit",
            minute: "2-digit",
          })}`
        : "تم الحفظ تلقائياً",
      color: "#15803D",
      spin: false,
    },
    error: {
      icon: AlertCircle,
      label: "تعذّر الحفظ — سيُعاد المحاولة",
      color: BRAND.danger,
      spin: false,
    },
  }[saveState];

  const Icon = view.icon;

  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold shrink-0"
      style={{ color: view.color }}
      data-testid={`autosave-${saveState}`}
      aria-live="polite"
    >
      <Icon className={`w-3.5 h-3.5 ${view.spin ? "animate-spin" : ""}`} />
      {view.label}
    </span>
  );
}
