import { useMemo } from "react";
import type { Match, Tournament } from "@/types/tournament";
import { BRAND } from "@/lib/brand";
import { roomTitle, roundTitle } from "@/lib/reveal";
import { getRoomStatus, roomStatusMeta } from "@/lib/roomStatus";

interface RoomDetailsPanelProps {
  tournament: Tournament;
  roundNumber: number;
  match: Match;
}

/**
 * Everything about one room in a single place: the pairing and its rosters, the
 * assigned judges and who has already submitted, the scores, the winner and the
 * room's own status — so the organiser never has to hop between screens.
 */
export default function RoomDetailsPanel({
  tournament,
  roundNumber,
  match,
}: RoomDetailsPanelProps) {
  const round = tournament.rounds.find((r) => r.roundNumber === roundNumber);
  const gov = tournament.teams.find((t) => t.id === match.team1.teamId);
  const opp = tournament.teams.find((t) => t.id === match.team2.teamId);

  const assignedJudges = useMemo(() => {
    const a = match.judgeAssignment;
    const ids = [
      ...(a?.chairJudgeId ? [a.chairJudgeId] : []),
      ...(a?.panelistJudgeIds ?? []),
    ];
    const fromAssignment = ids
      .map((id) => {
        const j = (tournament.judges ?? []).find((x) => x.id === id);
        return j ? { name: j.name, chair: a?.chairJudgeId === id } : null;
      })
      .filter(Boolean) as { name: string; chair: boolean }[];
    if (fromAssignment.length > 0) return fromAssignment;
    // Older rounds only recorded the names typed with the result.
    return (match.judgeNames ?? [])
      .filter((n) => n?.trim())
      .map((n) => ({ name: n, chair: n === match.chairName }));
  }, [match, tournament.judges]);

  /** Names that already sent a score — from submitted results or pending ones. */
  const submittedNames = useMemo(() => {
    const names = new Set<string>();
    for (const n of match.judgeNames ?? []) if (n?.trim()) names.add(n.trim());
    for (const p of tournament.pendingResults ?? []) {
      if (p.matchId !== match.id) continue;
      for (const n of (p.judgeName ?? "").split(/[،,]/)) {
        if (n.trim()) names.add(n.trim());
      }
    }
    return names;
  }, [match, tournament.pendingResults]);

  const status = getRoomStatus({
    match,
    pending: tournament.pendingResults ?? [],
    expectedJudges: round?.judgesPerRoom ?? tournament.settings?.judgesPerRoom ?? 0,
  });
  const meta = roomStatusMeta(status);

  const winnerName =
    match.winnerId === match.team1.teamId
      ? gov?.name
      : match.winnerId === match.team2.teamId
        ? opp?.name
        : null;

  const Side = ({
    title,
    label,
    color,
    names,
    total,
    isWinner,
  }: {
    title: string;
    label: string;
    color: string;
    names: string[];
    total: number;
    isWinner: boolean;
  }) => (
    <div
      className="rounded-2xl border p-3.5"
      style={{
        borderColor: isWinner ? `${BRAND.success}66` : BRAND.border,
        backgroundColor: isWinner ? `${BRAND.success}0a` : "#fff",
      }}
    >
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className="text-[11px] font-bold px-2 py-0.5 rounded-lg"
          style={{ backgroundColor: `${color}1f`, color }}
        >
          {label}
        </span>
        <span className="font-bold text-[14px]" style={{ color: BRAND.ink }}>
          {title}
        </span>
        {isWinner && <span className="text-[12px] font-bold">🏆 الفائز</span>}
        <span className="flex-1" />
        <span className="font-bold text-[16px] tabular-nums" style={{ color }}>
          {total || "—"}
        </span>
      </div>
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {names.filter(Boolean).map((n, i) => (
          <li
            key={`${n}-${i}`}
            className="text-[12px] font-semibold px-2 py-1 rounded-lg"
            style={{ backgroundColor: `${BRAND.ink}0a`, color: `${BRAND.ink}c4` }}
          >
            {n}
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <section
      className="rounded-2xl bg-white border shadow-sm p-4 mb-4 space-y-3.5"
      style={{ borderColor: BRAND.border }}
      dir="rtl"
      data-testid="room-details-panel"
    >
      <header className="flex items-center gap-2.5 flex-wrap">
        <h2 className="font-bold text-[16px]" style={{ color: BRAND.ink }}>
          {roomTitle(match)}
        </h2>
        <span
          className="text-[12px] font-bold px-2.5 py-1 rounded-lg"
          style={{ backgroundColor: `${BRAND.purple}12`, color: BRAND.purple }}
        >
          {roundTitle(round, roundNumber)}
        </span>
        <span className="flex-1" />
        <span
          className="text-[12.5px] font-bold px-2.5 py-1 rounded-lg"
          style={{ backgroundColor: meta.bg, color: meta.fg }}
          data-testid="room-details-status"
        >
          {meta.label}
        </span>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Side
          title={gov?.name ?? "—"}
          label="موالاة"
          color={BRAND.blue}
          names={gov?.speakerNames ?? []}
          total={match.team1.totalScore}
          isWinner={match.winnerId === match.team1.teamId}
        />
        <Side
          title={opp?.name ?? "—"}
          label="معارضة"
          color={BRAND.purple}
          names={opp?.speakerNames ?? []}
          total={match.team2.totalScore}
          isWinner={match.winnerId === match.team2.teamId}
        />
      </div>

      <div>
        <h3 className="font-bold text-[13.5px] mb-2" style={{ color: BRAND.ink }}>
          المحكمون وحالة التحكيم
        </h3>
        {assignedJudges.length === 0 ? (
          <p className="text-[12.5px] font-semibold" style={{ color: `${BRAND.ink}8c` }}>
            لم يتم تعيين محكمين لهذه القاعة بعد.
          </p>
        ) : (
          <ul className="flex flex-wrap gap-1.5">
            {assignedJudges.map((j) => {
              const sent = submittedNames.has(j.name.trim());
              return (
                <li
                  key={j.name}
                  className="text-[12.5px] font-bold px-2.5 py-1 rounded-lg"
                  style={{
                    backgroundColor: sent ? `${BRAND.success}14` : `${BRAND.warning}14`,
                    color: sent ? "#15803D" : "#92400E",
                  }}
                  data-testid={`judge-status-${j.name}`}
                >
                  {sent ? "✅" : "⏳"} {j.name}
                  {j.chair ? " (رئيس)" : ""} — {sent ? "أرسل الدرجة" : "لم يرسل"}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {winnerName && (
        <p className="font-bold text-[13.5px]" style={{ color: "#15803D" }}>
          النتيجة النهائية: {winnerName} — {Math.max(match.team1.totalScore, match.team2.totalScore)} مقابل{" "}
          {Math.min(match.team1.totalScore, match.team2.totalScore)}
        </p>
      )}
    </section>
  );
}
