import { Check, Clock, Users, X } from "lucide-react";
import type { PendingTeamRegistration } from "@/types/tournament";
import { BRAND, BTN, BTN_SIZE } from "@/lib/brand";

interface TeamRequestsPanelProps {
  /** Teams already accepted into the tournament. */
  acceptedCount: number;
  pending: PendingTeamRegistration[];
  onApprove: (p: PendingTeamRegistration) => void;
  onReject: (pendingId: string) => void;
}

const fmtDate = (ts: number) =>
  new Date(ts).toLocaleDateString("ar", { day: "numeric", month: "short" });

/**
 * The head of صفحة الفرق: how many teams are registered, then the requests that
 * arrived through the public link. A registration becomes a team only once it is
 * accepted here.
 */
export default function TeamRequestsPanel({
  acceptedCount,
  pending,
  onApprove,
  onReject,
}: TeamRequestsPanelProps) {
  return (
    <div className="space-y-3 mb-4" dir="rtl">
      <div className="flex flex-wrap gap-2.5">
        <div
          className="flex-1 min-w-[8rem] rounded-2xl bg-white border p-3 flex items-center gap-2.5"
          style={{ borderColor: BRAND.border }}
          data-testid="team-count-accepted"
        >
          <span
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${BRAND.purple}14` }}
          >
            <Users className="w-4 h-4" style={{ color: BRAND.purple }} />
          </span>
          <div>
            <p className="font-bold text-xl leading-none tabular-nums" style={{ color: BRAND.ink }}>
              {acceptedCount}
            </p>
            <p className="text-[11.5px] font-semibold mt-1" style={{ color: `${BRAND.ink}8c` }}>
              فرق مسجلة
            </p>
          </div>
        </div>
        <div
          className="flex-1 min-w-[8rem] rounded-2xl bg-white border p-3 flex items-center gap-2.5"
          style={{ borderColor: BRAND.border }}
          data-testid="team-count-pending"
        >
          <span
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${BRAND.warning}14` }}
          >
            <Clock className="w-4 h-4" style={{ color: BRAND.warning }} />
          </span>
          <div>
            <p className="font-bold text-xl leading-none tabular-nums" style={{ color: BRAND.ink }}>
              {pending.length}
            </p>
            <p className="text-[11.5px] font-semibold mt-1" style={{ color: `${BRAND.ink}8c` }}>
              طلبات تسجيل
            </p>
          </div>
        </div>
      </div>

      {pending.length > 0 && (
        <section
          className="rounded-2xl bg-white border overflow-hidden"
          style={{ borderColor: BRAND.border }}
          data-testid="team-requests"
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
                data-testid={`team-request-${p.id}`}
              >
                <div className="flex-1 min-w-[10rem]">
                  <p className="font-bold text-[14px]" style={{ color: BRAND.ink }}>
                    {p.teamName}
                  </p>
                  <p className="text-[12px]" style={{ color: `${BRAND.ink}8c` }}>
                    {[
                      p.institution,
                      `${p.speakersPerTeam} أعضاء`,
                      p.documents?.length ? `${p.documents.length} ملف` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
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
                    data-testid={`button-approve-team-${p.id}`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    قبول
                  </button>
                  <button
                    type="button"
                    onClick={() => onReject(p.id)}
                    className={`${BTN.base} ${BTN.danger} ${BTN_SIZE.sm}`}
                    data-testid={`button-reject-team-${p.id}`}
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
    </div>
  );
}
