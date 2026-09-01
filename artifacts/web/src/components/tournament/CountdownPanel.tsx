import { useState } from "react";
import { Timer } from "lucide-react";
import { BRAND, BTN } from "@/lib/brand";
import type { Tournament, TournamentCountdown } from "@/types/tournament";

/** `datetime-local` needs a local ISO string without the timezone part. */
function toLocalInput(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

/**
 * العد التنازلي — an optional countdown the organiser points at any moment
 * (إعلان النتائج، بداية الجولة…). It only ever displays: nothing in the
 * tournament changes when it reaches zero.
 */
export default function CountdownPanel({
  tournament,
  onChange,
}: {
  tournament: Tournament;
  onChange: (countdown: TournamentCountdown) => void;
}) {
  const existing = tournament.countdown;
  const [label, setLabel] = useState(existing?.label ?? "إعلان النتائج");
  const [at, setAt] = useState(
    toLocalInput(existing?.at ?? Date.now() + 60 * 60 * 1000),
  );

  const enabled = existing?.enabled === true;

  return (
    <section
      className="rounded-2xl border bg-white p-4 space-y-3"
      style={{ borderColor: BRAND.border }}
      dir="rtl"
      data-testid="countdown-panel"
    >
      <h2 className="text-[15px] font-bold" style={{ color: BRAND.ink }}>
        العد التنازلي للجمهور
      </h2>
      <p className="text-[12px]" style={{ color: `${BRAND.ink}99` }}>
        عند التفعيل يظهر للجمهور عدّاد بالساعات والدقائق والثواني حتى الموعد المحدد.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="space-y-1.5 block">
          <span className="text-[12.5px] font-bold" style={{ color: BRAND.ink }}>
            عنوان العدّاد
          </span>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full h-10 rounded-xl border px-3 text-[13.5px]"
            style={{ borderColor: BRAND.border }}
            data-testid="countdown-label"
          />
        </label>
        <label className="space-y-1.5 block">
          <span className="text-[12.5px] font-bold" style={{ color: BRAND.ink }}>
            الموعد
          </span>
          <input
            type="datetime-local"
            value={at}
            onChange={(e) => setAt(e.target.value)}
            className="w-full h-10 rounded-xl border px-3 text-[13.5px]"
            style={{ borderColor: BRAND.border }}
            data-testid="countdown-at"
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            const ms = new Date(at).getTime();
            if (!Number.isFinite(ms)) return;
            onChange({ enabled: true, label: label.trim() || "العد التنازلي", at: ms });
          }}
          className={`${BTN.base} ${BTN.secondary} h-9 px-3.5 text-[12.5px]`}
          data-testid="countdown-save"
        >
          <Timer className="w-4 h-4" />
          {enabled ? "تحديث العدّاد" : "تفعيل العدّاد"}
        </button>
        {enabled && (
          <button
            type="button"
            onClick={() =>
              onChange({
                enabled: false,
                label: existing?.label ?? label,
                at: existing?.at ?? new Date(at).getTime(),
              })
            }
            className={`${BTN.base} ${BTN.ghost} h-9 px-3.5 text-[12.5px]`}
            data-testid="countdown-disable"
          >
            تعطيل العدّاد
          </button>
        )}
      </div>

      {enabled && existing && (
        <p className="text-[12.5px] font-bold" style={{ color: BRAND.purple }}>
          مُفعّل: {existing.label} — {new Date(existing.at).toLocaleString("ar")}
        </p>
      )}
    </section>
  );
}
