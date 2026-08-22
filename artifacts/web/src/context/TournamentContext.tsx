import { createContext, useContext, useReducer, useEffect, useCallback, useRef, type ReactNode } from "react";
import type {
  Tournament,
  Team,
  Match,
  MatchTeam,
  Speaker,
  Round,
  Judge,
  PendingTeamRegistration,
  PendingJudgeRegistration,
  PendingMatchResult,
  MatchJudgeAssignment,
} from "@/types/tournament";
import {
  fetchAllShared,
  pushShared,
  deleteShared,
} from "@/lib/sharedTournamentsApi";

const STORAGE_KEY = "debate_tournaments_v2";
const SYNC_POLL_MS = 8000;
const SYNC_DEBOUNCE_MS = 800;

interface TournamentState {
  tournaments: Tournament[];
}

type Action =
  | { type: "LOAD"; tournaments: Tournament[] }
  | { type: "IMPORT_TOURNAMENT"; tournament: Tournament; overwrite: boolean }
  | { type: "ADD_TOURNAMENT"; tournament: Tournament }
  | { type: "DELETE_TOURNAMENT"; id: string }
  | { type: "UPDATE_TOURNAMENT"; tournament: Tournament }
  | { type: "ADD_TEAM"; tournamentId: string; team: Team }
  | { type: "DELETE_TEAM"; tournamentId: string; teamId: string }
  | { type: "UPDATE_TEAM"; tournamentId: string; team: Team }
  | { type: "START_TOURNAMENT"; tournamentId: string }
  | { type: "GENERATE_ROUND"; tournamentId: string }
  | { type: "GENERATE_SEMIFINAL"; tournamentId: string }
  | { type: "GENERATE_FINAL"; tournamentId: string }
  | { type: "SET_ELIMINATION_MODE"; tournamentId: string; semifinal: boolean; final: boolean }
  | { type: "SUBMIT_MATCH"; tournamentId: string; roundNumber: number; match: Match }
  | { type: "SET_ROUND_CASE"; tournamentId: string; roundNumber: number; caseText: string }
  | { type: "SET_MATCH_ROOM"; tournamentId: string; roundNumber: number; matchId: string; roomNumber?: number; roomLabel?: string }
  | { type: "ADD_JUDGE"; tournamentId: string; judge: Judge }
  | { type: "UPDATE_JUDGE"; tournamentId: string; judge: Judge }
  | { type: "DELETE_JUDGE"; tournamentId: string; judgeId: string }
  | { type: "ADD_PENDING_TEAM"; tournamentId: string; pending: PendingTeamRegistration }
  | { type: "REMOVE_PENDING_TEAM"; tournamentId: string; pendingId: string }
  | { type: "ADD_PENDING_JUDGE"; tournamentId: string; pending: PendingJudgeRegistration }
  | { type: "REMOVE_PENDING_JUDGE"; tournamentId: string; pendingId: string }
  | { type: "ADD_PENDING_RESULT"; tournamentId: string; pending: PendingMatchResult }
  | { type: "REMOVE_PENDING_RESULT"; tournamentId: string; pendingId: string }
  | { type: "SET_ROUND_JUDGES_PER_ROOM"; tournamentId: string; roundNumber: number; judgesPerRoom: number }
  | { type: "SET_MATCH_JUDGES"; tournamentId: string; roundNumber: number; matchId: string; assignment: MatchJudgeAssignment }
  | { type: "FINISH_TOURNAMENT"; tournamentId: string }
  | { type: "REOPEN_TOURNAMENT"; tournamentId: string }
  | { type: "DELETE_ROUND"; tournamentId: string; roundNumber: number };

