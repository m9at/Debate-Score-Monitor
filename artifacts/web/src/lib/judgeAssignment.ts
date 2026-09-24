import type { Judge, Match } from "@/types/tournament";

function shuffled<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Spreads judges over the rooms of a round: chairs first (one per room when
 * possible), then panelists; no conflicts and no judge in two rooms. Judges
 * and rooms are shuffled so every call gives a genuinely different result.
 */
export function assignJudges(judges: Judge[], matches: Match[], perRoom: number): Match[] {
  const pool = shuffled(judges.filter((j) => !j.disabled));
  const used = new Set<string>();
  const rooms = shuffled(matches);
  const chairOf = new Map<string, string>();
  const panelOf = new Map<string, string[]>();

  const free = (m: Match) =>
    pool.filter(
      (j) =>
        !used.has(j.id) &&
        !j.conflictTeamIds.includes(m.team1.teamId) &&
        !j.conflictTeamIds.includes(m.team2.teamId),
    );

  if (perRoom > 0) {
    for (const m of rooms) {
      const chair = free(m).find((j) => j.canChair);
      if (chair) {
        used.add(chair.id);
        chairOf.set(m.id, chair.id);
      }
    }
  }

  // Fill panel seats round-robin so a shortage leaves every room one short
  // instead of emptying the last rooms.
  rooms.forEach((m) => panelOf.set(m.id, []));
  for (let seat = 0; seat < perRoom; seat++) {
    for (const m of rooms) {
      const slots = perRoom - (chairOf.has(m.id) ? 1 : 0);
      if (seat >= slots) continue;
      const pick = free(m).sort((a, b) => Number(a.canChair) - Number(b.canChair))[0];
      if (!pick) continue;
      used.add(pick.id);
      panelOf.get(m.id)!.push(pick.id);
    }
  }

  return matches.map((m) => ({
    ...m,
    judgeAssignment: {
      chairJudgeId: chairOf.get(m.id),
      panelistJudgeIds: panelOf.get(m.id) ?? [],
    },
  }));
}
