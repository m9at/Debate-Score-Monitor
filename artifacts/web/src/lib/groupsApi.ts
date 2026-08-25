import type { TournamentGroup } from "@/types/tournament";

const API_BASE = "/api";

export async function fetchGroups(): Promise<TournamentGroup[]> {
  const r = await fetch(`${API_BASE}/tournament-groups`);
  if (!r.ok) throw new Error(`fetchGroups ${r.status}`);
  return (await r.json()) as TournamentGroup[];
}

export async function pushGroup(group: TournamentGroup): Promise<void> {
  const r = await fetch(`${API_BASE}/tournament-groups/${group.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(group),
  });
  if (!r.ok) throw new Error(`pushGroup ${r.status}`);
}

export async function deleteGroupApi(id: string): Promise<void> {
  const r = await fetch(`${API_BASE}/tournament-groups/${id}`, {
    method: "DELETE",
  });
  if (!r.ok) throw new Error(`deleteGroup ${r.status}`);
}
