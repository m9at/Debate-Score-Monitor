import type { Tournament } from "@/types/tournament";

const API_BASE = "/api";

export interface SharedTournamentRow {
  id: string;
  data: Tournament;
  updatedAt: string;
}

export async function fetchAllShared(): Promise<SharedTournamentRow[]> {
  const r = await fetch(`${API_BASE}/shared-tournaments`);
  if (!r.ok) throw new Error(`fetchAllShared ${r.status}`);
  return (await r.json()) as SharedTournamentRow[];
}

export async function fetchSharedById(id: string): Promise<SharedTournamentRow | null> {
  const r = await fetch(`${API_BASE}/shared-tournaments/${id}`);
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`fetchSharedById ${r.status}`);
  return (await r.json()) as SharedTournamentRow;
}

export async function pushShared(t: Tournament): Promise<void> {
  const r = await fetch(`${API_BASE}/shared-tournaments/${t.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(t),
  });
  if (!r.ok) throw new Error(`pushShared ${r.status}`);
}

export async function deleteShared(id: string): Promise<void> {
  const r = await fetch(`${API_BASE}/shared-tournaments/${id}`, {
    method: "DELETE",
  });
  if (!r.ok) throw new Error(`deleteShared ${r.status}`);
}
