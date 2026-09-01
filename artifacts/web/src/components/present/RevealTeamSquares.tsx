import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import { BRAND } from "@/lib/brand";

export interface RevealSide {
  key: "gov" | "opp";
  label: string;
  color: string;
  name: string;
  score: number;
  isWinner: boolean;
}

interface Props {
  sides: RevealSide[];
  /** The searching spotlight hops between the squares. */
  scanning: boolean;
  /** The winner is on screen: one square grows, the other recedes. */
  revealed: boolean;
  canShowScores: boolean;
}

/**
 * The two competing teams as TWO EQUAL SQUARES. They stay perfectly identical
 * — same size, same light — until the result is revealed; only then does the
 * winning square grow, light up in gold and take the trophy.
 */
export default function RevealTeamSquares({
  sides,
  scanning,
  revealed,
  canShowScores,
}: Props) {
  return (
    <div className="mt-10 md:mt-14 grid grid-cols-2 gap-5 md:gap-12 items-center justify-items-center">
      {sides.map((s, i) => {
        const dim = revealed && !s.isWinner;
        const win = revealed && s.isWinner;
        return (
          <motion.div
            key={s.key}
            className="relative w-full max-w-[34rem] aspect-square"
            initial={{ opacity: 0, y: 60, scale: 0.9 }}
            animate={{
              opacity: dim ? 0.32 : 1,
              y: 0,
              scale: win ? 1.08 : dim ? 0.86 : 1,
            }}
            transition={{
              duration: 1,
              delay: revealed ? 0 : i * 0.18,
              ease: [0.22, 1, 0.36, 1],
            }}
            data-testid={`reveal-side-${s.key}`}
          >
            {/* Searching light — sweeps both squares in turn, hinting nothing */}
            {scanning && (
              <motion.span
                aria-hidden
                className="absolute -inset-6 rounded-[3rem] blur-2xl pointer-events-none"
                style={{ backgroundColor: `${BRAND.gold}59` }}
                animate={{ opacity: [0, 0.9, 0] }}
                transition={{
                  duration: 1.6,
                  repeat: Infinity,
                  delay: i * 0.8,
                  ease: "easeInOut",
                }}
              />
            )}

            {/* Winner light — steady rings of gold */}
            {win && (
              <motion.span
                aria-hidden
                className="absolute -inset-8 rounded-[3.5rem] blur-3xl pointer-events-none"
                style={{ backgroundColor: `${BRAND.gold}80` }}
                animate={{ opacity: [0.5, 0.95, 0.5], scale: [1, 1.06, 1] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
              />
            )}

            <div
              className="relative w-full h-full rounded-[2.5rem] border-2 flex flex-col
                         items-center justify-center gap-5 px-6 text-center overflow-hidden"
              style={{
                backgroundColor: win ? `${BRAND.gold}1a` : `${s.color}1f`,
                borderColor: win ? BRAND.gold : `${s.color}4d`,
                boxShadow: win ? `0 0 120px ${BRAND.gold}66` : undefined,
              }}
            >
              <span
                className="px-4 py-1.5 rounded-2xl text-base md:text-2xl font-bold"
                style={{
                  backgroundColor: win ? `${BRAND.gold}33` : `${s.color}33`,
                  color: "#FFFFFFD9",
                }}
              >
                {s.label}
              </span>

              <p className="text-white font-black text-3xl md:text-6xl leading-tight break-words">
                {s.name}
              </p>

              {win && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.4, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Trophy
                    className="w-16 h-16 md:w-28 md:h-28"
                    style={{
                      color: BRAND.gold,
                      filter: `drop-shadow(0 0 40px ${BRAND.gold}cc)`,
                    }}
                  />
                </motion.span>
              )}

              {revealed && canShowScores && (
                <motion.p
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="font-black text-2xl md:text-5xl tabular-nums"
                  style={{ color: BRAND.gold }}
                  data-testid={`reveal-score-${s.key}`}
                >
                  {s.score}
                </motion.p>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
