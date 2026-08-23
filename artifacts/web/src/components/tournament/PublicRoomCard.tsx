import { Gavel, ListChecks, ScrollText } from "lucide-react";
import type { Match } from "@/types/tournament";
import { BRAND, BRAND_GRADIENT, BTN, BTN_SIZE } from "@/lib/brand";
import type { RoomStatus } from "@/lib/roomStatus";
import RoomStatusBadge from "./RoomStatusBadge";

interface PublicRoomCardProps {
  match: Match;
  status: RoomStatus;
  teamMap: Map<string, { name: string }>;
  onDetails: () => void;
  onFollowJudging?: () => void;
}

/**
 * Projector-safe room card: teams, room name, status and judge COUNT only.
 * Deliberately contains no scores, no judge votes and no speaker points.
 */
export default function PublicRoomCard({
  match,
  status,
  teamMap,
  onDetails,
  onFollowJudging,
}: PublicRoomCardProps) {
  const govName = teamMap.get(match.team1.teamId)?.name ?? "—";
  const oppName = teamMap.get(match.team2.teamId)?.name ?? "—";
  const roomText = match.roomLabel?.trim()
    ? match.roomLabel
    : `القاعة ${String(match.roomNumber).padStart(2, "0")}`;

  const judgeCount =
    (match.judgeNames?.filter((n) => n?.trim()).length ?? 0) +
    (match.chairName?.trim() ? 1 : 0);

  return (
    <div
      className="rounded-2xl bg-white border shadow-sm hover:shadow-lg transition-all
                 duration-300 hover:-translate-y-0.5 overflow-hidden flex flex-col"
      style={{ borderColor: BRAND.border }}
      data-testid={`public-room-${match.roomNumber}`}
    >
      {/* Head */}
      <div
        className="px-4 py-3 flex items-center gap-2 flex-wrap"
        style={{ backgroundColor: `${BRAND.ink}05` }}
      >
        <h3 className="font-bold text-[15px]" style={{ color: BRAND.ink }}>
          {roomText}
        </h3>
        <span className="flex-1" />
        <RoomStatusBadge status={status} />
      </div>

      {/* Teams */}
      <div className="p-4 flex-1">
        <div className="relative space-y-2">
          {[
            { label: "موالاة", color: BRAND.blue, name: govName },
            { label: "معارضة", color: BRAND.purple, name: oppName },
          ].map((side) => (
            <div
              key={side.label}
              className="flex items-center gap-2.5 h-12 px-3 rounded-xl"
              style={{ backgroundColor: `${side.color}12` }}
            >
              <span
                className="px-2 py-0.5 rounded-lg text-[10.5px] font-bold shrink-0"
                style={{ backgroundColor: `${side.color}24`, color: side.color }}
              >
                {side.label}
              </span>
              <span
                className="flex-1 min-w-0 truncate font-bold text-[14.5px]"
                style={{ color: BRAND.ink }}
              >
                {side.name}
              </span>
            </div>
          ))}

          <span
            aria-hidden
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                       w-10 h-10 rounded-full flex items-center justify-center
                       text-[11px] font-bold text-white ring-4 ring-white select-none"
            style={{ backgroundImage: BRAND_GRADIENT }}
          >
            VS
          </span>
        </div>

        {/* Judge count only — never names or votes */}
        <div
          className="mt-3 pt-3 border-t flex items-center gap-2"
          style={{ borderColor: BRAND.border }}
        >
          <Gavel className="w-3.5 h-3.5" style={{ color: BRAND.purple }} />
          <span className="text-[12.5px] font-semibold" style={{ color: `${BRAND.ink}99` }}>
            المحكمون:
          </span>
          <span className="text-[13px] font-bold" style={{ color: BRAND.ink }}>
            {judgeCount}
          </span>
        </div>
      </div>

      {/* Actions — icon + label, never icon-only */}
      <div
        className="px-4 pb-4 flex flex-col sm:flex-row gap-2"
        data-testid={`public-room-actions-${match.roomNumber}`}
      >
        <button
          type="button"
          onClick={onDetails}
          className={`${BTN.base} ${BTN.secondary} ${BTN_SIZE.md} flex-1`}
          data-testid={`button-room-details-${match.roomNumber}`}
        >
          <ScrollText className="w-4 h-4" />
          تفاصيل القاعة
        </button>
        {onFollowJudging && (
          <button
            type="button"
            onClick={onFollowJudging}
            className={`${BTN.base} ${BTN.secondary} ${BTN_SIZE.md} flex-1`}
            data-testid={`button-room-follow-${match.roomNumber}`}
          >
            <ListChecks className="w-4 h-4" />
            متابعة التحكيم
          </button>
        )}
      </div>
    </div>
  );
}
