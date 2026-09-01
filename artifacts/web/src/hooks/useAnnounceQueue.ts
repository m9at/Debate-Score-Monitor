import { useCallback, useRef, useState } from "react";

/**
 * The room-by-room walk of وضع العرض: room → animation → result → the presenter
 * presses «القاعة التالية» himself. Nothing advances on a timer and nothing ends
 * the show automatically: the presenter leaves with the ✕ button only.
 */
export function useAnnounceQueue(matchIds: string[]) {
  const [index, setIndex] = useState<number | null>(null);
  const idsRef = useRef(matchIds);
  idsRef.current = matchIds;

  const active = index !== null;
  const currentId = index !== null ? (idsRef.current[index] ?? null) : null;
  const nextId =
    index !== null ? (idsRef.current[index + 1] ?? null) : null;

  const start = useCallback(() => {
    setIndex(idsRef.current.length > 0 ? 0 : null);
  }, []);

  const stop = useCallback(() => setIndex(null), []);

  /** Moves to the following room; does nothing on the last one. */
  const next = useCallback(() => {
    setIndex((prev) =>
      prev !== null && prev + 1 < idsRef.current.length ? prev + 1 : prev,
    );
  }, []);

  /** Jumps straight to one room, so a manual إعلان joins the same walk. */
  const goTo = useCallback((matchId: string) => {
    const i = idsRef.current.indexOf(matchId);
    setIndex(i >= 0 ? i : null);
  }, []);

  return { active, currentId, nextId, hasNext: nextId !== null, start, stop, next, goTo };
}