function reducer(state: TournamentState, action: Action): TournamentState {
  switch (action.type) {
    case "LOAD":
      return { tournaments: action.tournaments };
    case "ADD_TOURNAMENT":
      return { tournaments: [...state.tournaments, action.tournament] };
    case "IMPORT_TOURNAMENT": {
      const exists = state.tournaments.some((t) => t.id === action.tournament.id);
      if (exists) {
        if (!action.overwrite) return state;
        return {
          tournaments: state.tournaments.map((t) =>
            t.id === action.tournament.id ? action.tournament : t
          ),
        };
      }
      return { tournaments: [...state.tournaments, action.tournament] };
    }
    case "DELETE_TOURNAMENT":
      return { tournaments: state.tournaments.filter((t) => t.id !== action.id) };
    case "UPDATE_TOURNAMENT":
      return {
        tournaments: state.tournaments.map((t) =>
          t.id === action.tournament.id ? action.tournament : t
        ),
      };
    case "ADD_TEAM": {
      return {
        tournaments: state.tournaments.map((t) => {
          if (t.id !== action.tournamentId) return t;
          return { ...t, teams: [...t.teams, action.team] };
        }),
      };
    }
    case "DELETE_TEAM": {
      return {
        tournaments: state.tournaments.map((t) => {
          if (t.id !== action.tournamentId) return t;
          return { ...t, teams: t.teams.filter((team) => team.id !== action.teamId) };
        }),
      };
    }
    case "UPDATE_TEAM": {
      return {
        tournaments: state.tournaments.map((t) => {
          if (t.id !== action.tournamentId) return t;
          const newTeam = action.team;
          const updatedRounds = t.rounds.map((round) => {
            const updatedMatches = round.matches.map((m) => {
              if (m.completed) return m;
              const isTeam1 = m.team1.teamId === newTeam.id;
              const isTeam2 = m.team2.teamId === newTeam.id;
              if (!isTeam1 && !isTeam2) return m;
              const syncMatchTeam = (mt: MatchTeam): MatchTeam => {
                const count = newTeam.speakersPerTeam;
                const newSpeakers: Speaker[] = Array.from(
                  { length: count },
                  (_, i) => {
                    const existing = mt.speakers[i];
                    return {
                      speakerNumber: i + 1,
                      name: newTeam.speakerNames[i] || `متحدث ${i + 1}`,
                      score: existing?.score ?? 0,
                    };
                  }
                );
                const replyNum =
                  mt.replySpeakerNumber > count ? 1 : mt.replySpeakerNumber;
                return {
                  ...mt,
                  speakers: newSpeakers,
                  replySpeakerNumber: replyNum,
                };
              };
              return {
                ...m,
                team1: isTeam1 ? syncMatchTeam(m.team1) : m.team1,
                team2: isTeam2 ? syncMatchTeam(m.team2) : m.team2,
              };
            });
            return { ...round, matches: updatedMatches };
          });
          return {
            ...t,
            teams: t.teams.map((team) => (team.id === newTeam.id ? newTeam : team)),
            rounds: updatedRounds,
          };
        }),
      };
    }
    case "START_TOURNAMENT": {
      return {
        tournaments: state.tournaments.map((t) => {
          if (t.id !== action.tournamentId) return t;
          return { ...t, started: true, currentRound: 1 };
        }),
      };
    }
    case "GENERATE_ROUND": {
      return {
        tournaments: state.tournaments.map((t) => {
          if (t.id !== action.tournamentId) return t;
          const round = generateRound(t);
          if (!round) return t;
          const newTotal = Math.max(t.totalRounds, t.rounds.length + 1);
          return {
            ...t,
            rounds: [...t.rounds, round],
            totalRounds: newTotal,
            currentRound: t.rounds.length + 1,
            finished: false,
          };
        }),
      };
    }
    case "GENERATE_SEMIFINAL": {
      return {
        tournaments: state.tournaments.map((t) => {
          if (t.id !== action.tournamentId) return t;
          if (t.rounds.some((r) => r.kind === "semifinal")) return t;
          if (t.rounds.some((r) => r.kind === "final")) return t;
          const round = generateSemifinal(t);
          if (!round) return t;
          return {
            ...t,
            rounds: [...t.rounds, round],
            currentRound: round.roundNumber,
            finished: false,
          };
        }),
      };
    }
    case "GENERATE_FINAL": {
      return {
        tournaments: state.tournaments.map((t) => {
          if (t.id !== action.tournamentId) return t;
          if (t.rounds.some((r) => r.kind === "final")) return t;
          const round = generateFinal(t);
          if (!round) return t;
          return {
            ...t,
            rounds: [...t.rounds, round],
            currentRound: round.roundNumber,
            finished: false,
          };
        }),
      };
    }
    case "SET_ELIMINATION_MODE": {
      return {
        tournaments: state.tournaments.map((t) => {
          if (t.id !== action.tournamentId) return t;
          return {
            ...t,
            semifinalEnabled: action.semifinal,
            finalEnabled: action.final,
          };
        }),
      };
    }
    case "SET_ROUND_CASE": {
      return {
        tournaments: state.tournaments.map((t) => {
          if (t.id !== action.tournamentId) return t;
          return {
            ...t,
            rounds: t.rounds.map((r) =>
              r.roundNumber === action.roundNumber
                ? { ...r, caseText: action.caseText }
                : r
            ),
          };
        }),
      };
    }
    case "SET_MATCH_ROOM": {
      return {
        tournaments: state.tournaments.map((t) => {
          if (t.id !== action.tournamentId) return t;
          return {
            ...t,
            rounds: t.rounds.map((r) => {
              if (r.roundNumber !== action.roundNumber) return r;
              return {
                ...r,
                matches: r.matches.map((m) => {
                  if (m.id !== action.matchId) return m;
                  const next: Match = { ...m };
                  if (typeof action.roomNumber === "number" && Number.isFinite(action.roomNumber)) {
                    next.roomNumber = action.roomNumber;
                  }
                  if (action.roomLabel !== undefined) {
                    const trimmed = action.roomLabel.trim();
                    if (trimmed) next.roomLabel = trimmed;
                    else delete next.roomLabel;
                  }
                  return next;
                }),
              };
            }),
          };
        }),
      };
    }
    case "SUBMIT_MATCH": {
      return {
        tournaments: state.tournaments.map((t) => {
          if (t.id !== action.tournamentId) return t;
          const updatedRounds = t.rounds.map((r) => {
            if (r.roundNumber !== action.roundNumber) return r;
            const updatedMatches = r.matches.map((m) =>
              m.id === action.match.id ? action.match : m
            );
            const allCompleted = updatedMatches.every((m) => m.completed);
            return { ...r, matches: updatedMatches, completed: allCompleted };
          });
          // Propagate any speaker-name updates from this match back into the
          // team rosters so future rounds use the same locked names.
          const nameUpdates = new Map<string, string[]>();
          [action.match.team1, action.match.team2].forEach((mt) => {
            const team = t.teams.find((tm) => tm.id === mt.teamId);
            if (!team) return;
            const merged = team.speakerNames.slice();
            mt.speakers.forEach((sp, i) => {
              const trimmed = (sp.name || "").trim();
              if (!trimmed) return;
              if (/^متحدث\s*\d+$/.test(trimmed)) return;
              if (merged[i] !== trimmed) merged[i] = trimmed;
            });
            const changed = merged.some((n, i) => n !== team.speakerNames[i]);
            if (changed) nameUpdates.set(team.id, merged);
          });
          const teamsWithNames = nameUpdates.size === 0
            ? t.teams
            : t.teams.map((tm) => {
                const upd = nameUpdates.get(tm.id);
                return upd ? { ...tm, speakerNames: upd } : tm;
              });
          // Sync those name updates into all not-yet-completed match speakers
          // so subsequent (already generated) rounds also reflect the locked
          // names without overwriting completed-match data.
          const roundsWithSyncedNames = nameUpdates.size === 0
            ? updatedRounds
            : updatedRounds.map((r) => ({
                ...r,
                matches: r.matches.map((m) => {
                  if (m.completed) return m;
                  const t1Names = nameUpdates.get(m.team1.teamId);
                  const t2Names = nameUpdates.get(m.team2.teamId);
                  if (!t1Names && !t2Names) return m;
                  const syncTeam = (mt: MatchTeam, names?: string[]): MatchTeam => {
                    if (!names) return mt;
                    return {
                      ...mt,
                      speakers: mt.speakers.map((sp, i) => ({
                        ...sp,
                        name: names[i] || sp.name,
                      })),
                    };
                  };
                  return {
                    ...m,
                    team1: syncTeam(m.team1, t1Names),
                    team2: syncTeam(m.team2, t2Names),
                  };
                }),
              }));
          const updatedTeams = recalcTeamStats(teamsWithNames, roundsWithSyncedNames);
          return {
            ...t,
            rounds: roundsWithSyncedNames,
            teams: updatedTeams,
          };
        }),
      };
    }
    case "FINISH_TOURNAMENT": {
      return {
        tournaments: state.tournaments.map((t) =>
          t.id === action.tournamentId ? { ...t, finished: true } : t
        ),
      };
    }
    case "REOPEN_TOURNAMENT": {
      return {
        tournaments: state.tournaments.map((t) =>
          t.id === action.tournamentId ? { ...t, finished: false } : t
        ),
      };
    }
    case "DELETE_ROUND": {
      return {
        tournaments: state.tournaments.map((t) => {
          if (t.id !== action.tournamentId) return t;
          const filtered = t.rounds.filter(
            (r) => r.roundNumber !== action.roundNumber
          );
          const renumbered = filtered.map((r, i) => ({
            ...r,
            roundNumber: i + 1,
          }));
          return {
            ...t,
            rounds: renumbered,
            totalRounds: Math.max(t.totalRounds - 1, renumbered.length),
            currentRound: Math.min(t.currentRound, renumbered.length),
          };
        }),
      };
    }
    case "ADD_JUDGE":
      return {
        tournaments: state.tournaments.map((t) => {
          if (t.id !== action.tournamentId) return t;
          return { ...t, judges: [...(t.judges ?? []), action.judge] };
        }),
      };
    case "UPDATE_JUDGE":
      return {
        tournaments: state.tournaments.map((t) => {
          if (t.id !== action.tournamentId) return t;
          return {
            ...t,
            judges: (t.judges ?? []).map((j) =>
              j.id === action.judge.id ? action.judge : j
            ),
          };
        }),
      };
    case "DELETE_JUDGE":
      return {
        tournaments: state.tournaments.map((t) => {
          if (t.id !== action.tournamentId) return t;
          const filteredJudges = (t.judges ?? []).filter(
            (j) => j.id !== action.judgeId
          );
          const cleanedRounds = t.rounds.map((r) => ({
            ...r,
            matches: r.matches.map((m) => {
              if (!m.judgeAssignment) return m;
              const a = m.judgeAssignment;
              return {
                ...m,
                judgeAssignment: {
                  chairJudgeId:
                    a.chairJudgeId === action.judgeId ? undefined : a.chairJudgeId,
                  panelistJudgeIds: a.panelistJudgeIds.filter(
                    (id) => id !== action.judgeId
                  ),
                },
              };
            }),
          }));
          return { ...t, judges: filteredJudges, rounds: cleanedRounds };
        }),
      };
    case "ADD_PENDING_TEAM":
      return {
        tournaments: state.tournaments.map((t) => {
          if (t.id !== action.tournamentId) return t;
          return {
            ...t,
            pendingTeams: [...(t.pendingTeams ?? []), action.pending],
          };
        }),
      };
    case "REMOVE_PENDING_TEAM":
      return {
        tournaments: state.tournaments.map((t) => {
          if (t.id !== action.tournamentId) return t;
          return {
            ...t,
            pendingTeams: (t.pendingTeams ?? []).filter(
              (p) => p.id !== action.pendingId
            ),
          };
        }),
      };
    case "ADD_PENDING_JUDGE":
      return {
        tournaments: state.tournaments.map((t) => {
          if (t.id !== action.tournamentId) return t;
          return {
            ...t,
            pendingJudges: [...(t.pendingJudges ?? []), action.pending],
          };
        }),
      };
    case "REMOVE_PENDING_JUDGE":
      return {
        tournaments: state.tournaments.map((t) => {
          if (t.id !== action.tournamentId) return t;
          return {
            ...t,
            pendingJudges: (t.pendingJudges ?? []).filter(
              (p) => p.id !== action.pendingId
            ),
          };
        }),
      };
    case "ADD_PENDING_RESULT":
      return {
        tournaments: state.tournaments.map((t) => {
          if (t.id !== action.tournamentId) return t;
          return {
            ...t,
            pendingResults: [...(t.pendingResults ?? []), action.pending],
          };
        }),
      };
    case "REMOVE_PENDING_RESULT":
      return {
        tournaments: state.tournaments.map((t) => {
          if (t.id !== action.tournamentId) return t;
          return {
            ...t,
            pendingResults: (t.pendingResults ?? []).filter(
              (p) => p.id !== action.pendingId
            ),
          };
        }),
      };
    case "SET_ROUND_JUDGES_PER_ROOM":
      return {
        tournaments: state.tournaments.map((t) => {
          if (t.id !== action.tournamentId) return t;
          return {
            ...t,
            rounds: t.rounds.map((r) =>
              r.roundNumber === action.roundNumber
                ? { ...r, judgesPerRoom: action.judgesPerRoom }
                : r
            ),
          };
        }),
      };
    case "SET_MATCH_JUDGES":
      return {
        tournaments: state.tournaments.map((t) => {
          if (t.id !== action.tournamentId) return t;
          return {
            ...t,
            rounds: t.rounds.map((r) => {
              if (r.roundNumber !== action.roundNumber) return r;
              return {
                ...r,
                matches: r.matches.map((m) =>
                  m.id === action.matchId
                    ? { ...m, judgeAssignment: action.assignment }
                    : m
                ),
              };
            }),
          };
        }),
      };
    default:
      return state;
  }
}

