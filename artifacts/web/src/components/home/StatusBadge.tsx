import { STATUS_META, type TournamentStatus } from "@/lib/brand";

interface StatusBadgeProps {
  status: TournamentStatus;
  size?: "sm" | "md";
}

/** Coloured lifecycle badge for a tournament (جارية / قيد الإعداد / ...). */
export default function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const meta = STATUS_META[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-bold whitespace-nowrap ${
        size === "sm" ? "text-[10px] px-2 py-0.5" : "text-[11px] px-2.5 py-1"
      }`}
      style={{ backgroundColor: meta.bg, color: meta.color }}
      data-testid={`badge-status-${status}`}
    >
      <span aria-hidden>{meta.dot}</span>
      {meta.label}
    </span>
  );
}
