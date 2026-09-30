import { CheckCircle2, Gavel, Link2, Lock, LockOpen, Trash2, UserRound, X } from "lucide-react";
import { BRAND, BTN, BTN_SIZE } from "@/lib/brand";
import type { LeaderIndividual, LeaderRoom } from "@/lib/leaderApi";

/** One room of a round: debaters and its single judge are picked from the registries. */
export default function RoomCard({ room, people, judges, sheets, onChange, onRemove, onToggleLock, onCopyLink, onDeleteSheet }: {
  room: LeaderRoom;
  /** Registered debaters not placed in another room of this round. */
  people: LeaderIndividual[];
  /** Registered judges not assigned to another room of this round. */
  judges: string[];
  sheets: [string, { judgeName: string }][];
  onChange: (fn: (r: LeaderRoom) => void) => void;
  onRemove: () => void;
  onToggleLock: () => void;
  onCopyLink: () => void;
  onDeleteSheet: (key: string) => void;
}) {
  const freePeople = people.filter((p) => !room.individuals.some((x) => x.id === p.id));
  const freeJudges = judges.filter((j) => !room.judges.includes(j));
  const done = sheets.length > 0;
  const status = done ? { l: "تم الإرسال", c: BRAND.success } : room.locked ? { l: "مغلقة", c: BRAND.inkSoft } : { l: "مفتوحة", c: BRAND.blue };

  return (
    <div className="rounded-2xl bg-white border shadow-sm overflow-hidden" style={{ borderColor: BRAND.border }}>
      <div className="flex items-center gap-2 border-b px-4 py-3" style={{ borderColor: BRAND.border }}>
        <input value={room.label} onChange={(e) => onChange((r) => { r.label = e.target.value; })}
          className="flex-1 min-w-0 bg-transparent font-bold text-[15px] outline-none" style={{ color: BRAND.ink }} />
        <span className="rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ background: `${status.c}18`, color: status.c }}>{status.l}</span>
        <button onClick={onRemove} className="rounded-md p-1 hover:bg-black/5" style={{ color: `${BRAND.ink}66` }}><Trash2 className="w-4 h-4" /></button>
      </div>

      <div className="space-y-4 p-4">
        <Section icon={<UserRound className="w-3.5 h-3.5" />} title={`المتناظرون (${room.individuals.length})`}>
          {room.individuals.map((ind, i) => (
            <Row key={ind.id} n={i + 1} name={ind.name} onRemove={() => onChange((r) => { r.individuals.splice(i, 1); })} />
          ))}
          <Picker placeholder={people.length ? "+ إضافة متناظر للقاعة" : "سجّل المتناظرين أولاً"}
            options={freePeople.map((p) => [p.id, p.name])}
            onPick={(pid) => { const p = freePeople.find((x) => x.id === pid); if (p) onChange((r) => { r.individuals.push({ ...p }); }); }} />
        </Section>

        <Section icon={<Gavel className="w-3.5 h-3.5" />} title="المحكم">
          {room.judges.map((j, i) => (
            <Row key={j} name={j} onRemove={() => onChange((r) => { r.judges.splice(i, 1); })} />
          ))}
          {room.judges.length === 0 && (
            <Picker placeholder={judges.length ? "اختر محكم القاعة" : "سجّل المحكمين أولاً"}
              options={freeJudges.map((j) => [j, j])}
              onPick={(j) => onChange((r) => { r.judges.push(j); })} />
          )}
        </Section>

        {done && (
          <div className="rounded-xl p-2.5 text-[12.5px]" style={{ background: `${BRAND.success}10` }}>
            {sheets.map(([key, s]) => (
              <div key={key} className="flex items-center gap-1.5" style={{ color: BRAND.ink }}>
                <CheckCircle2 className="w-4 h-4" style={{ color: BRAND.success }} />
                <span className="flex-1">أرسل {s.judgeName} الدرجات</span>
                <button onClick={() => onDeleteSheet(key)} className="text-[11.5px] font-bold" style={{ color: `${BRAND.ink}80` }}>إعادة فتح</button>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button onClick={onToggleLock} className={`${BTN.base} ${BTN.secondary} ${BTN_SIZE.sm}`}>
            {room.locked ? <><LockOpen className="w-4 h-4" /> فتح الرابط</> : <><Lock className="w-4 h-4" /> إغلاق الرابط</>}
          </button>
          <button onClick={onCopyLink} className={`${BTN.base} ${BTN.secondary} ${BTN_SIZE.sm}`} style={{ color: BRAND.purple }}>
            <Link2 className="w-4 h-4" /> رابط القاعة
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1.5 text-[12px] font-bold" style={{ color: BRAND.purple }}>{icon}{title}</div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Row({ n, name, onRemove }: { n?: number; name: string; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13.5px]" style={{ background: BRAND.surface, color: BRAND.ink }}>
      {n && <span className="text-[11px] font-bold" style={{ color: `${BRAND.ink}66` }}>{n}</span>}
      <span className="flex-1 font-medium">{name}</span>
      <button onClick={onRemove} style={{ color: `${BRAND.ink}66` }}><X className="w-3.5 h-3.5" /></button>
    </div>
  );
}

function Picker({ placeholder, options, onPick }: { placeholder: string; options: [string, string][]; onPick: (v: string) => void }) {
  return (
    <select value="" onChange={(e) => e.target.value && onPick(e.target.value)} disabled={!options.length}
      className="h-9 w-full rounded-lg border border-dashed bg-white px-2 text-[13px] font-bold outline-none disabled:opacity-60"
      style={{ borderColor: `${BRAND.purple}40`, color: BRAND.purple }}>
      <option value="">{placeholder}</option>
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  );
}
