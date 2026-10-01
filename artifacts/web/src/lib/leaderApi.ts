/** Leadership debate (مناظرة قيادية) — individuals scored per room, no winner. */

export interface LeaderIndividual { id: string; name: string }
export interface LeaderRoom {
  id: string;
  label: string;
  locked?: boolean;
  individuals: LeaderIndividual[];
  /** Panel judges; the session chair (رئيس الجلسة) is kept separately. */
  judges: string[];
  chair?: string;
}
export interface LeaderDay {
  day: number;
  rooms: LeaderRoom[];
  /** Per-round system: optional title and score range overriding the tournament's. */
  title?: string;
  /** Session (الفترة) this round belongs to — 1 = first period. */
  period?: number;
  createdAt?: number;
  /** Organiser closed the round — no more submissions. */
  closed?: boolean;
  scoreMin?: number;
  scoreMax?: number;
}
export const dayRange = (info: LeaderInfo, d?: LeaderDay) => ({
  min: d?.scoreMin ?? info.scoreMin,
  max: d?.scoreMax ?? info.scoreMax,
});
export interface LeaderInfo {
  name: string;
  /** Access code (same model as team tournaments), stored with the tournament so every device asks for it. */
  protection?: import("@/types/tournament").TournamentProtection;
  scoreMin: number;
  scoreMax: number;
  days: LeaderDay[];
  /** Judges registered for the tournament; rooms pick from this list. */
  judgePool?: string[];
  /** Registered individuals; rooms pick from this list. */
  individualPool?: LeaderIndividual[];
  /** Descriptive details shown in settings, overview and reports. */
  organizer?: string;
  venue?: string;
  startDate?: string;
  description?: string;
  /** Target individuals per room used by the auto-draw. */
  individualsPerRoom?: number;
  endDate?: string;
  /** Panel size per room including the chair (auto-draw). */
  judgesPerRoom?: number;
  /** Logo shown on reports; defaults to the centre's logo. */
  logoUrl?: string;
  watermarkText?: string;
  /** Organiser activity feed (newest last). */
  activity?: { at: number; text: string }[];
}

/** Everyone who may score a room: chair first, then the panel. */
export const roomPanel = (r: LeaderRoom) => [...(r.chair ? [r.chair] : []), ...r.judges];

export const logActivity = (d: LeaderInfo, text: string) => {
  d.activity = [...(d.activity ?? []), { at: Date.now(), text }].slice(-50);
};

export type RoundStatus = RoomStatus | "closed";
export const ROUND_STATUS: Record<RoundStatus, { label: string; color: string }> = {
  pending: { label: "لم تبدأ", color: "#2B1B4599" },
  progress: { label: "قيد التحكيم", color: "#1B87B8" },
  done: { label: "مكتملة", color: "#7B2D8E" },
  closed: { label: "مغلقة", color: "#5D1F6D" },
};
export function roundStatus(t: LeaderTournament, d: LeaderDay): RoundStatus {
  if (d.closed) return "closed";
  const got = d.rooms.filter((r) => t.results[r.id]).length;
  if (d.rooms.length && got === d.rooms.length) return "done";
  if (got || d.rooms.some((r) => t.drafts?.[r.id])) return "progress";
  return "pending";
}

export const timeAgo = (at: number) => {
  const m = Math.round((Date.now() - at) / 60000);
  if (m < 1) return "الآن";
  if (m < 60) return `قبل ${m} دقيقة`;
  const h = Math.round(m / 60);
  return h < 24 ? `قبل ${h} ساعة` : new Date(at).toLocaleDateString("ar");
};
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
  /** Judges' autosaved, not-yet-submitted scores keyed by room id. */
  drafts?: Record<string, { judgeName: string; scores: Record<string, number>; entries?: JudgeEntry[]; updatedAt: number }>;
}

export const PERIOD_NAMES = ["الأولى", "الثانية", "الثالثة", "الرابعة", "الخامسة"];
export const periodLabel = (p = 1) => `الفترة ${PERIOD_NAMES[p - 1] ?? p}`;

export type RoomStatus = "pending" | "progress" | "done";
export const ROOM_STATUS: Record<RoomStatus, string> = { pending: "لم تبدأ", progress: "قيد التحكيم", done: "مكتملة ✓" };
export const roomStatus = (t: LeaderTournament, roomId: string): RoomStatus =>
  t.results[roomId] ? "done" : t.drafts?.[roomId] ? "progress" : "pending";

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
/** One debater row on the judge form; `id` is empty for a debater the judge typed in. */
export interface JudgeEntry { id: string; name: string; score: string }
export const submitLeaderSheet = (id: string, roomId: string, judgeName: string, entries: { id?: string; name: string; score: number }[]) =>
  http(`/${encodeURIComponent(id)}/results/${encodeURIComponent(roomId)}`, {
    method: "PUT", body: JSON.stringify({ judgeName, entries }),
  });
export const saveLeaderDraft = (id: string, roomId: string, judgeName: string, entries: JudgeEntry[]) =>
  http(`/${encodeURIComponent(id)}/drafts/${encodeURIComponent(roomId)}`, {
    method: "PUT", body: JSON.stringify({
      judgeName, entries,
      scores: Object.fromEntries(entries.filter((e) => e.id && e.score !== "").map((e) => [e.id, +e.score])),
    }),
  });
export const resetLeaderScores = (id: string, day?: number) =>
  http(`/${encodeURIComponent(id)}/results${day ? `?day=${day}` : ""}`, { method: "DELETE" });
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
  /** Debater id — two debaters with the same name stay separate. */
  id?: string;
  name: string;
  room?: string;
  day?: number;
  /** The judge's score in one room, or the sum over all rounds (total). */
  score: number;
  judge?: string;
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
      // One judge per room enters the scores — his score is the debater's score.
      const sheet = sheets.find((s) => s.roomId === r.id);
      if (!sheet) continue;
      for (const ind of r.individuals) {
        const v = sheet.scores[ind.id];
        if (typeof v !== "number") continue;
        rows.push({ id: ind.id, name: ind.name.trim() || "—", room: r.label, day: d.day, score: v, judge: sheet.judgeName });
      }
    }
  }
  // Same name, different debaters: add the room where each first appeared.
  const ids = new Map<string, Map<string, string>>();
  for (const r of rows) {
    const m = ids.get(r.name) ?? new Map<string, string>();
    if (!m.has(r.id!)) m.set(r.id!, r.room!);
    ids.set(r.name, m);
  }
  for (const r of rows) {
    const m = ids.get(r.name)!;
    if (m.size > 1) r.name = `${r.name} (${m.get(r.id!)})`;
  }
  return rows.sort(byScore);
}

/** Individuals summed across days (matched by debater id). */
export function totalRows(t: LeaderTournament): RankRow[] {
  const map = new Map<string, RankRow>();
  for (const r of roomRows(t)) {
    const cur = map.get(r.id!) ?? { id: r.id, name: r.name, score: 0, perDay: {} };
    cur.perDay![r.day!] = round2((cur.perDay![r.day!] ?? 0) + r.score);
    cur.score = round2(cur.score + r.score);
    map.set(r.id!, cur);
  }
  return [...map.values()].sort(byScore);
}
