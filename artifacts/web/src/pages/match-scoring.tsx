import { useState, useEffect, useMemo } from "react";
import { useRoute, useLocation } from "wouter";
import { useTournament } from "@/context/TournamentContext";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowRight,
  Save,
  Edit2,
  Shield,
  ShieldOff,
  MessageSquare,
  AlertTriangle,
  ClipboardPaste,
  UserCheck,
  User,
  Users as UsersIcon,
  Link as LinkIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import type { Match, MatchTeam, Speaker } from "@/types/tournament";
import { decodeScores, type JudgeMatchInfo, buildSessionUrl } from "@/lib/judgeCodec";
import { createMatchSession } from "@/lib/firebaseJudgeApi";
import {
  isSpeakerScoreValid,
  isReplyScoreValid,
  SPEAKER_RANGE_LABEL,
  REPLY_RANGE_LABEL,
  SPEAKER_RANGE_MESSAGE,
  REPLY_RANGE_MESSAGE,
} from "@/lib/scoreValidation";

const CYAN = "#29ABE2";
const PURPLE = "#7B2D8E";

interface TeamSectionProps {
  side: "gov" | "opp";
  teamName: string;
  speakerNames: string[];
  setSpeakerNames: (names: string[]) => void;
  rosterNames: string[];
  speakerScores: string[];
  setSpeakerScores: (scores: string[]) => void;
  replySpeakerName: string;
  setReplySpeakerName: (name: string) => void;
  replyScore: string;
  setReplyScore: (v: string) => void;
  total: number;
  disabled: boolean;
}

