import type { LucideIcon } from "lucide-react";
import { Home } from "lucide-react";
import { BRAND, BRAND_GRADIENT, BRAND_GLOW } from "@/lib/brand";

export interface SidebarTab<T extends string = string> {
  key: T;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

interface TournamentSidebarProps<T extends string> {
  tabs: SidebarTab<T>[];
  activeTab: T;
  onTabChange: (key: T) => void;
  onHome: () => void;
}

/**
 * Fixed right-hand navigation rail: brand mark on top, vertical tab list below.
 * Collapses to a horizontal scrollable strip on small screens.
 */
export default function TournamentSidebar<T extends string>({
  tabs,
  activeTab,
  onTabChange,
  onHome,
}: TournamentSidebarProps<T>) {
  return (
    <aside
      className="md:w-[210px] md:min-h-screen shrink-0 md:sticky md:top-0 flex md:flex-col
                 relative overflow-hidden"
      style={{ backgroundColor: BRAND.ink }}
      data-testid="tournament-sidebar"
    >
      {/* ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-10 w-56 h-56 rounded-full opacity-40 blur-3xl"
        style={{ backgroundImage: BRAND_GRADIENT }}
      />

      {/* Brand mark */}
      <button
        type="button"
        onClick={onHome}
        title="الرئيسية"
        aria-label="الرئيسية"
        className="relative hidden md:flex flex-col items-center gap-2 pt-7 pb-6 px-4 group"
        data-testid="button-sidebar-home"
      >
        <span
          className="w-16 h-16 rounded-2xl bg-white/[0.06] flex items-center justify-center
                     transition-transform duration-300 group-hover:scale-105 animate-in fade-in zoom-in-95"
          style={{ boxShadow: BRAND_GLOW }}
        >
          <img
            src={`${import.meta.env.BASE_URL}logo-mark.png`}
            alt="مناظرات عُمان"
            className="w-12 h-12 object-contain"
          />
        </span>
        <span className="text-white/90 text-[11px] font-bold leading-tight text-center">
          مناظرات عُمان
          <span className="block text-white/45 text-[9px] font-medium tracking-wide">
            Oman Debates
          </span>
        </span>
      </button>

      {/* Mobile brand + home */}
      <button
        type="button"
        onClick={onHome}
        aria-label="الرئيسية"
        className="md:hidden relative shrink-0 w-14 flex items-center justify-center"
        data-testid="button-sidebar-home-mobile"
      >
        <Home className="w-5 h-5 text-white/80" />
      </button>

      {/* Tabs */}
      <nav className="relative flex md:flex-col gap-1 px-2 md:px-2.5 py-2 md:py-0 overflow-x-auto md:overflow-visible flex-1">
        {tabs.map((tab, i) => {
          const Icon = tab.icon;
          const active = tab.key === activeTab;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onTabChange(tab.key)}
              aria-current={active ? "page" : undefined}
              className={`group relative flex items-center gap-2.5 shrink-0 md:w-full h-10 px-3 rounded-xl
                          text-[13px] font-bold transition-all duration-200 animate-in fade-in slide-in-from-right-2
                          ${
                            active
                              ? "bg-white/[0.14] text-white"
                              : "text-white/60 hover:text-white/90 hover:bg-white/[0.07]"
                          }`}
              style={{ animationDelay: `${i * 40}ms` }}
              data-testid={`tab-${tab.key}`}
            >
              {active && (
                <span
                  aria-hidden
                  className="absolute right-0 top-1.5 bottom-1.5 w-[3px] rounded-full"
                  style={{ backgroundImage: BRAND_GRADIENT }}
                />
              )}
              <span className="flex-1 text-right whitespace-nowrap">{tab.label}</span>
              {tab.badge ? (
                <span
                  className="min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold
                             text-white flex items-center justify-center"
                  style={{ backgroundColor: BRAND.purple }}
                >
                  {tab.badge}
                </span>
              ) : null}
              <Icon
                className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                  active ? "scale-110" : "group-hover:scale-105"
                }`}
              />
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
