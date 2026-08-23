import type {
  PendingTeamRegistration,
  PendingJudgeRegistration,
  TeamDocument,
} from "@/types/tournament";
import { entities } from "@/api/base44Client";

export interface PublicTournamentInfo {
  id: string;
  name: string;
  topic: string;
}

export type RegistrationKind = "team" | "judge";

export interface ServerRegistration {
  id: string;
  tournamentId: string;
  kind: RegistrationKind;
  payload: TeamRegistrationPayload | JudgeRegistrationPayload;
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

export async function publishTournament(info: PublicTournamentInfo): Promise<void> {
  const rows = await entities.PublicTournament.filter({ tournament_id: info.id }, "-updated_date", 1);
  const payload = {
    tournament_id: info.id,
    name: info.name,
    topic: info.topic ?? "",
    updated_at_ms: Date.now(),
  };
  if (rows[0]) await entities.PublicTournament.update(rows[0].id, payload);
  else await entities.PublicTournament.create(payload);
}

export async function fetchPublicTournament(id: string): Promise<PublicTournamentInfo | null> {
  const rows = await entities.PublicTournament.filter({ tournament_id: id }, "-updated_date", 1);
  const row = rows[0];
  if (!row) return null;
  return { id: row.tournament_id, name: row.name, topic: row.topic ?? "" };
}

async function submitRegistration(
  tournamentId: string,
  kind: RegistrationKind,
  payload: TeamRegistrationPayload | JudgeRegistrationPayload,
): Promise<{ id: string }> {
  const registrationId = crypto.randomUUID();
  await entities.TournamentRegistration.create({
    registration_id: registrationId,
    tournament_id: tournamentId,
    kind,
    payload,
    created_at_ms: Date.now(),
  });
  return { id: registrationId };
}

export function submitTeamRegistration(
  tournamentId: string,
  payload: TeamRegistrationPayload,
): Promise<{ id: string }> {
  return submitRegistration(tournamentId, "team", payload);
}

export function submitJudgeRegistration(
  tournamentId: string,
  payload: JudgeRegistrationPayload,
): Promise<{ id: string }> {
  return submitRegistration(tournamentId, "judge", payload);
}

export async function listRegistrations(tournamentId: string): Promise<ServerRegistration[]> {
  const rows = await entities.TournamentRegistration.filter({ tournament_id: tournamentId }, "-created_date", 5000);
  return rows.map((row: any) => ({
    id: row.registration_id,
    tournamentId: row.tournament_id,
    kind: row.kind,
    payload: row.payload,
    createdAt: row.created_date ?? new Date(row.created_at_ms ?? Date.now()).toISOString(),
  }));
}

export async function deleteRegistration(
  tournamentId: string,
  registrationId: string,
): Promise<void> {
  const rows = await entities.TournamentRegistration.filter({
    tournament_id: tournamentId,
    registration_id: registrationId,
  }, "-created_date", 1);
  if (rows[0]) await entities.TournamentRegistration.delete(rows[0].id);
}

export function toPendingTeam(reg: ServerRegistration): PendingTeamRegistration | null {
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

export function toPendingJudge(reg: ServerRegistration): PendingJudgeRegistration | null {
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
