import { useEffect } from "react";
import { recordPublicView } from "@/lib/publicStatsApi";

/**
 * Counts one visit of وضع الجمهور. Only the public pages call it, so admin
 * panel activity is never counted as audience interest.
 */
export function usePublicViewTracker(
  tournamentId: string | undefined,
  opts: { round?: number; result?: boolean } = {},
) {
  const { round, result } = opts;
  useEffect(() => {
    if (!tournamentId) return;
    void recordPublicView(tournamentId, { round, result });
  }, [tournamentId, round, result]);
}
