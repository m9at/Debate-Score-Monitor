import { useEffect, useRef, useState } from "react";
import { ChevronDown, Repeat } from "lucide-react";
import type { Tournament } from "@/types/tournament";
import { BRAND } from "@/lib/brand";
import { roundTitle } from "@/lib/reveal";

interface DisplayRoundCardProps {
  tournament: Tournament;
  displayRound: number;
  onSelectRound: (roundNumber: number) => void;
}

/**
 * The "الجولة المعروضة" tile doubles as the round switcher: tapping it opens the
 * list of rounds, so the overview needs no separate selector row.
 */
export default function DisplayRoundCard({
  tournament,
  displayRound,
  onSelectRound,
}: DisplayRoundCardProps) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div className="relative" ref={boxRef} dir="rtl">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full rounded-2xl bg-white border shadow-sm p-4 flex items-center gap-3 text-right
                   transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
        style={{ borderColor: open ? BRAND.gold : BRAND.border }}
        data-testid="button-display-round"
      >
        <span
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${BRAND.gold}14` }}
        >
          <Repeat className="w-5 h-5" style={{ color: BRAND.gold }} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-2xl leading-none" style={{ color: BRAND.ink }}>
            {tournament.started ? `الجولة ${displayRound}` : "—"}
          </p>
          <p className="text-[12px] font-semibold mt-1" style={{ color: `${BRAND.ink}8c` }}>
            الجولة المعروضة — اضغط للتغيير
          </p>
        </div>
        <ChevronDown
          className="w-4 h-4 shrink-0"
          style={{ color: `${BRAND.ink}66` }}
        />
      </button>

      {open && (
        <div
          className="absolute z-20 mt-1.5 left-0 right-0 rounded-2xl bg-white border shadow-lg overflow-hidden"
          style={{ borderColor: BRAND.border }}
          data-testid="menu-display-round"
        >
          {tournament.rounds.map((r) => {
            const active = r.roundNumber === displayRound;
            return (
              <button
                key={r.roundNumber}
                type="button"
                onClick={() => {
                  onSelectRound(r.roundNumber);
                  setOpen(false);
                }}
                className="w-full px-4 py-2.5 text-right text-[13px] font-bold border-b last:border-b-0
                           hover:bg-black/[0.03]"
                style={{
                  borderColor: BRAND.border,
                  backgroundColor: active ? `${BRAND.purple}0f` : undefined,
                  color: active ? BRAND.purple : BRAND.ink,
                }}
                data-testid={`option-display-round-${r.roundNumber}`}
              >
                {roundTitle(r, r.roundNumber)}
                {tournament.currentRound === r.roundNumber ? " (الحالية)" : ""}
                {r.completed ? " — منتهية" : ""}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
