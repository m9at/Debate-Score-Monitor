import { useMemo } from "react";
import { BRAND } from "@/lib/brand";

const COLORS = [BRAND.purple, BRAND.blue, BRAND.gold, "#FFFFFF", BRAND.success];

/** Lightweight CSS confetti burst — no dependency, safe on a projector. */
export default function Confetti({ pieces = 90 }: { pieces?: number }) {
  const bits = useMemo(
    () =>
      Array.from({ length: pieces }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 1.2,
        duration: 3 + Math.random() * 2.5,
        size: 6 + Math.random() * 8,
        color: COLORS[i % COLORS.length],
        rotate: Math.random() * 360,
        round: Math.random() > 0.6,
      })),
    [pieces]
  );

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 overflow-hidden z-50"
      data-testid="confetti"
    >
      {bits.map((b) => (
        <span
          key={b.id}
          className="absolute top-[-8%] animate-confetti-fall"
          style={{
            left: `${b.left}%`,
            width: b.size,
            height: b.round ? b.size : b.size * 0.45,
            backgroundColor: b.color,
            borderRadius: b.round ? "9999px" : "2px",
            animationDelay: `${b.delay}s`,
            animationDuration: `${b.duration}s`,
            transform: `rotate(${b.rotate}deg)`,
          }}
        />
      ))}
    </div>
  );
}
