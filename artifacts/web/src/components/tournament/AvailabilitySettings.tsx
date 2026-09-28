import { Ban, CheckCircle2 } from "lucide-react";
import { BRAND } from "@/lib/brand";
import type { Tournament } from "@/types/tournament";

interface Props {
  tournament: Tournament;
  onToggleTeam: (teamId: string, disabled: boolean) => void;
  onToggleRoom: (roomNumber: number, disabled: boolean) => void;
}

/**
 * تعطيل الفرق والقاعات — a disabled team (e.g. withdrawn) is left out of new
 * draws, and a disabled room number is skipped. Rounds already drawn keep
 * their rooms; redraw to apply the change there.
 */
export default function AvailabilitySettings({ tournament, onToggleTeam, onToggleRoom }: Props) {
  const roomCount = Math.max(
    Math.ceil(tournament.teams.length / 2),
    ...(tournament.rooms ?? []).map((r) => r.number),
    0,
  );
  const rooms = Array.from({ length: roomCount }, (_, i) => {
    const number = i + 1;
    const room = tournament.rooms?.find((r) => r.number === number);
    return { number, label: room?.label.trim() || `القاعة ${number}`, disabled: !!room?.disabled };
  });

  return (
    <div className="space-y-3">
      <p className="text-[12px]" style={{ color: `${BRAND.ink}99` }}>
        الفرق والقاعات المعطّلة لا تدخل في القرعات الجديدة. الجولات التي أُجريت قرعتها لا تتغيّر — أعد قرعتها لتطبيق التعديل.
      </p>
      <Group title="الفرق">
        {tournament.teams.map((team) => (
          <Chip
            key={team.id}
            label={team.name}
            disabled={!!team.disabled}
            onClick={() => onToggleTeam(team.id, !team.disabled)}
            testId={`toggle-team-${team.id}`}
          />
        ))}
      </Group>
      <Group title="القاعات">
        {rooms.map((room) => (
          <Chip
            key={room.number}
            label={room.label}
            disabled={room.disabled}
            onClick={() => onToggleRoom(room.number, !room.disabled)}
            testId={`toggle-room-${room.number}`}
          />
        ))}
      </Group>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[12.5px] font-bold mb-1.5" style={{ color: BRAND.ink }}>
        {title}
      </p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Chip({
  label,
  disabled,
  onClick,
  testId,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  testId: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={!disabled}
      title={disabled ? "معطّل — اضغط للتفعيل" : "مفعّل — اضغط للتعطيل"}
      className="inline-flex items-center gap-1 h-8 px-2.5 rounded-full border text-[12px]"
      style={
        disabled
          ? { borderColor: "#FCA5A5", backgroundColor: "#FEF2F2", color: "#B91C1C", textDecoration: "line-through" }
          : { borderColor: BRAND.border, backgroundColor: "#fff", color: BRAND.ink }
      }
      data-testid={testId}
    >
      {disabled ? <Ban className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" style={{ color: BRAND.purple }} />}
      {label}
    </button>
  );
}
