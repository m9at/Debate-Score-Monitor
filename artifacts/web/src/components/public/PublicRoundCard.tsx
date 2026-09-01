import { Lock, Quote, Trophy } from "lucide-react";
import type { Round, Tournament } from "@/types/tournament";
import { BRAND } from "@/lib/brand";
import { roomTitle, roundTitle } from "@/lib/reveal";

/**
 * One round for the audience: its motion, whether the results are announced,
 * and — only for announced rooms — the pairing, the winner and (if the
 * organiser allows scores) the totals. Unannounced rooms stay locked.
 */
export default function PublicRoundCard({
  round,
  tournament,
  teamName,
}: {
  round: Round;
  tournament: Tournament;
  teamName: (id: string) => string;
}) {
  const showScores = tournament.settings?.showScoresOnAnnounce === true;
  const announced = round.matches.filter((m) => m.resultAnnounced);
  const allAnnounced = round.matches.length > 0 && announced.length === round.matches.length;

  return (
    <section
      className="rounded-2xl bg-white border p-4 md:p-5 space-y-3.5"
      style={{ borderColor: BRAND.border }}
      data-testid={`public-round-${round.roundNumber}`}
    >
      <div className="flex items-center gap-3 flex-wrap">
        <h3 className="font-black text-[17px]" style={{ color: BRAND.ink }}>
          {roundTitle(round, round.roundNumber)}
        </h3>
        <span
          className="px-2.5 h-7 inline-flex items-center gap-1.5 rounded-lg text-[12px] font-bold"
          style={{
            backgroundColor: allAnnounced ? `${BRAND.success}1f` : `${BRAND.ink}0f`,
            color: allAnnounced ? "#15803D" : `${BRAND.ink}99`,
          }}
          data-testid="public-round-state"
        >
          {allAnnounced ? (
            <>✅ النتائج معلنة</>
          ) : announced.length > 0 ? (
            <>⏳ معلنة جزئياً ({announced.length} من {round.matches.length})</>
          ) : (
            <>
              <Lock className="w-3.5 h-3.5" />
              النتائج غير معلنة
            </>
          )}
        </span>
      </div>

      {round.caseText?.trim() && (
        <p
          className="rounded-xl px-3.5 py-3 text-[14px] md:text-[15px] font-bold leading-relaxed
                     inline-flex items-start gap-2"
          style={{ backgroundColor: `${BRAND.purple}0f`, color: BRAND.ink }}
          data-testid="public-round-case"
        >
          <Quote className="w-4 h-4 mt-0.5 shrink-0" style={{ color: BRAND.purple }} />
          {round.caseText}
        </p>
      )}

      {round.matches.length === 0 ? (
        <p className="text-[12.5px]" style={{ color: `${BRAND.ink}99` }}>
          لم تُجرَ قرعة هذه الجولة بعد.
        </p>
      ) : (
        <ul className="space-y-2">
          {round.matches.map((m) => {
            const revealed = !!m.resultAnnounced;
            const winner = revealed && m.winnerId ? teamName(m.winnerId) : null;
            return (
              <li
                key={m.id}
                className="rounded-xl border px-3.5 py-3 flex flex-wrap items-center gap-x-3 gap-y-1.5"
                style={{ borderColor: BRAND.border }}
                data-testid={`public-room-${m.id}`}
              >
                <span
                  className="text-[12px] font-bold px-2 h-6 inline-flex items-center rounded-lg"
                  style={{ backgroundColor: `${BRAND.blue}1f`, color: BRAND.blueDeep }}
                >
                  {roomTitle(m)}
                </span>
                <span className="font-bold text-[13.5px]" style={{ color: BRAND.ink }}>
                  {teamName(m.team1.teamId)}
                  {revealed && showScores && (
                    <span className="tabular-nums" style={{ color: `${BRAND.ink}80` }}>
                      {" "}({m.team1.totalScore})
                    </span>
                  )}
                </span>
                <span className="text-[12px]" style={{ color: `${BRAND.ink}66` }}>
                  ضد
                </span>
                <span className="font-bold text-[13.5px]" style={{ color: BRAND.ink }}>
                  {teamName(m.team2.teamId)}
                  {revealed && showScores && (
                    <span className="tabular-nums" style={{ color: `${BRAND.ink}80` }}>
                      {" "}({m.team2.totalScore})
                    </span>
                  )}
                </span>
                <span className="flex-1" />
                {revealed ? (
                  <span
                    className="inline-flex items-center gap-1.5 text-[12.5px] font-bold px-2.5 h-7 rounded-lg"
                    style={{ backgroundColor: `${BRAND.gold}26`, color: "#8A5A00" }}
                    data-testid="public-room-winner"
                  >
                    <Trophy className="w-3.5 h-3.5" />
                    {winner ? `الفائز: ${winner}` : "تعادل"}
                  </span>
                ) : (
                  <span
                    className="inline-flex items-center gap-1.5 text-[12px] font-bold"
                    style={{ color: `${BRAND.ink}80` }}
                  >
                    <Lock className="w-3.5 h-3.5" />
                    بانتظار الإعلان
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
