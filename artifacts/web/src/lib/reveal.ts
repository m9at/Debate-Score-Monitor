import type { Match, Round, Tournament } from "@/types/tournament";

/**
 * The public lifecycle of a room's result.
 *
 * - `calculated`      — scored internally, NOT approved, nothing shown publicly.
 * - `ready_for_reveal`— approved and complete, still hidden from the audience.
 * - `revealed`        — announced on screen; the winner may now be shown.
 *
 * These are the exact values the backend column will hold, so the UI already
 * speaks the persisted vocabulary and only the reader below changes when the
 * result lives in Postgres instead of the local store.
 */
export type RevealStatus = "calculated" | "ready_for_reveal" | "revealed";

/** Reads a match's reveal status. Single point of change for the API swap. */
export function getRevealStatus(match: Match): RevealStatus {
  if (match.resultAnnounced) return "revealed";
  if (match.completed) return "ready_for_reveal";
  return "calculated";
}

/** True while the result must stay completely hidden from the audience. */
export function isWinnerHidden(match: Match): boolean {
  return getRevealStatus(match) !== "revealed";
}

/**
 * What the audience screen is allowed to show for a room, given the tournament
 * settings. Winner identity depends ONLY on the reveal status; the score toggle
 * hides numbers alone and never the winner.
 */
export interface RevealVisibility {
  status: RevealStatus;
  /** Winner name / trophy / highlight may be shown. */
  canShowWinner: boolean;
  /** Numeric scores and point gaps may be shown. */
  canShowScores: boolean;
}

export function revealVisibility(
  match: Match,
  tournament: Pick<Tournament, "settings">
): RevealVisibility {
  const status = getRevealStatus(match);
  const revealed = status === "revealed";
  return {
    status,
    canShowWinner: revealed,
    canShowScores: revealed && tournament.settings?.showScoresOnAnnounce === true,
  };
}

/** Rooms of a round that are approved and still waiting to be announced. */
export function roomsAwaitingReveal(round: Round | undefined): Match[] {
  return (round?.matches ?? []).filter(
    (m) => getRevealStatus(m) === "ready_for_reveal"
  );
}

/** Human label for a round, honouring knockout naming. */
export function roundTitle(round: Round | undefined, roundNumber: number): string {
  if (round?.kind === "final") return "النهائي";
  if (round?.kind === "semifinal") return "نصف النهائي";
  return `الجولة ${roundNumber}`;
}

/** Display name for a room. */
export function roomTitle(match: Match): string {
  return match.roomLabel?.trim()
    ? match.roomLabel
    : `القاعة ${String(match.roomNumber).padStart(2, "0")}`;
}