function recalcTeamStats(teams: Team[], rounds: Round[]): Team[] {
  return teams.map((team) => {
    let wins = 0;
    let losses = 0;
    let totalPoints = 0;
    let matchesPlayed = 0;

    for (const round of rounds) {
      if (round.kind && round.kind !== "regular") continue;
      for (const match of round.matches) {
        if (!match.completed) continue;
        const isTeam1 = match.team1.teamId === team.id;
        const isTeam2 = match.team2.teamId === team.id;
        if (!isTeam1 && !isTeam2) continue;

        matchesPlayed++;
        const myTeam = isTeam1 ? match.team1 : match.team2;
        totalPoints += myTeam.totalScore;
        if (match.winnerId === team.id) wins++;
        else losses++;
      }
    }

    return { ...team, wins, losses, totalPoints, matchesPlayed };
  });
}

function pairBucket(
  pool: Team[],
  pastPairings: Set<string>,
  allowRematch: boolean
): [Team, Team][] | null {
  if (pool.length === 0) return [];
  if (pool.length % 2 === 1) return null;
  const a = pool[0];
  for (let i = 1; i < pool.length; i++) {
    const b = pool[i];
    const key = [a.id, b.id].sort().join("-");
    if (!allowRematch && pastPairings.has(key)) continue;
    const rest = [...pool.slice(1, i), ...pool.slice(i + 1)];
    const sub = pairBucket(rest, pastPairings, allowRematch);
    if (sub !== null) return [[a, b], ...sub];
  }
  return null;
}

