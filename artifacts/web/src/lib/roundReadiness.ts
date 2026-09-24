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
  /** Non-blocking notices (e.g. rooms short of judges) — the round may still start. */
  warnings: ReadinessIssue[];
  /** Checks that passed — shown as a reassuring checklist. */
  passed: string[];
}

const roomName = (m: { roomLabel?: string; roomNumber: number }) =>
  m.roomLabel?.trim() || `القاعة ${m.roomNumber}`;

/**
 * Decides whether a round can actually run, and says precisely what is missing.
 *
 * Missing teams or matches block the round. Judge shortages never do — they are
 * reported as warnings, by room name, so the organiser can start anyway.
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
    if (count === 0) {
      warnings.push({
        key: `judges-${m.id}`,
        message: `${roomName(m)} لم يُعيَّن لها أي محكم (المطلوب ${expectedJudges}).`,
      });
    } else if (count < expectedJudges) {
      warnings.push({
        key: `judges-count-${m.id}`,
        message: `${roomName(m)} لديها ${count} محكم بدلاً من ${expectedJudges}.`,
      });
    }
  }

  // Enabled rooms that the draw left without teams.
  const used = new Set(round.matches.map((m) => m.roomNumber));
  for (const r of tournament.rooms ?? []) {
    if (r.disabled || used.has(r.number)) continue;
    warnings.push({
      key: `empty-room-${r.id}`,
      message: `${r.label?.trim() || `القاعة ${r.number}`} خالية من الفرق في هذه الجولة.`,
    });
  }

  if (!warnings.some((i) => i.key.startsWith("judges"))) {
    passed.push(`المحكمون موزّعون (${expectedJudges} لكل قاعة)`);
  }
  if (!issues.some((i) => i.key.startsWith("teams-"))) {
    passed.push("الفرق موزّعة على القاعات");
  }

  return { ready: issues.length === 0, issues, warnings, passed };
}
