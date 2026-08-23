import type { JudgeMatchInfo, JudgeScores, RoundData } from "./judgeCodec";
import { entities } from "@/api/base44Client";

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

async function findSession(sessionId: string) {
  const rows = await entities.JudgeSession.filter({ session_id: sessionId }, "-updated_date", 1);
  return rows[0] ?? null;
}

export async function createMatchSession(matchInfo: JudgeMatchInfo): Promise<string> {
  const tid = matchInfo.tournamentId;
  if (!tid) throw new Error("tournamentId is required");
  const sessionId = crypto.randomUUID();
  await entities.JudgeSession.create({
    session_id: sessionId,
    tournament_id: tid,
    kind: "match",
    info: matchInfo,
    results: {},
    created_at_ms: Date.now(),
    updated_at_ms: Date.now(),
  });
  return sessionId;
}

export async function createRoundSession(roundData: RoundData): Promise<string> {
  const tid = roundData.tournamentId;
  if (!tid) throw new Error("tournamentId is required");
  const sessionId = crypto.randomUUID();
  await entities.JudgeSession.create({
    session_id: sessionId,
    tournament_id: tid,
    kind: "round",
    info: roundData,
    results: {},
    created_at_ms: Date.now(),
    updated_at_ms: Date.now(),
  });
  return sessionId;
}

export async function syncRoundSessionsForRound(
  tournamentId: string,
  roundNumber: number,
  roundData: RoundData,
): Promise<{ updated: number }> {
  const rows = await entities.JudgeSession.filter({ tournament_id: tournamentId, kind: "round" }, "-updated_date", 5000);
  const matched = rows.filter((row: any) => Number(row.info?.roundNumber) === roundNumber);
  await Promise.all(matched.map((row: any) => entities.JudgeSession.update(row.id, {
    info: roundData,
    updated_at_ms: Date.now(),
  })));
  return { updated: matched.length };
}

export async function getMatchSession(sessionId: string): Promise<MatchSession | null> {
  const row = await findSession(sessionId);
  if (!row || row.kind !== "match") return null;
  return {
    tournamentId: row.tournament_id,
    matchInfo: row.info as JudgeMatchInfo,
    result: row.results?.result as JudgeScores | undefined,
    submittedAt: row.results?.submittedAt as number | undefined,
  };
}

export async function getRoundSession(sessionId: string): Promise<RoundSession | null> {
  const row = await findSession(sessionId);
  if (!row || row.kind !== "round") return null;
  return {
    tournamentId: row.tournament_id,
    roundData: row.info as RoundData,
    results: (row.results ?? {}) as { [roomNumber: string]: RoundResultEntry },
  };
}

export async function submitMatchResult(sessionId: string, scores: JudgeScores): Promise<void> {
  const row = await findSession(sessionId);
  if (!row || row.kind !== "match") throw new Error("session not found");
  await entities.JudgeSession.update(row.id, {
    results: { result: scores, submittedAt: Date.now() },
    updated_at_ms: Date.now(),
  });
}

export async function submitRoomResult(
  sessionId: string,
  roomNumber: number,
  scores: JudgeScores,
): Promise<void> {
  const row = await findSession(sessionId);
  if (!row || row.kind !== "round") throw new Error("session not found");
  const results = { ...(row.results ?? {}) };
  results[String(roomNumber)] = { ...scores, submittedAt: Date.now() };
  await entities.JudgeSession.update(row.id, { results, updated_at_ms: Date.now() });
}

export async function deleteMatchSession(sessionId: string): Promise<void> {
  const row = await findSession(sessionId);
  if (row) await entities.JudgeSession.delete(row.id);
}

export async function deleteRoundResult(sessionId: string, roomNumber: number): Promise<void> {
  const row = await findSession(sessionId);
  if (!row || row.kind !== "round") return;
  const results = { ...(row.results ?? {}) };
  delete results[String(roomNumber)];
  await entities.JudgeSession.update(row.id, { results, updated_at_ms: Date.now() });
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
const POLL_INTERVAL_MS = 4000;

function startPoll(
  tournamentId: string,
  onMatch: ((u: SessionUpdate) => void) | null,
  onRound: ((u: RoundResultUpdate) => void) | null,
): Unsubscribe {
  let cancelled = false;
  let inFlight = false;
  const seen = new Map<string, number>();
  const tick = async () => {
    if (cancelled || inFlight) return;
    inFlight = true;
    try {
      const rows = await entities.JudgeSession.filter({ tournament_id: tournamentId }, "-updated_date", 5000);
      if (cancelled) return;
      for (const row of rows) {
        if (row.kind === "match" && onMatch && row.results?.result) {
          const stamp = Number(row.results?.submittedAt ?? row.updated_at_ms ?? 0);
          if (seen.get(row.session_id) === stamp) continue;
          seen.set(row.session_id, stamp);
          onMatch({
            sessionId: row.session_id,
            tournamentId,
            matchInfo: row.info as JudgeMatchInfo,
            result: row.results.result as JudgeScores,
            submittedAt: stamp || Date.now(),
          });
        } else if (row.kind === "round" && onRound) {
          const roundData = row.info as RoundData;
          const results = (row.results ?? {}) as Record<string, RoundResultEntry>;
          for (const [roomKey, entry] of Object.entries(results)) {
            const key = `${row.session_id}:${roomKey}`;
            const stamp = Number(entry.submittedAt ?? row.updated_at_ms ?? 0);
            if (seen.get(key) === stamp) continue;
            seen.set(key, stamp);
            const room = roundData.rooms.find((r) => String(r.roomNumber) === roomKey);
            if (!room) continue;
            const { submittedAt, ...scoresOnly } = entry;
            onRound({
              sessionId: row.session_id,
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
      // transient; retry next tick
    } finally {
      inFlight = false;
    }
  };
  void tick();
  const id = window.setInterval(tick, POLL_INTERVAL_MS);
  return () => {
    cancelled = true;
    window.clearInterval(id);
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