function TeamSection({
  side,
  teamName,
  speakerNames,
  setSpeakerNames,
  rosterNames,
  speakerScores,
  setSpeakerScores,
  replySpeakerName,
  setReplySpeakerName,
  replyScore,
  setReplyScore,
  total,
  disabled,
}: TeamSectionProps) {
  const accent = side === "gov" ? CYAN : PURPLE;
  const Icon = side === "gov" ? Shield : ShieldOff;
  const label = side === "gov" ? "الموالاة" : "المعارضة";

  return (
    <div
      className="bg-card rounded-2xl p-4 mb-4"
      style={{ borderTopWidth: 4, borderTopColor: accent, borderTopStyle: "solid" }}
    >
      {/* Team header */}
      <div className="flex items-center gap-2 mb-3">
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
          style={{ backgroundColor: accent + "26" }}
        >
          <Icon className="w-3.5 h-3.5" style={{ color: accent }} />
          <span className="text-xs font-bold" style={{ color: accent }}>
            {label}
          </span>
        </div>
        <span className="text-base font-bold flex-1 truncate">{teamName}</span>
      </div>

      {/* Total */}
      <div
        className="flex items-center justify-between px-3 py-2 rounded-xl mb-3"
        style={{ backgroundColor: accent + "14" }}
      >
        <span className="text-sm font-semibold" style={{ color: accent }}>
          المجموع
        </span>
        <span className="text-2xl font-bold" style={{ color: accent }}>
          {total}
        </span>
      </div>

      {/* Range hint banner */}
      <div
        className="mb-3 px-3 py-2 rounded-lg text-[11px] leading-relaxed"
        style={{
          backgroundColor: "#FFF3CD",
          border: "1px solid #FFCC02",
          color: "#856404",
        }}
      >
        <div>
          <strong>تنبيه:</strong> درجة المتحدث {SPEAKER_RANGE_LABEL} • درجة الرد{" "}
          {REPLY_RANGE_LABEL}
        </div>
      </div>

      {/* Speakers */}
      {speakerNames.map((name, i) => {
        const filled = !!speakerScores[i]?.trim();
        const invalid = filled && !isSpeakerScoreValid(speakerScores[i]);
        return (
          <div key={i} className="flex items-center gap-2 mb-2.5">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: accent + "1f" }}
              >
                <User className="w-4 h-4" style={{ color: accent }} />
              </div>
              <select
                value={name || ""}
                onChange={(e) => {
                  const updated = [...speakerNames];
                  updated[i] = e.target.value;
                  setSpeakerNames(updated);
                }}
                disabled={disabled}
                className="text-sm font-medium flex-1 min-w-0 bg-muted rounded-lg px-2 h-9 outline-none disabled:opacity-60 truncate text-right"
                data-testid={`select-${side}-speaker-name-${i}`}
              >
                <option value="">— اختر —</option>
                {rosterNames.map((rn, ri) => (
                  <option key={ri} value={rn}>
                    {rn}
                  </option>
                ))}
                {name && !rosterNames.includes(name) && (
                  <option value={name}>{name}</option>
                )}
              </select>
            </div>
            <div className="flex flex-col items-end">
              <input
                type="number"
                inputMode="decimal"
                value={speakerScores[i] ?? ""}
                onChange={(e) => {
                  const updated = [...speakerScores];
                  updated[i] = e.target.value;
                  setSpeakerScores(updated);
                }}
                disabled={disabled}
                placeholder="--"
                className="w-20 h-10 text-center rounded-xl bg-muted text-foreground font-bold text-base disabled:opacity-60 outline-none"
                style={{
                  borderWidth: invalid ? 2 : filled ? 1.5 : 0,
                  borderColor: invalid ? "#FF3B30" : accent + "80",
                  borderStyle: "solid",
                }}
                data-testid={`input-${side}-speaker-${i}`}
              />
              {invalid && (
                <span className="text-[10px] text-destructive mt-0.5">
                  {SPEAKER_RANGE_LABEL}
                </span>
              )}
            </div>
          </div>
        );
      })}

      {/* Reply section */}
      <div
        className="mt-3 pt-3"
        style={{
          borderTopWidth: 1,
          borderTopColor: accent + "4D",
          borderTopStyle: "solid",
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
            style={{ backgroundColor: accent + "26" }}
          >
            <MessageSquare className="w-3.5 h-3.5" style={{ color: accent }} />
            <span className="text-xs font-bold" style={{ color: accent }}>
              خطاب الرد
            </span>
          </div>
        </div>

        <div className="mb-3">
          <span className="text-xs text-muted-foreground block mb-2">
            اختر متحدث الرد:
          </span>
          <select
            value={replySpeakerName}
            onChange={(e) => setReplySpeakerName(e.target.value)}
            disabled={disabled}
            className="w-full h-10 px-3 rounded-xl bg-muted text-sm font-medium outline-none disabled:opacity-60 text-right"
            style={{
              borderWidth: replySpeakerName ? 1.5 : 1,
              borderColor: replySpeakerName ? accent : "var(--border)",
              borderStyle: "solid",
              color: replySpeakerName ? accent : undefined,
            }}
            data-testid={`select-reply-speaker-${side}`}
          >
            <option value="">— اختر متحدث الرد —</option>
            {rosterNames.map((rn, i) => (
              <option key={i} value={rn}>
                {rn}
              </option>
            ))}
            {replySpeakerName && !rosterNames.includes(replySpeakerName) && (
              <option value={replySpeakerName}>{replySpeakerName}</option>
            )}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: accent + "1f" }}
            >
              <MessageSquare className="w-4 h-4" style={{ color: accent }} />
            </div>
            <span className="text-sm font-medium">درجة الرد</span>
          </div>
          <div className="flex flex-col items-end">
            <input
              type="number"
              inputMode="decimal"
              value={replyScore}
              onChange={(e) => setReplyScore(e.target.value)}
              disabled={disabled}
              placeholder="--"
              className="w-20 h-10 text-center rounded-xl bg-muted text-foreground font-bold text-base disabled:opacity-60 outline-none"
              style={{
                borderWidth:
                  replyScore.trim() && !isReplyScoreValid(replyScore)
                    ? 2
                    : replyScore.trim()
                    ? 1.5
                    : 0,
                borderColor:
                  replyScore.trim() && !isReplyScoreValid(replyScore)
                    ? "#FF3B30"
                    : accent + "80",
                borderStyle: "solid",
              }}
              data-testid={`input-${side}-reply`}
            />
            {replyScore.trim() && !isReplyScoreValid(replyScore) && (
              <span className="text-[10px] text-destructive mt-0.5">
                {REPLY_RANGE_LABEL}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MatchScoring() {
  const [, params] = useRoute("/match/:tournamentId/:roundNumber/:matchId");
  const [, setLocation] = useLocation();
  const { getTournament, submitMatch } = useTournament();

  const tournament = getTournament(params?.tournamentId || "");
  const roundNumber = parseInt(params?.roundNumber || "0");
  const matchId = params?.matchId || "";

  const originalMatch = useMemo(() => {
    if (!tournament) return null;
    const round = tournament.rounds.find((r) => r.roundNumber === roundNumber);
    return round?.matches.find((m) => m.id === matchId) || null;
  }, [tournament, roundNumber, matchId]);

  const [isEditing, setIsEditing] = useState(false);

  const [govScores, setGovScores] = useState<string[]>([]);
  const [oppScores, setOppScores] = useState<string[]>([]);
  const [govReplyScore, setGovReplyScore] = useState("");
  const [oppReplyScore, setOppReplyScore] = useState("");
  const [govReplySpeaker, setGovReplySpeaker] = useState(1);
  const [oppReplySpeaker, setOppReplySpeaker] = useState(1);
  const [govSlotNames, setGovSlotNames] = useState<string[]>([]);
  const [oppSlotNames, setOppSlotNames] = useState<string[]>([]);
  const [govReplyName, setGovReplyName] = useState("");
  const [oppReplyName, setOppReplyName] = useState("");
  const [judgeNamesText, setJudgeNamesText] = useState("");
  const [chairName, setChairName] = useState("");
  const [judgeNotes, setJudgeNotes] = useState("");
  const [scoreCodeText, setScoreCodeText] = useState("");
  const [importError, setImportError] = useState("");
  const [judgeLinkLoading, setJudgeLinkLoading] = useState(false);

  useEffect(() => {
    if (!originalMatch) return;
    if (originalMatch.completed) {
      setGovScores(originalMatch.team1.speakers.map((s) => String(s.score)));
      setOppScores(originalMatch.team2.speakers.map((s) => String(s.score)));
      setGovSlotNames(originalMatch.team1.speakers.map((s) => s.name || ""));
      setOppSlotNames(originalMatch.team2.speakers.map((s) => s.name || ""));
      setGovReplyScore(
        originalMatch.team1.replyScore ? String(originalMatch.team1.replyScore) : ""
      );
      setOppReplyScore(
        originalMatch.team2.replyScore ? String(originalMatch.team2.replyScore) : ""
      );
      setGovReplySpeaker(originalMatch.team1.replySpeakerNumber || 1);
      setOppReplySpeaker(originalMatch.team2.replySpeakerNumber || 1);
      setGovReplyName(
        originalMatch.team1.replySpeakerName ||
          originalMatch.team1.speakers[
            (originalMatch.team1.replySpeakerNumber || 1) - 1
          ]?.name ||
          ""
      );
      setOppReplyName(
        originalMatch.team2.replySpeakerName ||
          originalMatch.team2.speakers[
            (originalMatch.team2.replySpeakerNumber || 1) - 1
          ]?.name ||
          ""
      );
      setJudgeNamesText(originalMatch.judgeNames.join("، "));
      setChairName(originalMatch.chairName ?? "");
      setJudgeNotes(originalMatch.judgeNotes);
      setIsEditing(false);
    } else {
      setGovScores(originalMatch.team1.speakers.map(() => ""));
      setOppScores(originalMatch.team2.speakers.map(() => ""));
      setGovSlotNames(originalMatch.team1.speakers.map((s) => s.name || ""));
      setOppSlotNames(originalMatch.team2.speakers.map((s) => s.name || ""));
      setGovReplyScore("");
      setOppReplyScore("");
      setGovReplySpeaker(1);
      setOppReplySpeaker(1);
      setGovReplyName("");
      setOppReplyName("");
      setJudgeNamesText("");
      setJudgeNotes("");
      setScoreCodeText("");
      setImportError("");
      setIsEditing(true);
    }
  }, [originalMatch]);

  if (!tournament || !originalMatch) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">المباراة غير موجودة</p>
      </div>
    );
  }

  const govTeam = tournament.teams.find((t) => t.id === originalMatch.team1.teamId);
  const oppTeam = tournament.teams.find((t) => t.id === originalMatch.team2.teamId);
  if (!govTeam || !oppTeam) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">الفرق غير موجودة</p>
      </div>
    );
  }

  const govSpeakerNames = originalMatch.team1.speakers.map(
    (s, i) => govTeam.speakerNames[i] || s.name || `المتحدث ${i + 1}`
  );
  const oppSpeakerNames = originalMatch.team2.speakers.map(
    (s, i) => oppTeam.speakerNames[i] || s.name || `المتحدث ${i + 1}`
  );

  const govTotal =
    govScores.reduce((sum, s) => sum + (parseFloat(s) || 0), 0) +
    (parseFloat(govReplyScore) || 0);
  const oppTotal =
    oppScores.reduce((sum, s) => sum + (parseFloat(s) || 0), 0) +
    (parseFloat(oppReplyScore) || 0);

  const canEdit = isEditing;
  const isCompleted = originalMatch.completed;

  const handleImport = () => {
    const code = scoreCodeText.trim();
    if (!code) {
      setImportError("يرجى لصق رمز النتيجة أولاً");
      return;
    }
    const scores = decodeScores(code);
    if (!scores) {
      setImportError("رمز النتيجة غير صالح. تأكد من نسخه بالكامل.");
      return;
    }
    const govIsTeam1 = scores.govTeamId === originalMatch.team1.teamId;
    if (govIsTeam1) {
      setGovScores(scores.govSpeakers.map((s) => String(s.score)));
      setOppScores(scores.oppSpeakers.map((s) => String(s.score)));
      setGovReplyScore(String(scores.govReplyScore || ""));
      setOppReplyScore(String(scores.oppReplyScore || ""));
      setGovReplySpeaker(scores.govReplySpeakerNumber || 1);
      setOppReplySpeaker(scores.oppReplySpeakerNumber || 1);
    } else {
      setGovScores(scores.oppSpeakers.map((s) => String(s.score)));
      setOppScores(scores.govSpeakers.map((s) => String(s.score)));
      setGovReplyScore(String(scores.oppReplyScore || ""));
      setOppReplyScore(String(scores.govReplyScore || ""));
      setGovReplySpeaker(scores.oppReplySpeakerNumber || 1);
      setOppReplySpeaker(scores.govReplySpeakerNumber || 1);
    }
    if (scores.judgeName) setJudgeNamesText(scores.judgeName);
    if (scores.chairName) setChairName(scores.chairName);
    if (scores.judgeNotes) setJudgeNotes(scores.judgeNotes);
    setScoreCodeText("");
    setImportError("");
  };

  const handleCreateJudgeLink = async () => {
    if (judgeLinkLoading) return;
    setJudgeLinkLoading(true);
    try {
      const matchInfo: JudgeMatchInfo = {
        tournamentId: tournament.id,
        tournamentName: tournament.name,
        matchId: originalMatch.id,
        roundNumber,
        roomNumber: originalMatch.roomNumber,
        govTeamId: originalMatch.team1.teamId,
        govTeamName: govTeam.name,
        oppTeamName: oppTeam.name,
        govSpeakerNames: govTeam.speakerNames ?? [],
        oppSpeakerNames: oppTeam.speakerNames ?? [],
        govSpeakersCount: govTeam.speakersPerTeam ?? 3,
        oppSpeakersCount: oppTeam.speakersPerTeam ?? 3,
        speakersPerTeam: govTeam.speakersPerTeam ?? 3,
        caseText: tournament.rounds.find((r) => r.roundNumber === roundNumber)?.caseText,
      };
      const sid = await createMatchSession(matchInfo);
      const url = buildSessionUrl("match", sid);
      try { navigator.clipboard.writeText(url); } catch {}
      window.prompt("رابط المحكم - انسخه وشاركه:", url);
    } catch {
      window.alert("حدث خطأ أثناء إنشاء رابط المحكم");
    } finally {
      setJudgeLinkLoading(false);
    }
  };

  const handleSubmit = () => {
    const govSpeakers: Speaker[] = govScores.map((s, i) => ({
      speakerNumber: i + 1,
      name: govSlotNames[i] || govSpeakerNames[i] || `المتحدث ${i + 1}`,
      score: parseFloat(s) || 0,
    }));
    const oppSpeakers: Speaker[] = oppScores.map((s, i) => ({
      speakerNumber: i + 1,
      name: oppSlotNames[i] || oppSpeakerNames[i] || `المتحدث ${i + 1}`,
      score: parseFloat(s) || 0,
    }));

    const govReplyIdx = govSlotNames.indexOf(govReplyName);
    const oppReplyIdx = oppSlotNames.indexOf(oppReplyName);

    const t1: MatchTeam = {
      ...originalMatch.team1,
      speakers: govSpeakers,
      replyScore: parseFloat(govReplyScore) || 0,
      replySpeakerNumber:
        govReplyIdx >= 0 ? govReplyIdx + 1 : govReplySpeaker,
      replySpeakerName: govReplyName || undefined,
      totalScore: govTotal,
    };
    const t2: MatchTeam = {
      ...originalMatch.team2,
      speakers: oppSpeakers,
      replyScore: parseFloat(oppReplyScore) || 0,
      replySpeakerNumber:
        oppReplyIdx >= 0 ? oppReplyIdx + 1 : oppReplySpeaker,
      replySpeakerName: oppReplyName || undefined,
      totalScore: oppTotal,
    };

    const winnerId =
      govTotal > oppTotal ? t1.teamId : oppTotal > govTotal ? t2.teamId : null;

    const allWithTeam = [
      ...govSpeakers.map((s) => ({ ...s, teamId: t1.teamId })),
      ...oppSpeakers.map((s) => ({ ...s, teamId: t2.teamId })),
    ];
    const best = allWithTeam.reduce((a, b) => (a.score > b.score ? a : b));

    const names = judgeNamesText
      .split(/[,،]/)
      .map((n) => n.trim())
      .filter(Boolean);

    const updated: Match = {
      ...originalMatch,
      team1: t1,
      team2: t2,
      winnerId,
      bestSpeaker: { name: best.name, teamId: best.teamId, score: best.score },
      judgeNames: names,
      chairName: chairName.trim() || undefined,
      judgeNotes,
      completed: true,
    };

    submitMatch(tournament.id, roundNumber, updated);
    setLocation(`/tournament/${tournament.id}`);
  };

  const allFilled =
    govScores.every((s) => s.trim() !== "" && !isNaN(Number(s))) &&
    oppScores.every((s) => s.trim() !== "" && !isNaN(Number(s)));
  const allScoresValid =
    govScores.every((s) => isSpeakerScoreValid(s)) &&
    oppScores.every((s) => isSpeakerScoreValid(s)) &&
    isReplyScoreValid(govReplyScore) &&
    isReplyScoreValid(oppReplyScore);
  const tied = govTotal === oppTotal && govTotal > 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero Header */}
      <div className="relative pt-5 pb-4 overflow-hidden">
        <div
          className="absolute top-0 bottom-0 left-0"
          style={{ right: "35%", backgroundColor: CYAN }}
        />
        <div
          className="absolute top-0 bottom-0 right-0"
          style={{ left: "65%", backgroundColor: PURPLE }}
        />

        <div className="relative max-w-3xl mx-auto px-4 flex items-center gap-3">
          <button
            onClick={() => setLocation(`/tournament/${tournament.id}`)}
            aria-label="رجوع"
            className="w-10 h-10 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center"
            data-testid="button-back-tournament"
          >
            <ArrowRight className="w-4 h-4 text-white" />
          </button>
          <div className="flex-1">
            <h1 className="text-white font-bold text-base">
              {originalMatch.roomLabel?.trim() || `القاعة ${originalMatch.roomNumber}`}
            </h1>
            <p className="text-white/70 text-xs">الجولة {roundNumber}</p>
          </div>
          {isCompleted && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              aria-label="تعديل النتائج"
              className="w-10 h-10 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center"
            >
              <Edit2 className="w-4 h-4 text-white" />
            </button>
          )}
        </div>
      </div>

      <main className="max-w-3xl w-full mx-auto px-4 py-4 pb-32 flex-1">
        {(() => {
          const round = tournament.rounds.find((r) => r.roundNumber === roundNumber);
          if (!round?.caseText) return null;
          return (
            <div
              className="rounded-2xl p-3 mb-4 border"
              style={{ backgroundColor: PURPLE + "0d", borderColor: PURPLE + "33" }}
            >
              <div className="text-xs font-bold mb-1" style={{ color: PURPLE }}>
                نص القضية
              </div>
              <div className="text-sm whitespace-pre-wrap leading-relaxed">
                {round.caseText}
              </div>
            </div>
          );
        })()}
        {/* Judge name card */}
        {canEdit && (
          <div className="bg-card rounded-2xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <UserCheck className="w-4 h-4" style={{ color: PURPLE }} />
              <span className="text-sm font-bold">
                اسم المحكم / المحكمين
              </span>
            </div>
            <input
              value={judgeNamesText}
              onChange={(e) => setJudgeNamesText(e.target.value)}
              placeholder="مثال: أحمد، محمد"
              className="w-full h-11 px-3 rounded-xl bg-muted text-right text-sm outline-none"
              data-testid="input-judge-names"
            />
            <div className="flex items-center gap-2 mt-3 mb-2">
              <UserCheck className="w-4 h-4" style={{ color: CYAN }} />
              <span className="text-sm font-bold">رئيس الجلسة</span>
            </div>
            <input
              value={chairName}
              onChange={(e) => setChairName(e.target.value)}
              placeholder="اسم رئيس الجلسة"
              className="w-full h-11 px-3 rounded-xl bg-muted text-right text-sm outline-none"
              data-testid="input-chair-name"
            />
          </div>
        )}

        {/* Tie warning */}
        {tied && canEdit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-4"
            style={{
              backgroundColor: "#FFF3CD",
              border: "1px solid #FFCC02",
            }}
          >
            <AlertTriangle className="w-4 h-4" style={{ color: "#856404" }} />
            <span className="text-xs font-semibold" style={{ color: "#856404" }}>
              لا يمكن أن يتساوى مجموع النقاط - يجب أن يكون الفائز أعلى
            </span>
          </motion.div>
        )}

        <div className="grid lg:grid-cols-2 gap-0 lg:gap-4">
          <TeamSection
            side="gov"
            teamName={govTeam.name}
            speakerNames={govSlotNames}
            setSpeakerNames={setGovSlotNames}
            rosterNames={govTeam.speakerNames}
            speakerScores={govScores}
            setSpeakerScores={setGovScores}
            replySpeakerName={govReplyName}
            setReplySpeakerName={setGovReplyName}
            replyScore={govReplyScore}
            setReplyScore={setGovReplyScore}
            total={govTotal}
            disabled={!canEdit}
          />
          <TeamSection
            side="opp"
            teamName={oppTeam.name}
            speakerNames={oppSlotNames}
            setSpeakerNames={setOppSlotNames}
            rosterNames={oppTeam.speakerNames}
            speakerScores={oppScores}
            setSpeakerScores={setOppScores}
            replySpeakerName={oppReplyName}
            setReplySpeakerName={setOppReplyName}
            replyScore={oppReplyScore}
            setReplyScore={setOppReplyScore}
            total={oppTotal}
            disabled={!canEdit}
          />
        </div>

        {/* Notes */}
        {canEdit && (
          <div className="bg-card rounded-2xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <UsersIcon className="w-4 h-4" style={{ color: PURPLE }} />
              <span className="text-sm font-bold">ملاحظات الحكم</span>
            </div>
            <textarea
              value={judgeNotes}
              onChange={(e) => setJudgeNotes(e.target.value)}
              placeholder="ملاحظات اختيارية..."
              rows={3}
              className="w-full px-3 py-2 rounded-xl bg-muted text-right text-sm outline-none resize-none"
              data-testid="textarea-judge-notes"
            />
          </div>
        )}

        {/* Generate judge link */}
        {canEdit && (
          <div
            className="rounded-2xl p-4 mb-4 border-2 border-dashed"
            style={{ borderColor: PURPLE + "4D" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <LinkIcon className="w-4 h-4" style={{ color: PURPLE }} />
              <span className="text-sm font-bold" style={{ color: PURPLE }}>
                إنشاء رابط للمحكم
              </span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              أنشئ رابطاً ترسله للمحكم. سيدخل النتائج وتظهر هنا تلقائياً عند المتابعة من صفحة البطولة.
            </p>
            <button
              onClick={handleCreateJudgeLink}
              disabled={judgeLinkLoading}
              className="w-full h-10 rounded-xl border font-semibold text-sm flex items-center justify-center gap-2 transition-colors hover:opacity-80 disabled:opacity-50"
              style={{
                borderColor: PURPLE,
                color: PURPLE,
                backgroundColor: PURPLE + "0F",
              }}
              data-testid="button-create-match-judge-link"
            >
              <LinkIcon className="w-4 h-4" />
              {judgeLinkLoading ? "جاري الإنشاء..." : "إنشاء رابط ونسخه"}
            </button>
          </div>
        )}

        {/* Import score code */}
        {canEdit && (
          <div
            className="rounded-2xl p-4 mb-4 border-2 border-dashed"
            style={{ borderColor: CYAN + "4D" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <ClipboardPaste className="w-4 h-4" style={{ color: CYAN }} />
              <span className="text-sm font-bold" style={{ color: CYAN }}>
                استيراد رمز النتيجة من المحكم
              </span>
            </div>
            <textarea
              value={scoreCodeText}
              onChange={(e) => {
                setScoreCodeText(e.target.value);
                setImportError("");
              }}
              placeholder="الصق رمز النتيجة المرسل من المحكم هنا..."
              rows={3}
              dir="ltr"
              className="w-full px-3 py-2 rounded-xl bg-muted text-left text-xs font-mono outline-none resize-none mb-2"
              data-testid="textarea-score-code"
            />
            {importError && (
              <p className="text-xs text-red-500 mb-2">{importError}</p>
            )}
            <button
              onClick={handleImport}
              className="w-full h-10 rounded-xl border font-semibold text-sm flex items-center justify-center gap-2 transition-colors hover:opacity-80"
              style={{
                borderColor: CYAN,
                color: CYAN,
                backgroundColor: CYAN + "0F",
              }}
              data-testid="button-import-scores"
            >
              <ClipboardPaste className="w-4 h-4" />
              استيراد النتيجة
            </button>
          </div>
        )}
      </main>

      {/* Bottom action */}
      {canEdit && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 z-20">
          <div className="max-w-3xl mx-auto">
            {allFilled && !allScoresValid && (
              <div
                className="text-xs text-center mb-2 px-2 py-1.5 rounded-lg"
                style={{
                  backgroundColor: "#FFE5E5",
                  color: "#C0392B",
                  border: "1px solid #FFC2C2",
                }}
              >
                {SPEAKER_RANGE_MESSAGE} • {REPLY_RANGE_MESSAGE}
              </div>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  className="w-full h-12 text-white text-base font-bold rounded-2xl disabled:opacity-50"
                  style={{
                    backgroundColor:
                      !allFilled || tied || !allScoresValid ? "#999" : PURPLE,
                  }}
                  disabled={!allFilled || tied || !allScoresValid}
                  data-testid="button-submit-scores"
                >
                  <Save className="w-5 h-5 ml-2" />
                  تسجيل النتائج
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>تأكيد تسجيل النتائج</AlertDialogTitle>
                  <AlertDialogDescription asChild>
                    <div>
                      <div>
                        {govTeam.name}: <strong>{govTotal}</strong> نقطة
                      </div>
                      <div>
                        {oppTeam.name}: <strong>{oppTotal}</strong> نقطة
                      </div>
                      <div className="mt-3">
                        هل أنت متأكد؟ يمكن التعديل لاحقاً.
                      </div>
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>إلغاء</AlertDialogCancel>
                  <AlertDialogAction onClick={handleSubmit}>
                    تأكيد
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}
    </div>
  );
}
