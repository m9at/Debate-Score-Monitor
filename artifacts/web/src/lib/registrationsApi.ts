import type {
  PendingTeamRegistration,
  PendingJudgeRegistration,
  TeamDocument,
} from "@/types/tournament";

const API_BASE = "/api";

/**
 * قواعد البطولة as published for the public links — the single source the
 * registration pages and the judging screens read.
 */
export interface PublicTournamentRules {
  /** Allowed team sizes, e.g. [3, 4]. */
  speakersPerTeam?: number[];
  scoreMin?: number;
  scoreMax?: number;
  judgesPerRoom?: number;
  replySpeech?: boolean;
  /** Free-text rules written by the organiser. */
  text?: string;
}

export interface PublicTournamentInfo {
  id: string;
  name: string;
  topic: string;
  rules?: PublicTournamentRules;
}

export type RegistrationKind = "team" | "judge";

export interface ServerRegistration {
  id: string;
  tournamentId: string;
  kind: RegistrationKind;
  payload:
    | TeamRegistrationPayload
    | JudgeRegistrationPayload;
  createdAt: string;
}

export interface TeamRegistrationPayload {
  teamName: string;
  institution: string;
  speakersPerTeam: 3 | 4;
  speakerNames: string[];
  documents: TeamDocument[];
  submittedAt: number;
}

export interface JudgeRegistrationPayload {
  name: string;
  institution: string;
  experience: string;
  canChair: boolean;
  submittedAt: number;
}

async function http<T>(
  path: string,
  init?: RequestInit & { silent?: boolean },
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
  }
  return (await res.json()) as T;
}

export async function publishTournament(
  info: PublicTournamentInfo,
): Promise<void> {
  await http(`/tournaments/${encodeURIComponent(info.id)}`, {
    method: "PUT",
    body: JSON.stringify({
      name: info.name,
      topic: info.topic,
      rules: info.rules ?? null,
    }),
  });
}

export async function fetchPublicTournament(
  id: string,
): Promise<PublicTournamentInfo | null> {
  try {
    return await http<PublicTournamentInfo>(
      `/tournaments/${encodeURIComponent(id)}`,
    );
  } catch {
    return null;
  }
}

export async function submitTeamRegistration(
  tournamentId: string,
  payload: TeamRegistrationPayload,
): Promise<{ id: string }> {
  return http<{ id: string }>(
    `/tournaments/${encodeURIComponent(tournamentId)}/registrations`,
    {
      method: "POST",
      body: JSON.stringify({ kind: "team", payload }),
    },
  );
}

export async function submitJudgeRegistration(
  tournamentId: string,
  payload: JudgeRegistrationPayload,
): Promise<{ id: string }> {
  return http<{ id: string }>(
    `/tournaments/${encodeURIComponent(tournamentId)}/registrations`,
    {
      method: "POST",
      body: JSON.stringify({ kind: "judge", payload }),
    },
  );
}

export async function listRegistrations(
  tournamentId: string,
): Promise<ServerRegistration[]> {
  return http<ServerRegistration[]>(
    `/tournaments/${encodeURIComponent(tournamentId)}/registrations`,
  );
}

export async function deleteRegistration(
  tournamentId: string,
  registrationId: string,
): Promise<void> {
  await http(
    `/tournaments/${encodeURIComponent(tournamentId)}/registrations/${encodeURIComponent(registrationId)}`,
    { method: "DELETE" },
  );
}

export function toPendingTeam(
  reg: ServerRegistration,
): PendingTeamRegistration | null {
  if (reg.kind !== "team") return null;
  const p = reg.payload as TeamRegistrationPayload;
  return {
    id: reg.id,
    teamName: p.teamName,
    institution: p.institution,
    speakersPerTeam: p.speakersPerTeam,
    speakerNames: p.speakerNames,
    documents: p.documents,
    submittedAt: p.submittedAt,
  };
}

export function toPendingJudge(
  reg: ServerRegistration,
): PendingJudgeRegistration | null {
  if (reg.kind !== "judge") return null;
  const p = reg.payload as JudgeRegistrationPayload;
  return {
    id: reg.id,
    name: p.name,
    institution: p.institution,
    experience: p.experience,
    canChair: p.canChair,
    submittedAt: p.submittedAt,
  };
}
