import type { Match, PendingMatchResult } from "@/types/tournament";

/** The lifecycle a debate room moves through during a round. */
export type RoomStatus =
  | "notStarted"
  | "judging"
  | "partialResults"
  | "awaitingApproval"
  | "ready"
  | "announced";

export interface RoomStatusMeta {
  key: RoomStatus;
  /** Coloured dot used in the badge, matching the spec's legend. */
  dot: string;
  label: string;
  /** Badge background / text colours. */
  bg: string;
  fg: string;
}

const META: Record<RoomStatus, RoomStatusMeta> = {
  notStarted: {
    key: "notStarted",
    dot: "#9CA3AF",
    label: "لم تبدأ",
    bg: "#9CA3AF1f",
    fg: "#4B5563",
  },
  judging: {
    key: "judging",
    dot: "#F59E0B",
    label: "جاري التحكيم",
    bg: "#F59E0B24",
    fg: "#B45309",
  },
  partialResults: {
    key: "partialResults",
    dot: "#3B82F6",
    label: "تم إرسال بعض النتائج",
    bg: "#3B82F61f",
    fg: "#1D4ED8",
  },
  awaitingApproval: {
    key: "awaitingApproval",
    dot: "#F97316",
    label: "بانتظار اعتماد النتيجة",
    bg: "#F973161f",
    fg: "#C2410C",
  },
  ready: {
    key: "ready",
    dot: "#22C55E",
    label: "النتيجة جاهزة",
    bg: "#22C55E1f",
    fg: "#15803D",
  },
  announced: {
    key: "announced",
    dot: "#7B2D8E",
    label: "تم إعلان النتيجة",
    bg: "#7B2D8E1f",
    fg: "#5D1F6D",
  },
};

export function roomStatusMeta(status: RoomStatus): RoomStatusMeta {
  return META[status];
}

export interface RoomStatusInput {
  match: Match;
  /** Submissions from judges for this match that still need admin approval. */
  pending?: PendingMatchResult[];
  /** How many judges are expected to submit for this room. */
  expectedJudges?: number;
}

/**
 * Derives a room's status from the existing scoring data — read-only, so the
 * judging logic itself stays untouched.
 */
export function getRoomStatus({
  match,
  pending = [],
  expectedJudges = 0,
}: RoomStatusInput): RoomStatus {
  if (match.resultAnnounced) return "announced";
  if (match.completed) return "ready";

  const submissions = pending.filter((p) => p.matchId === match.id).length;
  if (submissions > 0) {
    const enough = expectedJudges > 0 && submissions >= expectedJudges;
    return enough ? "awaitingApproval" : "partialResults";
  }

  const judgesAssigned =
    (match.judgeNames?.filter((n) => n?.trim()).length ?? 0) > 0 ||
    !!match.judgeAssignment?.chairJudgeId ||
    (match.judgeAssignment?.panelistJudgeIds?.length ?? 0) > 0;

  return judgesAssigned ? "judging" : "notStarted";
}

/** Judges that were assigned to a room but have not submitted a result yet. */
export function missingJudgeNames({
  match,
  pending = [],
}: RoomStatusInput): string[] {
  const submitted = new Set(
    pending.filter((p) => p.matchId === match.id).map((p) => p.judgeName.trim())
  );
  const assigned = [match.chairName, ...(match.judgeNames ?? [])]
    .map((n) => n?.trim())
    .filter((n): n is string => !!n);
  return [...new Set(assigned)].filter((n) => !submitted.has(n));
}
