/**
 * Per-tournament join links.
 *
 * Every tournament has its own two links — one for judges, one for teams —
 * carrying the tournament id in the path, so a link from another tournament can
 * never register someone here:
 *
 *   /join/judges/<tournamentId>
 *   /join/teams/<tournamentId>
 *
 * The older token links (`/judge-register?d=...`, `/register?d=...`) keep
 * working; the pages accept either shape.
 */

export type JoinRole = "judges" | "teams";

function appBase(): string {
  return window.location.origin + import.meta.env.BASE_URL.replace(/\/$/, "");
}

export function buildJoinUrl(role: JoinRole, tournamentId: string): string {
  return `${appBase()}/join/${role}/${encodeURIComponent(tournamentId)}`;
}

/** Tournament id from the current `/join/<role>/<id>` path, if that's the route. */
export function joinTournamentIdFromPath(role: JoinRole): string | null {
  const match = window.location.pathname.match(
    new RegExp(`/join/${role}/([^/?#]+)`),
  );
  return match ? decodeURIComponent(match[1]) : null;
}
