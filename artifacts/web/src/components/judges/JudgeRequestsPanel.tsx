import { Check, Clock, UserCheck, UserX, X } from "lucide-react";
import type { Judge, PendingJudgeRegistration } from "@/types/tournament";
import { BRAND, BTN, BTN_SIZE } from "@/lib/brand";

interface JudgeRequestsPanelProps {
  pending: PendingJudgeRegistration[];
  judges: Judge[];
  onApprove: (p: PendingJudgeRegistration) => void;
  onReject: (pendingId: string) => void;
  /** Turns a judge on/off without removing them from the tournament. */
  onToggleDisabled: (judge: Judge) => void;
}

const fmtDate = (ts: number) =>
  new Date(ts).toLocaleDateString("ar", { day: "numeric", month: "short" });

/** A single count tile — the system counts judges, the organiser never types a number. */
function Count({
  icon: Icon,
  value,
  label,
  tone,
}: {
  icon: typeof UserCheck;
  value: number;
  label: string;
  tone: string;
}) {
  return (
    <div
      className="flex-1 min-w-[8rem] rounded-2xl bg-white border p-3 flex items-center gap-2.5"
      style={{ borderColor: BRAND.border }}
      data-testid={`judge-count-${label}`}
    >
      <span
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${tone}14` }}
      >
        <Icon className="w-4 h-4" style={{ color: tone }} />
      </span>
      <div>
        <p className="font-bold text-xl leading-none tabular-nums" style={{ color: BRAND.ink }}>
          {value}
        </p>
        <p className="text-[11.5px] font-semibold mt-1" style={{ color: `${BRAND.ink}8c` }}>
          {label}
        </p>
      </div>
    </div>
  );
}

/**
 * The top of صفحة المحكمون: the counts the system works out by itself, then the
 * registration requests. Registering is not being accepted — a judge only
 * becomes active once approved here.
 */
export default function JudgeRequestsPanel({
  pending,
  judges,
  onApprove,
  onReject,
  onToggleDisabled,
}: JudgeRequestsPanelProps) {
  const active = judges.filter((j) => !j.disabled);
  const inactive = judges.filter((j) => j.disabled);

  return (
    <div className="space-y-3" dir="rtl">
      <div className="flex flex-wrap gap-2.5">
        <Count icon={Clock} value={pending.length} label="طلبات جديدة" tone={BRAND.purple} />
        <Count icon={UserCheck} value={active.length} label="محكمون نشطون" tone="#34C759" />
        <Count icon={UserX} value={inactive.length} label="غير نشطين" tone={BRAND.warning} />
      </div>

      {pending.length > 0 && (
        <section
          className="rounded-2xl bg-white border overflow-hidden"
          style={{ borderColor: BRAND.border }}
          data-testid="judge-requests"
        >
          <header className="px-4 py-3 border-b" style={{ borderColor: BRAND.border }}>
            <h3 className="font-bold text-[14.5px]" style={{ color: BRAND.ink }}>
              طلبات التسجيل
            </h3>
          </header>
          <ul>
            {pending.map((p) => (
              <li
                key={p.id}
                className="px-4 py-3 flex flex-wrap items-center gap-3 border-b last:border-b-0"
                style={{ borderColor: BRAND.border }}
                data-testid={`judge-request-${p.id}`}
              >
                <div className="flex-1 min-w-[10rem]">
                  <p className="font-bold text-[14px]" style={{ color: BRAND.ink }}>
                    {p.name}
                  </p>
                  <p className="text-[12px]" style={{ color: `${BRAND.ink}8c` }}>
                    {[p.institution, p.experience, p.canChair ? "يصلح رئيس جلسة" : null]
                      .filter(Boolean)
                      .join(" · ") || "بدون بيانات إضافية"}
                  </p>
                </div>
                <span className="text-[12px] font-semibold" style={{ color: `${BRAND.ink}8c` }}>
                  {fmtDate(p.submittedAt)}
                </span>
                <span
                  className="text-[11.5px] font-bold px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: `${BRAND.warning}1f`, color: "#8A5A00" }}
                >
                  بانتظار الموافقة
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onApprove(p)}
                    className={`${BTN.base} ${BTN.primary} ${BTN_SIZE.sm}`}
                    data-testid={`button-approve-judge-${p.id}`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    قبول
                  </button>
                  <button
                    type="button"
                    onClick={() => onReject(p.id)}
                    className={`${BTN.base} ${BTN.danger} ${BTN_SIZE.sm}`}
                    data-testid={`button-reject-judge-${p.id}`}
                  >
                    <X className="w-3.5 h-3.5" />
                    رفض
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {inactive.length > 0 && (
        <section
          className="rounded-2xl bg-white border overflow-hidden"
          style={{ borderColor: BRAND.border }}
          data-testid="judges-inactive"
        >
          <header className="px-4 py-3 border-b" style={{ borderColor: BRAND.border }}>
            <h3 className="font-bold text-[14.5px]" style={{ color: BRAND.ink }}>
              محكمون غير نشطين
            </h3>
          </header>
          <ul>
            {inactive.map((j) => (
              <li
                key={j.id}
                className="px-4 py-2.5 flex items-center gap-3 border-b last:border-b-0"
                style={{ borderColor: BRAND.border }}
              >
                <p className="flex-1 font-bold text-[14px]" style={{ color: BRAND.ink }}>
                  {j.name}
                </p>
                <button
                  type="button"
                  onClick={() => onToggleDisabled(j)}
                  className={`${BTN.base} ${BTN.secondary} ${BTN_SIZE.sm}`}
                  data-testid={`button-enable-judge-${j.id}`}
                >
                  إعادة تفعيل
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
