import { newRoom, type LeaderInfo } from "./leaderApi";

function shuffled<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Auto-draw for one round — same idea as the team draw, but with individuals:
 * registered individuals are shuffled into rooms of `perRoom`, and each room gets
 * one registered judge, preferring judges who haven't judged those individuals before.
 */
export function drawLeaderRound(info: LeaderInfo, dayIdx: number, perRoom: number): LeaderInfo {
  const next = structuredClone(info);
  const people = shuffled((next.individualPool ?? []).filter((p) => p.name.trim()));
  const size = Math.max(1, perRoom);
  const roomCount = Math.max(1, Math.ceil(people.length / size));
  const day = next.days[dayIdx];

  // Keep existing room ids/labels where possible so room links stay valid.
  const rooms = Array.from({ length: roomCount }, (_, i) => {
    const r = day.rooms[i] ?? newRoom(i + 1);
    return { ...r, individuals: [] as typeof people, judges: [] as string[] };
  });
  // Deal round-robin so rooms stay balanced.
  people.forEach((p, i) => rooms[i % roomCount].individuals.push({ ...p }));

  // Judge→individual pairs already used in other rounds.
  const seen = new Set<string>();
  next.days.forEach((d, k) => {
    if (k === dayIdx) return;
    d.rooms.forEach((r) => r.judges.forEach((j) => r.individuals.forEach((x) => seen.add(`${j}|${x.id}`))));
  });
  const free = shuffled(next.judgePool ?? []);
  for (const room of rooms) {
    if (!free.length) break;
    let best = 0, bestClash = Infinity;
    free.forEach((j, i) => {
      const clash = room.individuals.filter((x) => seen.has(`${j}|${x.id}`)).length;
      if (clash < bestClash) { best = i; bestClash = clash; }
    });
    room.judges = [free.splice(best, 1)[0]];
  }
  day.rooms = rooms;
  return next;
}
