import type { TournamentGroup } from "@/types/tournament";
import { entities } from "@/api/base44Client";

function fromRow(row: any): TournamentGroup {
  return {
    id: row.group_id,
    name: row.name,
    description: row.description || undefined,
    kind: row.kind,
    createdAt: row.created_at_ms,
    tournamentIds: row.tournament_ids ?? [],
  };
}

export async function fetchGroups(): Promise<TournamentGroup[]> {
  const rows = await entities.TournamentGroup.list("-created_date", 5000);
  return rows.map(fromRow);
}

export async function pushGroup(group: TournamentGroup): Promise<void> {
  const rows = await entities.TournamentGroup.filter({ group_id: group.id }, "-updated_date", 1);
  const payload = {
    group_id: group.id,
    name: group.name,
    description: group.description ?? "",
    kind: group.kind ?? "normal",
    tournament_ids: group.tournamentIds ?? [],
    created_at_ms: group.createdAt,
    updated_at_ms: Date.now(),
  };
  if (rows[0]) await entities.TournamentGroup.update(rows[0].id, payload);
  else await entities.TournamentGroup.create(payload);
}

export async function deleteGroupApi(id: string): Promise<void> {
  const rows = await entities.TournamentGroup.filter({ group_id: id }, "-updated_date", 50);
  await Promise.all(rows.map((row: any) => entities.TournamentGroup.delete(row.id)));
}
