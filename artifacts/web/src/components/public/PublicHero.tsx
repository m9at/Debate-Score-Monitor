import { motion } from "framer-motion";
import { Eye } from "lucide-react";
import type { Tournament } from "@/types/tournament";
import { BRAND, BRAND_GRADIENT, LAYOUT, STATUS_META } from "@/lib/brand";
import { getTournamentStatus } from "@/lib/tournamentStatus";
import BrandLogo from "@/components/brand/BrandLogo";
import PublicCountdown from "@/components/public/PublicCountdown";

/**
 * The hero of وضع الجمهور. When the organiser uploaded a tournament image the
 * whole header is BUILT around it — full-bleed cover with a brand-tinted
 * overlay; otherwise it falls back to the brand gradient. The white logo is used
 * here, because the surface is always dark.
 */
export default function PublicHero({
  tournament,
  meta,
  children,
}: {
  tournament: Tournament;
  /** Small line under the title (counts, dates…). */
  meta?: string;
  children?: React.ReactNode;
}) {
  const cover = tournament.coverImageDataUrl;
  const status = STATUS_META[getTournamentStatus(tournament)];
  const whiteLogo = tournament.logoWhiteDataUrl;
  const countdown = tournament.countdown;

  return (
    <header
      className="relative overflow-hidden text-white"
      style={{ backgroundImage: cover ? undefined : BRAND_GRADIENT, backgroundColor: BRAND.ink }}
      data-testid="public-hero"
    >
      {cover && (
        <>
          <img
            src={cover}
            alt={tournament.name}
            className="absolute inset-0 w-full h-full object-cover"
            data-testid="public-hero-image"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                `linear-gradient(180deg, ${BRAND.ink}b3 0%, ${BRAND.ink}59 40%, ${BRAND.ink}e6 100%)`,
            }}
          />
        </>
      )}

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className={`${LAYOUT.page} relative flex flex-col items-center text-center gap-3.5
                    py-10 md:py-16`}
      >
        <div className="flex items-center gap-3">
          {whiteLogo ? (
            <img
              src={whiteLogo}
              alt={tournament.name}
              className="h-11 md:h-14 object-contain"
              data-testid="public-hero-tournament-logo"
            />
          ) : (
            <BrandLogo size={52} tone="dark" glow />
          )}
        </div>

        <span className="inline-flex items-center gap-2 px-3 h-8 rounded-full bg-white/20 backdrop-blur text-[12.5px] font-bold">
          <Eye className="w-4 h-4" />
          وضع الجمهور · مشاهدة فقط
        </span>

        <h1 className="font-black text-3xl md:text-5xl leading-tight drop-shadow-sm">
          {tournament.name}
        </h1>

        <span
          className="px-3 h-8 inline-flex items-center rounded-full text-[12.5px] font-bold bg-white/90"
          style={{ color: status.color }}
          data-testid="public-hero-status"
        >
          {status.dot} {status.label}
        </span>

        {meta && <p className="text-white/85 font-bold text-[13.5px] md:text-base">{meta}</p>}

        {countdown?.enabled && (
          <div className="mt-1.5">
            <PublicCountdown countdown={countdown} />
          </div>
        )}

        {children}
      </motion.div>
    </header>
  );
}
