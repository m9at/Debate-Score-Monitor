import type { Match, Round, Tournament } from "@/types/tournament";
import type { RoomInfo, RoundData } from "@/lib/judgeCodec";

/**
 * The round as the judging link sees it: rooms, rosters and — so the link can
 * identify the judge itself — the judges assigned to each room. Team names and
 * speakers are read live from `tournament.teams`, so re-syncing after a team
 * edit pushes the latest names to every open judge link.
 */
export function buildRoundSessionData(
  tournament: Tournament,
  round: Round,
  matches: Match[] = round.matches,
): RoundData {
  const rooms: RoomInfo[] = matches.map((m) => {
    const gov = tournament.teams.find((t) => t.id === m.team1.teamId);
    const opp = tournament.teams.find((t) => t.id === m.team2.teamId);
    const a = m.judgeAssignment;
    const ids = [
      ...(a?.chairJudgeId ? [a.chairJudgeId] : []),
      ...(a?.panelistJudgeIds ?? []),
    ];
    return {
      roomNumber: m.roomNumber,
      roomLabel: m.roomLabel,
      matchId: m.id,
      govTeamName: gov?.name ?? "الموالاة",
      oppTeamName: opp?.name ?? "المعارضة",
      govTeamId: m.team1.teamId,
      govSpeakerNames: gov?.speakerNames ?? [],
      oppSpeakerNames: opp?.speakerNames ?? [],
      govSpeakersCount: gov?.speakersPerTeam ?? 3,
      oppSpeakersCount: opp?.speakersPerTeam ?? 3,
      judges: ids
        .map((id) => {
          const j = (tournament.judges ?? []).find((x) => x.id === id);
          return j ? { id: j.id, name: j.name, chair: a?.chairJudgeId === id } : null;
        })
        .filter(Boolean) as { id: string; name: string; chair: boolean }[],
    };
  });
  return {
    tournamentId: tournament.id,
    tournamentName: tournament.name,
    roundNumber: round.roundNumber,
    rooms,
    caseText: round.caseText,
    replySpeech: tournament.settings?.replySpeech ?? true,
    rules: tournament.settings?.rules,
  };
}
