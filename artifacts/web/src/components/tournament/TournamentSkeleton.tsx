import { Skeleton } from "@/components/ui/skeleton";
import { BRAND } from "@/lib/brand";

/** Shape-matched placeholder for the tournament dashboard while data loads. */
export default function TournamentSkeleton() {
  return (
    <div
      className="min-h-screen flex flex-col md:flex-row"
      style={{ backgroundColor: BRAND.surface }}
      data-testid="tournament-skeleton"
    >
      {/* Sidebar rail */}
      <div
        className="md:w-[218px] shrink-0 md:min-h-screen p-4 space-y-3"
        style={{ backgroundColor: BRAND.ink }}
      >
        <Skeleton className="w-14 h-14 rounded-2xl mx-auto bg-white/10" />
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-9 rounded-xl bg-white/10" />
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 px-4 md:px-6 py-6 space-y-5 max-w-6xl mx-auto w-full">
        <Skeleton className="h-8 w-64 rounded-lg" />
        <Skeleton className="h-40 rounded-2xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
