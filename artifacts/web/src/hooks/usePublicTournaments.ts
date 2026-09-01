import { useEffect, useState } from "react";
import type { Tournament } from "@/types/tournament";
import { fetchAllShared } from "@/lib/sharedTournamentsApi";

const POLL_MS = 10000;

/** True when the organiser allowed the audience to follow this tournament. */
export function isPubliclyVisible(t: Tournament): boolean {
  return t.publicVisible === true && !t.archived;
}

/**
 * وضع الجمهور reads the SAME shared tournaments the admin panel writes, but
 * strictly read-only: it never touches the admin store and never pushes
 * anything back, so the audience can only ever watch. Polling keeps the page in
 * step with the panel — a newly announced result appears on its own.
 */
export function usePublicTournaments() {
  const [tournaments, setTournaments] = useState<Tournament[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const rows = await fetchAllShared();
        if (!alive) return;
        setTournaments(rows.map((r) => r.data).filter(isPubliclyVisible));
        setError(false);
      } catch {
        if (alive) setError(true);
      }
    };
    void load();
    const timer = window.setInterval(load, POLL_MS);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, []);

  return { tournaments, loading: tournaments === null && !error, error };
}

/** One publicly visible tournament, or `null` when it is not shared. */
export function usePublicTournament(id: string) {
  const { tournaments, loading, error } = usePublicTournaments();
  return {
    tournament: tournaments?.find((t) => t.id === id) ?? null,
    loading,
    error,
  };
}
