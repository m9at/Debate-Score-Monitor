import { useState } from "react";
import { CheckCircle2, Crown, DoorOpen, FileDown, Gavel, Link2, Lock, LockOpen, Pencil, RotateCcw, Trash2, UserRound, X } from "lucide-react";
import { BRAND, BRAND_GRADIENT } from "@/lib/brand";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ROOM_STATUS, type LeaderIndividual, type LeaderRoom, type LeaderSheet, type LeaderTournament, type RoomStatus } from "@/lib/leaderApi";
import { ActionsMenu, ConfirmDialog } from "./ui";

/** Brand-only status colors: waiting (muted ink), in progress (cyan), done (purple). */
const STATE_COLOR: Record<RoomStatus, string> = { pending: `${BRAND.ink}66`, progress: BRAND.blue, done: BRAND.purple };

/**
 * One room of a round: summary card (chair, panel, debaters, status, scores
 * progress) that opens into the full details and assignment controls.
 */
export default function RoomCard({ room, day, state, sheet, draft, people, judges, onChange, onRemove, onToggleLock, onCopyLink, onDeleteSheet, onPdf }: {
  room: LeaderRoom;
  day: number;
  state: RoomStatus;
  sheet?: LeaderSheet;
  draft?: NonNullable<LeaderTournament["drafts"]>[string];
  /** Registered debaters not placed in another room of this round. */
  people: LeaderIndividual[];
  /** Registered judges not used in another room of this round. */
  judges: string[];
  onChange: (fn: (r: LeaderRoom) => void, activity?: string) => void;
  onRemove: () => void;
  onToggleLock: () => void;
  onCopyLink: () => void;
  onDeleteSheet: (key: string) => void;
  onPdf: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [reopen, setReopen] = useState(false);
  const freePeople = people.filter((p) => !room.individuals.some((x) => x.id === p.id));
  const freeJudges = judges.filter((j) => j !== room.chair && !room.judges.includes(j));
  const color = STATE_COLOR[state];
  const scored = sheet ? room.individuals.length : Object.keys(draft?.scores ?? {}).length;
  const where = `${room.label} — الجولة ${day}`;

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-shadow hover:shadow-md"
      style={{ borderColor: open ? `${color}88` : BRAND.border }}>
      <div className="h-1.5" style={{ background: state === "pending" ? BRAND.border : BRAND_GRADIENT }} />
      <div className="p-4">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            {renaming ? (
              <input autoFocus value={room.label} onChange={(e) => onChange((r) => { r.label = e.target.value; })}
                onBlur={() => setRenaming(false)} onKeyDown={(e) => { if (e.key === "Enter") setRenaming(false); }}
                className="w-full rounded-lg border px-2 py-1 font-bold outline-none" style={{ borderColor: BRAND.border, color: BRAND.ink }} />
            ) : (
              <div className="text-[17px] font-extrabold" style={{ color: BRAND.ink }}>{room.label}</div>
            )}
            <div className="text-[11.5px] font-bold" style={{ color: BRAND.purple }}>الجولة {day}</div>
          </div>
          <span className="shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ background: `${color}1a`, color }}>
            {ROOM_STATUS[state]}{room.locked && !sheet ? " · 🔒" : ""}
          </span>
          <ActionsMenu actions={[
            { label: "إعادة تسمية القاعة", icon: <Pencil className="w-4 h-4" />, onClick: () => setRenaming(true) },
            { label: "نسخ رابط تحكيم القاعة", icon: <Link2 className="w-4 h-4" />, onClick: onCopyLink },
            { label: "PDF هذه القاعة", icon: <FileDown className="w-4 h-4" />, onClick: onPdf },
            room.locked
              ? { label: "فتح رابط التحكيم", icon: <LockOpen className="w-4 h-4" />, onClick: onToggleLock }
              : { label: "إغلاق رابط التحكيم", icon: <Lock className="w-4 h-4" />, onClick: onToggleLock },
            { label: "حذف القاعة", icon: <Trash2 className="w-4 h-4" />, onClick: onRemove,
              danger: { title: "حذف القاعة", description: `سيتم حذف «${room.label}» وتوزيعها من هذه الجولة.` } },
          ]} />
        </div>

        <div className="mt-3 space-y-1.5 text-[12.5px]" style={{ color: BRAND.ink }}>
          <Line icon={<Crown className="h-3.5 w-3.5" />} label="رئيس الجلسة" value={room.chair || "—"} />
          <Line icon={<Gavel className="h-3.5 w-3.5" />} label="المحكمون" value={`${room.judges.length} محكمين`} />
          <Line icon={<UserRound className="h-3.5 w-3.5" />} label="الأفرقاء" value={room.individuals.length} />
          <Line icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="الدرجات" value={`${scored} / ${room.individuals.length} مكتملة`} />
        </div>

        {sheet && (
          <div className="mt-3 flex items-center gap-2 rounded-xl px-3 py-2 text-[12px] font-bold" style={{ background: `${BRAND.purple}12`, color: BRAND.purple }}>
            <CheckCircle2 className="h-4 w-4" />
            <span className="flex-1">تم الإرسال بواسطة {sheet.judgeName} · {new Date(sheet.submittedAt).toLocaleTimeString("ar", { timeStyle: "short" })}</span>
          </div>
        )}

        <button onClick={() => setOpen(true)} className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-[13px] font-bold text-white"
          style={{ background: BRAND_GRADIENT }}>
          <DoorOpen className="h-4 w-4" /> فتح القاعة والتوزيع
        </button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent dir="rtl" className="max-h-[90vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-right">
              <span className="block text-[12px] font-bold" style={{ color: BRAND.blueDeep }}>الجولة {day}</span>
              <span className="text-[22px] font-extrabold" style={{ color: BRAND.ink }}>{room.label}</span>
            </DialogTitle>
          </DialogHeader>
        <div className="grid gap-4 md:grid-cols-3 [&>*]:rounded-2xl [&>*]:border [&>*]:bg-white [&>*]:p-4" style={{ borderColor: BRAND.border }}>
          <Section icon={<Crown className="w-3.5 h-3.5" />} title="رئيس الجلسة">
            {room.chair
              ? <Row name={room.chair} tag="رئيس جلسة" onRemove={() => onChange((r) => { r.chair = undefined; })} />
              : <Picker placeholder={freeJudges.length ? "اختر رئيس الجلسة" : "سجّل المحكمين أولاً"} options={freeJudges.map((j) => [j, j])}
                  onPick={(j) => onChange((r) => { r.chair = j; }, `تم تعيين ${j} رئيساً للجلسة — ${where}`)} />}
          </Section>

          <Section icon={<Gavel className="w-3.5 h-3.5" />} title={`المحكمون (${room.judges.length})`}>
            {room.judges.map((j, i) => (
              <Row key={j} name={j} tag="محكم" onRemove={() => onChange((r) => { r.judges.splice(i, 1); })} />
            ))}
            <Picker placeholder={freeJudges.length ? "+ إضافة محكم" : "لا يوجد محكمون متاحون"} options={freeJudges.map((j) => [j, j])}
              onPick={(j) => onChange((r) => { r.judges.push(j); }, `تم تعيين المحكم ${j} — ${where}`)} />
          </Section>

          <Section icon={<UserRound className="w-3.5 h-3.5" />} title={`الأفرقاء (${room.individuals.length})`}>
            {room.individuals.length === 0 && <p className="text-[12px]" style={{ color: `${BRAND.ink}66` }}>لم يوزَّع أحد على هذه القاعة بعد</p>}
            {room.individuals.map((ind, i) => (
              <Row key={ind.id} n={i + 1} name={ind.name} score={sheet?.scores[ind.id] ?? draft?.scores[ind.id]}
                onRemove={() => onChange((r) => { r.individuals.splice(i, 1); })} />
            ))}
            <Picker placeholder={people.length ? "+ إضافة مشارك من القائمة" : "سجّل المشاركين أولاً"}
              options={freePeople.map((p) => [p.id, p.name])}
              onPick={(pid) => { const p = freePeople.find((x) => x.id === pid); if (p) onChange((r) => { r.individuals.push({ ...p }); }); }} />
          </Section>

          {sheet && (
            <button onClick={() => setReopen(true)} className="inline-flex items-center gap-1 text-[12px] font-bold" style={{ color: BRAND.purple }}>
              <RotateCcw className="w-3.5 h-3.5" /> إعادة فتح التحكيم
            </button>
          )}
        </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={reopen} title="إعادة فتح القاعة"
        description="ستُحذف الدرجات المرسلة ليُعاد إدخالها من جديد."
        onCancel={() => setReopen(false)} onConfirm={() => { onDeleteSheet(room.id); setReopen(false); }} />
    </div>
  );
}

function Line({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5">
      <span style={{ color: BRAND.purple }}>{icon}</span>
      <span className="whitespace-nowrap" style={{ color: `${BRAND.ink}80` }}>{label}:</span>
      <b className="truncate">{value}</b>
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

function Row({ n, name, tag, score, onRemove }: { n?: number; name: string; tag?: string; score?: number; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-1.5 text-[13.5px]" style={{ color: BRAND.ink }}>
      {n && <span className="text-[11px] font-bold" style={{ color: `${BRAND.ink}66` }}>{n}</span>}
      <span className="flex-1 font-medium">{name}</span>
      {tag && <span className="rounded-full px-2 text-[10.5px] font-bold" style={{ background: `${BRAND.purple}14`, color: BRAND.purple }}>{tag}</span>}
      {score !== undefined && <b className="rounded-md px-2 text-[13px]" style={{ background: BRAND.surface, color: BRAND.purple }}>{score}</b>}
      <button onClick={onRemove} title="إزالة" style={{ color: `${BRAND.ink}66` }}><X className="w-3.5 h-3.5" /></button>
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
