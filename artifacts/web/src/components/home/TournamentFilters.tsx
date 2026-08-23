import { Search, X } from "lucide-react";
import { BRAND, BRAND_GRADIENT, STATUS_META, type TournamentStatus } from "@/lib/brand";

export type StatusFilter = TournamentStatus | "all";

interface TournamentFiltersProps {
  query: string;
  onQueryChange: (v: string) => void;
  filter: StatusFilter;
  onFilterChange: (f: StatusFilter) => void;
  /** How many tournaments fall under each status, for the chip counters. */
  counts: Record<StatusFilter, number>;
}

const ORDER: StatusFilter[] = [
  "all",
  "running",
  "draft",
  "upcoming",
  "completed",
  "archived",
];

/** Search field plus status filter chips for the tournaments list. */
export default function TournamentFilters({
  query,
  onQueryChange,
  filter,
  onFilterChange,
  counts,
}: TournamentFiltersProps) {
  return (
    <div className="flex flex-col gap-3" data-testid="tournament-filters">
      {/* Search */}
      <div className="relative">
        <Search
          className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
          style={{ color: `${BRAND.ink}66` }}
        />
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="ابحث عن بطولة..."
          className="w-full h-11 rounded-xl bg-white border pr-10 pl-10 text-[14px] font-medium
                     outline-none transition-colors focus:border-[#7B2D8E]/45
                     placeholder:font-normal"
          style={{ borderColor: BRAND.border, color: BRAND.ink }}
          data-testid="input-search-tournaments"
        />
        {query && (
          <button
            onClick={() => onQueryChange("")}
            aria-label="مسح البحث"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full
                       flex items-center justify-center hover:bg-[#2B1B45]/10 transition-colors"
            data-testid="button-clear-search"
          >
            <X className="w-3.5 h-3.5" style={{ color: `${BRAND.ink}99` }} />
          </button>
        )}
      </div>

      {/* Status chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-0.5 -mb-0.5">
        {ORDER.map((key) => {
          const active = filter === key;
          const label = key === "all" ? "الكل" : STATUS_META[key].label;
          const dot = key === "all" ? null : STATUS_META[key].dot;

          return (
            <button
              key={key}
              onClick={() => onFilterChange(key)}
              className={`inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl text-[12.5px] font-bold
                          whitespace-nowrap shrink-0 border transition-all duration-200 active:scale-[0.97]
                          ${active ? "text-white shadow-sm" : "bg-white hover:bg-[#7B2D8E]/[0.04]"}`}
              style={{
                backgroundImage: active ? BRAND_GRADIENT : undefined,
                borderColor: active ? "transparent" : BRAND.border,
                color: active ? "#fff" : BRAND.ink,
              }}
              data-testid={`filter-${key}`}
            >
              {dot && <span aria-hidden>{dot}</span>}
              {label}
              <span
                className="text-[10px] font-bold rounded-full px-1.5 py-px"
                style={{
                  backgroundColor: active ? "rgba(255,255,255,0.22)" : `${BRAND.ink}0f`,
                  color: active ? "#fff" : `${BRAND.ink}99`,
                }}
              >
                {counts[key] ?? 0}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
