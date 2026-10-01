import type { Tournament } from "@/types/tournament";

/** Deleted tournaments kept in the browser so they can be brought back. */
export const TRASH_KEY = "debate_trash_v1";
export type TrashItem = { tournament: Tournament; deletedAt: string };

export const readTrash = (): TrashItem[] => {
  try { return JSON.parse(localStorage.getItem(TRASH_KEY) || "[]"); } catch { return []; }
};
const write = (items: TrashItem[]) => localStorage.setItem(TRASH_KEY, JSON.stringify(items));
export const addToTrash = (tournament: Tournament) =>
  write([{ tournament, deletedAt: new Date().toISOString() }, ...readTrash().filter((x) => x.tournament.id !== tournament.id)]);
export const removeFromTrash = (id: string) => write(readTrash().filter((x) => x.tournament.id !== id));
