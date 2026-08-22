import type { Tournament, Team, TeamDocument } from "@/types/tournament";

export interface RegistrationInfo {
  tournamentId: string;
  tournamentName: string;
}

export interface TeamRegistration {
  teamName: string;
  institution: string;
  speakersPerTeam: 3 | 4;
  speakerNames: string[];
  documents: TeamDocument[];
  submittedAt: number;
}

function b64encode(s: string) {
  return btoa(unescape(encodeURIComponent(s)));
}
function b64decode(s: string) {
  return decodeURIComponent(escape(atob(s)));
}

export function encodeRegistration(reg: TeamRegistration): string {
  return b64encode(JSON.stringify(reg));
}
export function decodeRegistration(s: string): TeamRegistration | null {
  try {
    return JSON.parse(b64decode(s));
  } catch {
    return null;
  }
}

export function buildRegisterUrl(info: RegistrationInfo): string {
  const base = window.location.origin + import.meta.env.BASE_URL.replace(/\/$/, "");
  const data = b64encode(JSON.stringify(info));
  return `${base}/register?d=${encodeURIComponent(data)}`;
}

export function decodeRegisterToken(s: string): RegistrationInfo | null {
  try {
    return JSON.parse(b64decode(s));
  } catch {
    return null;
  }
}

export function encodeTournamentForAdmin(t: Tournament): string {
  return b64encode(JSON.stringify(t));
}
export function decodeAdminTournament(s: string): Tournament | null {
  try {
    return JSON.parse(b64decode(s));
  } catch {
    return null;
  }
}

export function buildAdminUrl(t: Tournament): string {
  const base = window.location.origin + import.meta.env.BASE_URL.replace(/\/$/, "");
  const data = encodeTournamentForAdmin(t);
  return `${base}/import?d=${encodeURIComponent(data)}`;
}

export function registrationToTeam(reg: TeamRegistration): Team {
  return {
    id: crypto.randomUUID(),
    name: reg.teamName,
    speakersPerTeam: reg.speakersPerTeam,
    speakerNames: reg.speakerNames,
    institution: reg.institution,
    documents: reg.documents,
    registeredAt: reg.submittedAt,
    totalPoints: 0,
    wins: 0,
    losses: 0,
    matchesPlayed: 0,
  };
}
