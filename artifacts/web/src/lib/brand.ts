/**
 * Oman Debates brand tokens — derived from the new logo.
 * Used by the tournament management UI for a single, consistent visual language.
 */

export const BRAND = {
  purple: "#7B2D8E",
  purpleDeep: "#5D1F6D",
  blue: "#29ABE2",
  blueDeep: "#1B87B8",
  ink: "#2B1B45",
  inkSoft: "#3A2758",
  surface: "#F7F8FC",
  card: "#FFFFFF",
  border: "#E7E9F2",
  success: "#22C55E",
  warning: "#F59E0B",
  danger: "#EF4444",
  gold: "#F5B740",
} as const;

/** Signature gradient of the logo (purple → sky blue). */
export const BRAND_GRADIENT = `linear-gradient(135deg, ${BRAND.purple} 0%, ${BRAND.blue} 100%)`;

/** Soft glow used behind the logo and active elements. */
export const BRAND_GLOW = `0 0 32px ${BRAND.purple}59`;

/** Unified button classes — one size, radius, weight and spacing system. */
export const BTN = {
  base:
    "inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-xl text-[13px] font-bold " +
    "transition-all duration-200 active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
  primary: "text-white shadow-sm hover:shadow-md hover:brightness-110",
  secondary:
    "bg-white text-[#2B1B45] border border-[#E7E9F2] hover:border-[#7B2D8E]/40 hover:bg-[#7B2D8E]/[0.04]",
  ghost: "bg-transparent text-[#2B1B45]/70 hover:bg-[#2B1B45]/[0.06]",
  danger:
    "bg-[#EF4444]/[0.08] text-[#EF4444] border border-[#EF4444]/30 hover:bg-[#EF4444]/[0.14]",
} as const;

/** Inline style for the primary (gradient) button. */
export const BTN_PRIMARY_STYLE: React.CSSProperties = {
  backgroundImage: BRAND_GRADIENT,
};

/** Size modifiers, so a call-to-action can be visually heavier than a row action. */
export const BTN_SIZE = {
  sm: "h-8 px-3 text-[12px] rounded-lg",
  md: "h-9 px-3.5 text-[13px] rounded-xl",
  lg: "h-11 px-5 text-[15px] rounded-xl",
  xl: "h-14 px-7 text-base rounded-2xl",
} as const;

/**
 * Tournament lifecycle states, used for the badges and filters on the
 * tournaments home screen.
 */
export type TournamentStatus =
  | "running"
  | "draft"
  | "upcoming"
  | "completed"
  | "archived";

export const STATUS_META: Record<
  TournamentStatus,
  { label: string; dot: string; color: string; bg: string }
> = {
  running: { label: "جارية", dot: "🟢", color: "#15803D", bg: "#22C55E1f" },
  draft: { label: "قيد الإعداد", dot: "🟡", color: "#B45309", bg: "#F59E0B1f" },
  upcoming: { label: "قادمة", dot: "🔵", color: "#1B87B8", bg: "#29ABE21f" },
  completed: { label: "مكتملة", dot: "⚪", color: "#4B5563", bg: "#9CA3AF24" },
  archived: { label: "مؤرشفة", dot: "📦", color: "#6B4E7A", bg: "#7B2D8E14" },
};