function generateRound(tournament: Tournament): Round | null {
  const roundNumber = tournament.rounds.length + 1;

  const pastPairings = new Set<string>();
  const govCount = new Map<string, number>();
  const oppCount = new Map<string, number>();
  for (const round of tournament.rounds) {
    if (round.kind && round.kind !== "regular") continue;
    for (const match of round.matches) {
      const key = [match.team1.teamId, match.team2.teamId].sort().join("-");
      pastPairings.add(key);
      govCount.set(match.team1.teamId, (govCount.get(match.team1.teamId) ?? 0) + 1);
      oppCount.set(match.team2.teamId, (oppCount.get(match.team2.teamId) ?? 0) + 1);
    }
  }

  let teams = [...tournament.teams];
  if (teams.length < 2) return null;

  let pairList: [Team, Team][] = [];
  if (roundNumber === 1) {
    for (let i = teams.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [teams[i], teams[j]] = [teams[j], teams[i]];
    }
    if (teams.length % 2 === 1) teams = teams.slice(0, -1);
    for (let i = 0; i < teams.length; i += 2) {
      pairList.push([teams[i], teams[i + 1]]);
    }
  } else {
    // Group into wins-buckets, sorted by wins desc; within each by totalPoints desc.
    // Process top→bottom. If a bucket is odd, float the lowest-points team down to
    // the next bucket so it pairs with the highest-points team there
    // (winner faces winner; lowest winner faces highest loser when forced).
    const sorted = [...teams].sort(
      (a, b) => b.wins - a.wins || b.totalPoints - a.totalPoints
    );
    const buckets = new Map<number, Team[]>();
    for (const t of sorted) {
      const arr = buckets.get(t.wins) ?? [];
      arr.push(t);
      buckets.set(t.wins, arr);
    }
    const winsKeys = [...buckets.keys()].sort((a, b) => b - a);

    let carry: Team[] = [];
    for (let bi = 0; bi < winsKeys.length; bi++) {
      const w = winsKeys[bi];
      let pool: Team[] = [...carry, ...(buckets.get(w) ?? [])];
      pool.sort((a, b) => b.totalPoints - a.totalPoints);
      carry = [];
      const isLast = bi === winsKeys.length - 1;

      if (pool.length % 2 === 1 && !isLast) {
        carry = [pool.pop()!];
      }
      if (pool.length === 0) continue;

      let result: [Team, Team][] | null =
        pairBucket(pool, pastPairings, false) ??
        pairBucket(pool, pastPairings, true);
      if (!result) {
        const fallback: [Team, Team][] = [];
        for (let i = 0; i + 1 < pool.length; i += 2)
          fallback.push([pool[i], pool[i + 1]]);
        result = fallback;
      }
      pairList.push(...result);
    }
    if (carry.length === 2) pairList.push([carry[0], carry[1]]);
  }

  const remainingRounds = Math.max(tournament.totalRounds - roundNumber + 1, 1);
  const pickRole = (teamId: string): "gov" | "opp" => {
    const g = govCount.get(teamId) ?? 0;
    const o = oppCount.get(teamId) ?? 0;
    if (g + remainingRounds <= o + 1 || (tournament.totalRounds >= 3 && o >= tournament.totalRounds - 1)) return "gov";
    if (o + remainingRounds <= g + 1 || (tournament.totalRounds >= 3 && g >= tournament.totalRounds - 1)) return "opp";
    if (g < o) return "gov";
    if (o < g) return "opp";
    return Math.random() > 0.5 ? "gov" : "opp";
  };

  const matches: Match[] = [];
  let roomNumber = 1;
  for (const [a, b] of pairList) {
    const roleA = pickRole(a.id);
    const govTeam = roleA === "gov" ? a : b;
    const oppTeam = roleA === "gov" ? b : a;
    matches.push(createMatch(govTeam, oppTeam, roomNumber++));
  }

  return { roundNumber, matches, completed: false };
}

function generateSemifinal(tournament: Tournament): Round | null {
  const regularRounds = tournament.rounds.filter(
    (r) => !r.kind || r.kind === "regular"
  );
  if (regularRounds.length === 0) return null;
  if (!regularRounds.every((r) => r.completed)) return null;
  const stats = recalcTeamStats(tournament.teams, regularRounds);
  const sorted = [...stats].sort(
    (a, b) => b.wins - a.wins || b.totalPoints - a.totalPoints
  );
  if (sorted.length < 4) return null;
  const top4 = sorted.slice(0, 4);
  return {
    roundNumber: tournament.rounds.length + 1,
    matches: [
      createMatch(top4[0], top4[3], 1),
      createMatch(top4[1], top4[2], 2),
    ],
    completed: false,
    kind: "semifinal",
  };
}

function generateFinal(tournament: Tournament): Round | null {
  const semi = tournament.rounds.find((r) => r.kind === "semifinal");
  if (semi) {
    if (!semi.completed) return null;
    if (!semi.matches || semi.matches.length < 2) return null;
    const w1 = tournament.teams.find((t) => t.id === semi.matches[0].winnerId);
    const w2 = tournament.teams.find((t) => t.id === semi.matches[1].winnerId);
    if (!w1 || !w2) return null;
    return {
      roundNumber: tournament.rounds.length + 1,
      matches: [createMatch(w1, w2, 1)],
      completed: false,
      kind: "final",
    };
  }
  const regularRounds = tournament.rounds.filter(
    (r) => !r.kind || r.kind === "regular"
  );
  if (regularRounds.length === 0) return null;
  if (!regularRounds.every((r) => r.completed)) return null;
  const stats = recalcTeamStats(tournament.teams, regularRounds);
  const sorted = [...stats].sort(
    (a, b) => b.wins - a.wins || b.totalPoints - a.totalPoints
  );
  if (sorted.length < 2) return null;
  return {
    roundNumber: tournament.rounds.length + 1,
    matches: [createMatch(sorted[0], sorted[1], 1)],
    completed: false,
    kind: "final",
  };
}

function createMatch(govTeam: Team, oppTeam: Team, roomNumber: number): Match {
  const createMatchTeam = (team: Team, role: "government" | "opposition"): MatchTeam => ({
    teamId: team.id,
    role,
    speakers: Array.from({ length: team.speakersPerTeam }, (_, i) => ({
      speakerNumber: i + 1,
      name: team.speakerNames[i] || `متحدث ${i + 1}`,
      score: 0,
    })),
    replyScore: 0,
    replySpeakerNumber: 1,
    totalScore: 0,
  });

  return {
    id: crypto.randomUUID(),
    roomNumber,
    team1: createMatchTeam(govTeam, "government"),
    team2: createMatchTeam(oppTeam, "opposition"),
    winnerId: null,
    bestSpeaker: null,
    judgeNames: [],
    judgeNotes: "",
    completed: false,
  };
}

