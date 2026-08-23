import type { Tournament } from "@/types/tournament";
import { getRoomStatus } from "@/lib/roomStatus";
import { BRAND } from "@/lib/brand";

export interface RoundProgress {
  /** Short human label for the state of the current round. */
  label: string;
  color: string;
  rooms: number;
  done: number;
}

/**
 * Summarises the current round of a tournament in one line — used on the
 * tournament cards so the state is readable at a glance. Read-only: it reuses
 * the room-status rules rather than re-deriving them.
 */
export function getRoundProgress(t: Tournament): RoundProgress {
  const round =
    t.rounds.find((r) => r.roundNumber === t.currentRound) ??
    t.rounds[t.rounds.length - 1];

  if (t.finished) {
    return { label: "البطولة منتهية", color: BRAND.purple, rooms: 0, done: 0 };
  }
  if (!t.started || !round) {
    return { label: "قيد الإعداد", color: BRAND.blueDeep, rooms: 0, done: 0 };
  }

  const statuses = round.matches.map((match) =>
    getRoomStatus({
      match,
      pending: t.pendingResults ?? [],
      expectedJudges: round.judgesPerRoom ?? 0,
    })
  );
  const rooms = statuses.length;
  const announced = statuses.filter((s) => s === "announced").length;
  const ready = statuses.filter((s) => s === "ready").length;
  const judging = statuses.filter(
    (s) => s === "judging" || s === "partialResults" || s === "awaitingApproval"
  ).length;

  if (rooms === 0) {
    return { label: "بانتظار التوزيع", color: BRAND.warning, rooms, done: 0 };
  }
  if (announced === rooms) {
    return { label: "تم إعلان النتائج", color: BRAND.purple, rooms, done: rooms };
  }
  if (ready + announced === rooms) {
    return {
      label: "جاهزة للإعلان",
      color: BRAND.success,
      rooms,
      done: ready + announced,
    };
  }
  if (judging > 0 || ready > 0) {
    return {
      label: `جاري التحكيم · ${ready + announced}/${rooms}`,
      color: BRAND.warning,
      rooms,
      done: ready + announced,
    };
  }
  return { label: "بانتظار البدء", color: BRAND.blueDeep, rooms, done: 0 };
}
