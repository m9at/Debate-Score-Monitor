import type { Round, Tournament } from "@/types/tournament";

export interface ReadinessIssue {
  /** Short machine key, useful for tests. */
  key: string;
  /** Arabic message shown to the organiser, naming the exact room when relevant. */
  message: string;
}

export interface RoundReadiness {
  ready: boolean;
  issues: ReadinessIssue[];
  /** Non-blocking notes (e.g. rooms short of judges) — the round may still start. */
  warnings: ReadinessIssue[];
  /** Checks that passed — shown as a reassuring checklist. */
  passed: string[];
}

const roomName = (m: { roomLabel?: string; roomNumber: number }) =>
  m.roomLabel?.trim() || `القاعة ${m.roomNumber}`;

/**
 * Decides whether a round can actually run, and says precisely what is missing.
 *
 * The organiser must never start a round and only then discover that a room has
 * no judge — every blocking condition is reported up front, by room name.
 */
export function evaluateRoundReadiness(
  tournament: Tournament,
  round: Round | undefined,
): RoundReadiness {
  const issues: ReadinessIssue[] = [];
  const warnings: ReadinessIssue[] = [];
  const passed: string[] = [];
  const judges = (tournament.judges ?? []).filter((j) => !j.disabled);
  const expectedJudges =
    round?.judgesPerRoom ?? tournament.settings?.judgesPerRoom ?? 1;

  // الفرق
  if (tournament.teams.length < 2) {
    issues.push({ key: "teams", message: "لا يمكن بدء الجولة — يجب تسجيل فريقين على الأقل." });
  } else {
    passed.push(`الفرق محددة (${tournament.teams.length} فريق)`);
  }

  // الجولة السابقة
  const previous = round
    ? tournament.rounds.find((r) => r.roundNumber === round.roundNumber - 1)
    : undefined;
  if (previous && !previous.completed) {
    issues.push({
      key: "previous-round",
      message: `لا يمكن بدء الجولة — الجولة ${previous.roundNumber} لم تنتهِ بعد.`,
    });
  } else if (previous) {
    passed.push(`الجولة ${previous.roundNumber} انتهت`);
  }

  // المواجهات والقاعات
  if (!round || round.matches.length === 0) {
    issues.push({
      key: "matches",
      message: "لا يمكن بدء الجولة — لم يتم إنشاء المواجهات والقاعات.",
    });
    return { ready: false, issues, warnings, passed };
  }
  passed.push(`المواجهات جاهزة (${round.matches.length} قاعة)`);

  // فرق مسجلة لم تدخل القرعة (مثلاً أُضيفت بعد إجراء القرعة)
  const placed = new Set(round.matches.flatMap((m) => [m.team1.teamId, m.team2.teamId]));
  const unplaced = tournament.teams.filter((t) => !t.disabled && !placed.has(t.id)).length;
  if (unplaced > 0) {
    warnings.push({
      key: "unplaced-teams",
      message: `${unplaced} فريق غير موزّع على أي قاعة (القاعات ${round.matches.length} من ${Math.floor(tournament.teams.filter((t) => !t.disabled).length / 2)}) — أعد القرعة من الصفر لتوزيع جميع الفرق.`,
    });
  }

  for (const m of round.matches) {
    // فرق القاعة
    const t1 = tournament.teams.find((t) => t.id === m.team1.teamId);
    const t2 = tournament.teams.find((t) => t.id === m.team2.teamId);
    if (!t1 || !t2) {
      issues.push({
        key: `teams-${m.id}`,
        message: `لا يمكن بدء الجولة — ${roomName(m)} لم يتم توزيع الفرق عليها.`,
      });
    }

    // محكمو القاعة
    const a = m.judgeAssignment;
    const assigned = new Set<string>([
      ...(a?.chairJudgeId ? [a.chairJudgeId] : []),
      ...(a?.panelistJudgeIds ?? []),
    ]);
    const count = [...assigned].filter((id) => judges.some((j) => j.id === id)).length;
    const needed = a?.slots ?? expectedJudges;
    if (count === 0 && needed > 0) {
      warnings.push({
        key: `judges-${m.id}`,
        message: `${roomName(m)} لم يتم تعيين محكم لها.`,
      });
    } else if (count < needed) {
      warnings.push({
        key: `judges-count-${m.id}`,
        message: `${roomName(m)} لديها ${count} من ${needed} محكمين.`,
      });
    }
  }

  if (warnings.length === 0) {
    passed.push("المحكمون موزّعون على القاعات");
  }
  if (!issues.some((i) => i.key.startsWith("teams-"))) {
    passed.push("الفرق موزّعة على القاعات");
  }

  return { ready: issues.length === 0, issues, warnings, passed };
}