interface TournamentContextType {
  tournaments: Tournament[];
  addTournament: (
    name: string,
    totalRounds: number,
    elimination?: { semifinal?: boolean; final?: boolean }
  ) => string;
  deleteTournament: (id: string) => void;
  getTournament: (id: string) => Tournament | undefined;
  addTeam: (tournamentId: string, name: string, speakersPerTeam: 3 | 4, speakerNames: string[]) => void;
  deleteTeam: (tournamentId: string, teamId: string) => void;
  updateTeam: (tournamentId: string, team: Team) => void;
  startTournament: (tournamentId: string) => void;
  generateRound: (tournamentId: string) => void;
  generateSemifinal: (tournamentId: string) => void;
  generateFinal: (tournamentId: string) => void;
  setEliminationMode: (tournamentId: string, semifinal: boolean, final: boolean) => void;
  submitMatch: (tournamentId: string, roundNumber: number, match: Match) => void;
  setRoundCase: (tournamentId: string, roundNumber: number, caseText: string) => void;
  setMatchRoom: (
    tournamentId: string,
    roundNumber: number,
    matchId: string,
    update: { roomNumber?: number; roomLabel?: string }
  ) => void;
  addDemoTournament: (opts?: { teams?: number; rounds?: number; finishAll?: boolean }) => string;
  addImportedTournament: (tournament: Tournament, opts?: { overwrite?: boolean }) => void;
  addRegisteredTeam: (tournamentId: string, team: Team) => void;
  addJudge: (tournamentId: string, judge: Judge) => void;
  updateJudge: (tournamentId: string, judge: Judge) => void;
  deleteJudge: (tournamentId: string, judgeId: string) => void;
  addPendingTeam: (tournamentId: string, pending: PendingTeamRegistration) => void;
  removePendingTeam: (tournamentId: string, pendingId: string) => void;
  addPendingJudge: (tournamentId: string, pending: PendingJudgeRegistration) => void;
  removePendingJudge: (tournamentId: string, pendingId: string) => void;
  addPendingResult: (tournamentId: string, pending: PendingMatchResult) => void;
  removePendingResult: (tournamentId: string, pendingId: string) => void;
  setRoundJudgesPerRoom: (tournamentId: string, roundNumber: number, judgesPerRoom: number) => void;
  setMatchJudges: (tournamentId: string, roundNumber: number, matchId: string, assignment: MatchJudgeAssignment) => void;
  autoAssignJudges: (tournamentId: string, roundNumber: number) => void;
  fillDummyData: (tournamentId: string, opts?: { teams?: number; judges?: number }) => void;
  finishTournament: (tournamentId: string) => void;
  reopenTournament: (tournamentId: string) => void;
  deleteRound: (tournamentId: string, roundNumber: number) => void;
}

const DEMO_TEAM_NAMES = [
  "نزوى", "مسقط", "صلالة", "صحار", "البريمي", "الرستاق",
  "إبراء", "صور", "بهلاء", "نخل", "الخابورة", "بدية",
];
const DEMO_FIRST_NAMES = [
  "عبدالله", "محمد", "سعيد", "خالد", "ناصر", "حمد",
  "سلطان", "ياسر", "فهد", "طارق", "أحمد", "راشد",
  "سالم", "عمر", "زياد", "بدر", "مازن", "هلال",
];
const DEMO_LAST_NAMES = [
  "البلوشي", "الكندي", "الحارثي", "الزدجالي", "الرواحي",
  "البوسعيدي", "السيابي", "الهنائي", "الشكيلي", "العامري",
];
const DEMO_JUDGES = [
  "د. سلمى الراشدية", "أ. ماجد البلوشي", "د. هدى السعيدية",
  "أ. خالد الكندي", "د. منى الحارثية",
];

function pickRandom<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

