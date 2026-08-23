import type { Judge, Room, Team, TournamentSettings } from "@/types/tournament";
import type { DrawPairing } from "./draw";

/** Everything the creation wizard collects before the tournament exists. */
export interface TournamentSetup {
  name: string;
  description?: string;
  logoDataUrl?: string;
  startDate?: number;
  endDate?: number;
  totalRounds: number;
  expectedTeams: number;

  protection: { enabled: boolean; code: string };

  rooms: Room[];
  judges: Judge[];
  teams: Team[];
  settings: TournamentSettings;

  /** Approved first-round draw, or null when the organiser skipped it. */
  draw: DrawPairing[] | null;
  drawApproved: boolean;
}

export const WIZARD_STEPS = [
  { key: "info", label: "معلومات البطولة" },
  { key: "protection", label: "الحماية" },
  { key: "rooms", label: "القاعات" },
  { key: "judges", label: "المحكمون" },
  { key: "teams", label: "الفِرق" },
  { key: "system", label: "نظام البطولة" },
  { key: "draw", label: "التوزيع" },
  { key: "review", label: "المراجعة" },
] as const;

export type WizardStepKey = (typeof WIZARD_STEPS)[number]["key"];

export function emptySetup(): TournamentSetup {
  return {
    name: "",
    totalRounds: 3,
    expectedTeams: 8,
    protection: { enabled: false, code: "" },
    rooms: [],
    judges: [],
    teams: [],
    settings: {
      replySpeech: true,
      sides: true,
      scoreMin: 60,
      scoreMax: 100,
      judgesPerRoom: 3,
      showScoresOnAnnounce: false,
    },
    draw: null,
    drawApproved: false,
  };
}

export function makeRoom(number: number): Room {
  return { id: crypto.randomUUID(), number, label: `القاعة ${number}` };
}
