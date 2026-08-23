import { Quote } from "lucide-react";
import { BRAND } from "@/lib/brand";

/**
 * The round's motion as a hero element on the projector — large, high contrast
 * and never a footnote at the edge of the screen.
 */
export default function PresentCaseText({
  caseText,
  roundLabel,
}: {
  caseText: string;
  roundLabel: string;
}) {
  return (
    <section
      className="relative rounded-[2rem] border overflow-hidden px-8 py-8 md:px-14 md:py-12"
      style={{
        borderColor: `${BRAND.gold}59`,
        backgroundColor: "rgba(255,255,255,0.05)",
      }}
      data-testid="present-case-text"
    >
      <div
        aria-hidden
        className="absolute inset-y-0 right-0 w-2"
        style={{ backgroundImage: `linear-gradient(${BRAND.gold}, ${BRAND.purple})` }}
      />
      <p
        className="flex items-center gap-3 text-lg md:text-2xl font-bold tracking-wide mb-4"
        style={{ color: BRAND.gold }}
      >
        <Quote className="w-6 h-6 md:w-7 md:h-7" />
        قضية {roundLabel}
      </p>
      <p
        className="text-white font-black leading-[1.35] text-3xl md:text-5xl xl:text-6xl"
        style={{ textShadow: "0 2px 30px rgba(0,0,0,0.5)" }}
        data-testid="present-case-body"
      >
        {caseText}
      </p>
    </section>
  );
}
