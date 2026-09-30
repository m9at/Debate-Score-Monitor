import { useState } from "react";
import { CheckCircle2, ChevronDown, Gavel, Link2, Lock, LockOpen, Pencil, RotateCcw, Trash2, UserRound, X } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { ROOM_STATUS, type LeaderIndividual, type LeaderRoom, type RoomStatus } from "@/lib/leaderApi";
import { ActionsMenu, ConfirmDialog } from "./ui";

/**
 * One room of a round. Collapsed it shows a summary; click to open it and
 * see / place its debaters and its single judge (picked from the registries).
 */
export default function RoomCard({ room, state, scores, people, judges, sheets, onChange, onRemove, onToggleLock, onCopyLink, onDeleteSheet }: {
  room: LeaderRoom;
  state: RoomStatus;
  /** Submitted scores (by individual id) once judging is complete. */
  scores?: Record<string, number>;
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
  const [open, setOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [reopen, setReopen] = useState<string | null>(null);
  const freePeople = people.filter((p) => !room.individuals.some((x) => x.id === p.id));
  const done = sheets.length > 0;
  const status = {
    l: ROOM_STATUS[state] + (room.locked && !done ? " · 🔒" : ""),
    c: state === "done" ? BRAND.success : state === "progress" ? BRAND.warning : BRAND.blue,
  };

  return (
    <div className="rounded-2xl bg-white border shadow-sm" style={{ borderColor: open ? `${BRAND.purple}55` : BRAND.border }}>
      <div onClick={() => !renaming && setOpen((o) => !o)} className="flex cursor-pointer items-center gap-3 px-4 py-3">
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} style={{ color: BRAND.purple }} />
        <div className="min-w-0 flex-1">
          {renaming ? (
            <input autoFocus value={room.label} onClick={(e) => e.stopPropagation()}
              onChange={(e) => onChange((r) => { r.label = e.target.value; })}
              onBlur={() => setRenaming(false)} onKeyDown={(e) => { if (e.key === "Enter") setRenaming(false); }}
              className="w-full rounded-lg border px-2 py-1 font-bold outline-none" style={{ borderColor: BRAND.border, color: BRAND.ink }} />
          ) : (
            <div className="font-bold text-[15px]" style={{ color: BRAND.ink }}>{room.label}</div>
          )}
          <div className="mt-0.5 flex flex-wrap gap-x-3 text-[12px]" style={{ color: `${BRAND.ink}80` }}>
            <span>👤 {room.individuals.length} متناظر</span>
            <span>⚖️ {room.judges[0] ?? "بدون محكم"}</span>
          </div>
        </div>
        <span className="rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ background: `${status.c}18`, color: status.c }}>{status.l}</span>
        <ActionsMenu actions={[
          { label: "إعادة تسمية القاعة", icon: <Pencil className="w-4 h-4" />, onClick: () => setRenaming(true) },
          { label: "نسخ رابط تحكيم القاعة", icon: <Link2 className="w-4 h-4" />, onClick: onCopyLink },
          room.locked
            ? { label: "فتح رابط التحكيم", icon: <LockOpen className="w-4 h-4" />, onClick: onToggleLock }
            : { label: "إغلاق رابط التحكيم", icon: <Lock className="w-4 h-4" />, onClick: onToggleLock },
          {
            label: "حذف القاعة", icon: <Trash2 className="w-4 h-4" />, onClick: onRemove,
            danger: { title: "حذف القاعة", description: `سيتم حذف «${room.label}» وتوزيعها من هذه الجولة.` },
          },
        ]} />
      </div>

      {open && (
        <div className="space-y-4 border-t px-4 py-4" style={{ borderColor: BRAND.border }}>
          <Section icon={<UserRound className="w-3.5 h-3.5" />} title={`المتناظرون في القاعة (${room.individuals.length})`}>
            {room.individuals.length === 0 && <Empty>لم يوزَّع أحد على هذه القاعة بعد</Empty>}
            {room.individuals.map((ind, i) => (
              <Row key={ind.id} n={i + 1} name={ind.name} score={scores?.[ind.id]} onRemove={() => onChange((r) => { r.individuals.splice(i, 1); })} />
            ))}
            <Picker placeholder={people.length ? "+ إضافة متناظر من القائمة" : "سجّل المتناظرين أولاً من قسم «المتناظرون»"}
              options={freePeople.map((p) => [p.id, p.name])}
              onPick={(pid) => { const p = freePeople.find((x) => x.id === pid); if (p) onChange((r) => { r.individuals.push({ ...p }); }); }} />
          </Section>

          <Section icon={<Gavel className="w-3.5 h-3.5" />} title="محكم القاعة">
            {room.judges.map((j, i) => (
              <Row key={j} name={j} onRemove={() => onChange((r) => { r.judges.splice(i, 1); })} />
            ))}
            {room.judges.length === 0 && (
              <Picker placeholder={judges.length ? "اختر المحكم من القائمة" : "سجّل المحكمين أولاً من قسم «المحكمون»"}
                options={judges.map((j) => [j, j])}
                onPick={(j) => onChange((r) => { r.judges.push(j); })} />
            )}
          </Section>

          {done && sheets.map(([key, s]) => (
            <div key={key} className="flex items-center gap-2 rounded-xl p-2.5 text-[12.5px]" style={{ background: `${BRAND.success}10`, color: BRAND.ink }}>
              <CheckCircle2 className="w-4 h-4" style={{ color: BRAND.success }} />
              <span className="flex-1">أرسل {s.judgeName} الدرجات</span>
              <button onClick={() => setReopen(key)} className="inline-flex items-center gap-1 text-[12px] font-bold" style={{ color: BRAND.purple }}>
                <RotateCcw className="w-3.5 h-3.5" /> إعادة فتح
              </button>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog open={!!reopen} title="إعادة فتح القاعة"
        description="ستُحذف درجات المحكم المرسلة ليعيد إدخالها من جديد."
        onCancel={() => setReopen(null)} onConfirm={() => { if (reopen) onDeleteSheet(reopen); setReopen(null); }} />
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

const Empty = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[12px]" style={{ color: `${BRAND.ink}66` }}>{children}</p>
);

function Row({ n, name, score, onRemove }: { n?: number; name: string; score?: number; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13.5px]" style={{ background: BRAND.surface, color: BRAND.ink }}>
      {n && <span className="text-[11px] font-bold" style={{ color: `${BRAND.ink}66` }}>{n}</span>}
      <span className="flex-1 font-medium">{name}</span>
      {score !== undefined && <b className="rounded-md bg-white px-2 text-[13px]" style={{ color: BRAND.purple }}>{score}</b>}
      <button onClick={onRemove} title="إزالة من القاعة" style={{ color: `${BRAND.ink}66` }}><X className="w-3.5 h-3.5" /></button>
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
