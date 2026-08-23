import { motion } from "framer-motion";
import { BRAND, BRAND_GRADIENT } from "@/lib/brand";

/**
 * The broadcast header of وضع العرض: the مناظرات عُمان mark on a living
 * backdrop — a slow glow, a drifting gradient and a light sweep passing behind
 * it — so the screen reads as a live event, never a static image.
 */
export default function PresentLogoHero({
  tournamentName,
  roundLabel,
}: {
  tournamentName: string;
  roundLabel: string;
}) {
  return (
    <header
      className="relative flex flex-col items-center text-center pt-2 pb-1"
      data-testid="present-logo-hero"
    >
      {/* Slow breathing halo */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -top-24 w-[38rem] h-[38rem] rounded-full blur-3xl"
        style={{ backgroundImage: BRAND_GRADIENT }}
        animate={{ opacity: [0.18, 0.34, 0.18], scale: [0.95, 1.06, 0.95] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative">
        {/* Light sweep passing behind the mark */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 -inset-x-24 blur-2xl"
          style={{
            backgroundImage:
              "linear-gradient(100deg, transparent 20%, rgba(255,255,255,0.34) 50%, transparent 80%)",
          }}
          animate={{ x: ["-60%", "60%"] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.img
          src={`${import.meta.env.BASE_URL}logo-mark.png`}
          alt="مناظرات عُمان"
          className="relative w-28 h-28 md:w-40 md:h-40 object-contain"
          style={{ filter: `drop-shadow(0 0 34px ${BRAND.purple}cc)` }}
          animate={{ scale: [1, 1.03, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <h1 className="relative mt-3 text-white/90 font-black text-2xl md:text-4xl truncate max-w-full">
        {tournamentName}
      </h1>
      <p
        className="relative mt-2 font-black text-3xl md:text-5xl"
        style={{
          backgroundImage: `linear-gradient(120deg, ${BRAND.gold}, #fff 60%, ${BRAND.gold})`,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
        }}
        data-testid="present-round-label"
      >
        {roundLabel}
      </p>
    </header>
  );
}
