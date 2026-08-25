import type { TournamentSetup } from "@/lib/wizard/types";

const API_BASE = "/api";

export interface TournamentDraftRow {
  id: string;
  name: string;
  stepIndex: number;
  setup: TournamentSetup;
  updatedAt: string;
}

export async function fetchDrafts(): Promise<TournamentDraftRow[]> {
  const r = await fetch(`${API_BASE}/tournament-drafts`);
  if (!r.ok) throw new Error(`fetchDrafts ${r.status}`);
  return (await r.json()) as TournamentDraftRow[];
}

export async function fetchDraft(id: string): Promise<TournamentDraftRow | null> {
  const r = await fetch(`${API_BASE}/tournament-drafts/${id}`);
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`fetchDraft ${r.status}`);
  return (await r.json()) as TournamentDraftRow;
}

export async function saveDraft(
  setup: TournamentSetup,
  stepIndex: number,
): Promise<void> {
  const r = await fetch(`${API_BASE}/tournament-drafts/${setup.draftId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: setup.name, stepIndex, setup }),
  });
  if (!r.ok) throw new Error(`saveDraft ${r.status}`);
}

export async function deleteDraft(id: string): Promise<void> {
  const r = await fetch(`${API_BASE}/tournament-drafts/${id}`, {
    method: "DELETE",
  });
  if (!r.ok) throw new Error(`deleteDraft ${r.status}`);
}
