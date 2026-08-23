import { entities } from "@/api/base44Client";

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
  kind: "team" | "judge";
  state: LinkState;
}

export interface ParticipantRecord<P> {
  id: string;
  status: ParticipationStatus;
  payload: Record<string, unknown>;
  createdAt: string;
  profile: P | null;
}

function normalizeContact(v: string) {
  return v.trim().toLowerCase().replace(/\s+/g, "");
}

function profileFromRow(row: any): JudgeProfileRecord | TeamProfileRecord {
  if (row.role === "team") {
    return {
      id: row.profile_id,
      name: row.name,
      contact: row.contact,
      contactKind: row.contact_kind ?? (row.contact?.includes("@") ? "email" : "phone"),
      logoUrl: row.logo_url ?? null,
      institution: row.institution ?? null,
      lastMembers: row.last_members ?? [],
      details: row.details ?? {},
    };
  }
  return {
    id: row.profile_id,
    name: row.name,
    contact: row.contact,
    contactKind: row.contact_kind ?? (row.contact?.includes("@") ? "email" : "phone"),
    photoUrl: row.photo_url ?? null,
    institution: row.institution ?? null,
    experience: row.experience ?? null,
    details: row.details ?? {},
  };
}

function participationFromRow(row: any): ParticipationRecord {
  return {
    id: row.participation_id,
    tournamentId: row.tournament_id,
    role: row.role,
    profileId: row.profile_id,
    status: row.status,
    payload: row.payload ?? {},
    createdAt: row.created_date ?? new Date(row.created_at_ms ?? Date.now()).toISOString(),
  };
}

export async function lookupProfile<P>(
  role: ProfileRole,
  contact: string,
): Promise<{ found: false } | { found: true; profile: P; participations: ParticipationRecord[] }> {
  const normalized = normalizeContact(contact);
  const rows = await entities.ParticipantProfile.filter({ role, contact: normalized }, "-updated_date", 1);
  const row = rows[0];
  if (!row) return { found: false };
  const parts = await entities.TournamentParticipation.filter({ profile_id: row.profile_id, role }, "-created_date", 5000);
  return {
    found: true,
    profile: profileFromRow(row) as P,
    participations: parts.map(participationFromRow),
  };
}

export interface RegisterInput {
  name: string;
  contact: string;
  institution?: string;
  photoUrl?: string;
  experience?: string;
  logoUrl?: string;
  payload?: Record<string, unknown>;
  details?: Record<string, unknown>;
}

export async function registerForTournament<P>(
  tournamentId: string,
  role: ProfileRole,
  input: RegisterInput,
): Promise<{ ok: true; reused: boolean; profile: P }> {
  const link = (await getRegistrationLinks(tournamentId))[role];
  if (link.state !== "open") throw new Error("التسجيل مغلق لهذه البطولة");

  const contact = normalizeContact(input.contact);
  const found = await entities.ParticipantProfile.filter({ role, contact }, "-updated_date", 1);
  let profileRow = found[0];
  const profileId = profileRow?.profile_id ?? crypto.randomUUID();
  const payloadMembers = Array.isArray(input.payload?.speakerNames)
    ? (input.payload?.speakerNames as string[])
    : Array.isArray(input.payload?.members)
      ? (input.payload?.members as string[])
      : [];
  const profilePayload = {
    profile_id: profileId,
    role,
    name: input.name.trim(),
    contact,
    contact_kind: contact.includes("@") ? "email" : "phone",
    photo_url: input.photoUrl ?? profileRow?.photo_url ?? "",
    logo_url: input.logoUrl ?? profileRow?.logo_url ?? "",
    institution: input.institution ?? profileRow?.institution ?? "",
    experience: input.experience ?? profileRow?.experience ?? "",
    last_members: role === "team" && payloadMembers.length ? payloadMembers : (profileRow?.last_members ?? []),
    details: input.details ?? profileRow?.details ?? {},
    updated_at_ms: Date.now(),
  };
  if (profileRow) profileRow = await entities.ParticipantProfile.update(profileRow.id, profilePayload);
  else profileRow = await entities.ParticipantProfile.create(profilePayload);

  const existingParts = await entities.TournamentParticipation.filter({
    tournament_id: tournamentId,
    role,
    profile_id: profileId,
  }, "-updated_date", 1);
  const partPayload = {
    participation_id: existingParts[0]?.participation_id ?? crypto.randomUUID(),
    tournament_id: tournamentId,
    role,
    profile_id: profileId,
    status: existingParts[0]?.status ?? "pending",
    payload: input.payload ?? {},
    created_at_ms: existingParts[0]?.created_at_ms ?? Date.now(),
    updated_at_ms: Date.now(),
  };
  if (existingParts[0]) await entities.TournamentParticipation.update(existingParts[0].id, partPayload);
  else await entities.TournamentParticipation.create(partPayload);

  return { ok: true, reused: !!found[0], profile: profileFromRow(profileRow) as P };
}

