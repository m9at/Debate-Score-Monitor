/** Leadership debate (مناظرة قيادية) — individuals scored per room, no winner. */

export interface LeaderIndividual { id: string; name: string }
export interface LeaderRoom {
  id: string;
  label: string;
  locked?: boolean;
  individuals: LeaderIndividual[];
  judges: string[];
}
export interface LeaderDay { day: number; rooms: LeaderRoom[] }
export interface LeaderInfo {
  name: string;
  scoreMin: number;
  scoreMax: number;
  days: LeaderDay[];
}
export interface LeaderSheet {
  roomId: string;
  judgeName: string;
  scores: Record<string, number>;
  submittedAt: number;
}
export interface LeaderTournament {
  id: string;
  info: LeaderInfo;
  results: Record<string, LeaderSheet>;
}

const uid = () => Math.random().toString(36).slice(2, 10);

export function buildInfo(name: string, days: number, rooms: number, scoreMin: number, scoreMax: number): LeaderInfo {
  return {
    name,
    scoreMin,
    scoreMax,
    days: Array.from({ length: days }, (_, d) => ({
      day: d + 1,
      rooms: Array.from({ length: rooms }, (_, r) => newRoom(r + 1)),
    })),
  };
}

export const newRoom = (n: number): LeaderRoom => ({
  id: uid(), label: `القاعة ${n}`, individuals: [], judges: [],
});
export const newIndividual = (name = ""): LeaderIndividual => ({ id: uid(), name });

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/leader${path}`, {
    ...init,
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}

export const createLeader = (info: LeaderInfo) =>
  http<{ id: string }>("", { method: "POST", body: JSON.stringify({ info }) }).then((r) => r.id);
export const getLeader = (id: string) => http<LeaderTournament>(`/${encodeURIComponent(id)}`);
export const saveLeaderInfo = (id: string, info: LeaderInfo) =>
  http(`/${encodeURIComponent(id)}/info`, { method: "PUT", body: JSON.stringify({ info }) });
export const submitLeaderSheet = (id: string, roomId: string, judgeName: string, scores: Record<string, number>) =>
  http(`/${encodeURIComponent(id)}/results/${encodeURIComponent(roomId)}`, {
    method: "PUT", body: JSON.stringify({ judgeName, scores }),
  });
export const deleteLeaderSheet = (id: string, key: string) =>
  http(`/${encodeURIComponent(id)}/results/${encodeURIComponent(key)}`, { method: "DELETE" });

/** Local list of the organiser's leadership tournaments (like the team ones). */
const LS_KEY = "leaderTournaments";
export interface LeaderListItem { id: string; name: string; createdAt: number }
export const listLocal = (): LeaderListItem[] => {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); } catch { return []; }
};
export const addLocal = (item: LeaderListItem) =>
  localStorage.setItem(LS_KEY, JSON.stringify([item, ...listLocal().filter((i) => i.id !== item.id)]));
export const removeLocal = (id: string) =>
  localStorage.setItem(LS_KEY, JSON.stringify(listLocal().filter((i) => i.id !== id)));

// ── Results ────────────────────────────────────────────────────────────────

export interface RankRow {
  name: string;
  room?: string;
  day?: number;
  /** Average of all judges' scores (one room), or sum of day averages (total). */
  score: number;
  judges: number;
  perDay?: Record<number, number>;
}

const round2 = (n: number) => Math.round(n * 100) / 100;
const byScore = (a: RankRow, b: RankRow) => b.score - a.score;

/** One row per individual per room: the average of the judges who scored them. */
export function roomRows(t: LeaderTournament): RankRow[] {
  const sheets = Object.values(t.results);
  const rows: RankRow[] = [];
  for (const d of t.info.days) {
    for (const r of d.rooms) {
      const rs = sheets.filter((s) => s.roomId === r.id);
      for (const ind of r.individuals) {
        const vals = rs.map((s) => s.scores[ind.id]).filter((v) => typeof v === "number");
        if (!vals.length) continue;
        rows.push({
          name: ind.name.trim() || "—", room: r.label, day: d.day,
          score: round2(vals.reduce((a, b) => a + b, 0) / vals.length), judges: vals.length,
        });
      }
    }
  }
  return rows.sort(byScore);
}

/** Individuals summed across days (matched by name). */
export function totalRows(t: LeaderTournament): RankRow[] {
  const map = new Map<string, RankRow>();
  for (const r of roomRows(t)) {
    const cur = map.get(r.name) ?? { name: r.name, score: 0, judges: 0, perDay: {} };
    cur.perDay![r.day!] = round2((cur.perDay![r.day!] ?? 0) + r.score);
    cur.score = round2(cur.score + r.score);
    cur.judges += r.judges;
    map.set(r.name, cur);
  }
  return [...map.values()].sort(byScore);
}
