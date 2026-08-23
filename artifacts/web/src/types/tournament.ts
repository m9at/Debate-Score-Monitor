export interface Speaker {
  speakerNumber: number;
  name: string;
  score: number;
}

export interface MatchTeam {
  teamId: string;
  role: "government" | "opposition";
  speakers: Speaker[];
  replyScore: number;
  replySpeakerNumber: number;
  replySpeakerName?: string;
  totalScore: number;
}

export interface MatchJudgeAssignment {
  chairJudgeId?: string;
  panelistJudgeIds: string[];
}

export interface Match {
  id: string;
  roomNumber: number;
  roomLabel?: string;
  team1: MatchTeam;
  team2: MatchTeam;
  winnerId: string | null;
  bestSpeaker: { name: string; teamId: string; score: number } | null;
  judgeNames: string[];
  chairName?: string;
  judgeNotes: string;
  completed: boolean;
  judgeAssignment?: MatchJudgeAssignment;
}

export interface Round {
  roundNumber: number;
  matches: Match[];
  completed: boolean;
  caseText?: string;
  judgesPerRoom?: number;
  kind?: "regular" | "semifinal" | "final";
}

export interface TeamDocument {
  name: string;
  type: string;
  dataUrl: string;
}

export interface Team {
  id: string;
  name: string;
  speakerNames: string[];
  speakersPerTeam: 3 | 4;
  totalPoints: number;
  wins: number;
  losses: number;
  matchesPlayed: number;
  institution?: string;
  documents?: TeamDocument[];
  registeredAt?: number;
}

export interface Judge {
  id: string;
  name: string;
  institution?: string;
  experience?: string;
  canChair: boolean;
  conflictTeamIds: string[];
  registeredAt?: number;
  /** Temporarily unavailable — kept in the list but skipped by the draw. */
  disabled?: boolean;
}

export interface PendingJudgeRegistration {
  id: string;
  name: string;
  institution?: string;
  experience?: string;
  canChair: boolean;
  submittedAt: number;
}

export interface PendingTeamRegistration {
  id: string;
  teamName: string;
  institution?: string;
  speakersPerTeam: 3 | 4;
  speakerNames: string[];
  documents?: TeamDocument[];
  submittedAt: number;
}

export interface PendingMatchResult {
  id: string;
  matchId: string;
  roundNumber: number;
  roomNumber?: number;
  rawCode: string;
  govTeamId: string;
  govTeamName: string;
  oppTeamName: string;
  govSpeakers: { speakerNumber: number; name: string; score: number }[];
  oppSpeakers: { speakerNumber: number; name: string; score: number }[];
  govReplySpeakerNumber: number;
  govReplyScore: number;
  oppReplySpeakerNumber: number;
  oppReplyScore: number;
  judgeName: string;
  chairName?: string;
  judgeNotes: string;
  submittedAt: number;
}

/** A physical debate room. The number is stable; only the label is editable. */
export interface Room {
  id: string;
  number: number;
  label: string;
}

/** Format rules chosen while creating the tournament. */
export interface TournamentSettings {
  /** Reply speeches enabled — only speaker 1 or 2 may deliver one. */
  replySpeech: boolean;
  /** Government / opposition sides (always true for BP-style debates). */
  sides: boolean;
  scoreMin: number;
  scoreMax: number;
  judgesPerRoom: number;
  rules?: string;
  /** Show team scores on the public announcement screen. */
  showScoresOnAnnounce: boolean;
}

export interface Tournament {
  id: string;
  name: string;
  createdAt: number;
  totalRounds: number;
  teams: Team[];
  rounds: Round[];
  currentRound: number;
  started: boolean;
  finished: boolean;
  judges?: Judge[];
  pendingTeams?: PendingTeamRegistration[];
  pendingJudges?: PendingJudgeRegistration[];
  pendingResults?: PendingMatchResult[];
  semifinalEnabled?: boolean;
  finalEnabled?: boolean;
  /** Access-code protection for viewing and editing this tournament. */
  protection?: TournamentProtection;
  /** Hidden from the main list until restored. */
  archived?: boolean;
  /** Optional schedule — drives the "قادمة / جارية" status. */
  startDate?: number;
  endDate?: number;
  description?: string;
  /** Optional tournament logo (data URL), shown next to the brand logo. */
  logoDataUrl?: string;
  /** Rooms defined during setup. */
  rooms?: Room[];
  /** Format settings defined during setup. */
  settings?: TournamentSettings;
}

export interface TournamentProtection {
  enabled: boolean;
  /** 4 or 6 digits. */
  code: string;
  /** Ask for the code before the tournament can be viewed at all. */
  protectView: boolean;
  /** Ask for the code before rounds, scores and settings can be changed. */
  protectEdit: boolean;
}

export interface TournamentGroup {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  tournamentIds: string[];
}
