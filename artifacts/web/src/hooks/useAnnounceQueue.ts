import { useCallback, useEffect, useRef, useState } from "react";

/** How long a revealed result stays on screen before the next room. */
export const HOLD_MS = 5000;

/**
 * The auto-play queue of وضع العرض: room → animation → result → 5 full seconds
 * → next room.
 *
 * The timer lives in a ref, so re-rendering the screen (a background refresh,
 * a state update) never restarts the hold and never ends the show. The clock
 * only starts once a result is actually on screen — `revealed()` — never when
 * the page mounts.
 */
export function useAnnounceQueue(matchIds: string[]) {
  const [index, setIndex] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const idsRef = useRef(matchIds);
  idsRef.current = matchIds;
  const timerRef = useRef<number | null>(null);
  /** The room whose hold is already scheduled — keeps repeats harmless. */
  const scheduledRef = useRef<string | null>(null);

  const clear = () => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = null;
  };

  useEffect(() => clear, []);

  const active = index !== null;
  const currentId = index !== null ? (idsRef.current[index] ?? null) : null;

  const start = useCallback(() => {
    clear();
    scheduledRef.current = null;
    setDone(false);
    setIndex(idsRef.current.length > 0 ? 0 : null);
  }, []);

  const stop = useCallback(() => {
    clear();
    scheduledRef.current = null;
    setIndex(null);
    setDone(false);
  }, []);

  /** Called by the reveal animation once the winner is on screen. */
  const revealed = useCallback((matchId: string) => {
    if (index === null || scheduledRef.current === matchId) return;
    scheduledRef.current = matchId;
    clear();
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      setIndex((prev) => {
        const next = (prev ?? 0) + 1;
        if (next >= idsRef.current.length) {
          setDone(true);
          return null;
        }
        return next;
      });
    }, HOLD_MS);
  }, [index]);

  return { active, currentId, done, start, stop, revealed };
}
