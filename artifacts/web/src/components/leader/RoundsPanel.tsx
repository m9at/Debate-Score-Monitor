import { useState } from "react";
import { Link2, Pencil, Plus, Settings2, Shuffle, Trash2 } from "lucide-react";
import { BRAND, BRAND_GRADIENT, BTN, BTN_PRIMARY_STYLE } from "@/lib/brand";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, inputClass, inputStyle } from "@/components/wizard/ui";
import { dayRange, newRoom, periodLabel, roomStatus, type LeaderInfo, type LeaderRoom, type LeaderTournament } from "@/lib/leaderApi";
import { drawLeaderRound } from "@/lib/leaderDraw";
import RoomCard from "./RoomCard";
import { ActionsMenu, SectionHeader } from "./ui";

interface Props {
  t: LeaderTournament;
  info: LeaderInfo;
  edit: (fn: (d: LeaderInfo) => void) => void;
  onToggleLock: (dayIdx: number, roomIdx: number) => void;
  onDeleteSheet: (key: string) => void;
  copyLink: (q: string) => void;
}

/** Rounds: pick a round (each has its own system + judge link), then manage its rooms. */
export default function RoundsPanel({ t, info, edit, onToggleLock, onDeleteSheet, copyLink }: Props) {
  const [sel, setSel] = useState(0);
  const [settingsFor, setSettingsFor] = useState<number | null>(null);
  const dayIdx = Math.min(sel, info.days.length - 1);
  const day = info.days[dayIdx];
  const people = info.individualPool ?? [];
  const judges = info.judgePool ?? [];

  const addRound = () => {
    edit((d) => { d.days.push({ day: d.days.length + 1, period: d.days.at(-1)?.period ?? 1, rooms: [newRoom(1)] }); });
    setSel(info.days.length);
  };
  const removeRound = (i: number) => {
    edit((d) => { d.days.splice(i, 1); d.days.forEach((x, k) => { x.day = k + 1; }); });
    setSel(0);
  };

  return (
    <div>
      <SectionHeader title="الجولات" subtitle="لكل جولة نظامها ورابط تحكيمها الخاص — وتُجمع كل الجولات في النتيجة النهائية">
        <button onClick={addRound} className={`${BTN.base} ${BTN.primary}`} style={BTN_PRIMARY_STYLE}><Plus className="w-4 h-4" /> جولة جديدة</button>
      </SectionHeader>

      {/* Round cards, grouped by period (الفترة) */}
      {[...new Set(info.days.map((d) => d.period ?? 1))].sort((a, b) => a - b).map((p) => (
      <div key={p} className="mb-5">
      <h3 className="mb-2 font-bold text-[14px]" style={{ color: BRAND.purple }}>{periodLabel(p)}</h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {info.days.map((d, i) => {
          if ((d.period ?? 1) !== p) return null;
          const r = dayRange(info, d);
          const sent = d.rooms.filter((x) => t.results[x.id]).length;
          const active = i === dayIdx;
          return (
            <div key={d.day} onClick={() => setSel(i)}
              className="cursor-pointer overflow-hidden rounded-2xl border bg-white shadow-sm transition-all"
              style={{ borderColor: active ? BRAND.purple : BRAND.border, boxShadow: active ? `0 0 0 3px ${BRAND.purple}1f` : undefined }}>
              <div className="h-1" style={{ backgroundImage: active ? BRAND_GRADIENT : undefined, background: active ? undefined : BRAND.border }} />
              <div className="flex items-start gap-2 p-4">
                <div className="flex-1">
                  <div className="text-[12px] font-bold" style={{ color: BRAND.purple }}>الجولة {d.day}</div>
                  <div className="font-bold text-[15px]" style={{ color: BRAND.ink }}>{d.title || "البطولة القيادية"}</div>
                  <div className="mt-1 text-[12px]" style={{ color: `${BRAND.ink}80` }}>
                    {d.rooms.length} قاعات · {sent}/{d.rooms.length} قاعات مكتملة · الدرجات {r.min}–{r.max}
                  </div>
                  <div className="text-[12px]" style={{ color: `${BRAND.ink}80` }}>
                    عدد الأفرقاء: {d.rooms.reduce((n, x) => n + x.individuals.length, 0)} · المحكمون: {d.rooms.reduce((n, x) => n + x.judges.length, 0)}
                  </div>
                </div>
                <ActionsMenu actions={[
                  { label: "إعدادات الجولة", icon: <Settings2 className="w-4 h-4" />, onClick: () => setSettingsFor(i) },
                  { label: "نسخ رابط تحكيم الجولة", icon: <Link2 className="w-4 h-4" />, onClick: () => copyLink(`?day=${d.day}`) },
                  ...(info.days.length > 1 ? [{
                    label: "حذف الجولة", icon: <Trash2 className="w-4 h-4" />, onClick: () => removeRound(i),
                    danger: { title: `حذف الجولة ${d.day}`, description: "ستُحذف الجولة بقاعاتها وتوزيعها. لا يمكن التراجع." },
                  }] : []),
                ]} />
              </div>
            </div>
          );
        })}
      </div>
      </div>
      ))}

      {/* Rooms of the selected round */}
      {day && (
        <div className="rounded-2xl border bg-white/60 p-4" style={{ borderColor: BRAND.border }}>
          <div className="mb-3 flex flex-wrap items-center gap-2 [&_button]:whitespace-nowrap">
            <h3 className="flex-1 font-bold text-[16px]" style={{ color: BRAND.ink }}>قاعات الجولة {day.day}</h3>
            <ActionsMenu actions={[{
              label: "توزيع تلقائي للأفراد والمحكمين", icon: <Shuffle className="w-4 h-4" />,
              onClick: () => edit((d) => { Object.assign(d, drawLeaderRound(d, dayIdx, d.individualsPerRoom ?? 4)); }),
              danger: { title: `توزيع تلقائي للجولة ${day.day}`, description: `سيُعاد توزيع كل المتناظرين المسجلين (${people.length}) على قاعات من ${info.individualsPerRoom ?? 4} أفراد، مع محكم لكل قاعة. سيُستبدل التوزيع الحالي.` },
            }]} />
            <button onClick={() => setSettingsFor(dayIdx)} className={`${BTN.base} ${BTN.secondary}`}><Pencil className="w-4 h-4" /> إعدادات الجولة</button>
            <button onClick={() => copyLink(`?day=${day.day}`)} className={`${BTN.base} ${BTN.secondary}`}><Link2 className="w-4 h-4" /> رابط تحكيم الجولة</button>
            <button onClick={() => edit((d) => { d.days[dayIdx].rooms.push(newRoom(d.days[dayIdx].rooms.length + 1)); })}
              className={`${BTN.base} ${BTN.primary}`} style={BTN_PRIMARY_STYLE}><Plus className="w-4 h-4" /> إضافة قاعة</button>
          </div>
          <RoundSummary t={t} day={day} />
          <div className="space-y-2.5">
            {day.rooms.length === 0 && <p className="py-6 text-center text-[13px]" style={{ color: `${BRAND.ink}66` }}>لا توجد قاعات — أضف قاعة للبدء</p>}
            {day.rooms.map((room, ri) => {
              const others = day.rooms.filter((_, i) => i !== ri);
              return (
                <RoomCard key={room.id} room={room} state={roomStatus(t, room.id)} scores={t.results[room.id]?.scores}
                  people={people.filter((p) => !others.some((r) => r.individuals.some((x) => x.id === p.id)))}
                  judges={judges.filter((j) => !others.some((r) => r.judges.includes(j)))}
                  sheets={Object.entries(t.results).filter(([, s]) => s.roomId === room.id)}
                  onChange={(fn: (r: LeaderRoom) => void) => edit((d) => fn(d.days[dayIdx].rooms[ri]))}
                  onRemove={() => edit((d) => { d.days[dayIdx].rooms.splice(ri, 1); })}
                  onToggleLock={() => onToggleLock(dayIdx, ri)}
                  onCopyLink={() => copyLink(`?room=${room.id}`)}
                  onDeleteSheet={onDeleteSheet}
                />
              );
            })}
          </div>
        </div>
      )}

      <RoundSettingsDialog info={info} dayIdx={settingsFor} onClose={() => setSettingsFor(null)} edit={edit} />
    </div>
  );
}

