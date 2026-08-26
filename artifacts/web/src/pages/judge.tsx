import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import {
  type JudgeMatchInfo,
  type JudgeScores,
} from "@/lib/judgeCodec";
import {
  isSpeakerScoreValid,
  isReplyScoreValid,
  SPEAKER_RANGE_LABEL,
  REPLY_RANGE_LABEL,
  SPEAKER_RANGE_MESSAGE,
  REPLY_RANGE_MESSAGE,
  SPEAKER_MIN,
  SPEAKER_MAX,
  REPLY_MIN,
  REPLY_MAX,
  clampScoreInput,
  clampScoreOnBlur,
} from "@/lib/scoreValidation";
import { getMatchSession, submitMatchResult } from "@/lib/firebaseJudgeApi";

type SubmitStatus = "idle" | "sending" | "sent" | "failed";

export default function JudgePage() {
  const [, params] = useRoute<{ sessionId: string }>("/judge/:sessionId");
  const sessionId = params?.sessionId;
  const [matchInfo, setMatchInfo] = useState<JudgeMatchInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [alreadyLocked, setAlreadyLocked] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle");
  const [govScores, setGovScores] = useState<string[]>([]);
  const [oppScores, setOppScores] = useState<string[]>([]);
  const [govNames, setGovNames] = useState<string[]>([]);
  const [oppNames, setOppNames] = useState<string[]>([]);
  const [govReplyNum, setGovReplyNum] = useState(1);
  const [oppReplyNum, setOppReplyNum] = useState(1);
  const [govReplyScore, setGovReplyScore] = useState("");
  const [oppReplyScore, setOppReplyScore] = useState("");
  const [judgeName, setJudgeName] = useState("");
  const [chairName, setChairName] = useState("");
  const [judgeNotes, setJudgeNotes] = useState("");
  const [warning, setWarning] = useState("");
  const [lastScores, setLastScores] = useState<JudgeScores | null>(null);

  useEffect(() => {
    if (!sessionId) { setError("الرابط غير صالح"); return; }
    let cancelled = false;
    getMatchSession(sessionId)
      .then((s) => {
        if (cancelled) return;
        if (!s) { setError("هذا الرابط غير موجود أو انتهت صلاحيته"); return; }
        const info = s.matchInfo;
        setMatchInfo(info);
        if (s.result) { setSubmitted(true); setAlreadyLocked(true); setSubmitStatus("sent"); }
        const govCount = info.govSpeakersCount ?? info.speakersPerTeam;
        const oppCount = info.oppSpeakersCount ?? info.speakersPerTeam;
        setGovScores(new Array(govCount).fill(""));
        setOppScores(new Array(oppCount).fill(""));
        setGovNames(new Array(govCount).fill(""));
        setOppNames(new Array(oppCount).fill(""));
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "تعذّر تحميل المباراة");
      });
    return () => { cancelled = true; };
  }, [sessionId]);

  if (error) {
    return (
      <div className="judge-page" dir="rtl">
        <Header />
        <div className="judge-wrap">
          <div className="judge-err">
            <div className="judge-err-icon">⚠️</div>
            <div className="judge-err-title">الرابط غير صالح</div>
            <div className="judge-err-sub">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  if (!matchInfo) {
    return (
      <div className="judge-page" dir="rtl">
        <Header />
        <div className="judge-wrap"><p className="judge-loading">⏳ جارٍ التحميل...</p></div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="judge-page" dir="rtl">
        <Header title={`القاعة ${matchInfo.roomNumber}`}
          subtitle={`${matchInfo.tournamentName} · الجولة ${matchInfo.roundNumber}`} />
        <div className="judge-wrap">
          <div className="judge-success">
            <div className="judge-success-icon">{submitStatus === "sending" ? "⏳" : submitStatus === "failed" ? "⚠️" : alreadyLocked ? "🔒" : "✅"}</div>
            <div className="judge-success-title">
              {alreadyLocked ? "تم إرسال النتيجة مسبقاً — لا يمكن التعديل" :
               submitStatus === "sent" ? "تم إرسال النتيجة للمنسّق" :
               submitStatus === "sending" ? "جاري الإرسال..." :
               submitStatus === "failed" ? "تعذّر الإرسال — حاول مرة أخرى" :
               "تمّ إعداد النتيجة"}
            </div>
            <div className="judge-success-sub">
              {alreadyLocked ? "للتعديل تواصل مع إدارة البطولة." :
               submitStatus === "sent" ? "النتيجة محفوظة. شكراً لك." :
               submitStatus === "sending" ? "يتم حفظ النتيجة الآن..." :
               submitStatus === "failed" ? "تأكد من الاتصال بالإنترنت ثم اضغط على الزر أدناه." :
               "جاري الإرسال..."}
            </div>
          </div>
          {submitStatus === "failed" && !alreadyLocked && (
            <button
              onClick={() => doSubmit()}
              className="judge-btn judge-btn-submit"
              style={{ marginTop: 16 }}
            >
              🔁 إعادة المحاولة
            </button>
          )}
        </div>
      </div>
    );
  }

  const govTotal = govScores.reduce((s, v) => s + (parseFloat(v) || 0), 0) + (parseFloat(govReplyScore) || 0);
  const oppTotal = oppScores.reduce((s, v) => s + (parseFloat(v) || 0), 0) + (parseFloat(oppReplyScore) || 0);
  const tied = govTotal > 0 && oppTotal > 0 && govTotal === oppTotal;

  const allNamesPicked =
    govNames.every((n) => n.trim() !== "") &&
    oppNames.every((n) => n.trim() !== "");
  const allScoresValid =
    govScores.every((s, i) => i === 3 || isSpeakerScoreValid(s)) &&
    oppScores.every((s, i) => i === 3 || isSpeakerScoreValid(s)) &&
    isReplyScoreValid(govReplyScore) &&
    isReplyScoreValid(oppReplyScore);

  const handleSubmit = () => {
    if (tied) return;
    if (!allNamesPicked) {
      setWarning("يجب اختيار اسم كل متحدث (الأول والثاني والثالث)");
      return;
    }
    const allGov = govScores.every((s, i) => i === 3 || (s.trim() !== "" && !isNaN(Number(s))));
    const allOpp = oppScores.every((s, i) => i === 3 || (s.trim() !== "" && !isNaN(Number(s))));
    if (!allGov || !allOpp) { setWarning("يجب إدخال جميع درجات المتحدثين"); return; }
    if (govTotal === 0 && oppTotal === 0) { setWarning("يجب إدخال الدرجات أولاً"); return; }
    if (!allScoresValid) {
      setWarning(`${SPEAKER_RANGE_MESSAGE} • ${REPLY_RANGE_MESSAGE}`);
      return;
    }

    const scores: JudgeScores = {
      govSpeakers: govScores.map((s, i) => ({
        speakerNumber: i + 1,
        name: govNames[i] || matchInfo.govSpeakerNames[i] || `المتحدث ${i + 1}`,
        score: parseFloat(s) || 0,
      })),
      govReplySpeakerNumber: govReplyNum,
      govReplyScore: parseFloat(govReplyScore) || 0,
      oppSpeakers: oppScores.map((s, i) => ({
        speakerNumber: i + 1,
        name: oppNames[i] || matchInfo.oppSpeakerNames[i] || `المتحدث ${i + 1}`,
        score: parseFloat(s) || 0,
      })),
      oppReplySpeakerNumber: oppReplyNum,
      oppReplyScore: parseFloat(oppReplyScore) || 0,
      govTeamId: matchInfo.govTeamId,
      judgeName,
      chairName,
      judgeNotes,
      submittedAt: Date.now(),
      matchId: matchInfo.matchId,
      roundNumber: matchInfo.roundNumber,
      roomNumber: matchInfo.roomNumber,
    };

    setSubmitted(true);
    setLastScores(scores);
    void doSubmit(scores);
  };

  const doSubmit = async (scoresArg?: JudgeScores) => {
    const scores = scoresArg ?? lastScores;
    if (!sessionId || !scores) return;
    setSubmitStatus("sending");
    try {
      await submitMatchResult(sessionId, scores);
      setSubmitStatus("sent");
    } catch {
      setSubmitStatus("failed");
    }
  };

  const speakerIcons = ["👤", "👥", "🙋", "🙋‍♂️"];

  return (
    <div className="judge-page" dir="rtl">
      <Header title={`القاعة ${matchInfo.roomNumber}`}
        subtitle={`${matchInfo.tournamentName} · الجولة ${matchInfo.roundNumber}`} />
      <div className="judge-wrap">
        {matchInfo.caseText && (
          <div style={{
            background: "#7B2D8E0d", border: "1px solid #7B2D8E33",
            borderRadius: 12, padding: 12, marginBottom: 12,
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#7B2D8E", marginBottom: 4 }}>
              نص القضية
            </div>
            <div style={{ fontSize: 14, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
              {matchInfo.caseText}
            </div>
          </div>
        )}
        <div style={{
          background: "#7B2D8E0d", border: "1px solid #7B2D8E33", color: "#5D1F6D",
          borderRadius: 10, padding: "8px 12px", marginBottom: 12, fontSize: 12, lineHeight: 1.6,
        }}>
          <strong>قواعد الدرجات (ثابتة):</strong> درجة المتحدث يجب أن تكون بين {SPEAKER_MIN} و{SPEAKER_MAX} • درجة الرد بين {REPLY_MIN} و{REPLY_MAX}
        </div>

        <div className="judge-card judge-card-gov">
          <div className="judge-row">
            <span className="judge-tname">{matchInfo.govTeamName}</span>
            <span className="judge-badge judge-badge-gov">موالاة</span>
          </div>
          <div className="judge-total-box judge-total-box-gov">
            <span className="judge-total-lbl">المجموع</span>
            <span className="judge-total-val judge-total-val-gov">{govTotal}</span>
          </div>
          {govScores.map((score, i) => (
            <SpeakerRow
              key={i}
              role="gov"
              index={i}
              icon={speakerIcons[i] || "👤"}
              roster={matchInfo.govSpeakerNames}
              selectedNames={govNames}
              onSelectName={(v) => { const n = [...govNames]; n[i] = v; setGovNames(n); setWarning(""); }}
              score={score}
              onChangeScore={(v) => { const n = [...govScores]; n[i] = v; setGovScores(n); setWarning(""); }}
            />
          ))}
          <ReplySection role="gov" speakerNames={govNames.slice(0, 2)}
            replyNum={govReplyNum} setReplyNum={setGovReplyNum}
            replyScore={govReplyScore} setReplyScore={(v) => { setGovReplyScore(v); setWarning(""); }} />
        </div>

        <div className="judge-card judge-card-opp">
          <div className="judge-row">
            <span className="judge-tname">{matchInfo.oppTeamName}</span>
            <span className="judge-badge judge-badge-opp">معارضة</span>
          </div>
          <div className="judge-total-box judge-total-box-opp">
            <span className="judge-total-lbl">المجموع</span>
            <span className="judge-total-val judge-total-val-opp">{oppTotal}</span>
          </div>
          {oppScores.map((score, i) => (
            <SpeakerRow
              key={i}
              role="opp"
              index={i}
              icon={speakerIcons[i] || "👤"}
              roster={matchInfo.oppSpeakerNames}
              selectedNames={oppNames}
              onSelectName={(v) => { const n = [...oppNames]; n[i] = v; setOppNames(n); setWarning(""); }}
              score={score}
              onChangeScore={(v) => { const n = [...oppScores]; n[i] = v; setOppScores(n); setWarning(""); }}
            />
          ))}
          <ReplySection role="opp" speakerNames={oppNames.slice(0, 2)}
            replyNum={oppReplyNum} setReplyNum={setOppReplyNum}
            replyScore={oppReplyScore} setReplyScore={(v) => { setOppReplyScore(v); setWarning(""); }} />
        </div>

        <div className="judge-card judge-card-info">
          <div className="judge-info-label">👨‍⚖️ اسم المحكم</div>
          <input type="text" value={judgeName} onChange={(e) => setJudgeName(e.target.value)}
            placeholder="أدخل اسمك (اختياري)" className="judge-text-input" />
          <div className="judge-info-label" style={{ marginTop: 14 }}>🎙️ رئيس الجلسة</div>
          <input type="text" value={chairName} onChange={(e) => setChairName(e.target.value)}
            placeholder="اسم رئيس الجلسة (اختياري)" className="judge-text-input" />
          <div className="judge-info-label" style={{ marginTop: 14 }}>📝 ملاحظات</div>
          <textarea value={judgeNotes} onChange={(e) => setJudgeNotes(e.target.value)}
            placeholder="ملاحظات (اختياري)" className="judge-textarea" />
        </div>

        {warning && <div className="judge-warn">{warning}</div>}
        {tied && <div className="judge-warn">⚠️ لا يمكن أن يتساوى مجموع الفريقين</div>}

        <button onClick={handleSubmit} disabled={tied || !allScoresValid || !allNamesPicked}
          className={`judge-btn ${tied || !allScoresValid || !allNamesPicked ? "judge-btn-disabled" : "judge-btn-submit"}`}>
          📤 تسليم النتيجة
        </button>
      </div>
    </div>
  );
}

function Header({ title, subtitle }: { title?: string; subtitle?: string }) {
  return (
    <div className="judge-hdr">
      <div className="judge-hdr-brand">مناظرات عُمان · Oman Debates</div>
      <div className="judge-hdr-title">{title || "بوابة التحكيم"}</div>
      {subtitle && <div className="judge-hdr-sub">{subtitle}</div>}
    </div>
  );
}

function ReplySection({ role, speakerNames, replyNum, setReplyNum, replyScore, setReplyScore }: {
  role: "gov" | "opp"; speakerNames: string[]; replyNum: number; setReplyNum: (n: number) => void;
  replyScore: string; setReplyScore: (v: string) => void;
}) {
  const isGov = role === "gov";
  return (
    <div className="judge-reply-section">
      <div className="judge-reply-hdr">
        <span className={`judge-reply-badge ${isGov ? "" : "judge-reply-badge-opp"}`}>💬 خطاب الرد</span>
      </div>
      <div style={{ padding: "8px 12px" }}>
        <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 8 }}>
          اختر متحدث الرد (الأول أو الثاني فقط):
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {speakerNames.slice(0, 2).map((name, idx) => {
            const n = idx + 1;
            const active = replyNum === n;
            return (
              <button
                key={n}
                onClick={() => setReplyNum(n)}
                className={`judge-rbt-row ${active ? (isGov ? "judge-rbt-row-gov" : "judge-rbt-row-opp") : ""}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 10px",
                  borderRadius: 10,
                  border: "1px solid var(--border)",
                  background: active ? (isGov ? "#29ABE220" : "#7B2D8E20") : "var(--surface-2, #f5f5f5)",
                  color: active ? (isGov ? "#29ABE2" : "#7B2D8E") : "inherit",
                  fontWeight: active ? 700 : 500,
                  fontSize: 13,
                  textAlign: "right",
                  cursor: "pointer",
                  width: "100%",
                }}
              >
                <span
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    background: active ? (isGov ? "#29ABE2" : "#7B2D8E") : (isGov ? "#29ABE226" : "#7B2D8E26"),
                    color: active ? "#fff" : (isGov ? "#29ABE2" : "#7B2D8E"),
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {n}
                </span>
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {name || `المتحدث ${n}`}
                </span>
                {active && (
                  <span style={{
                    fontSize: 10, padding: "2px 6px", borderRadius: 4,
                    background: isGov ? "#29ABE2" : "#7B2D8E", color: "#fff", fontWeight: 700,
                  }}>الرد</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
      <div className="judge-sp-row">
        <div className="judge-sp-info">
          <div className={`judge-sp-icon ${isGov ? "judge-sp-icon-gov" : "judge-sp-icon-opp"}`}>💬</div>
          <div className="judge-sp-name">درجة الرد</div>
        </div>
        <ScoreInput value={replyScore} cls={role} valid={isReplyScoreValid(replyScore)} hint={REPLY_RANGE_LABEL}
          min={REPLY_MIN} max={REPLY_MAX}
          onChange={(v) => setReplyScore(v)} />
      </div>
    </div>
  );
}

const SPEAKER_ORDINALS = ["المتحدث الأول", "المتحدث الثاني", "المتحدث الثالث", "المتحدث الرابع"];

function SpeakerRow({
  role, index, icon, roster, selectedNames, onSelectName, score, onChangeScore,
}: {
  role: "gov" | "opp";
  index: number;
  icon: string;
  roster: string[];
  selectedNames: string[];
  onSelectName: (v: string) => void;
  score: string;
  onChangeScore: (v: string) => void;
}) {
  const taken = new Set(selectedNames.filter((_, i) => i !== index).filter(Boolean));
  const ordinal = SPEAKER_ORDINALS[index] || `المتحدث ${index + 1}`;
  const selected = selectedNames[index] || "";
  const nameMissing = !selected;
  const replyOnly = index === 3;
  useEffect(() => {
    if (replyOnly && score !== "0") onChangeScore("0");
  }, [replyOnly, score, onChangeScore]);
  return (
    <div className="judge-sp-row" style={{ flexDirection: "column", alignItems: "stretch", gap: 6 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div className={`judge-sp-icon judge-sp-icon-${role}`}>{icon}</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--muted)" }}>
          {ordinal}{replyOnly ? " (بدون درجة)" : ""}
        </div>
      </div>
      <select
        value={selected}
        onChange={(e) => onSelectName(e.target.value)}
        style={{
          width: "100%",
          padding: "10px 12px",
          borderRadius: 10,
          border: `1px solid ${nameMissing ? "#FFCC02" : "var(--border)"}`,
          background: nameMissing ? "#FFF8E1" : "var(--surface-2, #f9f9f9)",
          fontSize: 14,
          fontWeight: 600,
          textAlign: "right",
        }}
      >
        <option value="">— اختر اسم {ordinal} —</option>
        {roster.map((rn, ri) => {
          const disabled = !!rn && rn !== selected && taken.has(rn);
          return (
            <option key={ri} value={rn} disabled={disabled}>
              {rn || `متحدث ${ri + 1}`}{disabled ? " (مختار)" : ""}
            </option>
          );
        })}
      </select>
      {!replyOnly && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: "var(--muted)" }}>
            {nameMissing ? "اختر الاسم أولاً ثم أدخل الدرجة" : "أدخل الدرجة:"}
          </span>
          <ScoreInput
            value={score}
            cls={role}
            valid={isSpeakerScoreValid(score)}
            hint={SPEAKER_RANGE_LABEL}
            min={SPEAKER_MIN}
            max={SPEAKER_MAX}
            onChange={onChangeScore}
            disabled={nameMissing}
          />
        </div>
      )}
    </div>
  );
}

function ScoreInput({ value, cls, valid, hint, onChange, disabled, min, max }: {
  value: string; cls: "gov" | "opp"; valid: boolean; hint: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  min?: number;
  max?: number;
}) {
  const filled = value.trim() !== "";
  const invalid = filled && !valid;
  // The tournament's score rules are fixed: a value outside the range can never
  // be entered — not by typing, pasting or stepping.
  const lo = min ?? 0;
  const hi = max ?? Number.MAX_SAFE_INTEGER;
  const handleChange = (v: string) => onChange(clampScoreInput(v, lo, hi));
  const handleBlur = () => onChange(clampScoreOnBlur(value, lo, hi));
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
      <input
        type="text"
        inputMode="decimal"
        enterKeyHint="next"
        autoComplete="off"
        pattern="[0-9]*\.?[0-9]*"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="--"
        disabled={disabled}
        onFocus={(e) => e.target.select()}
        onBlur={handleBlur}
        className={`judge-score-input ${cls}`}
        style={{
          ...(invalid ? { borderColor: "#FF3B30", borderWidth: 2, borderStyle: "solid" } : {}),
          ...(disabled ? { opacity: 0.45, cursor: "not-allowed" } : {}),
        }}
      />
      {invalid && <span style={{ fontSize: 10, color: "#C0392B" }}>{hint}</span>}
      {typeof max === "number" && filled && parseFloat(value) === max && (
        <span style={{ fontSize: 9, color: "#856404" }}>وصلت للحد الأقصى</span>
      )}
    </div>
  );
}
