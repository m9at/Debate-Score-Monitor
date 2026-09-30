import { Activity, CheckCircle2, Circle, CircleDot, Clock, Gavel, LayoutGrid, Layers, ListChecks, Lock, Percent, Sigma, Users } from "lucide-react";
import { BRAND, BRAND_GRADIENT } from "@/lib/brand";
import { periodLabel, roomPanel, ROUND_STATUS, roundStatus, timeAgo, type LeaderTournament } from "@/lib/leaderApi";
import JudgeLinkCard from "./JudgeLinkCard";

/** Leadership dashboard: status header, stats, round timeline and live activity. */
export default function LeaderOverview({ t, copyLink }: { t: LeaderTournament; copyLink: (q: string) => void }) {
  const { info } = t;
  const rooms = info.days.flatMap((d) => d.rooms.map((r) => ({ d, r })));
  const sheets = Object.values(t.results);
  const doneRooms = rooms.filter((x) => t.results[x.r.id]).length;
  const statuses = info.days.map((d) => roundStatus(t, d));
  const doneRounds = statuses.filter((s) => s === "done" || s === "closed").length;
  const scoresEntered = sheets.reduce((n, s) => n + Object.keys(s.scores).length, 0)
    + Object.values(t.drafts ?? {}).reduce((n, s) => n + Object.keys(s.scores).length, 0);
  const judges = new Set([...(info.judgePool ?? []), ...rooms.flatMap((x) => roomPanel(x.r))]);
  const current = info.days[statuses.findIndex((s) => s !== "done" && s !== "closed")] ?? info.days.at(-1);
  const tourStatus = doneRounds === info.days.length && info.days.length ? "مكتملة" : sheets.length || t.drafts && Object.keys(t.drafts).length ? "قيد التنفيذ" : "لم تبدأ";

  const events = [
    ...(info.activity ?? []),
    ...rooms.flatMap(({ d, r }) => {
      const s = t.results[r.id];
      return s ? [{ at: s.submittedAt, text: `تم إكمال تحكيم ${r.label} — الجولة ${d.day} (أرسلها ${s.judgeName})`, done: true }] : [];
    }),
    ...rooms.flatMap(({ d, r }) => {
      const s = t.drafts?.[r.id];
      return s ? [{ at: s.updatedAt, text: `بدأ ${s.judgeName || "المحكم"} تحكيم ${r.label} — الجولة ${d.day}` }] : [];
    }),
  ].sort((a, b) => b.at - a.at);
  const lastUpdate = events[0]?.at;

  const stats: [React.ReactNode, string, string | number][] = [
    [<Users key="1" />, "إجمالي الفرق", info.individualPool?.length ?? 0],
    [<Layers key="2" />, "إجمالي الجولات", info.days.length],
    [<LayoutGrid key="3" />, "إجمالي القاعات", rooms.length],
    [<Gavel key="4" />, "إجمالي المحكمين", judges.size],
    [<ListChecks key="5" />, "الجولات المكتملة", `${doneRounds}/${info.days.length}`],
    [<CheckCircle2 key="6" />, "القاعات المكتملة", `${doneRooms}/${rooms.length}`],
    [<Percent key="7" />, "نسبة التحكيم المكتمل", `${rooms.length ? Math.round((doneRooms / rooms.length) * 100) : 0}%`],
    [<Sigma key="8" />, "إجمالي الدرجات المدخلة", scoresEntered],
  ];

  return (
    <div className="space-y-6">
      {/* Status header */}
      <div className="overflow-hidden rounded-3xl p-5 text-white shadow-sm md:p-6" style={{ backgroundImage: BRAND_GRADIENT }}>
        <div className="text-[12px] font-bold opacity-80">نظرة عامة على البطولة</div>
        <div className="text-[22px] font-extrabold">{info.name}</div>
        {info.description && <p className="mt-1 max-w-3xl text-[13px] opacity-90">{info.description}</p>}
        <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
          {[
            ["حالة البطولة", tourStatus],
            ["الفترة الحالية", current ? periodLabel(current.period) : "—"],
            ["الجولة الحالية", current ? `الجولة ${current.day}` : "—"],
            ["آخر تحديث", lastUpdate ? timeAgo(lastUpdate) : "—"],
          ].map(([l, v]) => (
            <div key={l} className="rounded-2xl bg-white/15 px-3 py-2 backdrop-blur">
              <div className="text-[11px] opacity-80">{l}</div>
              <div className="text-[15px] font-extrabold">{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map(([icon, l, v]) => (
          <div key={l} className="flex items-center gap-3 rounded-2xl border bg-white p-3.5 shadow-sm" style={{ borderColor: BRAND.border }}>
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl [&_svg]:h-5 [&_svg]:w-5" style={{ background: `${BRAND.purple}12`, color: BRAND.purple }}>{icon}</div>
            <div className="min-w-0">
              <div className="truncate text-[11.5px]" style={{ color: `${BRAND.ink}80` }}>{l}</div>
              <div className="text-[20px] font-extrabold leading-tight" style={{ color: BRAND.ink }}>{v}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Timeline */}
        <div className="rounded-2xl border bg-white p-4 shadow-sm lg:col-span-3" style={{ borderColor: BRAND.border }}>
          <h3 className="mb-3 font-extrabold" style={{ color: BRAND.ink }}>تقدم البطولة</h3>
          <ol className="relative space-y-4 pr-6">
            <span className="absolute inset-y-1 right-[9px] w-0.5" style={{ background: BRAND.border }} />
            {info.days.map((d, i) => {
              const s = statuses[i];
              const st = ROUND_STATUS[s];
              const got = d.rooms.filter((r) => t.results[r.id]).length;
              const Icon = s === "done" ? CheckCircle2 : s === "closed" ? Lock : s === "progress" ? CircleDot : Circle;
              return (
                <li key={d.day} className="relative">
                  <Icon className="absolute -right-6 top-0.5 h-5 w-5 rounded-full bg-white" style={{ color: st.color }} />
                  <div className="flex items-center gap-2 [&>*]:whitespace-nowrap">
                    <b style={{ color: BRAND.ink }}>الجولة {d.day}</b>
                    <span className="text-[11px]" style={{ color: `${BRAND.ink}70` }}>{periodLabel(d.period)}</span>
                    <span className="rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ background: `${st.color}1a`, color: st.color }}>{st.label}</span>
                    <button onClick={() => copyLink(`?day=${d.day}`)} className="mr-auto text-[11.5px] font-bold" style={{ color: BRAND.blueDeep }}>نسخ رابط التحكيم</button>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full" style={{ background: BRAND.border }}>
                    <div className="h-full" style={{ width: `${d.rooms.length ? (got / d.rooms.length) * 100 : 0}%`, background: st.color }} />
                  </div>
                  <div className="mt-0.5 text-[11px]" style={{ color: `${BRAND.ink}70` }}>{got}/{d.rooms.length} قاعات مكتملة</div>
                </li>
              );
            })}
          </ol>
        </div>

        {/* Activity */}
        <div className="rounded-2xl border bg-white p-4 shadow-sm lg:col-span-2" style={{ borderColor: BRAND.border }}>
          <h3 className="mb-3 flex items-center gap-2 font-extrabold" style={{ color: BRAND.ink }}>
            <Activity className="h-4 w-4" style={{ color: BRAND.purple }} /> النشاط الأخير
            <span className="h-2 w-2 animate-pulse rounded-full" style={{ background: BRAND.purple }} />
          </h3>
          {events.length === 0 && <p className="text-[12.5px]" style={{ color: `${BRAND.ink}66` }}>لا يوجد نشاط بعد</p>}
          <ul className="max-h-[340px] space-y-2.5 overflow-y-auto">
            {events.slice(0, 20).map((e, i) => (
              <li key={i} className="flex gap-2 text-[12.5px]">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: "done" in e ? BRAND.purple : BRAND.blue }} />
                <div className="min-w-0">
                  <div style={{ color: BRAND.ink }}>{e.text}</div>
                  <div className="flex items-center gap-1 text-[11px]" style={{ color: `${BRAND.ink}66` }}><Clock className="h-3 w-3" />{timeAgo(e.at)}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {current && <JudgeLinkCard id={t.id} days={t.info.days} day={current.day} onCopy={(n) => copyLink(`?day=${n}`)} />}
    </div>
  );
}