function RoundSettingsDialog({ info, dayIdx, onClose, edit }: {
  info: LeaderInfo; dayIdx: number | null; onClose: () => void; edit: Props["edit"];
}) {
  const d = dayIdx !== null ? info.days[dayIdx] : null;
  const r = d ? dayRange(info, d) : { min: 0, max: 0 };
  return (
    <Dialog open={!!d} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent dir="rtl">
        <DialogHeader><DialogTitle className="text-right">إعدادات الجولة {d?.day}</DialogTitle></DialogHeader>
        {d && dayIdx !== null && (
          <div className="space-y-4">
            <Field label="عنوان / موضوع الجولة">
              <input value={d.title ?? ""} placeholder="مثال: الجولة التمهيدية"
                onChange={(e) => edit((x) => { x.days[dayIdx].title = e.target.value; })} className={inputClass} style={inputStyle} />
            </Field>
            <Field label="الفترة">
              <select value={d.period ?? 1} onChange={(e) => edit((x) => { x.days[dayIdx].period = +e.target.value; })}
                className={inputClass} style={inputStyle}>
                {Array.from({ length: Math.max(...info.days.map((y) => y.period ?? 1)) + 1 }, (_, k) => k + 1)
                  .map((k) => <option key={k} value={k}>{periodLabel(k)}</option>)}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="أقل درجة">
                <input type="number" value={r.min} onChange={(e) => edit((x) => { x.days[dayIdx].scoreMin = +e.target.value; })}
                  className={inputClass} style={inputStyle} />
              </Field>
              <Field label="أعلى درجة">
                <input type="number" value={r.max} onChange={(e) => edit((x) => { x.days[dayIdx].scoreMax = +e.target.value; })}
                  className={inputClass} style={inputStyle} />
              </Field>
            </div>
            <p className="text-[12px]" style={{ color: `${BRAND.ink}80` }}>أرقام صحيحة فقط · بدون فائز · بعد إرسال المحكم تُقفل القاعة.</p>
            <button onClick={onClose} className={`${BTN.base} ${BTN.primary} w-full h-11`} style={BTN_PRIMARY_STYLE}>تم</button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Round header stats — scores only, no winner. */
function RoundSummary({ t, day }: { t: LeaderTournament; day: LeaderInfo["days"][number] }) {
  const done = day.rooms.filter((r) => t.results[r.id]);
  const scores = done.flatMap((r) => Object.values(t.results[r.id].scores));
  const avg = scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : "—";
  const stats: [string, string | number][] = [
    ["الأفرقاء", day.rooms.reduce((n, r) => n + r.individuals.length, 0)],
    ["القاعات", day.rooms.length],
    ["المحكمون", day.rooms.reduce((n, r) => n + r.judges.length, 0)],
    ["التحكيم المكتمل", `${done.length}/${day.rooms.length}`],
    ["متوسط الدرجات", avg],
  ];
  return (
    <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
      {stats.map(([l, v]) => (
        <div key={l} className="rounded-xl border bg-white px-3 py-2 text-center" style={{ borderColor: BRAND.border }}>
          <div className="text-[11px]" style={{ color: `${BRAND.ink}80` }}>{l}</div>
          <div className="text-[17px] font-extrabold" style={{ color: BRAND.purple }}>{v}</div>
        </div>
      ))}
    </div>
  );
}
