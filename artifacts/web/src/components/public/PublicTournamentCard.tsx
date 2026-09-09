import { Link } from "wouter";
import { CalendarDays, Layers, Users } from "lucide-react";
import type { Tournament } from "@/types/tournament";
import { BRAND, STATUS_META } from "@/lib/brand";
import { getTournamentStatus } from "@/lib/tournamentStatus";

/** A tournament as the audience sees it: status and counts, no actions. */
export default function PublicTournamentCard({
  tournament: t,
}: {
  tournament: Tournament;
}) {
  const status = STATUS_META[getTournamentStatus(t)];
  const announcedRounds = t.rounds.filter(
    (r) => r.matches.length > 0 && r.matches.every((m) => m.resultAnnounced),
  ).length;

  return (
    <Link
      href={`/public/${t.id}`}
      className="block rounded-2xl bg-white border p-4 md:p-5 space-y-3 overflow-hidden transition-all
                 hover:-translate-y-1 hover:shadow-lg"
      style={{ borderColor: BRAND.border }}
      data-testid={`public-tournament-${t.id}`}
    >
      {t.coverImageDataUrl && (
        <div className="-mx-4 -mt-4 md:-mx-5 md:-mt-5 mb-1 h-40 md:h-48 overflow-hidden rounded-t-2xl relative">
          <img
            src={t.coverImageDataUrl}
            alt={t.name}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-[1.04]"
            data-testid="public-tournament-cover"
          />
          <div
            className="absolute inset-0"
            style={{ background: `linear-gradient(180deg, transparent 45%, ${BRAND.ink}99 100%)` }}
          />
          {t.logoWhiteDataUrl && (
            <img
              src={t.logoWhiteDataUrl}
              alt=""
              className="absolute bottom-3 right-4 h-9 object-contain"
            />
          )}
        </div>
      )}
      <div className="flex items-start gap-3 flex-wrap">
        <h2 className="flex-1 font-black text-[17px]" style={{ color: BRAND.ink }}>
          {t.name}
        </h2>
        <span
          className="px-2.5 h-7 inline-flex items-center gap-1.5 rounded-lg text-[12px] font-bold"
          style={{ backgroundColor: status.bg, color: status.color }}
          data-testid="public-tournament-status"
        >
          {status.dot} {status.label}
        </span>
      </div>

      {t.description && (
        <p className="text-[12.5px] leading-relaxed" style={{ color: `${BRAND.ink}99` }}>
          {t.description}
        </p>
      )}

      <div
        className="flex flex-wrap gap-4 text-[12.5px] font-bold"
        style={{ color: `${BRAND.ink}b3` }}
      >
        <span className="inline-flex items-center gap-1.5">
          <Users className="w-4 h-4" style={{ color: BRAND.purple }} />
          {t.teams.length} فريق
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Layers className="w-4 h-4" style={{ color: BRAND.blue }} />
          {t.rounds.length} من {t.totalRounds} جولة
        </span>
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="w-4 h-4" style={{ color: BRAND.gold }} />
          {announcedRounds} جولة معلنة
        </span>
      </div>
    </Link>
  );
}
