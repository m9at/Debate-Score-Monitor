import type { Judge, Room, Team } from "@/types/tournament";

/** One room's proposed line-up for the first round. */
export interface DrawPairing {
  roomId: string;
  roomNumber: number;
  roomLabel: string;
  govTeamId: string;
  oppTeamId: string;
  chairJudgeId?: string;
  panelistJudgeIds: string[];
}

export interface DrawInput {
  teams: Team[];
  rooms: Room[];
  judges: Judge[];
  judgesPerRoom: number;
}

function shuffled<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Builds a first-round draw: teams paired across the available rooms, sides
 * assigned, and judges spread as evenly as possible with a chair per room.
 * Pure and deterministic-free — call again to reshuffle.
 */
export function generateDraw({
  teams,
  rooms,
  judges,
  judgesPerRoom,
}: DrawInput): DrawPairing[] {
  const usableRooms = [...rooms].sort((a, b) => a.number - b.number);
  const pool = shuffled(teams.filter((t) => t.name.trim()));
  const pairs: [Team, Team][] = [];

  for (let i = 0; i + 1 < pool.length; i += 2) {
    pairs.push([pool[i], pool[i + 1]]);
  }

  // Judges: chairs first so every room gets an experienced chair when possible.
  const chairs = shuffled(judges.filter((j) => j.canChair));
  const others = shuffled(judges.filter((j) => !j.canChair));
  const panelPool = [...others, ...chairs.slice(pairs.length)];

  return pairs.slice(0, usableRooms.length).map(([gov, opp], idx) => {
    const room = usableRooms[idx];
    const chair = chairs[idx];
    const panelSize = Math.max(0, judgesPerRoom - (chair ? 1 : 0));
    const panelists = panelPool.splice(0, panelSize);

    return {
      roomId: room.id,
      roomNumber: room.number,
      roomLabel: room.label,
      govTeamId: gov.id,
      oppTeamId: opp.id,
      chairJudgeId: chair?.id,
      panelistJudgeIds: panelists.map((j) => j.id),
    };
  });
}

/** Teams that could not be seated (odd count, or more teams than rooms allow). */
export function unseatedTeams(teams: Team[], draw: DrawPairing[]): Team[] {
  const seated = new Set(draw.flatMap((d) => [d.govTeamId, d.oppTeamId]));
  return teams.filter((t) => !seated.has(t.id));
}
