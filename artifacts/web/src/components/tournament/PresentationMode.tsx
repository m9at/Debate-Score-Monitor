import { useEffect, useMemo } from "react";
import { X } from "lucide-react";
import type { Tournament } from "@/types/tournament";
import { BRAND, BRAND_GRADIENT } from "@/lib/brand";
import { getRoomStatus } from "@/lib/roomStatus";
import RoomStatusBadge from "./RoomStatusBadge";

/**
 * وضع العرض 🎥 — audience-facing full screen: rooms, teams and statuses only.
 * No sidebar, no admin actions, no scores and no judge names.
 */
export default function PresentationMode({
  tournament,
  onExit,
}: {
  tournament: Tournament;
  onExit: () => void;
}) {
  const round = tournament.rounds.find(
    (r) => r.roundNumber === tournament.currentRound
  );

  // Ask the browser for real full screen; exiting it leaves the mode.
  useEffect(() => {
    const el = document.documentElement;
    el.requestFullscreen?.().catch(() => {});
    const onChange = () => {
      if (!document.fullscreenElement) onExit();
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    };
  }, [onExit]);

  const teamName = useMemo(() => {
    const byId = new Map(tournament.teams.map((t) => [t.id, t.name]));
    return (id: string) => byId.get(id) ?? "—";
  }, [tournament.teams]);

  const rooms = (round?.matches ?? []).map((match) => ({
    match,
    status: getRoomStatus({
      match,
      pending: tournament.pendingResults ?? [],
      expectedJudges: round?.judgesPerRoom ?? tournament.settings?.judgesPerRoom ?? 0,
    }),
  }));

  return (
    <div
      dir="rtl"
      className="min-h-screen relative overflow-hidden px-6 py-8 md:px-12 md:py-12"
      style={{ backgroundColor: BRAND.ink }}
      data-testid="presentation-mode"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 right-1/4 w-[42rem] h-[42rem] rounded-full blur-3xl opacity-30"
        style={{ backgroundImage: BRAND_GRADIENT }}
      />

      <button
        type="button"
        onClick={onExit}
        aria-label="إنهاء وضع العرض"
        className="absolute top-5 left-5 z-40 w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20
                   text-white/70 hover:text-white flex items-center justify-center transition-colors"
        data-testid="button-exit-presentation"
      >
        <X className="w-5 h-5" />
      </button>

      <header className="relative flex items-center gap-4 mb-8 md:mb-12">
        <img
          src={`${import.meta.env.BASE_URL}logo-mark.png`}
          alt="مناظرات عُمان"
          className="w-16 h-16 md:w-20 md:h-20 object-contain shrink-0"
          style={{ filter: "drop-shadow(0 0 22px rgba(123,45,142,0.7))" }}
        />
        <div className="min-w-0">
          <h1 className="text-white font-bold text-2xl md:text-4xl leading-tight truncate">
            {tournament.name}
          </h1>
          <p className="text-white/55 text-sm md:text-lg font-semibold mt-1">
            الجولة {tournament.currentRound} من {tournament.totalRounds}
          </p>
        </div>
      </header>

      {rooms.length === 0 ? (
        <p className="relative text-white/60 text-xl font-bold text-center py-20">
          لم تبدأ الجولة بعد
        </p>
      ) : (
        <div className="relative grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
          {rooms.map(({ match, status }) => (
            <div
              key={match.id}
              className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 md:p-6
                         animate-in fade-in zoom-in-95 duration-500"
              data-testid={`present-room-${match.roomNumber}`}
            >
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <h2 className="text-white font-bold text-lg md:text-2xl">
                  {match.roomLabel?.trim() ||
                    `القاعة ${String(match.roomNumber).padStart(2, "0")}`}
                </h2>
                <span className="flex-1" />
                <RoomStatusBadge status={status} />
              </div>

              <div className="space-y-2.5">
                {[
                  { label: "موالاة", color: BRAND.blue, id: match.team1.teamId },
                  { label: "معارضة", color: BRAND.purple, id: match.team2.teamId },
                ].map((side) => (
                  <div
                    key={side.label}
                    className="rounded-2xl px-4 py-3 flex items-center gap-3"
                    style={{ backgroundColor: `${side.color}26` }}
                  >
                    <span
                      className="px-2 py-0.5 rounded-lg text-[11px] md:text-xs font-bold shrink-0 text-white"
                      style={{ backgroundColor: `${side.color}66` }}
                    >
                      {side.label}
                    </span>
                    <span className="text-white font-bold text-base md:text-2xl truncate">
                      {teamName(side.id)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
