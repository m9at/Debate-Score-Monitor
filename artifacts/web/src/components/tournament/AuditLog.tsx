import { History } from "lucide-react";
import type { AuditEntry } from "@/types/tournament";
import { BRAND } from "@/lib/brand";

const time = (at: number) =>
  new Date(at).toLocaleTimeString("ar", {
    hour: "2-digit",
    minute: "2-digit",
  });

const day = (at: number) =>
  new Date(at).toLocaleDateString("ar", { dateStyle: "medium" });

/** سجل العمليات — who did what, and when. */
export default function AuditLog({ entries }: { entries: AuditEntry[] }) {
  return (
    <section
      className="rounded-2xl bg-white border shadow-sm overflow-hidden"
      style={{ borderColor: BRAND.border }}
      data-testid="audit-log"
    >
      <div
        className="px-4 py-3 border-b flex items-center gap-2"
        style={{ borderColor: BRAND.border }}
      >
        <History className="w-4 h-4" style={{ color: BRAND.purple }} />
        <h3 className="font-bold text-[14px]" style={{ color: BRAND.ink }}>
          سجل العمليات
        </h3>
        <span className="flex-1" />
        <span className="text-[11.5px] font-semibold" style={{ color: `${BRAND.ink}8c` }}>
          {entries.length} عملية
        </span>
      </div>

      {entries.length === 0 ? (
        <p className="text-[13px] text-center py-10" style={{ color: `${BRAND.ink}8c` }}>
          لم تُسجَّل أي عملية بعد.
        </p>
      ) : (
        <ul>
          {entries.map((e) => (
            <li
              key={e.id}
              className="px-4 py-2.5 border-b last:border-b-0 flex items-center gap-3 flex-wrap"
              style={{ borderColor: BRAND.border }}
              data-testid={`audit-${e.id}`}
            >
              <span
                className="text-[11.5px] font-bold tabular-nums shrink-0"
                style={{ color: `${BRAND.ink}80` }}
                title={day(e.at)}
              >
                {time(e.at)}
              </span>
              <p className="flex-1 min-w-[10rem] text-[13px]" style={{ color: BRAND.ink }}>
                <span className="font-bold">{e.actor}</span> — {e.action}
                {e.detail && (
                  <span style={{ color: `${BRAND.ink}99` }}> · {e.detail}</span>
                )}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
