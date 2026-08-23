import type { Tournament } from "@/types/tournament";
import type { TournamentStatus } from "@/lib/brand";

/**
 * Derives a tournament's lifecycle status from the data we already keep —
 * no extra field to maintain, so existing tournaments classify correctly.
 */
export function getTournamentStatus(t: Tournament): TournamentStatus {
  if (t.archived) return "archived";
  if (t.finished) return "completed";
  if (t.started) return "running";
  if (t.startDate && t.startDate > Date.now()) return "upcoming";
  return "draft";
}

/** Counts of rooms in the current (or last) round — used on the tournament cards. */
export function getTournamentCounts(t: Tournament) {
  const round =
    t.rounds.find((r) => r.roundNumber === t.currentRound) ??
    t.rounds[t.rounds.length - 1];

  return {
    teams: t.teams.length,
    judges: t.judges?.length ?? 0,
    rooms: round?.matches.length ?? 0,
    currentRound: t.started ? t.currentRound : 0,
    totalRounds: t.totalRounds,
  };
}
