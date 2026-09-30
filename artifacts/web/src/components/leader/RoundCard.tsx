import { CalendarClock, ChevronLeft, Gavel, LayoutGrid, Swords, Users } from "lucide-react";
import { BRAND, BRAND_GRADIENT } from "@/lib/brand";
import { ROUND_STATUS, roomPanel, roundStatus, type LeaderDay, type LeaderTournament } from "@/lib/leaderApi";

/** Modern round card — colour follows the round's status. */
export default function RoundCard({ t, d, active, onManage, menu }: {
  t: LeaderTournament; d: LeaderDay; active: boolean; onManage: () => void; menu: React.ReactNode;
}) {
  const st = ROUND_STATUS[roundStatus(t, d)];
  const done = d.rooms.filter((r) => t.results[r.id]).length;
  const pct = d.rooms.length ? Math.round((done / d.rooms.length) * 100) : 0;
  const stats: [React.ReactNode, string, number][] = [
    [<Users key="u" className="h-3.5 w-3.5" />, "الفرق", d.rooms.reduce((n, r) => n + r.individuals.length, 0)],
    [<LayoutGrid key="l" className="h-3.5 w-3.5" />, "القاعات", d.rooms.length],
    [<Gavel key="g" className="h-3.5 w-3.5" />, "المحكمون", d.rooms.reduce((n, r) => n + roomPanel(r).length, 0)],
  ];
  return (
    <div className="group relative overflow-hidden rounded-3xl border bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
      style={{ borderColor: active ? st.color : BRAND.border, boxShadow: active ? `0 0 0 3px ${st.color}26` : undefined }}>
      <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: BRAND_GRADIENT }} />
      <div className="p-5">
        <div className="flex items-start gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-white shadow-md" style={{ background: BRAND_GRADIENT }}>
            <Swords className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[20px] font-extrabold leading-tight" style={{ color: BRAND.ink }}>الجولة {d.day}</div>
            <div className="truncate text-[12.5px] font-bold" style={{ color: BRAND.purple }}>{d.title || "البطولة القيادية"}</div>
          </div>
          <span className="shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ background: `${st.color}1a`, color: st.color }}>● {st.label}</span>
          {menu}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {stats.map(([icon, l, v]) => (
            <div key={l} className="rounded-xl px-2 py-2 text-center" style={{ background: BRAND.surface }}>
              <div className="flex items-center justify-center gap-1 text-[11px]" style={{ color: `${BRAND.ink}80` }}>{icon}{l}</div>
              <div className="text-[17px] font-extrabold" style={{ color: BRAND.ink }}>{v}</div>
            </div>
          ))}
        </div>

        <div className="mt-3">
          <div className="mb-1 flex justify-between text-[11.5px] font-bold" style={{ color: `${BRAND.ink}99` }}>
            <span className="whitespace-nowrap">التحكيم: {done}/{d.rooms.length} قاعات مكتملة</span><span>{pct}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full" style={{ background: BRAND.border }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: st.color }} />
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <span className="flex flex-1 items-center gap-1 text-[11px]" style={{ color: `${BRAND.ink}70` }}>
            <CalendarClock className="h-3.5 w-3.5" />
            {d.createdAt ? new Date(d.createdAt).toLocaleString("ar", { dateStyle: "medium", timeStyle: "short" }) : "—"}
          </span>
          <button onClick={onManage} className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-lg px-3 py-1.5 text-[12.5px] font-bold text-white"
            style={{ background: active ? st.color : BRAND.purple }}>
            إدارة الجولة <ChevronLeft className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
