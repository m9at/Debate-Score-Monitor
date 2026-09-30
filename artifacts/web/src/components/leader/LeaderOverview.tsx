import { Link2 } from "lucide-react";
import { BRAND, BTN } from "@/lib/brand";
import { dayRange, type LeaderTournament } from "@/lib/leaderApi";

/** Dashboard: stats + each round's status with its own judge link. */
export default function LeaderOverview({ t, copyLink }: { t: LeaderTournament; copyLink: (q: string) => void }) {
  const { info } = t;
  const rooms = info.days.flatMap((d) => d.rooms);
  const sent = rooms.filter((r) => t.results[r.id]).length;
  const people = info.individualPool?.length ?? 0;
  const judges = info.judgePool?.length ?? 0;
  const cards: [string, string | number][] = [
    ["الجولات", info.days.length], ["القاعات", rooms.length], ["المتناظرون", people],
    ["المحكمون", judges], ["أوراق مستلمة", `${sent}/${rooms.length}`],
  ];
  const details = [["الجهة المنظمة", info.organizer], ["المكان", info.venue], ["التاريخ", info.startDate]].filter(([, v]) => v);

  return (
    <div className="space-y-5">
      {(details.length > 0 || info.description) && (
        <div className="rounded-2xl border bg-white p-4" style={{ borderColor: BRAND.border }}>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-[13px]">
            {details.map(([l, v]) => <span key={l}><b style={{ color: BRAND.purple }}>{l}:</b> {v}</span>)}
          </div>
          {info.description && <p className="mt-2 text-[13px]" style={{ color: `${BRAND.ink}b3` }}>{info.description}</p>}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {cards.map(([l, v]) => (
          <div key={l} className="rounded-xl bg-white p-3 text-center shadow-sm" style={{ borderTop: `3px solid ${BRAND.blue}` }}>
            <div className="text-xs text-gray-500">{l}</div>
            <div className="text-xl font-extrabold" style={{ color: BRAND.purple }}>{v}</div>
          </div>
        ))}
      </div>

      <h3 className="font-bold" style={{ color: BRAND.purple }}>الجولات وروابط التحكيم</h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {info.days.map((d) => {
          const got = d.rooms.filter((r) => t.results[r.id]).length;
          const noJudge = d.rooms.filter((r) => !r.judges.length).length;
          const pct = d.rooms.length ? Math.round((got / d.rooms.length) * 100) : 0;
          const r = dayRange(info, d);
          return (
            <div key={d.day} className="rounded-2xl border bg-white p-4 shadow-sm" style={{ borderColor: BRAND.border }}>
              <div className="text-[12px] font-bold" style={{ color: BRAND.purple }}>الجولة {d.day}</div>
              <div className="font-bold" style={{ color: BRAND.ink }}>{d.title || "بدون عنوان"}</div>
              <div className="mt-1 text-[12px]" style={{ color: `${BRAND.ink}80` }}>
                {d.rooms.length} قاعات · {d.rooms.reduce((n, x) => n + x.individuals.length, 0)} فرد · الدرجات {r.min}–{r.max}
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full" style={{ background: BRAND.border }}>
                <div className="h-full" style={{ width: `${pct}%`, background: BRAND.blue }} />
              </div>
              <div className="mt-1 flex justify-between text-[11.5px]" style={{ color: `${BRAND.ink}99` }}>
                <span>مستلم {got}/{d.rooms.length}</span>
                {noJudge > 0 && <span style={{ color: BRAND.warning }}>{noJudge} قاعة بلا محكم</span>}
              </div>
              <button onClick={() => copyLink(`?day=${d.day}`)} className={`${BTN.base} ${BTN.secondary} mt-3 w-full`}>
                <Link2 className="w-4 h-4" /> نسخ رابط تحكيم الجولة {d.day}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