function rnd(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function buildDemoTournament(opts: {
  teams: number;
  rounds: number;
  finishAll: boolean;
}): Tournament {
  const teamCount = Math.max(2, opts.teams - (opts.teams % 2));
  const teamNames = pickRandom(DEMO_TEAM_NAMES, teamCount);
  const usedNames = new Set<string>();
  const makeSpeakerName = () => {
    for (let attempt = 0; attempt < 50; attempt++) {
      const f = DEMO_FIRST_NAMES[rnd(0, DEMO_FIRST_NAMES.length - 1)];
      const l = DEMO_LAST_NAMES[rnd(0, DEMO_LAST_NAMES.length - 1)];
      const full = `${f} ${l}`;
      if (!usedNames.has(full)) {
        usedNames.add(full);
        return full;
      }
    }
    return `متحدث ${usedNames.size + 1}`;
  };

  const teams: Team[] = teamNames.map((name) => {
    const speakersPerTeam: 3 | 4 = Math.random() < 0.5 ? 3 : 4;
    return {
      id: crypto.randomUUID(),
      name: `فريق ${name}`,
      speakersPerTeam,
      speakerNames: Array.from({ length: speakersPerTeam }, makeSpeakerName),
      totalPoints: 0,
      wins: 0,
      losses: 0,
      matchesPlayed: 0,
    };
  });

  const tournament: Tournament = {
    id: crypto.randomUUID(),
    name: `بطولة تجريبية - ${new Date().toLocaleDateString("ar-EG")}`,
    createdAt: Date.now(),
    totalRounds: opts.rounds,
    teams,
    rounds: [],
    currentRound: 1,
    started: true,
    finished: false,
  };

  const roundsToPlay = opts.finishAll ? opts.rounds : Math.min(opts.rounds, opts.rounds);
  for (let r = 0; r < roundsToPlay; r++) {
    const round = generateRound(tournament);
    if (!round) break;

    round.matches = round.matches.map((m) => {
      const fillTeam = (mt: MatchTeam): MatchTeam => {
        const speakers = mt.speakers.map((s) => ({
          ...s,
          score: rnd(72, 88),
        }));
        const replyScore = rnd(36, 44);
        const totalScore =
          speakers.reduce((sum, s) => sum + s.score, 0) + replyScore;
        return {
          ...mt,
          speakers,
          replyScore,
          replySpeakerNumber: rnd(1, speakers.length),
          totalScore,
        };
      };
      let team1 = fillTeam(m.team1);
      let team2 = fillTeam(m.team2);
      if (team1.totalScore === team2.totalScore) {
        team1 = { ...team1, replyScore: team1.replyScore + 1, totalScore: team1.totalScore + 1 };
      }
      const winnerId =
        team1.totalScore > team2.totalScore ? team1.teamId : team2.teamId;
      const allSpeakers = [
        ...team1.speakers.map((s) => ({ ...s, teamId: team1.teamId })),
        ...team2.speakers.map((s) => ({ ...s, teamId: team2.teamId })),
      ];
      const best = allSpeakers.reduce((a, b) => (b.score > a.score ? b : a));
      return {
        ...m,
        team1,
        team2,
        winnerId,
        bestSpeaker: { name: best.name, teamId: best.teamId, score: best.score },
        judgeNames: [DEMO_JUDGES[rnd(0, DEMO_JUDGES.length - 1)]],
        judgeNotes: "",
        completed: true,
      };
    });
    round.completed = true;
    tournament.rounds.push(round);
  }

  tournament.teams = recalcTeamStats(tournament.teams, tournament.rounds);
  const allDone = tournament.rounds.length >= tournament.totalRounds;
  tournament.finished = allDone;
  tournament.currentRound = allDone
    ? tournament.totalRounds
    : tournament.rounds.length + 1;

  return tournament;
}

const TournamentContext = createContext<TournamentContextType | null>(null);

export function TournamentProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { tournaments: [] });

  // Tracks tournaments that have local edits not yet pushed to the server.
  const dirtyIdsRef = useRef<Set<string>>(new Set());
  // Tracks tournaments deleted locally so polling does not re-add them
  // before the DELETE request lands on the server.
  const pendingDeletesRef = useRef<Set<string>>(new Set());
  const pushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSerializedRef = useRef<Map<string, string>>(new Map());
  const initialLoadDoneRef = useRef(false);

  // Initial load: prefer server, fall back to local cache.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await fetchAllShared();
        if (cancelled) return;
        const tournaments = rows.map((r) => r.data);
        dispatch({ type: "LOAD", tournaments });
        for (const t of tournaments) {
          lastSerializedRef.current.set(t.id, JSON.stringify(t));
        }
      } catch {
        try {
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) {
            const data = JSON.parse(stored) as Tournament[];
            if (!cancelled) {
              dispatch({ type: "LOAD", tournaments: data });
              for (const t of data) {
                dirtyIdsRef.current.add(t.id);
              }
            }
          }
        } catch {
          // ignore
        }
      } finally {
        initialLoadDoneRef.current = true;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Local cache mirror (offline fallback).
  useEffect(() => {
    if (state.tournaments.length > 0 || localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tournaments));
    }
  }, [state.tournaments]);

  // Detect changed tournaments and queue them for push.
  useEffect(() => {
    if (!initialLoadDoneRef.current) return;
    let queued = false;
    for (const t of state.tournaments) {
      const prev = lastSerializedRef.current.get(t.id);
      const next = JSON.stringify(t);
      if (prev !== next) {
        lastSerializedRef.current.set(t.id, next);
        dirtyIdsRef.current.add(t.id);
        queued = true;
      }
    }
    if (queued) {
      if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
      pushTimerRef.current = setTimeout(async () => {
        const ids = Array.from(dirtyIdsRef.current);
        dirtyIdsRef.current.clear();
        for (const id of ids) {
          const t = state.tournaments.find((x) => x.id === id);
          if (!t) continue;
          try {
            await pushShared(t);
          } catch {
            dirtyIdsRef.current.add(id);
          }
        }
      }, SYNC_DEBOUNCE_MS);
    }
  }, [state.tournaments]);

  // Poll for updates from other devices.
  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      if (cancelled || !initialLoadDoneRef.current) return;
      try {
        const rows = await fetchAllShared();
        if (cancelled) return;
        const serverIds = new Set(rows.map((r) => r.id));
        const merged: Tournament[] = [];
        // Keep dirty (in-flight) local versions; otherwise take server.
        for (const r of rows) {
          if (pendingDeletesRef.current.has(r.id)) continue;
          if (dirtyIdsRef.current.has(r.id)) {
            const localT = state.tournaments.find((x) => x.id === r.id);
            if (localT) {
              merged.push(localT);
              continue;
            }
          }
          merged.push(r.data);
          lastSerializedRef.current.set(r.id, JSON.stringify(r.data));
        }
        // Preserve any local-only tournaments that are still pending push.
        for (const t of state.tournaments) {
          if (!serverIds.has(t.id) && dirtyIdsRef.current.has(t.id)) {
            merged.push(t);
          }
        }
        // Drop refs for ids no longer present anywhere.
        for (const id of Array.from(lastSerializedRef.current.keys())) {
          if (!serverIds.has(id) && !dirtyIdsRef.current.has(id)) {
            lastSerializedRef.current.delete(id);
          }
        }
        dispatch({ type: "LOAD", tournaments: merged });
      } catch {
        // ignore poll errors
      }
    };
    const handle = setInterval(tick, SYNC_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(handle);
    };
  }, [state.tournaments]);

  const addTournament = useCallback((
    name: string,
    totalRounds: number,
    elimination?: { semifinal?: boolean; final?: boolean }
  ) => {
    const tournament: Tournament = {
      id: crypto.randomUUID(),
      name,
      createdAt: Date.now(),
      totalRounds,
      teams: [],
      rounds: [],
      currentRound: 0,
      started: false,
      finished: false,
      semifinalEnabled: !!elimination?.semifinal,
      finalEnabled: !!elimination?.final,
    };
    dispatch({ type: "ADD_TOURNAMENT", tournament });
    return tournament.id;
  }, []);

  const deleteTournament = useCallback((id: string) => {
    pendingDeletesRef.current.add(id);
    lastSerializedRef.current.delete(id);
    dirtyIdsRef.current.delete(id);
    dispatch({ type: "DELETE_TOURNAMENT", id });
    void deleteShared(id)
      .catch(() => {})
      .finally(() => {
        setTimeout(() => pendingDeletesRef.current.delete(id), 30000);
      });
  }, []);

  const getTournament = useCallback(
    (id: string) => state.tournaments.find((t) => t.id === id),
    [state.tournaments]
  );

  const addTeam = useCallback(
    (tournamentId: string, name: string, speakersPerTeam: 3 | 4, speakerNames: string[]) => {
      const team: Team = {
        id: crypto.randomUUID(),
        name,
        speakerNames,
        speakersPerTeam,
        totalPoints: 0,
        wins: 0,
        losses: 0,
        matchesPlayed: 0,
      };
      dispatch({ type: "ADD_TEAM", tournamentId, team });
    },
    []
  );

  const deleteTeam = useCallback((tournamentId: string, teamId: string) => {
    dispatch({ type: "DELETE_TEAM", tournamentId, teamId });
  }, []);

  const updateTeam = useCallback((tournamentId: string, team: Team) => {
    dispatch({ type: "UPDATE_TEAM", tournamentId, team });
  }, []);

  const startTournament = useCallback((tournamentId: string) => {
    dispatch({ type: "START_TOURNAMENT", tournamentId });
  }, []);

  const genRound = useCallback((tournamentId: string) => {
    dispatch({ type: "GENERATE_ROUND", tournamentId });
  }, []);

  const genSemifinal = useCallback((tournamentId: string) => {
    dispatch({ type: "GENERATE_SEMIFINAL", tournamentId });
  }, []);

  const genFinal = useCallback((tournamentId: string) => {
    dispatch({ type: "GENERATE_FINAL", tournamentId });
  }, []);

  const setEliminationMode = useCallback(
    (tournamentId: string, semifinal: boolean, final: boolean) => {
      dispatch({ type: "SET_ELIMINATION_MODE", tournamentId, semifinal, final });
    },
    []
  );

  const submitMatch = useCallback((tournamentId: string, roundNumber: number, match: Match) => {
    dispatch({ type: "SUBMIT_MATCH", tournamentId, roundNumber, match });
  }, []);

  const finishTournament = useCallback((tournamentId: string) => {
    dispatch({ type: "FINISH_TOURNAMENT", tournamentId });
  }, []);

  const reopenTournament = useCallback((tournamentId: string) => {
    dispatch({ type: "REOPEN_TOURNAMENT", tournamentId });
  }, []);

  const deleteRound = useCallback(
    (tournamentId: string, roundNumber: number) => {
      dispatch({ type: "DELETE_ROUND", tournamentId, roundNumber });
    },
    []
  );

  const setRoundCase = useCallback(
    (tournamentId: string, roundNumber: number, caseText: string) => {
      dispatch({ type: "SET_ROUND_CASE", tournamentId, roundNumber, caseText });
    },
    []
  );

  const setMatchRoom = useCallback(
    (
      tournamentId: string,
      roundNumber: number,
      matchId: string,
      update: { roomNumber?: number; roomLabel?: string }
    ) => {
      dispatch({
        type: "SET_MATCH_ROOM",
        tournamentId,
        roundNumber,
        matchId,
        roomNumber: update.roomNumber,
        roomLabel: update.roomLabel,
      });
    },
    []
  );

  const addImportedTournament = useCallback(
    (tournament: Tournament, opts?: { overwrite?: boolean }) => {
      dispatch({
        type: "IMPORT_TOURNAMENT",
        tournament,
        overwrite: opts?.overwrite ?? true,
      });
    },
    []
  );

  const addRegisteredTeam = useCallback(
    (tournamentId: string, team: Team) => {
      dispatch({ type: "ADD_TEAM", tournamentId, team });
    },
    []
  );

  const addJudge = useCallback((tournamentId: string, judge: Judge) => {
    dispatch({ type: "ADD_JUDGE", tournamentId, judge });
  }, []);
  const updateJudge = useCallback((tournamentId: string, judge: Judge) => {
    dispatch({ type: "UPDATE_JUDGE", tournamentId, judge });
  }, []);
  const deleteJudge = useCallback((tournamentId: string, judgeId: string) => {
    dispatch({ type: "DELETE_JUDGE", tournamentId, judgeId });
  }, []);
  const addPendingTeam = useCallback(
    (tournamentId: string, pending: PendingTeamRegistration) => {
      dispatch({ type: "ADD_PENDING_TEAM", tournamentId, pending });
    },
    []
  );
  const removePendingTeam = useCallback(
    (tournamentId: string, pendingId: string) => {
      dispatch({ type: "REMOVE_PENDING_TEAM", tournamentId, pendingId });
    },
    []
  );
  const addPendingJudge = useCallback(
    (tournamentId: string, pending: PendingJudgeRegistration) => {
      dispatch({ type: "ADD_PENDING_JUDGE", tournamentId, pending });
    },
    []
  );
  const removePendingJudge = useCallback(
    (tournamentId: string, pendingId: string) => {
      dispatch({ type: "REMOVE_PENDING_JUDGE", tournamentId, pendingId });
    },
    []
  );
  const addPendingResult = useCallback(
    (tournamentId: string, pending: PendingMatchResult) => {
      dispatch({ type: "ADD_PENDING_RESULT", tournamentId, pending });
    },
    []
  );
  const removePendingResult = useCallback(
    (tournamentId: string, pendingId: string) => {
      dispatch({ type: "REMOVE_PENDING_RESULT", tournamentId, pendingId });
    },
    []
  );
  const setRoundJudgesPerRoom = useCallback(
    (tournamentId: string, roundNumber: number, judgesPerRoom: number) => {
      dispatch({
        type: "SET_ROUND_JUDGES_PER_ROOM",
        tournamentId,
        roundNumber,
        judgesPerRoom,
      });
    },
    []
  );
  const setMatchJudges = useCallback(
    (
      tournamentId: string,
      roundNumber: number,
      matchId: string,
      assignment: MatchJudgeAssignment
    ) => {
      dispatch({
        type: "SET_MATCH_JUDGES",
        tournamentId,
        roundNumber,
        matchId,
        assignment,
      });
    },
    []
  );

  const autoAssignJudges = useCallback(
    (tournamentId: string, roundNumber: number) => {
      const t = state.tournaments.find((x) => x.id === tournamentId);
      if (!t) return;
      const round = t.rounds.find((r) => r.roundNumber === roundNumber);
      if (!round) return;
      const judges = t.judges ?? [];
      const perRoom = round.judgesPerRoom ?? 3;

      const usage: Record<string, number> = {};
      const chairUsage: Record<string, number> = {};
      judges.forEach((j) => {
        usage[j.id] = 0;
        chairUsage[j.id] = 0;
      });

      const assignedChairs = new Set<string>();

      const isConflict = (judge: Judge, match: Match) =>
        judge.conflictTeamIds.includes(match.team1.teamId) ||
        judge.conflictTeamIds.includes(match.team2.teamId);

      const matchesShuffled = [...round.matches];

      for (const match of matchesShuffled) {
        const usedHere = new Set<string>();
        // Pick chair: candidate must canChair, no conflict, not yet chair anywhere this round
        const chairCandidates = judges
          .filter(
            (j) =>
              j.canChair &&
              !isConflict(j, match) &&
              !assignedChairs.has(j.id)
          )
          .sort((a, b) => {
            if (chairUsage[a.id] !== chairUsage[b.id])
              return chairUsage[a.id] - chairUsage[b.id];
            return usage[a.id] - usage[b.id];
          });
        let chairId: string | undefined;
        if (chairCandidates.length > 0) {
          chairId = chairCandidates[0].id;
          assignedChairs.add(chairId);
          usedHere.add(chairId);
          usage[chairId]++;
          chairUsage[chairId]++;
        }
        // Pick panelists
        const panelistIds: string[] = [];
        const panelistSlots = Math.max(0, perRoom - (chairId ? 1 : 0));
        const panelCandidates = judges
          .filter((j) => !usedHere.has(j.id) && !isConflict(j, match))
          .sort((a, b) => usage[a.id] - usage[b.id]);
        for (const c of panelCandidates) {
          if (panelistIds.length >= panelistSlots) break;
          panelistIds.push(c.id);
          usedHere.add(c.id);
          usage[c.id]++;
        }
        dispatch({
          type: "SET_MATCH_JUDGES",
          tournamentId,
          roundNumber,
          matchId: match.id,
          assignment: { chairJudgeId: chairId, panelistJudgeIds: panelistIds },
        });
      }
    },
    [state.tournaments]
  );

  const fillDummyData = useCallback(
    (tournamentId: string, opts?: { teams?: number; judges?: number }) => {
      const target = state.tournaments.find((t) => t.id === tournamentId);
      if (!target) return;
      if (target.started) return;
      const wantTeams = Math.max(0, opts?.teams ?? 6);
      const wantJudges = Math.max(0, opts?.judges ?? 5);
      const existingTeamNames = new Set(target.teams.map((t) => t.name));
      const usedSpeakerNames = new Set<string>();
      target.teams.forEach((t) => t.speakerNames.forEach((n) => usedSpeakerNames.add(n)));
      const makeSpeakerName = () => {
        for (let i = 0; i < 80; i++) {
          const f = DEMO_FIRST_NAMES[rnd(0, DEMO_FIRST_NAMES.length - 1)];
          const l = DEMO_LAST_NAMES[rnd(0, DEMO_LAST_NAMES.length - 1)];
          const full = `${f} ${l}`;
          if (!usedSpeakerNames.has(full)) {
            usedSpeakerNames.add(full);
            return full;
          }
        }
        return `متحدث ${usedSpeakerNames.size + 1}`;
      };
      const teamNamePool = pickRandom(DEMO_TEAM_NAMES, DEMO_TEAM_NAMES.length);
      let added = 0;
      for (const name of teamNamePool) {
        if (added >= wantTeams) break;
        const fullName = `فريق ${name}`;
        if (existingTeamNames.has(fullName)) continue;
        const speakersPerTeam: 3 | 4 = Math.random() < 0.5 ? 3 : 4;
        const team: Team = {
          id: crypto.randomUUID(),
          name: fullName,
          speakersPerTeam,
          speakerNames: Array.from({ length: speakersPerTeam }, makeSpeakerName),
          totalPoints: 0,
          wins: 0,
          losses: 0,
          matchesPlayed: 0,
          institution: pickRandom(["جامعة السلطان قابوس", "جامعة نزوى", "كلية العلوم التطبيقية", "جامعة ظفار"], 1)[0],
          registeredAt: Date.now(),
        };
        dispatch({ type: "ADD_TEAM", tournamentId, team });
        existingTeamNames.add(fullName);
        added++;
      }
      const existingJudgeNames = new Set((target.judges ?? []).map((j) => j.name));
      const judgePool = pickRandom(DEMO_JUDGES, DEMO_JUDGES.length);
      let addedJ = 0;
      const extraJudges = [
        "د. عائشة الحبسية", "أ. سيف اللواتي", "د. ريم البطاشية",
        "أ. يوسف المعمري", "د. نورة الفارسية", "أ. عبدالعزيز الجابري",
      ];
      const allJudgePool = [...judgePool, ...extraJudges];
      for (const name of allJudgePool) {
        if (addedJ >= wantJudges) break;
        if (existingJudgeNames.has(name)) continue;
        const judge: Judge = {
          id: crypto.randomUUID(),
          name,
          institution: pickRandom(["جامعة السلطان قابوس", "وزارة التربية والتعليم", "نادي مناظرات عُمان", "جامعة نزوى"], 1)[0],
          experience: pickRandom(["خبرة 5 سنوات", "خبرة 8 سنوات", "خبرة 3 سنوات", "خبرة 10+ سنوات"], 1)[0],
          canChair: Math.random() < 0.6,
          conflictTeamIds: [],
          registeredAt: Date.now(),
        };
        dispatch({ type: "ADD_JUDGE", tournamentId, judge });
        existingJudgeNames.add(name);
        addedJ++;
      }
    },
    [state.tournaments]
  );

  const addDemoTournament = useCallback(
    (opts?: { teams?: number; rounds?: number; finishAll?: boolean }) => {
      const tournament = buildDemoTournament({
        teams: opts?.teams ?? 6,
        rounds: opts?.rounds ?? 3,
        finishAll: opts?.finishAll ?? true,
      });
      dispatch({ type: "ADD_TOURNAMENT", tournament });
      return tournament.id;
    },
    []
  );

  return (
    <TournamentContext.Provider
      value={{
        tournaments: state.tournaments,
        addTournament,
        deleteTournament,
        getTournament,
        addTeam,
        deleteTeam,
        updateTeam,
        startTournament,
        generateRound: genRound,
        generateSemifinal: genSemifinal,
        generateFinal: genFinal,
        setEliminationMode,
        submitMatch,
        setRoundCase,
        setMatchRoom,
        addDemoTournament,
        fillDummyData,
        addImportedTournament,
        addRegisteredTeam,
        addJudge,
        updateJudge,
        deleteJudge,
        addPendingTeam,
        removePendingTeam,
        addPendingJudge,
        removePendingJudge,
        addPendingResult,
        removePendingResult,
        setRoundJudgesPerRoom,
        setMatchJudges,
        autoAssignJudges,
        finishTournament,
        reopenTournament,
        deleteRound,
      }}
    >
      {children}
    </TournamentContext.Provider>
  );
}

export function useTournament() {
  const ctx = useContext(TournamentContext);
  if (!ctx) throw new Error("useTournament must be used within TournamentProvider");
  return ctx;
}
