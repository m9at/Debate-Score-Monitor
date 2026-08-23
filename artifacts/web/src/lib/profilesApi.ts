const API_BASE = "/api";

export type ProfileRole = "judge" | "team";
export type ParticipationStatus = "pending" | "approved" | "withdrawn";
export type LinkState = "open" | "closed" | "archived";

export interface JudgeProfileRecord {
  id: string;
  name: string;
  contact: string;
  contactKind: "phone" | "email";
  photoUrl: string | null;
  institution: string | null;
  experience: string | null;
  details: Record<string, unknown>;
}

export interface TeamProfileRecord {
  id: string;
  name: string;
  contact: string;
  contactKind: "phone" | "email";
  logoUrl: string | null;
  institution: string | null;
  lastMembers: string[];
  details: Record<string, unknown>;
}

export interface ParticipationRecord {
  id: string;
  tournamentId: string;
  role: ProfileRole;
  profileId: string;
  status: ParticipationStatus;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface RegistrationLinkRecord {
  id: string;
  tournamentId: string;
  kind: ProfileRole extends never ? never : "team" | "judge";
  state: LinkState;
}

/** A participant row as the admin panel shows it. */
export interface ParticipantRecord<P> {
  id: string;
  status: ParticipationStatus;
  payload: Record<string, unknown>;
  createdAt: string;
  profile: P | null;
}

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

/** Is there already a permanent profile behind this phone/email? */
export function lookupProfile<P>(
  role: ProfileRole,
  contact: string,
): Promise<
  { found: false } | { found: true; profile: P; participations: ParticipationRecord[] }
> {
  return http(
    `/profiles/${role}/lookup?contact=${encodeURIComponent(contact)}`,
  );
}

export interface RegisterInput {
  name: string;
  contact: string;
  institution?: string;
  /** judge */
  photoUrl?: string;
  experience?: string;
  /** team */
  logoUrl?: string;
  /** Per-tournament data, e.g. this tournament's speaker list. */
  payload?: Record<string, unknown>;
  details?: Record<string, unknown>;
}

/** Register / join a tournament — creates the profile only on the first visit. */
export function registerForTournament<P>(
  tournamentId: string,
  role: ProfileRole,
  input: RegisterInput,
): Promise<{ ok: true; reused: boolean; profile: P }> {
  return http(`/tournaments/${tournamentId}/registrations/${role}`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function listParticipants<P>(
  tournamentId: string,
  role: ProfileRole,
): Promise<ParticipantRecord<P>[]> {
  return http(`/tournaments/${tournamentId}/registrations/${role}`);
}

export function setParticipationStatus(
  participationId: string,
  status: ParticipationStatus,
): Promise<{ ok: true }> {
  return http(`/registrations/${participationId}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function getRegistrationLinks(
  tournamentId: string,
): Promise<{ team: RegistrationLinkRecord; judge: RegistrationLinkRecord }> {
  return http(`/tournaments/${tournamentId}/registration-links`);
}

export function setRegistrationLinkState(
  tournamentId: string,
  kind: "team" | "judge",
  state: LinkState,
): Promise<{ ok: true; state: LinkState }> {
  return http(`/tournaments/${tournamentId}/registration-links/${kind}`, {
    method: "PATCH",
    body: JSON.stringify({ state }),
  });
}
