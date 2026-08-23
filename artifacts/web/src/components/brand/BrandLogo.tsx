import { BRAND_GLOW } from "@/lib/brand";

type Tone = "light" | "dark";

interface BrandLogoProps {
  /** Rendered height in pixels; width follows the logo's aspect ratio. */
  size?: number;
  /**
   * Surface the logo sits on:
   * - "light" → dark wordmark (for white/soft backgrounds)
   * - "dark"  → white wordmark (for ink/gradient backgrounds)
   */
  tone?: Tone;
  /** Soft brand glow behind the mark — only reads well on dark surfaces. */
  glow?: boolean;
  className?: string;
}

/**
 * The Oman Debates logo — transparent PNG, no white plate or circle behind it,
 * so it sits naturally on whatever surface it is placed on.
 */
export default function BrandLogo({
  size = 44,
  tone = "light",
  glow = false,
  className = "",
}: BrandLogoProps) {
  const file = tone === "dark" ? "logo-mark-light.png" : "logo-mark.png";

  return (
    <img
      src={`${import.meta.env.BASE_URL}${file}`}
      alt="مناظرات عُمان"
      width={size}
      height={size}
      className={`object-contain select-none shrink-0 ${className}`}
      style={{
        height: size,
        width: size,
        filter: glow ? `drop-shadow(${BRAND_GLOW.replace("0 0 32px ", "0 0 18px ")})` : undefined,
      }}
      draggable={false}
      data-testid="brand-logo"
    />
  );
}
