import { useMemo, useState } from "react";
import ExcelJS from "exceljs";
import LeaderReport from "./LeaderReport";
import { roomRows, totalRows, type LeaderTournament, type RankRow } from "@/lib/leaderApi";

type View = "report" | "total" | "day" | "room";

/** Rankings three ways: overall (sum of days), per day, per room. */
export default function LeaderResults({ t }: { t: LeaderTournament }) {
  const [view, setView] = useState<View>("report");
  const rooms = useMemo(() => roomRows(t), [t]);
  const totals = useMemo(() => totalRows(t), [t]);
  const days = t.info.days.map((d) => d.day);

  const exportXlsx = async () => {
    const wb = new ExcelJS.Workbook();
    const total = wb.addWorksheet("المجموع", { views: [{ rightToLeft: true }] });
    total.addRow(["الترتيب", "الاسم", ...days.map((d) => `الجولة ${d}`), "المجموع"]);
    totals.forEach((r, i) => total.addRow([i + 1, r.name, ...days.map((d) => r.perDay?.[d] ?? ""), r.score]));
    const byRoom = wb.addWorksheet("القاعات", { views: [{ rightToLeft: true }] });
    byRoom.addRow(["الجولة", "القاعة", "الاسم", "الدرجة", "المحكم"]);
    rooms.forEach((r) => byRoom.addRow([r.day, r.room, r.name, r.score, r.judge]));
    const buf = await wb.xlsx.writeBuffer();
    const url = URL.createObjectURL(new Blob([buf]));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${t.info.name}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {([["report", "📊 التقرير الشامل"], ["total", "المجموع الكلي"], ["day", "حسب الجولة"], ["room", "حسب القاعة"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setView(k)} className="rounded-lg px-3 py-1.5 text-sm font-bold"
            style={view === k ? { background: "#29ABE2", color: "#fff" } : { background: "#fff", color: "#29ABE2" }}>
            {l}
          </button>
        ))}
        <button onClick={exportXlsx} className="mr-auto rounded-lg border px-3 py-1.5 text-sm font-bold">⬇️ تصدير Excel</button>
      </div>

      {view === "report" && <LeaderReport t={t} />}

      {view === "total" && (
        <Table
          head={["#", "الاسم", ...days.map((d) => `الجولة ${d}`), "المجموع"]}
          rows={totals.map((r, i) => [i + 1, r.name, ...days.map((d) => r.perDay?.[d] ?? "—"), <b key="s">{r.score}</b>])}
        />
      )}

      {view === "day" && days.map((d) => (
        <Section key={d} title={`الجولة ${d}`}>
          <Ranked rows={rooms.filter((r) => r.day === d)} withRoom />
        </Section>
      ))}

      {view === "room" && t.info.days.map((d) => d.rooms.map((room) => (
        <Section key={room.id} title={`الجولة ${d.day} · ${room.label}`}>
          <Ranked rows={rooms.filter((r) => r.day === d.day && r.room === room.label)} />
        </Section>
      )))}
    </div>
  );
}

function Ranked({ rows, withRoom }: { rows: RankRow[]; withRoom?: boolean }) {
  return (
    <Table
      head={["#", "الاسم", ...(withRoom ? ["القاعة"] : []), "الدرجة", "المحكم"]}
      rows={rows.map((r, i) => [i + 1, r.name, ...(withRoom ? [r.room] : []), <b key="s">{r.score}</b>, r.judge])}
    />
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 font-bold" style={{ color: "#7B2D8E" }}>{title}</h3>
      {children}
    </div>
  );
}

function Table({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  if (!rows.length) return <p className="rounded-xl bg-white p-4 text-center text-sm text-gray-400">لا توجد درجات بعد</p>;
  return (
    <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead style={{ background: "#7B2D8E", color: "#fff" }}>
          <tr>{head.map((h) => <th key={h} className="px-3 py-2 text-right">{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t">{r.map((c, j) => <td key={j} className="px-3 py-2">{c}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
