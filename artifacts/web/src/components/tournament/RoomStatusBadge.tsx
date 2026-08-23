import { roomStatusMeta, type RoomStatus } from "@/lib/roomStatus";

/** Clear coloured badge for a room's stage in the round. */
export default function RoomStatusBadge({
  status,
  size = "md",
}: {
  status: RoomStatus;
  size?: "sm" | "md";
}) {
  const meta = roomStatusMeta(status);
  const dims =
    size === "sm"
      ? "h-5 px-2 text-[10.5px] gap-1.5"
      : "h-6.5 px-2.5 text-[11.5px] gap-2";

  return (
    <span
      className={`inline-flex items-center rounded-full font-bold shrink-0 ${dims}`}
      style={{ backgroundColor: meta.bg, color: meta.fg }}
      data-testid={`room-status-${status}`}
    >
      <span
        aria-hidden
        className="w-2 h-2 rounded-full shrink-0"
        style={{ backgroundColor: meta.dot, boxShadow: `0 0 6px ${meta.dot}` }}
      />
      {meta.label}
    </span>
  );
}
