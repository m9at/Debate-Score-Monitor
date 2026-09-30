import { periodLabel, totalRows, type LeaderDay, type LeaderRoom, type LeaderTournament } from "./leaderApi";

/**
 * Official results PDF: a dedicated, print-styled document (logo header,
 * faint watermark on every page) opened in a new window and sent to the
 * browser's "Save as PDF". Scores only — no winner/loser.
 */
export type PdfScope =
  | { kind: "round"; day: number }
  | { kind: "room"; day: number; roomId: string }
  | { kind: "rounds" }
  | { kind: "all" };

const esc = (s: unknown) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
const logoUrl = (t: LeaderTournament) =>
  t.info.logoUrl || `${window.location.origin}${import.meta.env.BASE_URL.replace(/\/$/, "")}/logo-mark.png`;

function roomBlock(t: LeaderTournament, d: LeaderDay, r: LeaderRoom) {
  const sheet = t.results[r.id];
  const rows = r.individuals
    .map((p) => ({ name: p.name, score: sheet?.scores[p.id] }))
    .sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
  return `
  <section class="room">
    <div class="room-head"><b>${esc(r.label)}</b><span>الجولة ${d.day} · ${esc(periodLabel(d.period))}</span></div>
    <div class="meta">
      <div><small>رئيس الجلسة</small>${esc(r.chair || "—")}</div>
      <div><small>المحكمون</small>${esc(r.judges.join("، ") || "—")}</div>
      <div><small>أرسل الدرجات</small>${esc(sheet ? `${sheet.judgeName} · ${new Date(sheet.submittedAt).toLocaleString("ar")}` : "لم تُرسل بعد")}</div>
    </div>
    <table><thead><tr><th>#</th><th>المشارك</th><th>الدرجة</th></tr></thead><tbody>
      ${rows.map((x, i) => `<tr><td>${i + 1}</td><td>${esc(x.name)}</td><td class="score">${x.score ?? "—"}</td></tr>`).join("")}
    </tbody></table>
  </section>`;
}

function roundBlock(t: LeaderTournament, d: LeaderDay) {
  return `<h2>الجولة ${d.day}${d.title ? ` — ${esc(d.title)}` : ""} <span>${esc(periodLabel(d.period))}</span></h2>
    ${d.rooms.map((r) => roomBlock(t, d, r)).join("")}`;
}

function totalsBlock(t: LeaderTournament) {
  const days = t.info.days;
  return `<h2>المجموع الكلي</h2><table><thead><tr><th>#</th><th>المشارك</th>
    ${days.map((d) => `<th>ج${d.day}</th>`).join("")}<th>المجموع</th></tr></thead><tbody>
    ${totalRows(t).map((r, i) => `<tr><td>${i + 1}</td><td>${esc(r.name)}</td>${days.map((d) => `<td>${r.perDay?.[d.day] ?? "—"}</td>`).join("")}<td class="score">${r.score}</td></tr>`).join("")}
  </tbody></table>`;
}

export function exportLeaderPdf(t: LeaderTournament, scope: PdfScope) {
  const { info } = t;
  const day = "day" in scope ? info.days.find((d) => d.day === scope.day) : undefined;
  let title = "جميع النتائج";
  let body = "";
  if (scope.kind === "round" && day) { title = `نتائج الجولة ${day.day}`; body = roundBlock(t, day); }
  if (scope.kind === "room" && day) {
    const room = day.rooms.find((r) => r.id === scope.roomId)!;
    title = `نتائج ${room.label} — الجولة ${day.day}`; body = roomBlock(t, day, room);
  }
  if (scope.kind === "rounds") { title = "نتائج جميع الجولات"; body = info.days.map((d) => roundBlock(t, d)).join(""); }
  if (scope.kind === "all") body = totalsBlock(t) + info.days.map((d) => roundBlock(t, d)).join("");

  const dates = [info.startDate, info.endDate].filter(Boolean).join(" — ") || new Date().toLocaleDateString("ar");
  const html = `<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>${esc(info.name)} - ${esc(title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;800&display=swap" rel="stylesheet">
<style>
  @page { size: A4; margin: 16mm 14mm; }
  * { box-sizing: border-box; }
  body { font-family: Cairo, sans-serif; color: #2B1B45; margin: 0; font-size: 12px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .wm { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; flex-direction: column; opacity: .05; z-index: -1; pointer-events: none; }
  .wm img { width: 60%; } .wm div { font-size: 48px; font-weight: 800; transform: rotate(-20deg); }
  header { display: flex; align-items: center; gap: 16px; border-bottom: 3px solid #7B2D8E; padding-bottom: 12px; margin-bottom: 14px; }
  header img { height: 64px; }
  header .k { color: #29ABE2; font-weight: 700; font-size: 12px; }
  header h1 { margin: 0; font-size: 22px; color: #7B2D8E; }
  header .sub { font-size: 14px; font-weight: 700; }
  .info { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 16px; }
  .info div, .meta div { background: #F7F8FC; border-radius: 8px; padding: 6px 10px; }
  small { display: block; color: #7B2D8E; font-weight: 700; font-size: 10px; }
  h2 { font-size: 16px; color: #7B2D8E; border-right: 4px solid #29ABE2; padding-right: 8px; margin: 18px 0 8px; }
  h2 span { font-size: 11px; color: #64748B; font-weight: 400; }
  .room { border: 1px solid #E7E9F2; border-radius: 10px; padding: 10px; margin-bottom: 10px; break-inside: avoid; }
  .room-head { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 14px; }
  .room-head span { font-size: 11px; color: #64748B; }
  .meta { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-bottom: 8px; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #7B2D8E; color: #fff; padding: 6px 8px; text-align: right; font-size: 11px; }
  td { padding: 5px 8px; border-bottom: 1px solid #E7E9F2; }
  tr:nth-child(even) td { background: #FAFAFD; }
  .score { font-weight: 800; color: #7B2D8E; }
  footer { margin-top: 20px; font-size: 10px; color: #94A3B8; text-align: center; border-top: 1px solid #E7E9F2; padding-top: 6px; }
</style></head><body>
  <div class="wm"><img src="${esc(logoUrl(t))}">${info.watermarkText ? `<div>${esc(info.watermarkText)}</div>` : ""}</div>
  <header><img src="${esc(logoUrl(t))}"><div>
    <div class="k">البطولة القيادية</div><h1>${esc(info.name)}</h1><div class="sub">${esc(title)}</div></div></header>
  <div class="info">
    <div><small>الجهة المنظمة</small>${esc(info.organizer || "—")}</div>
    <div><small>التاريخ</small>${esc(dates)}</div>
    <div><small>الفترة</small>${esc(day ? periodLabel(day.period) : "جميع الفترات")}</div>
    <div><small>الجولة</small>${day ? `الجولة ${day.day}` : `${info.days.length} جولات`}</div>
  </div>
  ${body}
  <footer>نظام درجات بدون فائز أو خاسر · صدر بتاريخ ${new Date().toLocaleString("ar")}</footer>
  <script>window.onload = () => setTimeout(() => window.print(), 600);</script>
</body></html>`;
  const w = window.open("", "_blank");
  if (!w) return false;
  w.document.write(html);
  w.document.close();
  return true;
}
