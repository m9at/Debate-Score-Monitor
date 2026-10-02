import { useEffect, useState } from "react";
import { Copy, ExternalLink, Gavel } from "lucide-react";
import { BRAND, BRAND_GRADIENT } from "@/lib/brand";
import { periodLabel, roomStatus, ROOM_STATUS, type LeaderTournament } from "@/lib/leaderApi";

export const judgeUrl = (id: string, query: string) =>
  `${window.location.origin}${import.meta.env.BASE_URL.replace(/\/$/, "")}/leader/judge/${id}${query}`;

/** Judge link hub: pick a round, then copy or open that round's link. */
export default function JudgeLinkCard({ t, day, onCopy, onPick }: {
  t: LeaderTournament; day: number; onCopy: (day: number) => void; onPick?: (day: number) => void;
}) {
  const { id, info: { days } } = t;
  const [pick, setPick] = useState(day);
  useEffect(() => setPick(day), [day]);
  const current = days.find((d) => d.day === pick) ?? days[0];
  if (!current) return null;
  const missing = current.rooms.filter((r) => !t.results[r.id]).length;
  const url = judgeUrl(id, `?day=${current.day}`);
  return (
    <div className="overflow-hidden rounded-2xl border bg-white shadow-sm" style={{ borderColor: BRAND.border }}>
      <div className="flex items-center gap-3 px-4 py-3 text-white" style={{ background: BRAND_GRADIENT }}>
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/20"><Gavel className="h-5 w-5" /></div>
        <div className="flex-1">
          <div className="text-[15px] font-extrabold">روابط التحكيم</div>
          <div className="text-[12px] opacity-90">اختر الجولة ثم انسخ رابطها وأرسله للمحكمين</div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 p-4">
        <select value={current.day} onChange={(e) => { setPick(+e.target.value); onPick?.(+e.target.value); }}
          className="h-10 min-w-[220px] rounded-xl border bg-white px-3 text-[13.5px] font-bold outline-none"
          style={{ borderColor: `${BRAND.purple}40`, color: BRAND.ink }}>
          {days.map((d) => (
            <option key={d.day} value={d.day}>الجولة {d.day} — {periodLabel(d.period)}{d.title ? ` · ${d.title}` : ""}</option>
          ))}
        </select>
        <div className="min-w-0 flex-1 truncate rounded-xl px-3 py-2 font-mono text-[12px]" dir="ltr"
          style={{ background: BRAND.surface, color: `${BRAND.ink}99` }}>{url}</div>
        <button onClick={() => onCopy(current.day)} className="inline-flex h-10 items-center gap-1.5 rounded-xl px-4 text-[13px] font-bold text-white"
          style={{ background: BRAND_GRADIENT }}>
          <Copy className="h-4 w-4" /> نسخ الرابط
        </button>
        <a href={url} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-1.5 rounded-xl border px-4 text-[13px] font-bold"
          style={{ borderColor: `${BRAND.purple}40`, color: BRAND.purple }}>
          <ExternalLink className="h-4 w-4" /> فتح
        </a>
      </div>
      {/* The chosen round's own rooms and their status. */}
      <div className="border-t px-4 pb-4 pt-3" style={{ borderColor: BRAND.border }}>
        <div className="mb-3 text-[16px] font-extrabold" style={{ color: BRAND.ink }}>
          قاعات الجولة {current.day} · {missing ? `${missing} من ${current.rooms.length} لم تُدخل درجاتها بعد` : "كل القاعات أرسلت ✓"}
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {current.rooms.map((r) => {
            const st = roomStatus(t, r.id);
            const sent = t.results[r.id];
            return (
              <div key={r.id} className="flex flex-col items-center rounded-2xl border bg-white p-4 shadow-sm" style={{ borderColor: `${BRAND.purple}1f` }}>
                <ProgressRing value={roomProgress(t, r.id, r.individuals.length)} label={r.label} gradId={`ring-${r.id}`} />
                <div className="mt-3 w-full max-w-[150px] rounded-full py-1 text-center text-[12.5px] font-bold" style={{
                  background: st === "progress" ? `${BRAND.blue}1a` : `${BRAND.purple}14`,
                  color: st === "done" ? BRAND.purple : st === "progress" ? BRAND.blueDeep : `${BRAND.ink}80`,
                }}>{ROOM_STATUS[st]}</div>
                {sent && <div className="mt-1.5 truncate text-[12px]" style={{ color: `${BRAND.ink}b3` }}>المحكم: {sent.judgeName}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** 0–1 share of a room's individuals scored: full when sent, partial from the live draft. */
function roomProgress(t: LeaderTournament, roomId: string, total: number) {
  if (t.results[roomId]) return 1;
  const draft = t.drafts?.[roomId];
  if (!draft || !total) return 0;
  return Math.min(1, Math.max(0.08, Object.keys(draft.scores ?? {}).length / total));
}

/** Gradient ring (purple → blue) with the room name in the centre. */
function ProgressRing({ value, label, gradId }: { value: number; label: string; gradId: string }) {
  const r = 44, c = 2 * Math.PI * r;
  return (
    <div className="relative h-[110px] w-[110px]">
      <svg viewBox="0 0 110 110" className="h-full w-full -rotate-90">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={BRAND.purple} /><stop offset="100%" stopColor={BRAND.blue} />
          </linearGradient>
        </defs>
        <circle cx="55" cy="55" r={r} fill="none" strokeWidth="10" stroke={value ? "#ECE8F7" : "#E4E2E8"} />
        {value > 0 && <circle cx="55" cy="55" r={r} fill="none" strokeWidth="10" strokeLinecap="round"
          stroke={`url(#${gradId})`} strokeDasharray={c} strokeDashoffset={c * (1 - value)} />}
      </svg>
      <div className="absolute inset-0 grid place-items-center px-3 text-center text-[16px] font-extrabold leading-tight" style={{ color: BRAND.ink }}>{label}</div>
    </div>
  );
}
