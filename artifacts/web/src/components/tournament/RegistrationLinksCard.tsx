import { Link2, UserPlus, Gavel } from "lucide-react";
import { BRAND } from "@/lib/brand";

interface Props {
  /** Teams awaiting approval, shown next to the teams link. */
  pendingTeams: number;
  /** Judges awaiting approval, shown next to the judges link. */
  pendingJudges: number;
  onTeamLink: () => void;
  onJudgeLink: () => void;
}

/**
 * The two registration links as plainly written buttons, so organisers do not
 * have to hunt for them inside a menu.
 */
export default function RegistrationLinksCard({
  pendingTeams,
  pendingJudges,
  onTeamLink,
  onJudgeLink,
}: Props) {
  const rows = [
    {
      key: "teams",
      label: "رابط تسجيل الفرق",
      hint: "شاركه مع الفرق لتسجّل أسماءها ومتحدثيها",
      icon: UserPlus,
      color: BRAND.blue,
      pending: pendingTeams,
      onClick: onTeamLink,
      testId: "card-link-team-register",
    },
    {
      key: "judges",
      label: "رابط تسجيل المحكمين",
      hint: "شاركه مع المحكمين لتقديم طلبات التحكيم",
      icon: Gavel,
      color: BRAND.purple,
      pending: pendingJudges,
      onClick: onJudgeLink,
      testId: "card-link-judge-register",
    },
  ];

  return (
    <section
      className="rounded-2xl bg-white border shadow-sm p-4"
      style={{ borderColor: BRAND.border }}
      data-testid="card-registration-links"
    >
      <div className="flex items-center gap-2 mb-3">
        <Link2 className="w-4 h-4" style={{ color: BRAND.purple }} />
        <h3 className="font-bold text-[14px]" style={{ color: BRAND.ink }}>
          روابط التسجيل
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {rows.map((r) => (
          <button
            key={r.key}
            type="button"
            onClick={r.onClick}
            className="flex items-center gap-3 p-3 rounded-xl border text-right
                       transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99]"
            style={{ borderColor: BRAND.border }}
            data-testid={r.testId}
          >
            <span
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${r.color}1f` }}
            >
              <r.icon className="w-4 h-4" style={{ color: r.color }} />
            </span>
            <span className="flex-1 min-w-0">
              <span
                className="block font-bold text-[13.5px]"
                style={{ color: BRAND.ink }}
              >
                {r.label}
              </span>
              <span
                className="block text-[11.5px] mt-0.5 truncate"
                style={{ color: `${BRAND.ink}8c` }}
              >
                {r.hint}
              </span>
            </span>
            {r.pending > 0 && (
              <span
                className="shrink-0 px-2 h-6 rounded-full text-[11px] font-bold
                           inline-flex items-center tabular-nums"
                style={{
                  backgroundColor: `${BRAND.warning}24`,
                  color: "#B45309",
                }}
                data-testid={`${r.testId}-pending`}
              >
                {r.pending} بانتظار الاعتماد
              </span>
            )}
          </button>
        ))}
      </div>
    </section>
  );
}
