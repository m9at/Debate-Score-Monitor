import { useEffect } from "react";
import { ChevronDown, ChevronUp, LayoutGrid, Plus, Trash2 } from "lucide-react";
import { BRAND, BTN, BTN_SIZE } from "@/lib/brand";
import type { Room } from "@/types/tournament";
import { makeRoom, type TournamentSetup } from "@/lib/wizard/types";
import { Panel, inputStyle } from "./ui";

interface StepRoomsProps {
  setup: TournamentSetup;
  patch: (p: Partial<TournamentSetup>) => void;
}

/** Keeps room numbers sequential (1..n) after add / delete / reorder. */
function renumber(rooms: Room[]): Room[] {
  return rooms.map((r, i) => ({ ...r, number: i + 1 }));
}

/**
 * The rooms themselves. Two teams debate per room, so the step suggests one
 * room per two teams — but the organiser may add, remove, rename and reorder
 * rooms freely. The draw warns about rooms left empty or teams left out.
 */
export default function StepRooms({ setup, patch }: StepRoomsProps) {
  const rooms = setup.rooms;
  const teamsCount = setup.teams.length;
  const suggested = Math.ceil(teamsCount / 2);

  const commit = (next: Room[]) =>
    patch({ rooms: renumber(next), draw: null, drawApproved: false });

  // First visit: start from the suggested count so nothing needs typing.
  useEffect(() => {
    if (rooms.length === 0 && suggested > 0) {
      commit(Array.from({ length: suggested }, (_, i) => makeRoom(i + 1)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rename = (id: string, label: string) =>
    patch({ rooms: rooms.map((r) => (r.id === id ? { ...r, label } : r)) });

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= rooms.length) return;
    const next = [...rooms];
    [next[index], next[target]] = [next[target], next[index]];
    commit(next);
  };

  const add = () => commit([...rooms, makeRoom(rooms.length + 1)]);
  const remove = (id: string) => commit(rooms.filter((r) => r.id !== id));
  const matchTeams = () => {
    const next = rooms.slice(0, suggested);
    while (next.length < suggested) next.push(makeRoom(next.length + 1));
    commit(next);
  };

  return (
    <div className="space-y-4">
      <Panel
        title="العدد المقترح"
        hint="قاعة واحدة لكل فريقين — يمكنك إضافة أو حذف القاعات بحرية"
      >
        <div className="flex items-center gap-3 flex-wrap">
          <p className="text-[13.5px] font-bold flex-1" style={{ color: BRAND.ink }} data-testid="text-rooms-derived">
            {teamsCount} فريق ← {suggested} قاعة مقترحة · لديك {rooms.length} قاعة
          </p>
          {rooms.length !== suggested && suggested > 0 && (
            <button
              type="button"
              onClick={matchTeams}
              className={`${BTN.base} ${BTN.secondary} ${BTN_SIZE.sm}`}
              data-testid="button-rooms-match-teams"
            >
              مطابقة عدد الفرق ({suggested})
            </button>
          )}
        </div>
      </Panel>

      <Panel
        title={`القاعات (${rooms.length})`}
        hint="رقم القاعة يتبع ترتيبها — الاسم قابل للتعديل"
      >
        {rooms.length === 0 ? (
          <div className="py-8 flex flex-col items-center gap-2 text-center">
            <LayoutGrid className="w-9 h-9" style={{ color: `${BRAND.purple}59` }} />
            <p className="font-bold text-[14px]" style={{ color: BRAND.ink }}>
              لا توجد قاعات بعد
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {rooms.map((room, i) => (
              <li
                key={room.id}
                className="flex items-center gap-2 rounded-xl border p-2"
                style={{ borderColor: BRAND.border }}
                data-testid={`row-room-${room.number}`}
              >
                <span
                  className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-[13px] shrink-0"
                  style={{ backgroundColor: `${BRAND.purple}12`, color: BRAND.purple }}
                >
                  {String(room.number).padStart(2, "0")}
                </span>

                <input
                  value={room.label}
                  onChange={(e) => rename(room.id, e.target.value)}
                  placeholder={`القاعة ${room.number}`}
                  className="flex-1 min-w-0 h-9 rounded-lg bg-transparent border px-2.5 text-[13.5px]
                             font-semibold outline-none transition-colors focus:border-[#7B2D8E]/45"
                  style={inputStyle}
                  data-testid={`input-room-label-${room.number}`}
                />

                <div className="flex flex-col shrink-0">
                  <button
                    type="button"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    className="w-7 h-4 flex items-center justify-center rounded-t
                               hover:bg-[#2B1B45]/[0.06] disabled:opacity-25"
                    aria-label="تحريك لأعلى"
                    data-testid={`button-room-up-${room.number}`}
                  >
                    <ChevronUp className="w-3.5 h-3.5" style={{ color: BRAND.ink }} />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    disabled={i === rooms.length - 1}
                    className="w-7 h-4 flex items-center justify-center rounded-b
                               hover:bg-[#2B1B45]/[0.06] disabled:opacity-25"
                    aria-label="تحريك لأسفل"
                    data-testid={`button-room-down-${room.number}`}
                  >
                    <ChevronDown className="w-3.5 h-3.5" style={{ color: BRAND.ink }} />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => remove(room.id)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 hover:bg-red-50"
                  aria-label="حذف القاعة"
                  data-testid={`button-room-delete-${room.number}`}
                >
                  <Trash2 className="w-4 h-4" style={{ color: BRAND.danger }} />
                </button>
              </li>
            ))}
          </ul>
        )}

        <button
          type="button"
          onClick={add}
          className={`${BTN.base} ${BTN.secondary} ${BTN_SIZE.sm} mt-3`}
          data-testid="button-room-add"
        >
          <Plus className="w-3.5 h-3.5" />
          إضافة قاعة
        </button>
      </Panel>
    </div>
  );
}