export async function listParticipants<P>(
  tournamentId: string,
  role: ProfileRole,
): Promise<ParticipantRecord<P>[]> {
  const parts = await entities.TournamentParticipation.filter({ tournament_id: tournamentId, role }, "-created_date", 5000);
  const profileIds = [...new Set(parts.map((p: any) => p.profile_id))];
  const profileRows = await Promise.all(profileIds.map(async (profileId) => {
    const rows = await entities.ParticipantProfile.filter({ profile_id: profileId, role }, "-updated_date", 1);
    return rows[0] ?? null;
  }));
  const byId = new Map(profileRows.filter(Boolean).map((p: any) => [p.profile_id, p]));
  return parts.map((row: any) => ({
    id: row.participation_id,
    status: row.status,
    payload: row.payload ?? {},
    createdAt: row.created_date ?? new Date(row.created_at_ms ?? Date.now()).toISOString(),
    profile: byId.get(row.profile_id) ? profileFromRow(byId.get(row.profile_id)) as P : null,
  }));
}

export async function setParticipationStatus(
  participationId: string,
  status: ParticipationStatus,
): Promise<{ ok: true }> {
  const rows = await entities.TournamentParticipation.filter({ participation_id: participationId }, "-updated_date", 1);
  if (!rows[0]) throw new Error("التسجيل غير موجود");
  await entities.TournamentParticipation.update(rows[0].id, { status, updated_at_ms: Date.now() });
  return { ok: true };
}

async function ensureLink(tournamentId: string, kind: "team" | "judge"): Promise<RegistrationLinkRecord> {
  const rows = await entities.RegistrationLink.filter({ tournament_id: tournamentId, kind }, "-updated_date", 1);
  let row = rows[0];
  if (!row) {
    row = await entities.RegistrationLink.create({
      link_id: `${tournamentId}-${kind}`,
      tournament_id: tournamentId,
      kind,
      state: "open",
      updated_at_ms: Date.now(),
    });
  }
  return { id: row.link_id, tournamentId: row.tournament_id, kind: row.kind, state: row.state };
}

export async function getRegistrationLinks(
  tournamentId: string,
): Promise<{ team: RegistrationLinkRecord; judge: RegistrationLinkRecord }> {
  const [team, judge] = await Promise.all([
    ensureLink(tournamentId, "team"),
    ensureLink(tournamentId, "judge"),
  ]);
  return { team, judge };
}

export async function setRegistrationLinkState(
  tournamentId: string,
  kind: "team" | "judge",
  state: LinkState,
): Promise<{ ok: true; state: LinkState }> {
  await ensureLink(tournamentId, kind);
  const rows = await entities.RegistrationLink.filter({ tournament_id: tournamentId, kind }, "-updated_date", 1);
  await entities.RegistrationLink.update(rows[0].id, { state, updated_at_ms: Date.now() });
  return { ok: true, state };
}
