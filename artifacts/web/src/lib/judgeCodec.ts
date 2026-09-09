export interface JudgeMatchInfo {
  matchId: string;
  roundNumber: number;
  roomNumber: number;
  tournamentId?: string;
  tournamentName: string;
  govTeamName: string;
  oppTeamName: string;
  govTeamId: string;
  govSpeakerNames: string[];
  oppSpeakerNames: string[];
  speakersPerTeam: number;
  govSpeakersCount?: number;
  oppSpeakersCount?: number;
  caseText?: string;
}

export interface JudgeScores {
  govSpeakers: { speakerNumber: number; name: string; score: number }[];
  govReplySpeakerNumber: number;
  govReplyScore: number;
  oppSpeakers: { speakerNumber: number; name: string; score: number }[];
  oppReplySpeakerNumber: number;
  oppReplyScore: number;
  govTeamId: string;
  judgeName: string;
  chairName?: string;
  judgeNotes: string;
  submittedAt: number;
  matchId?: string;
  roundNumber?: number;
  roomNumber?: number;
}

/** A judge assigned to a room, as carried by the judging link. */
export interface RoomJudge {
  id: string;
  name: string;
  chair?: boolean;
}

export interface RoomInfo {
  roomNumber: number;
  roomLabel?: string;
  matchId: string;
  govTeamName: string;
  oppTeamName: string;
  govTeamId: string;
  govSpeakerNames: string[];
  oppSpeakerNames: string[];
  govSpeakersCount: number;
  oppSpeakersCount: number;
  /** Judges assigned to this room — lets the link greet the judge by name. */
  judges?: RoomJudge[];
}

export interface RoundData {
  tournamentId?: string;
  tournamentName: string;
  roundNumber: number;
  rooms: RoomInfo[];
  caseText?: string;
}

export function encodeScores(scores: JudgeScores): string {
  const json = JSON.stringify(scores);
  return btoa(unescape(encodeURIComponent(json)));
}

export function decodeScores(encoded: string): JudgeScores | null {
  try {
    const json = decodeURIComponent(escape(atob(encoded)));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function buildSessionUrl(kind: "match" | "round", sessionId: string): string {
  const base = window.location.origin + import.meta.env.BASE_URL.replace(/\/$/, "");
  return kind === "match" ? `${base}/judge/${sessionId}` : `${base}/judge/round/${sessionId}`;
}

/**
 * A judging link bound to one judge: the page identifies them from the link and
 * never asks for a name, so nobody can score under a colleague's identity.
 */
export function buildJudgeSessionUrl(sessionId: string, judgeId: string): string {
  return `${buildSessionUrl("round", sessionId)}?j=${encodeURIComponent(judgeId)}`;
}
