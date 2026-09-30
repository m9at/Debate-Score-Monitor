import { useMemo, useState } from "react";
import ExcelJS from "exceljs";
import { ArrowDown, ArrowUp, Download, Minus } from "lucide-react";
import { BRAND, BRAND_GRADIENT } from "@/lib/brand";
import { roomRows, totalRows, type LeaderTournament, type RankRow } from "@/lib/leaderApi";

type View = "total" | "progress" | "judge" | "room";
const VIEWS: [View, string][] = [["total", "الترتيب العام"], ["progress", "الأداء جولة بجولة"], ["judge", "حسب المحكم"], ["room", "حسب القاعة"]];
const avg = (a: number[]) => (a.length ? Math.round((a.reduce((x, y) => x + y, 0) / a.length) * 100) / 100 : 0);

/** Detailed results: ranking with movement, per-round progress, judge breakdown and room sheets. */
export default function LeaderResults({ t }: { t: LeaderTournament }) {
  const [view, setView] = useState<View>("total");
  const rows = useMemo(() => roomRows(t), [t]);
  const totals = useMemo(() => totalRows(t), [t]);
  const days = t.info.days.map((d) => d.day);

  /** Rank of each name inside each round (1 = best). */
  const rankIn = useMemo(() => {
    const m: Record<number, Record<string, number>> = {};
    for (const d of days) {
      const sorted = totals.filter((r) => r.perDay?.[d] != null).sort((a, b) => b.perDay![d] - a.perDay![d]);
      m[d] = Object.fromEntries(sorted.map((r, i) => [r.name, i + 1]));
    }
    return m;
  }, [totals, days]);
  const played = (r: RankRow) => days.filter((d) => r.perDay?.[d] != null);

  const exportXlsx = async () => {
    const wb = new ExcelJS.Workbook();
    const total = wb.addWorksheet("المجموع", { views: [{ rightToLeft: true }] });
    total.addRow(["الترتيب", "الاسم", ...days.map((d) => `الجولة ${d}`), "المجموع"]);
    totals.forEach((r, i) => total.addRow([i + 1, r.name, ...days.map((d) => r.perDay?.[d] ?? ""), r.score]));
    const byRoom = wb.addWorksheet("القاعات", { views: [{ rightToLeft: true }] });
    byRoom.addRow(["الجولة", "القاعة", "الاسم", "الدرجة", "المحكم"]);
    rows.forEach((r) => byRoom.addRow([r.day, r.room, r.name, r.score, r.judge]));
    const buf = await wb.xlsx.writeBuffer();
    const url = URL.createObjectURL(new Blob([buf]));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${t.info.name}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const judges = [...new Set(rows.map((r) => r.judge!).filter(Boolean))].map((j) => {
    const s = rows.filter((r) => r.judge === j).map((r) => r.score);
    return { j, n: s.length, avg: avg(s), max: Math.max(...s), min: Math.min(...s) };
  }).sort((a, b) => b.avg - a.avg);
  const overall = avg(rows.map((r) => r.score));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1 rounded-2xl border bg-white p-1" style={{ borderColor: BRAND.border }}>
          {VIEWS.map(([k, l]) => (
            <button key={k} onClick={() => setView(k)} className="rounded-xl px-4 py-2 text-[13px] font-bold transition-colors"
              style={view === k ? { background: BRAND_GRADIENT, color: "#fff" } : { color: BRAND.ink }}>{l}</button>
          ))}
        </div>
        <button onClick={exportXlsx} className="mr-auto inline-flex items-center gap-1.5 rounded-xl border bg-white px-4 py-2 text-[13px] font-bold"
          style={{ borderColor: `${BRAND.purple}40`, color: BRAND.purple }}><Download className="h-4 w-4" /> تصدير Excel</button>
      </div>

      {view === "total" && (
        <Table
          head={["#", "الاسم", "الجولات", ...days.map((d) => `الجولة ${d}`), "المتوسط", "المجموع", "التغيّر"]}
          rows={totals.map((r, i) => {
            const p = played(r);
            const last = p.at(-1), prev = p.at(-2);
            const move = last && prev ? rankIn[prev][r.name] - rankIn[last][r.name] : 0;
            return [
              <Rank key="r" n={i + 1} />, <b key="n">{r.name}</b>, p.length,
              ...days.map((d) => r.perDay?.[d] != null ? <span key={d}>{r.perDay[d]} <small style={{ color: `${BRAND.ink}66` }}>#{rankIn[d][r.name]}</small></span> : "—"),
              avg(p.map((d) => r.perDay![d])), <b key="s" style={{ color: BRAND.purple }}>{r.score}</b>, <Move key="m" v={move} />,
            ];
          })}
        />
      )}

      {view === "progress" && (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {totals.map((r, i) => {
            const p = played(r);
            return (
              <div key={r.name} className="rounded-2xl border bg-white p-4 shadow-sm" style={{ borderColor: BRAND.border }}>
                <div className="mb-3 flex items-center gap-2">
                  <Rank n={i + 1} />
                  <b className="flex-1 truncate" style={{ color: BRAND.ink }}>{r.name}</b>
                  <span className="text-[12px] font-bold" style={{ color: BRAND.purple }}>متوسط {avg(p.map((d) => r.perDay![d]))}</span>
                </div>
                <div className="space-y-1.5">
                  {days.map((d) => {
                    const v = r.perDay?.[d];
                    return (
                      <div key={d} className="flex items-center gap-2 text-[12px]">
                        <span className="w-16 shrink-0" style={{ color: `${BRAND.ink}80` }}>الجولة {d}</span>
                        <div className="h-2.5 flex-1 overflow-hidden rounded-full" style={{ background: BRAND.surface }}>
                          {v != null && <div className="h-full rounded-full" style={{ width: `${Math.min(100, ((v - 50) / 40) * 100)}%`, background: BRAND_GRADIENT }} />}
                        </div>
                        <b className="w-10 text-left" style={{ color: BRAND.ink }}>{v ?? "—"}</b>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {!totals.length && <Empty />}
        </div>
      )}

      {view === "judge" && (
        <Table
          head={["المحكم", "الدرجات الممنوحة", "المتوسط", "الأعلى", "الأدنى", "الفرق عن المتوسط العام"]}
          rows={judges.map((x) => {
            const diff = Math.round((x.avg - overall) * 100) / 100;
            return [<b key="j">{x.j}</b>, x.n, x.avg, x.max, x.min,
              <span key="d" className="font-bold" style={{ color: diff > 0 ? BRAND.purple : BRAND.blueDeep }}>
                {diff > 0 ? "+" : ""}{diff} {Math.abs(diff) >= 3 ? (diff > 0 ? "· سخي" : "· متشدد") : ""}</span>];
          })}
        />
      )}

      {view === "room" && (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {t.info.days.flatMap((d) => d.rooms.map((room) => {
            const rs = rows.filter((r) => r.day === d.day && r.room === room.label);
            return (
              <div key={room.id} className="overflow-hidden rounded-2xl border bg-white shadow-sm" style={{ borderColor: BRAND.border }}>
                <div className="flex items-center justify-between px-4 py-2.5 text-white" style={{ background: BRAND_GRADIENT }}>
                  <b>الجولة {d.day} · {room.label}</b>
                  <span className="text-[12px] opacity-90">{rs[0]?.judge ?? "بانتظار الدرجات"}</span>
                </div>
                {rs.length ? rs.map((r, i) => (
                  <div key={r.name} className="flex items-center gap-2 border-t px-4 py-2 text-[13px]" style={{ borderColor: BRAND.border }}>
                    <Rank n={i + 1} /><span className="flex-1">{r.name}</span><b style={{ color: BRAND.purple }}>{r.score}</b>
                  </div>
                )) : <p className="p-4 text-center text-[12px]" style={{ color: `${BRAND.ink}66` }}>لا توجد درجات بعد</p>}
                {rs.length > 0 && <div className="border-t px-4 py-2 text-[12px]" style={{ borderColor: BRAND.border, color: `${BRAND.ink}99` }}>متوسط القاعة: <b>{avg(rs.map((r) => r.score))}</b></div>}
              </div>
            );
          }))}
        </div>
      )}
    </div>
  );
}

function Rank({ n }: { n: number }) {
  const top = n <= 3;
  return (
    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[12px] font-extrabold"
      style={top ? { background: BRAND_GRADIENT, color: "#fff" } : { background: BRAND.surface, color: BRAND.ink }}>{n}</span>
  );
}

function Move({ v }: { v: number }) {
  if (!v) return <Minus className="h-4 w-4" style={{ color: `${BRAND.ink}40` }} />;
  const up = v > 0;
  return (
    <span className="inline-flex items-center gap-0.5 text-[12px] font-bold" style={{ color: up ? BRAND.purple : BRAND.blueDeep }}>
      {up ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />}{Math.abs(v)}
    </span>
  );
}

const Empty = () => <p className="rounded-2xl bg-white p-6 text-center text-sm" style={{ color: `${BRAND.ink}66` }}>لا توجد درجات بعد</p>;

function Table({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  if (!rows.length) return <Empty />;
  return (
    <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm" style={{ borderColor: BRAND.border }}>
      <table className="w-full text-sm">
        <thead style={{ background: BRAND_GRADIENT, color: "#fff" }}>
          <tr>{head.map((h) => <th key={h} className="whitespace-nowrap px-3 py-2.5 text-right">{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t hover:bg-black/[0.02]" style={{ borderColor: BRAND.border }}>
              {r.map((c, j) => <td key={j} className="whitespace-nowrap px-3 py-2.5">{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
