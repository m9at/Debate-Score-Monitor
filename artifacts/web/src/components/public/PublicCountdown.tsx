import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { TournamentCountdown } from "@/types/tournament";

/**
 * العد التنازلي للجمهور — ساعات : دقائق : ثوانٍ. Purely presentational: when it
 * reaches zero it simply says the moment has come, and the actual results stay
 * governed by what the admin panel announced.
 */
export default function PublicCountdown({
  countdown,
  onDark = true,
}: {
  countdown: TournamentCountdown;
  onDark?: boolean;
}) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  const left = Math.max(0, countdown.at - now);
  const hours = Math.floor(left / 3600000);
  const minutes = Math.floor((left % 3600000) / 60000);
  const seconds = Math.floor((left % 60000) / 1000);
  const pad = (n: number) => String(n).padStart(2, "0");

  const fg = onDark ? "#ffffff" : "#2B1B45";
  const chip = onDark ? "rgba(255,255,255,0.16)" : "rgba(43,27,69,0.06)";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="flex flex-col items-center gap-2"
      data-testid="public-countdown"
    >
      <p className="text-[13px] font-bold tracking-wide" style={{ color: fg, opacity: 0.85 }}>
        {countdown.label}
      </p>
      {left === 0 ? (
        <p className="text-xl md:text-2xl font-black" style={{ color: fg }}>
          حان الموعد
        </p>
      ) : (
        <div className="flex items-center gap-1.5" dir="ltr">
          {[pad(hours), pad(minutes), pad(seconds)].map((part, i) => (
            <div key={i} className="flex items-center gap-1.5">
              {i > 0 && (
                <span className="text-xl font-black" style={{ color: fg, opacity: 0.5 }}>
                  :
                </span>
              )}
              <span
                className="min-w-[3.1rem] text-center rounded-xl px-2 py-1.5 text-2xl md:text-3xl
                           font-black tabular-nums"
                style={{ backgroundColor: chip, color: fg }}
              >
                {part}
              </span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
