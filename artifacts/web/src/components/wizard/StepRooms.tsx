import { ChevronDown, ChevronUp, LayoutGrid, Plus, Trash2 } from "lucide-react";
import { BRAND, BTN, BTN_SIZE } from "@/lib/brand";
import type { Room } from "@/types/tournament";
import { makeRoom, type TournamentSetup } from "@/lib/wizard/types";
import { Field, Panel, inputClass, inputStyle } from "./ui";

interface StepRoomsProps {
  setup: TournamentSetup;
  patch: (p: Partial<TournamentSetup>) => void;
}

/** Keeps room numbers sequential (1..n) after add / delete / reorder. */
function renumber(rooms: Room[]): Room[] {
  return rooms.map((r, i) => ({ ...r, number: i + 1 }));
}

/** Step 3 — define the rooms up front, name and order them. */
export default function StepRooms({ setup, patch }: StepRoomsProps) {
  const rooms = setup.rooms;

  const setCount = (count: number) => {
    const target = Math.max(0, Math.min(40, count));
    const next = [...rooms];
    while (next.length < target) next.push(makeRoom(next.length + 1));
    while (next.length > target) next.pop();
    patch({ rooms: renumber(next), draw: null, drawApproved: false });
  };

  const rename = (id: string, label: string) =>
    patch({ rooms: rooms.map((r) => (r.id === id ? { ...r, label } : r)) });

  const remove = (id: string) =>
    patch({
      rooms: renumber(rooms.filter((r) => r.id !== id)),
      draw: null,
      drawApproved: false,
    });

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= rooms.length) return;
    const next = [...rooms];
    [next[index], next[target]] = [next[target], next[index]];
    patch({ rooms: renumber(next), draw: null, drawApproved: false });
  };

  return (
    <div className="space-y-4">
      <Panel title="عدد القاعات" hint="حدد العدد وسيتم إنشاء القاعات تلقائياً، ثم يمكنك تسميتها">
        <div className="flex items-end gap-3">
          <div className="w-32">
            <Field label="العدد">
              <input
                type="number"
                min={0}
                max={40}
                value={rooms.length}
                onChange={(e) => setCount(Number(e.target.value) || 0)}
                className={inputClass}
                style={inputStyle}
                data-testid="input-rooms-count"
              />
            </Field>
          </div>
          <button
            type="button"
            onClick={() => setCount(rooms.length + 1)}
            className={`${BTN.base} ${BTN.secondary} ${BTN_SIZE.md} mb-0.5`}
            data-testid="button-add-room"
          >
            <Plus className="w-4 h-4" />
            إضافة قاعة
          </button>
        </div>
      </Panel>

      <Panel
        title={`القاعات (${rooms.length})`}
        hint="رقم القاعة ثابت ومحفوظ — الاسم فقط قابل للتعديل"
      >
        {rooms.length === 0 ? (
          <div className="py-8 flex flex-col items-center gap-2 text-center">
            <LayoutGrid className="w-9 h-9" style={{ color: `${BRAND.purple}59` }} />
            <p className="font-bold text-[14px]" style={{ color: BRAND.ink }}>
              لم تُضف أي قاعة بعد
            </p>
            <p className="text-[12px]" style={{ color: `${BRAND.ink}8c` }}>
              حدد عدد القاعات في الأعلى للبدء
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

                {/* reorder */}
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
                  className={`${BTN.base} ${BTN.danger} ${BTN_SIZE.sm} shrink-0`}
                  data-testid={`button-delete-room-${room.number}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  حذف
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
