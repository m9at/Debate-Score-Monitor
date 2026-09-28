import { useMemo } from "react";
import { AlertTriangle, CheckCircle2, Gavel, Play, Shuffle } from "lucide-react";
import type { Tournament } from "@/types/tournament";
import { BRAND, BTN, BTN_PRIMARY_STYLE, BTN_SIZE } from "@/lib/brand";
import { roundTitle } from "@/lib/reveal";
import { evaluateRoundReadiness } from "@/lib/roundReadiness";

interface RoundCommandCenterProps {
  tournament: Tournament;
  /** Round number the organiser is inspecting. */
  selectedRound: number;
  /**
   * Prepares and starts the next round: pairings → rooms → judges → current round.
   * Only offered once the selected round is finished.
   */
  onStartNextRound: () => void;
  /** Makes the selected (already prepared) round the live one. */
  onStartSelectedRound: () => void;
  /** Draws the selected round when it has no pairings yet (judges are not assigned). */
  onDraw: () => void;
  /** Opens the judge distribution page. */
  onOpenJudges: () => void;
  canManage: boolean;
}

/**
 * The round is the unit of work: which round is shown, whether it can actually
 * run, and the single button that moves the tournament forward. Judge
 * distribution belongs to the judges tab, not to this screen.
 */
export default function RoundCommandCenter({
  tournament,
  selectedRound,
  onStartNextRound,
  onStartSelectedRound,
  onDraw,
  onOpenJudges,
  canManage,
}: RoundCommandCenterProps) {
  const round = tournament.rounds.find((r) => r.roundNumber === selectedRound);
  const readiness = useMemo(
    () => evaluateRoundReadiness(tournament, round),
    [tournament, round],
  );

  // A round without a draw isn't running yet, even if it is the current one.
  const isLive =
    tournament.started &&
    tournament.currentRound === selectedRound &&
    (round?.matches.length ?? 0) > 0;
  const roundFinished = !!round?.completed;
  const nextRoundExists = tournament.rounds.some(
    (r) => r.roundNumber === selectedRound + 1,
  );
  const canPrepareNext =
    canManage &&
    roundFinished &&
    !tournament.finished &&
    (selectedRound < tournament.totalRounds ||
      tournament.semifinalEnabled ||
      tournament.finalEnabled);

  return (
    <section className="space-y-4" dir="rtl" data-testid="round-command-center">
      {/* Round actions — the round itself is chosen from the summary tile. */}
      <div
        className="rounded-2xl bg-white border shadow-sm p-4 flex flex-wrap items-center gap-3"
        style={{ borderColor: BRAND.border }}
      >
        <span className="font-bold text-[14px]" style={{ color: BRAND.ink }}>
          {round ? roundTitle(round, selectedRound) : "الجولة"}
        </span>

        <span className="flex-1" />

        {isLive ? (
          <span
            className="h-9 px-3 rounded-xl text-[12.5px] font-bold inline-flex items-center"
            style={{ backgroundColor: `${BRAND.success}1f`, color: "#15803D" }}
          >
            🟢 الجولة الجارية الآن
          </span>
        ) : (
          canManage &&
          !roundFinished &&
          round &&
          (round.matches.length === 0 ? (
            <button
              type="button"
              onClick={onDraw}
              className={`${BTN.base} ${BTN.primary} ${BTN_SIZE.lg}`}
              style={BTN_PRIMARY_STYLE}
              data-testid="button-draw-round"
            >
              <Shuffle className="w-4 h-4" />
              بدء القرعة
            </button>
          ) : (
            <button
              type="button"
              onClick={onStartSelectedRound}
              disabled={!readiness.ready}
              className={`${BTN.base} ${BTN.primary} ${BTN_SIZE.lg}`}
              style={BTN_PRIMARY_STYLE}
              data-testid="button-start-selected-round"
            >
              <Play className="w-4 h-4" />
              بدء {roundTitle(round, selectedRound)}
            </button>
          ))
        )}

        {canPrepareNext && (
          <button
            type="button"
            onClick={onStartNextRound}
            className={`${BTN.base} ${BTN.primary} ${BTN_SIZE.lg}`}
            style={BTN_PRIMARY_STYLE}
            data-testid="button-start-next-round"
          >
            <Play className="w-4 h-4" />
            {nextRoundExists ? "بدء الجولة التالية" : "تجهيز وبدء الجولة التالية"}
          </button>
        )}
      </div>

      {/* Readiness — the round never starts before it can actually run. */}
      <div
        className="rounded-2xl bg-white border shadow-sm p-4"
        style={{
          borderColor: readiness.ready ? `${BRAND.success}55` : `${BRAND.danger}55`,
        }}
        data-testid="round-readiness"
      >
        <h3
          className="font-bold text-[14.5px] flex items-center gap-2"
          style={{ color: readiness.ready ? "#15803D" : BRAND.danger }}
        >
          {readiness.ready ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              🟢 {round ? roundTitle(round, selectedRound) : "الجولة"} جاهزة
            </>
          ) : (
            <>
              <AlertTriangle className="w-4 h-4" />
              لا يمكن بدء الجولة
            </>
          )}
        </h3>

        {readiness.issues.length > 0 && (
          <ul className="mt-2.5 space-y-1.5">
            {readiness.issues.map((iss) => (
              <li
                key={iss.key}
                className="text-[13px] font-semibold"
                style={{ color: BRAND.danger }}
                data-testid={`readiness-issue-${iss.key}`}
              >
                • {iss.message}
              </li>
            ))}
          </ul>
        )}

        {readiness.warnings.length > 0 && (
          <div
            className="mt-3 rounded-xl border p-3"
            style={{ borderColor: `${BRAND.warning}66`, backgroundColor: `${BRAND.warning}12` }}
            data-testid="round-judge-warnings"
          >
            <p className="text-[13px] font-bold" style={{ color: "#92400E" }}>
              ⚠️ تنبيهات — يمكنك بدء الجولة رغم ذلك
            </p>
            <ul className="mt-1.5 space-y-1">
              {readiness.warnings.map((w) => (
                <li key={w.key} className="text-[12.5px] font-semibold" style={{ color: "#92400E" }}>
                  • {w.message}
                </li>
              ))}
            </ul>
            {canManage && (
              <button
                type="button"
                onClick={onOpenJudges}
                className={`${BTN.base} ${BTN.secondary} ${BTN_SIZE.sm} mt-2.5`}
                data-testid="button-open-judge-distribution"
              >
                <Gavel className="w-3.5 h-3.5" />
                الانتقال إلى توزيع المحكمين
              </button>
            )}
          </div>
        )}

        {readiness.passed.length > 0 && (
          <ul className="mt-2.5 flex flex-wrap gap-1.5">
            {readiness.passed.map((p) => (
              <li
                key={p}
                className="text-[12px] font-bold px-2.5 py-1 rounded-lg"
                style={{ backgroundColor: `${BRAND.success}14`, color: "#15803D" }}
              >
                ✓ {p}
              </li>
            ))}
          </ul>
        )}
      </div>

    </section>
  );
}
