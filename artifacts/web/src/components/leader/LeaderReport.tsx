import { useMemo } from "react";
import { roomRows, totalRows, type LeaderTournament } from "@/lib/leaderApi";

const PURPLE = "#7B2D8E";
const CYAN = "#29ABE2";
const avg = (a: number[]) => (a.length ? Math.round((a.reduce((x, y) => x + y, 0) / a.length) * 100) / 100 : 0);

/** Expanded report: overview, per-round summary, room status and full individual sheet. */
export default function LeaderReport({ t }: { t: LeaderTournament }) {
  const rows = useMemo(() => roomRows(t), [t]);
  const totals = useMemo(() => totalRows(t), [t]);
  const days = t.info.days;
  const allRooms = days.flatMap((d) => d.rooms.map((r) => ({ day: d.day, room: r })));
  const scores = rows.map((r) => r.score);
  const received = allRooms.filter((x) => t.results[x.room.id]).length;
  const people = allRooms.reduce((s, x) => s + x.room.individuals.length, 0);

  const cards: [string, string | number][] = [
    ["الجولات", days.length],
    ["القاعات", allRooms.length],
    ["الأفراد", people],
    ["أوراق مستلمة", `${received}/${allRooms.length}`],
    ["المتوسط العام", scores.length ? avg(scores) : "—"],
    ["أعلى درجة", scores.length ? Math.max(...scores) : "—"],
    ["أدنى درجة", scores.length ? Math.min(...scores) : "—"],
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cards.map(([l, v]) => (
          <div key={l} className="rounded-xl bg-white p-3 text-center shadow-sm" style={{ borderTop: `3px solid ${CYAN}` }}>
            <div className="text-xs text-gray-500">{l}</div>
            <div className="text-xl font-extrabold" style={{ color: PURPLE }}>{v}</div>
          </div>
        ))}
      </div>

      <H>ملخص الجولات</H>
      <Tbl head={["الجولة", "القاعات", "الأفراد", "المستلم", "المتوسط", "الأعلى", "الأدنى"]}
        rows={days.map((d) => {
          const s = rows.filter((r) => r.day === d.day).map((r) => r.score);
          return [d.day, d.rooms.length, d.rooms.reduce((n, r) => n + r.individuals.length, 0),
            `${d.rooms.filter((r) => t.results[r.id]).length}/${d.rooms.length}`,
            s.length ? avg(s) : "—", s.length ? Math.max(...s) : "—", s.length ? Math.min(...s) : "—"];
        })} />

      <H>حالة القاعات والمحكمين</H>
      <Tbl head={["الجولة", "القاعة", "المحكم", "الأفراد", "الحالة", "المتوسط"]}
        rows={allRooms.map(({ day, room }) => {
          const sh = t.results[room.id];
          const s = sh ? Object.values(sh.scores) : [];
          return [day, room.label, sh?.judgeName || room.judges.join("، ") || "—", room.individuals.length,
            sh ? "✅ مرسلة" : room.locked ? "🔒 مغلقة" : "⏳ بانتظار الدرجات", s.length ? avg(s) : "—"];
        })} />

      <H>الكشف التفصيلي للأفراد</H>
      <Tbl head={["#", "الاسم", ...days.map((d) => `الجولة ${d.day}`), "المجموع", "المتوسط", "الأعلى", "الأدنى"]}
        rows={totals.map((r, i) => {
          const mine = rows.filter((x) => x.name === r.name).map((x) => x.score);
          return [i + 1, r.name, ...days.map((d) => r.perDay?.[d.day] ?? "—"), <b key="s">{r.score}</b>,
            avg(mine), Math.max(...mine), Math.min(...mine)];
        })} />

      <H>تقرير المحكمين</H>
      <Tbl head={["المحكم", "القاعات المسندة", "الأوراق المرسلة", "الجولات", "متوسط ما منحه", "الأعلى", "الأدنى"]}
        rows={(t.info.judgePool ?? []).map((j) => {
          const mine = allRooms.filter((x) => x.room.judges.includes(j));
          const given = rows.filter((r) => r.judge === j).map((r) => r.score);
          return [j, mine.length, mine.filter((x) => t.results[x.room.id]).length,
            [...new Set(mine.map((x) => x.day))].join("، ") || "—",
            given.length ? avg(given) : "—", given.length ? Math.max(...given) : "—", given.length ? Math.min(...given) : "—"];
        })} />

      <H>توزيع المتناظرين على الجولات</H>
      <Tbl head={["المتناظر", ...days.map((d) => `الجولة ${d.day}`), "عدد المشاركات"]}
        rows={(t.info.individualPool ?? []).map((p) => {
          const at = days.map((d) => d.rooms.find((r) => r.individuals.some((x) => x.id === p.id)));
          return [p.name, ...at.map((r) => r ? `${r.label} · ${r.judges[0] ?? "بلا محكم"}` : "—"), at.filter(Boolean).length];
        })} />

      <button onClick={() => window.print()} className="rounded-lg border px-3 py-1.5 text-sm font-bold print:hidden">🖨️ طباعة التقرير</button>
    </div>
  );
}

const H = ({ children }: { children: React.ReactNode }) => (
  <h3 className="font-bold" style={{ color: PURPLE }}>{children}</h3>
);

function Tbl({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  if (!rows.length) return <p className="rounded-xl bg-white p-4 text-center text-sm text-gray-400">لا توجد بيانات بعد</p>;
  return (
    <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead style={{ background: PURPLE, color: "#fff" }}>
          <tr>{head.map((h, i) => <th key={i} className="whitespace-nowrap px-3 py-2 text-right">{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => <tr key={i} className="border-t">{r.map((c, j) => <td key={j} className="whitespace-nowrap px-3 py-2">{c}</td>)}</tr>)}
        </tbody>
      </table>
    </div>
  );
}
