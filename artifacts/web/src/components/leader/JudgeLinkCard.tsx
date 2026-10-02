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
        <div className="mb-2 text-[12.5px] font-bold" style={{ color: `${BRAND.ink}b3` }}>
          قاعات الجولة {current.day} · {missing ? `${missing} من ${current.rooms.length} لم تُدخل درجاتها بعد` : "كل القاعات أرسلت ✓"}
        </div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {current.rooms.map((r) => {
            const st = roomStatus(t, r.id);
            const sent = t.results[r.id];
            return (
              <div key={r.id} className="rounded-xl border px-3 py-2" style={{
                borderColor: st === "done" ? BRAND.purple : BRAND.border,
                background: st === "done" ? `${BRAND.purple}0f` : st === "progress" ? `${BRAND.blue}12` : "#fff",
              }}>
                <div className="text-[13px] font-extrabold" style={{ color: BRAND.ink }}>{r.label}</div>
                <div className="text-[11.5px]" style={{ color: st === "done" ? BRAND.purple : `${BRAND.ink}8c` }}>
                  {ROOM_STATUS[st]}{sent ? ` · ${sent.judgeName}` : ""}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
