import type { JudgeMatchInfo, JudgeScores, RoundData } from "./judgeCodec";

export interface MatchSession {
  tournamentId: string;
  matchInfo: JudgeMatchInfo;
  result?: JudgeScores;
  submittedAt?: number;
}

export interface RoundResultEntry extends JudgeScores {
  submittedAt: number;
}

export interface RoundSession {
  tournamentId: string;
  roundData: RoundData;
  results?: { [roomNumber: string]: RoundResultEntry };
}

const API_BASE = "/api/judge";

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    let body = "";
    try { body = await res.text(); } catch {}
    throw new Error(`HTTP ${res.status}: ${body || res.statusText}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export async function createMatchSession(matchInfo: JudgeMatchInfo): Promise<string> {
  const tid = matchInfo.tournamentId;
  if (!tid) throw new Error("tournamentId is required");
  const r = await http<{ id: string }>("/sessions", {
    method: "POST",
    body: JSON.stringify({ tournamentId: tid, matchInfo }),
  });
  return r.id;
}

export async function createRoundSession(roundData: RoundData): Promise<string> {
  const tid = roundData.tournamentId;
  if (!tid) throw new Error("tournamentId is required");
  const r = await http<{ id: string }>("/round-sessions", {
    method: "POST",
    body: JSON.stringify({ tournamentId: tid, roundData }),
  });
  return r.id;
}

export async function syncRoundSessionsForRound(
  tournamentId: string,
  roundNumber: number,
  roundData: RoundData,
): Promise<{ updated: number }> {
  const r = await http<{ ok: boolean; updated: number }>(
    `/round-sessions/by-tournament/${encodeURIComponent(tournamentId)}/round/${roundNumber}/info`,
    {
      method: "PUT",
      body: JSON.stringify(roundData),
    },
  );
  return { updated: r.updated };
}

export async function getMatchSession(sessionId: string): Promise<MatchSession | null> {
  try {
    return await http<MatchSession>(`/sessions/${encodeURIComponent(sessionId)}`);
  } catch (e) {
    if (e instanceof Error && /^HTTP 404/.test(e.message)) return null;
    throw e;
  }
}

export async function getRoundSession(sessionId: string): Promise<RoundSession | null> {
  try {
    return await http<RoundSession>(`/round-sessions/${encodeURIComponent(sessionId)}`);
  } catch (e) {
    if (e instanceof Error && /^HTTP 404/.test(e.message)) return null;
    throw e;
  }
}

export async function submitMatchResult(sessionId: string, scores: JudgeScores): Promise<void> {
  await http<{ ok: boolean }>(`/sessions/${encodeURIComponent(sessionId)}/result`, {
    method: "PUT",
    body: JSON.stringify(scores),
  });
}

export async function submitRoomResult(
  sessionId: string,
  roomNumber: number,
  scores: JudgeScores,
): Promise<void> {
  await http<{ ok: boolean }>(
    `/round-sessions/${encodeURIComponent(sessionId)}/results/${roomNumber}`,
    { method: "PUT", body: JSON.stringify(scores) },
  );
}

export async function deleteMatchSession(sessionId: string): Promise<void> {
  await http<{ ok: boolean }>(`/sessions/${encodeURIComponent(sessionId)}`, {
    method: "DELETE",
  });
}

export async function deleteRoundResult(sessionId: string, roomNumber: number): Promise<void> {
  await http<{ ok: boolean }>(
    `/round-sessions/${encodeURIComponent(sessionId)}/results/${roomNumber}`,
    { method: "DELETE" },
  );
}

export interface SessionUpdate {
  sessionId: string;
  tournamentId: string;
  matchInfo: JudgeMatchInfo;
  result: JudgeScores;
  submittedAt: number;
}

export interface RoundResultUpdate {
  sessionId: string;
  tournamentId: string;
  roomNumber: number;
  matchId: string;
  roundNumber: number;
  scores: JudgeScores;
  submittedAt: number;
  roundData: RoundData;
}

type Unsubscribe = () => void;

interface AggregatedRow {
  sessionId: string;
  kind: "match" | "round";
  info: JudgeMatchInfo | RoundData;
  results: Record<string, unknown>;
}

const POLL_INTERVAL_MS = 4000;

function startPoll(
  tournamentId: string,
  onMatch: ((u: SessionUpdate) => void) | null,
  onRound: ((u: RoundResultUpdate) => void) | null,
): Unsubscribe {
  let cancelled = false;
  let inFlight = false;
  const tick = async () => {
    if (cancelled || inFlight) return;
    inFlight = true;
    try {
      const rows = await http<AggregatedRow[]>(
        `/tournaments/${encodeURIComponent(tournamentId)}/results`,
      );
      if (cancelled) return;
      for (const row of rows) {
        if (row.kind === "match" && onMatch) {
          const r = row.results as { result?: JudgeScores; submittedAt?: number };
          if (r && r.result) {
            const info = row.info as JudgeMatchInfo;
            onMatch({
              sessionId: row.sessionId,
              tournamentId,
              matchInfo: info,
              result: r.result,
              submittedAt: r.submittedAt ?? Date.now(),
            });
          }
        } else if (row.kind === "round" && onRound) {
          const roundData = row.info as RoundData;
          const results = (row.results as Record<string, RoundResultEntry>) || {};
          for (const [roomKey, entry] of Object.entries(results)) {
            const room = roundData.rooms.find((r) => String(r.roomNumber) === roomKey);
            if (!room) continue;
            const { submittedAt, ...scoresOnly } = entry;
            onRound({
              sessionId: row.sessionId,
              tournamentId,
              roomNumber: Number(roomKey),
              matchId: room.matchId,
              roundNumber: roundData.roundNumber,
              scores: scoresOnly as JudgeScores,
              submittedAt,
              roundData,
            });
          }
        }
      }
    } catch {
      // transient; will retry next tick
    } finally {
      inFlight = false;
    }
  };
  void tick();
  const id = setInterval(tick, POLL_INTERVAL_MS);
  return () => {
    cancelled = true;
    clearInterval(id);
  };
}

export function subscribeMatchResults(
  tournamentId: string,
  onResult: (u: SessionUpdate) => void,
): Unsubscribe {
  return startPoll(tournamentId, onResult, null);
}

export function subscribeRoundResults(
  tournamentId: string,
  onResult: (u: RoundResultUpdate) => void,
): Unsubscribe {
  return startPoll(tournamentId, null, onResult);
}
