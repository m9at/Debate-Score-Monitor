import { Award, Pencil, Star } from "lucide-react";
import type { Match } from "@/types/tournament";
import { BRAND, BRAND_GRADIENT, BTN, BTN_PRIMARY_STYLE } from "@/lib/brand";
import { roomStatusMeta, type RoomStatus } from "@/lib/roomStatus";
import RoomStatusBadge from "./RoomStatusBadge";

const HIDDEN_SCORE = "••";

/** موالاة (government) and معارضة (opposition) keep the app-wide colour semantics. */
const GOV = BRAND.blue;
const OPP = BRAND.purple;

interface RoomCardProps {
  match: Match;
  teamMap: Map<string, { name: string }>;
  hideScores?: boolean;
  /** Where the room stands in the round — drives the badge and accent bar. */
  status: RoomStatus;
  onOpen: () => void;
  onEditRoom?: () => void;
}

function SideRow({
  label,
  color,
  teamName,
  score,
  isWinner,
  showScore,
  hideScores,
}: {
  label: string;
  color: string;
  teamName: string;
  score: number;
  isWinner: boolean;
  showScore: boolean;
  hideScores?: boolean;
}) {
  return (
    <div
      className="flex items-center gap-2 h-11 pr-2.5 pl-3 rounded-xl transition-colors"
      style={{
        backgroundColor: `${color}14`,
        boxShadow: isWinner ? `inset 0 0 0 1.5px ${color}66` : undefined,
      }}
    >
      <span
        className="px-2 py-0.5 rounded-lg text-[10px] font-bold shrink-0"
        style={{ backgroundColor: `${color}24`, color }}
      >
        {label}
      </span>
      <span
        className={`flex-1 min-w-0 truncate text-[13px] ${isWinner ? "font-bold" : "font-medium"}`}
        style={{ color: isWinner ? color : BRAND.ink }}
      >
        {teamName}
      </span>
      {isWinner && <Award className="w-3.5 h-3.5 shrink-0" style={{ color }} />}
      {showScore && (
        <span
          className="text-base font-bold shrink-0 tabular-nums"
          style={{ color }}
        >
          {hideScores ? HIDDEN_SCORE : score}
        </span>
      )}
    </div>
  );
}

/** A single debate room: teams, status, best speaker and its actions. */
export default function RoomCard({
  match,
  teamMap,
  hideScores,
  status,
  onOpen,
  onEditRoom,
}: RoomCardProps) {
  const statusColor = roomStatusMeta(status).dot;
  const govName = teamMap.get(match.team1.teamId)?.name ?? "-";
  const oppName = teamMap.get(match.team2.teamId)?.name ?? "-";
  const isGovWinner = match.winnerId === match.team1.teamId;
  const isOppWinner = match.winnerId === match.team2.teamId;
  const roomText = match.roomLabel?.trim()
    ? match.roomLabel
    : `القاعة ${match.roomNumber}`;
  const judges = (match.judgeNames ?? []).filter((n) => n && n.trim());

  return (
    <div
      className="group rounded-2xl bg-white border shadow-sm hover:shadow-lg
                 overflow-hidden transition-all duration-300 hover:-translate-y-0.5
                 animate-in fade-in zoom-in-95"
      style={{ borderColor: BRAND.border }}
      data-testid={`card-match-${match.id}`}
    >
      {/* Status accent bar */}
      <div
        aria-hidden
        className="h-1 w-full transition-colors duration-300"
        style={{ backgroundColor: statusColor }}
        data-testid={`accent-match-${match.id}`}
      />
      <div className="p-3">
      {/* Head: room name + status */}
      <div className="flex items-center gap-2 mb-2.5">
        <span
          aria-hidden
          className="w-2 h-2 rounded-full shrink-0"
          style={{
            backgroundColor: statusColor,
            boxShadow: `0 0 8px ${statusColor}`,
          }}
        />
        <span
          className="text-[13px] font-bold"
          style={{ color: BRAND.ink }}
          data-testid={`text-room-${match.id}`}
        >
          {roomText}
        </span>

        {onEditRoom && (
          <button
            type="button"
            onClick={onEditRoom}
            aria-label="تعديل اسم/رقم القاعة"
            title="تعديل اسم/رقم القاعة"
            className="w-6 h-6 rounded-lg flex items-center justify-center opacity-0
                       group-hover:opacity-100 focus:opacity-100 transition-opacity
                       hover:bg-[#2B1B45]/[0.06]"
            style={{ color: `${BRAND.ink}80` }}
            data-testid={`button-edit-room-${match.id}`}
          >
            <Pencil className="w-3 h-3" />
          </button>
        )}

        <span className="flex-1" />

        <span data-testid={`status-match-${match.id}`}>
          <RoomStatusBadge status={status} size="sm" />
        </span>
      </div>

      {/* Teams with centred VS */}
      <div className="relative space-y-1.5">
        <SideRow
          label="موالاة"
          color={GOV}
          teamName={govName}
          score={match.team1.totalScore}
          isWinner={isGovWinner}
          showScore={match.completed}
          hideScores={hideScores}
        />
        <SideRow
          label="معارضة"
          color={OPP}
          teamName={oppName}
          score={match.team2.totalScore}
          isWinner={isOppWinner}
          showScore={match.completed}
          hideScores={hideScores}
        />

        <span
          aria-hidden
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                     w-9 h-9 rounded-full flex items-center justify-center
                     text-[11px] font-bold text-white ring-4 ring-white select-none"
          style={{ backgroundImage: BRAND_GRADIENT }}
        >
          VS
        </span>
      </div>

      {/* Best speaker + judges */}
      {(match.completed && match.bestSpeaker) || judges.length > 0 ? (
        <div className="mt-2.5 pt-2.5 border-t flex flex-wrap items-center gap-x-3 gap-y-1" style={{ borderColor: BRAND.border }}>
          {match.completed && match.bestSpeaker && (
            <span className="flex items-center gap-1.5 text-[11px] min-w-0">
              <Star className="w-3.5 h-3.5 shrink-0" style={{ color: BRAND.gold }} />
              <span style={{ color: `${BRAND.ink}99` }}>أفضل متحدث:</span>
              <span className="font-bold truncate" style={{ color: BRAND.ink }}>
                {match.bestSpeaker.name}
              </span>
              <span className="font-bold tabular-nums" style={{ color: BRAND.gold }}>
                {hideScores ? HIDDEN_SCORE : match.bestSpeaker.score}
              </span>
            </span>
          )}
          {judges.length > 0 && (
            <span
              className="text-[11px] truncate min-w-0"
              style={{ color: `${BRAND.ink}99` }}
            >
              المحكم: <span className="font-semibold">{judges.join("، ")}</span>
            </span>
          )}
        </div>
      ) : null}

      {/* Actions */}
      <div className="mt-2.5 flex items-center gap-2">
        <button
          type="button"
          onClick={onOpen}
          className={`${BTN.base} ${match.completed ? BTN.secondary : BTN.primary} flex-1`}
          style={match.completed ? undefined : BTN_PRIMARY_STYLE}
          data-testid={`button-score-${match.id}`}
        >
          {match.completed ? "تعديل النتائج" : "إدخال النتائج"}
        </button>
        {onEditRoom && (
          <button
            type="button"
            onClick={onEditRoom}
            className={`${BTN.base} ${BTN.secondary}`}
            data-testid={`button-room-details-${match.id}`}
          >
            تفاصيل الغرفة
          </button>
        )}
        </div>
      </div>
    </div>
  );
}
