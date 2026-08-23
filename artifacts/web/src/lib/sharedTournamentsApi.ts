import type { Tournament } from "@/types/tournament";
import { entities } from "@/api/base44Client";

export interface SharedTournamentRow {
  id: string;
  data: Tournament;
  updatedAt: string;
}

function toRow(row: any): SharedTournamentRow {
  return {
    id: row.tournament_id,
    data: row.data as Tournament,
    updatedAt: row.updated_date ?? new Date(row.updated_at_ms ?? Date.now()).toISOString(),
  };
}

export async function fetchAllShared(): Promise<SharedTournamentRow[]> {
  const rows = await entities.TournamentState.list("-updated_date", 5000);
  return rows.map(toRow);
}

export async function fetchSharedById(id: string): Promise<SharedTournamentRow | null> {
  const rows = await entities.TournamentState.filter({ tournament_id: id }, "-updated_date", 1);
  return rows[0] ? toRow(rows[0]) : null;
}

export async function pushShared(t: Tournament): Promise<void> {
  const rows = await entities.TournamentState.filter({ tournament_id: t.id }, "-updated_date", 1);
  const payload = {
    tournament_id: t.id,
    name: t.name,
    data: t,
    updated_at_ms: Date.now(),
  };
  if (rows[0]) await entities.TournamentState.update(rows[0].id, payload);
  else await entities.TournamentState.create(payload);
}

export async function deleteShared(id: string): Promise<void> {
  const rows = await entities.TournamentState.filter({ tournament_id: id }, "-updated_date", 50);
  await Promise.all(rows.map((row: any) => entities.TournamentState.delete(row.id)));
}
