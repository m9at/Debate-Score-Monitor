import { useEffect, useState } from "react";
import { getRegistrationLinks } from "@/lib/profilesApi";

/**
 * The optional form fields the organiser made mandatory for this tournament's
 * link. Empty until loaded, so the form never blocks on a slow request.
 */
export function useRequiredFields(
  tournamentId: string | undefined,
  kind: "team" | "judge",
): string[] {
  const [fields, setFields] = useState<string[]>([]);

  useEffect(() => {
    if (!tournamentId) return;
    let alive = true;
    void getRegistrationLinks(tournamentId)
      .then((r) => {
        if (alive) setFields(r[kind].requiredFields ?? []);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [tournamentId, kind]);

  return fields;
}
