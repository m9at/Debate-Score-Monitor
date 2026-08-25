import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { ChevronDown, Home } from "lucide-react";
import { BRAND, BRAND_GRADIENT, BRAND_GLOW } from "@/lib/brand";

export interface SidebarTab<T extends string = string> {
  key: T;
  label: string;
  icon: LucideIcon;
  badge?: number;
  /** Marks an admin-only destination (shows a small lock). */
  restricted?: boolean;
}

/** A titled group of destinations, e.g. "إدارة البطولة". */
export interface SidebarGroup<T extends string = string> {
  title: string;
  tabs: SidebarTab<T>[];
  /** Secondary destinations — folded away behind the group title. */
  collapsible?: boolean;
}

interface TournamentSidebarProps<T extends string> {
  groups: SidebarGroup<T>[];
  activeTab: T;
  onTabChange: (key: T) => void;
  onHome: () => void;
}

/**
 * Fixed right-hand navigation rail: brand mark on top, then destinations
 * organised into labelled sections. Collapses to a horizontal strip on mobile.
 */
export default function TournamentSidebar<T extends string>({
  groups,
  activeTab,
  onTabChange,
  onHome,
}: TournamentSidebarProps<T>) {
  const [openExtra, setOpenExtra] = useState(false);
  let order = 0;

  const renderTab = (tab: SidebarTab<T>) => {
    const Icon = tab.icon;
    const active = tab.key === activeTab;
    const delay = `${Math.min(order++ * 30, 300)}ms`;

    return (
      <button
        key={tab.key}
        type="button"
        onClick={() => onTabChange(tab.key)}
        aria-current={active ? "page" : undefined}
        className={`group relative flex items-center gap-2.5 shrink-0 md:w-full h-9.5 px-3 rounded-xl
                    text-[12.5px] font-bold transition-all duration-200
                    animate-in fade-in slide-in-from-right-2
                    ${
                      active
                        ? "bg-white/[0.14] text-white"
                        : "text-white/55 hover:text-white/90 hover:bg-white/[0.07]"
                    }`}
        style={{ animationDelay: delay }}
        data-testid={`tab-${tab.key}`}
      >
        {active && (
          <span
            aria-hidden
            className="absolute right-0 top-1.5 bottom-1.5 w-[3px] rounded-full"
            style={{ backgroundImage: BRAND_GRADIENT }}
          />
        )}
        <span className="flex-1 text-right whitespace-nowrap">
          {tab.label}
          {tab.restricted && <span className="mr-1 opacity-70">🔒</span>}
        </span>
        {tab.badge ? (
          <span
            className="min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold
                       text-white flex items-center justify-center shrink-0"
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
  };

  return (
    <aside
      className="md:w-[218px] md:min-h-screen shrink-0 md:sticky md:top-0 flex md:flex-col
                 relative overflow-hidden md:overflow-y-auto"
      style={{ backgroundColor: BRAND.ink }}
      data-testid="tournament-sidebar"
    >
      {/* ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-10 w-56 h-56 rounded-full opacity-40 blur-3xl"
        style={{ backgroundImage: BRAND_GRADIENT }}
      />

      {/* Brand mark — logo sits directly on the dark surface, no white plate */}
      <button
        type="button"
        onClick={onHome}
        title="الرئيسية"
        aria-label="الرئيسية"
        className="relative hidden md:flex flex-col items-center gap-1.5 pt-6 pb-5 px-4 group"
        data-testid="button-sidebar-home"
      >
        <img
          src={`${import.meta.env.BASE_URL}logo-mark.png`}
          alt="مناظرات عُمان"
          className="w-14 h-14 object-contain transition-transform duration-300 group-hover:scale-105"
          style={{ filter: `drop-shadow(${BRAND_GLOW})` }}
        />
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

      {/* Grouped destinations */}
      <nav className="relative flex md:flex-col gap-1 px-2 md:px-2.5 py-2 md:pb-6 overflow-x-auto md:overflow-visible flex-1">
        {groups
          .filter((g) => g.tabs.length > 0)
          .map((group) => {
            // A collapsible group stays folded until asked for, and opens by
            // itself when the active tab lives inside it.
            const holdsActive = group.tabs.some((t) => t.key === activeTab);
            const expanded = !group.collapsible || openExtra || holdsActive;
            return (
              <div
                key={group.title}
                className="flex md:flex-col gap-1 md:mb-3 shrink-0"
              >
                {group.collapsible ? (
                  <button
                    type="button"
                    onClick={() => setOpenExtra((v) => !v)}
                    className="flex items-center gap-1 px-3 mb-1 text-[9.5px] font-bold uppercase
                               tracking-wider text-white/30 hover:text-white/60 transition-colors"
                    data-testid="button-sidebar-more"
                  >
                    {group.title}
                    <ChevronDown
                      className={`w-3 h-3 transition-transform ${expanded ? "rotate-180" : ""}`}
                    />
                  </button>
                ) : (
                  <p
                    className="hidden md:block px-3 mb-1 text-[9.5px] font-bold uppercase tracking-wider
                               text-white/30"
                  >
                    {group.title}
                  </p>
                )}
                {expanded && group.tabs.map(renderTab)}
              </div>
            );
          })}
      </nav>
    </aside>
  );
}
