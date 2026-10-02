import { useState } from "react";
import { Lock, LockOpen, Pencil, Plus, Settings2, Shuffle, Trash2 } from "lucide-react";
import { BRAND, BTN, BTN_PRIMARY_STYLE } from "@/lib/brand";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, inputClass, inputStyle } from "@/components/wizard/ui";
import {
  dayRange, logActivity, newRoom, periodLabel, roomPanel, roomStatus, ROUND_STATUS, roundStatus,
  type LeaderDay, type LeaderInfo, type LeaderTournament,
} from "@/lib/leaderApi";
import { drawLeaderRound } from "@/lib/leaderDraw";
import { exportLeaderPdf } from "@/lib/leaderPdf";
import RoomCard from "./RoomCard";
import RoundCard from "./RoundCard";
import JudgeLinkCard from "./JudgeLinkCard";
import PdfMenu from "./PdfMenu";
import { ActionsMenu, SectionHeader } from "./ui";

interface Props {
  t: LeaderTournament;
  info: LeaderInfo;
  edit: (fn: (d: LeaderInfo) => void) => void;
  onToggleLock: (dayIdx: number, roomIdx: number) => void;
  onDeleteSheet: (key: string) => void;
  copyLink: (q: string) => void;
}

/** Periods → rounds → rooms. Each round has its own distribution, panel and judge link. */
export default function RoundsPanel({ t, info, edit, onToggleLock, onDeleteSheet, copyLink }: Props) {
  const [sel, setSel] = useState(0);
  const [settingsFor, setSettingsFor] = useState<number | null>(null);
  const dayIdx = Math.min(sel, info.days.length - 1);
  const day = info.days[dayIdx];
  const people = info.individualPool ?? [];
  const judges = info.judgePool ?? [];
  const tl = { ...t, info };
  const periods = [...new Set(info.days.map((d) => d.period ?? 1))].sort((a, b) => a - b);

  const addRound = (period = info.days.at(-1)?.period ?? 1) => {
    edit((d) => {
      d.days.push({ day: d.days.length + 1, period, createdAt: Date.now(), rooms: [newRoom(1)] });
      logActivity(d, `تم إنشاء الجولة ${d.days.length} — ${periodLabel(period)}`);
    });
    setSel(info.days.length);
  };
  const removeRound = (i: number) => {
    edit((d) => { d.days.splice(i, 1); d.days.forEach((x, k) => { x.day = k + 1; }); });
    setSel(0);
  };
  const toggleClose = (i: number) => edit((d) => {
    d.days[i].closed = !d.days[i].closed;
    logActivity(d, `${d.days[i].closed ? "تم إغلاق" : "تم فتح"} الجولة ${d.days[i].day}`);
  });

  return (
    <div>
      <SectionHeader title="الفترات والجولات" subtitle="كل جولة مستقلة بتوزيعها وقاعاتها ومحكميها ورابط تحكيمها — وتُحفظ كل التغييرات تلقائياً">
        <button onClick={() => addRound()} className={`${BTN.base} ${BTN.primary}`} style={BTN_PRIMARY_STYLE}><Plus className="w-4 h-4" /> جولة جديدة</button>
      </SectionHeader>

      {periods.map((p) => (
        <div key={p} className="mb-6">
          <div className="mb-2 flex items-center gap-2">
            <span className="whitespace-nowrap rounded-lg px-3 py-1 text-[13px] font-extrabold text-white" style={{ background: BRAND.purple }}>{periodLabel(p)}</span>
            <div className="h-px flex-1" style={{ background: BRAND.border }} />
            <button onClick={() => addRound(p)} className="whitespace-nowrap text-[12px] font-bold" style={{ color: BRAND.purple }}>+ جولة في هذه الفترة</button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {info.days.map((d, i) => (d.period ?? 1) !== p ? null : (
              <RoundCard key={d.day} t={tl} d={d} active={i === dayIdx} onManage={() => setSel(i)}
                menu={<ActionsMenu actions={[
                  { label: "إعدادات الجولة", icon: <Settings2 className="w-4 h-4" />, onClick: () => setSettingsFor(i) },
                  d.closed
                    ? { label: "فتح الجولة", icon: <LockOpen className="w-4 h-4" />, onClick: () => toggleClose(i) }
                    : { label: "إغلاق الجولة", icon: <Lock className="w-4 h-4" />, onClick: () => toggleClose(i) },
                  ...(info.days.length > 1 ? [{
                    label: "حذف الجولة", icon: <Trash2 className="w-4 h-4" />, onClick: () => removeRound(i),
                    danger: { title: `حذف الجولة ${d.day}`, description: "ستُحذف الجولة بقاعاتها وتوزيعها. لا يمكن التراجع." },
                  }] : []),
                ]} />} />
            ))}
          </div>
        </div>
      ))}
      <button onClick={() => addRound(Math.max(...periods, 0) + 1)} className="mb-6 w-full rounded-2xl border-2 border-dashed py-3 text-[13px] font-bold"
        style={{ borderColor: `${BRAND.purple}40`, color: BRAND.purple }}>+ فترة جديدة</button>

      {day && (
        <div className="space-y-4 rounded-3xl border bg-white/70 p-4 md:p-5" style={{ borderColor: BRAND.border }}>
          <div className="flex flex-wrap items-center gap-2 [&_button]:whitespace-nowrap">
            <div className="flex-1">
              <div className="text-[12px] font-bold" style={{ color: BRAND.purple }}>{periodLabel(day.period)}</div>
              <h3 className="text-[20px] font-extrabold" style={{ color: BRAND.ink }}>
                الجولة {day.day} <span className="text-[13px]" style={{ color: ROUND_STATUS[roundStatus(tl, day)].color }}>● {ROUND_STATUS[roundStatus(tl, day)].label}</span>
              </h3>
            </div>
            <button onClick={() => setSettingsFor(dayIdx)} className={`${BTN.base} ${BTN.secondary}`}><Pencil className="w-4 h-4" /> إعدادات الجولة</button>
            <button onClick={() => edit((d) => {
              Object.assign(d, drawLeaderRound(d, dayIdx, d.individualsPerRoom ?? 4, d.judgesPerRoom ?? 1));
              logActivity(d, `تم توزيع ${people.length} فرق على قاعات الجولة ${day.day}`);
            })} className={`${BTN.base} ${BTN.secondary}`}><Shuffle className="w-4 h-4" /> توزيع تلقائي</button>
            <PdfMenu t={tl} day={day.day} />
            <button onClick={() => edit((d) => { d.days[dayIdx].rooms.push(newRoom(d.days[dayIdx].rooms.length + 1)); })}
              className={`${BTN.base} ${BTN.primary}`} style={BTN_PRIMARY_STYLE}><Plus className="w-4 h-4" /> إضافة قاعة</button>
          </div>

          <RoundSummary t={tl} day={day} />
          <JudgeLinkCard t={{ ...t, info }} day={day.day} onCopy={(n) => copyLink(`?day=${n}`)} />

          {day.rooms.length === 0 && <p className="py-6 text-center text-[13px]" style={{ color: `${BRAND.ink}66` }}>لا توجد قاعات — أضف قاعة للبدء</p>}
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {day.rooms.map((room, ri) => {
              const others = day.rooms.filter((_, i) => i !== ri);
              return (
                <RoomCard key={room.id} room={room} day={day.day} state={roomStatus(t, room.id)}
                  sheet={t.results[room.id]} draft={t.drafts?.[room.id]}
                  people={people.filter((p) => !others.some((r) => r.individuals.some((x) => x.id === p.id)))}
                  judges={judges.filter((j) => !others.some((r) => roomPanel(r).includes(j)))}
                  onChange={(fn, text) => edit((d) => { fn(d.days[dayIdx].rooms[ri]); if (text) logActivity(d, text); })}
                  onRemove={() => edit((d) => { d.days[dayIdx].rooms.splice(ri, 1); })}
                  onToggleLock={() => onToggleLock(dayIdx, ri)}
                  onCopyLink={() => copyLink(`?room=${room.id}`)}
                  onDeleteSheet={onDeleteSheet}
                  onPdf={() => exportLeaderPdf(tl, { kind: "room", day: day.day, roomId: room.id })}
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

/** Round header stats — scores only, no winner. */
function RoundSummary({ t, day }: { t: LeaderTournament; day: LeaderDay }) {
  const done = day.rooms.filter((r) => t.results[r.id]);
  const scores = done.flatMap((r) => Object.values(t.results[r.id].scores));
  const avg = scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : "—";
  const stats: [string, string | number][] = [
    ["الفرق", day.rooms.reduce((n, r) => n + r.individuals.length, 0)],
    ["القاعات", day.rooms.length],
    ["المحكمون", day.rooms.reduce((n, r) => n + roomPanel(r).length, 0)],
    ["التحكيم المكتمل", `${done.length}/${day.rooms.length}`],
    ["متوسط الدرجات", avg],
  ];
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
      {stats.map(([l, v]) => (
        <div key={l} className="rounded-xl border bg-white px-3 py-2 text-center" style={{ borderColor: BRAND.border }}>
          <div className="text-[11px]" style={{ color: `${BRAND.ink}80` }}>{l}</div>
          <div className="text-[18px] font-extrabold" style={{ color: BRAND.purple }}>{v}</div>
        </div>
      ))}
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
            <Field label="اسم / موضوع الجولة">
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
            <p className="text-[12px]" style={{ color: `${BRAND.ink}80` }}>أرقام صحيحة فقط · بدون فائز أو خاسر · بعد إنهاء التحكيم تُقفل القاعة.</p>
            <button onClick={onClose} className={`${BTN.base} ${BTN.primary} w-full h-11`} style={BTN_PRIMARY_STYLE}>تم</button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
