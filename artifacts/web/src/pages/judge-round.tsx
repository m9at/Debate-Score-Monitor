import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import {
  type RoundData,
  type RoomInfo,
  type RoomJudge,
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
import { getRoundSession, submitRoomResult } from "@/lib/firebaseJudgeApi";

type SubmitStatus = "idle" | "sending" | "sent" | "failed";

export default function JudgeRoundPage() {
  const [, params] = useRoute<{ sessionId: string }>("/judge/round/:sessionId");
  const sessionId = params?.sessionId;
  const [roundData, setRoundData] = useState<RoundData | null>(null);
  const [submittedRooms, setSubmittedRooms] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<number | null>(null);
  /** The judge this link belongs to — read once from the URL, never typed. */
  const judgeId = new URLSearchParams(window.location.search).get("j");

  useEffect(() => {
    if (!sessionId) { setError("الرابط غير صالح"); return; }
    let cancelled = false;
    getRoundSession(sessionId)
      .then((s) => {
        if (cancelled) return;
        if (!s) { setError("هذا الرابط غير موجود أو انتهت صلاحيته"); return; }
        setRoundData(s.roundData);
        if (judgeId) {
          const mine = s.roundData.rooms.find((r) =>
            (r.judges ?? []).some((j) => j.id === judgeId),
          );
          if (mine) setSelectedRoom(mine.roomNumber);
        }
        if (s.results) {
          setSubmittedRooms(new Set(Object.keys(s.results).map(Number)));
        }
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "تعذّر تحميل الجولة");
      });
    return () => { cancelled = true; };
  }, [sessionId, judgeId]);

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

  if (!roundData) {
    return (
      <div className="judge-page" dir="rtl">
        <Header />
        <div className="judge-wrap"><p className="judge-loading">⏳ جارٍ التحميل...</p></div>
      </div>
    );
  }

  if (selectedRoom !== null) {
    const room = roundData.rooms.find((r) => r.roomNumber === selectedRoom);
    if (!room) { setSelectedRoom(null); return null; }
    return (
      <RoomScoring
        room={room}
        sessionId={sessionId!}
        tournamentName={roundData.tournamentName}
        roundNumber={roundData.roundNumber}
        identifiedJudge={
          judgeId
            ? ((room.judges ?? []).find((j) => j.id === judgeId) ?? null)
            : null
        }
        lockedToRoom={!!judgeId}
        onBack={(submittedOk) => {
          if (submittedOk) {
            setSubmittedRooms((prev) => new Set(prev).add(room.roomNumber));
          }
          setSelectedRoom(null);
        }}
      />
    );
  }

  return (
    <div className="judge-page" dir="rtl">
      <Header title={`الجولة ${roundData.roundNumber}`} subtitle={roundData.tournamentName} />
      <div className="judge-wrap">
        {roundData.caseText && (
          <div style={{
            background: "#7B2D8E0d", border: "1px solid #7B2D8E33",
            borderRadius: 12, padding: 12, marginBottom: 12,
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#7B2D8E", marginBottom: 4 }}>
              نص القضية
            </div>
            <div style={{ fontSize: 14, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
              {roundData.caseText}
            </div>
          </div>
        )}
        {roundData.rooms.map((room) => {
          const done = submittedRooms.has(room.roomNumber);
          return (
            <div
              key={room.roomNumber}
              className="judge-card judge-card-room"
              onClick={() => setSelectedRoom(room.roomNumber)}
            >
              <div className="judge-room-header">
                <div>
                  <div className="judge-room-num">{room.roomLabel?.trim() || `القاعة ${room.roomNumber}`}</div>
                  <div className="judge-room-teams">{room.govTeamName} ضد {room.oppTeamName}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className={`judge-badge ${done ? "judge-badge-done" : "judge-badge-pend"}`}>
                    {done ? "✅ تم" : "⏳ بانتظار"}
                  </span>
                  <span className="judge-room-arrow">←</span>
                </div>
              </div>
            </div>
          );
        })}
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

function RoomScoring({ room, sessionId, tournamentName, roundNumber, identifiedJudge, lockedToRoom, onBack }: {
  room: RoomInfo; sessionId: string; tournamentName: string; roundNumber: number;
  /** Known from the link — the judge never types their own name. */
  identifiedJudge: RoomJudge | null;
  /** A personal link shows only that judge's room. */
  lockedToRoom: boolean;
  onBack: (submittedOk: boolean) => void;
}) {
  const [govScores, setGovScores] = useState<string[]>(new Array(room.govSpeakersCount).fill(""));
  const [oppScores, setOppScores] = useState<string[]>(new Array(room.oppSpeakersCount).fill(""));
  const [govNames, setGovNames] = useState<string[]>(new Array(room.govSpeakersCount).fill(""));
  const [oppNames, setOppNames] = useState<string[]>(new Array(room.oppSpeakersCount).fill(""));
  const [govReplyNum, setGovReplyNum] = useState(1);
  const [oppReplyNum, setOppReplyNum] = useState(1);
  const [govReplyScore, setGovReplyScore] = useState("");
  const [oppReplyScore, setOppReplyScore] = useState("");
  const [judgeName, setJudgeName] = useState(identifiedJudge?.name ?? "");
  const [judgeNotes, setJudgeNotes] = useState("");
  const [warning, setWarning] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [alreadyLocked, setAlreadyLocked] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle");
  const [lastScores, setLastScores] = useState<JudgeScores | null>(null);
  const [pendingScores, setPendingScores] = useState<JudgeScores | null>(null);

  useEffect(() => {
    let cancelled = false;
    getRoundSession(sessionId).then((s) => {
      if (cancelled || !s?.results) return;
      const entry = (s.results as Record<string, unknown>)[String(room.roomNumber)];
      if (entry) { setSubmitted(true); setAlreadyLocked(true); setSubmitStatus("sent"); }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [sessionId, room.roomNumber]);

  const doSubmit = async (scoresArg?: JudgeScores) => {
    const scores = scoresArg ?? lastScores;
    if (!scores) return;
    setSubmitStatus("sending");
    try {
      await submitRoomResult(sessionId, room.roomNumber, scores);
      setSubmitStatus("sent");
    } catch {
      setSubmitStatus("failed");
    }
  };

  if (submitted) {
    return (
      <div className="judge-page" dir="rtl">
        <div className="judge-hdr">
          <div className="judge-hdr-brand">مناظرات عُمان · Oman Debates</div>
          <div className="judge-hdr-title">{room.roomLabel?.trim() || `القاعة ${room.roomNumber}`}</div>
          <div className="judge-hdr-sub">{tournamentName} · الجولة {roundNumber}</div>
        </div>
        <div className="judge-wrap">
          <div className="judge-success">
            <div className="judge-success-icon">{submitStatus === "sending" ? "⏳" : submitStatus === "failed" ? "⚠️" : alreadyLocked ? "🔒" : "✅"}</div>
            <div className="judge-success-title">
              {alreadyLocked ? "تم إرسال النتيجة" :
               submitStatus === "sent" ? "تم إرسال النتيجة" :
               submitStatus === "sending" ? "جاري الإرسال..." :
               submitStatus === "failed" ? "تعذّر الإرسال — حاول مرة أخرى" :
               "تمّ إعداد النتيجة"}
            </div>
            <div className="judge-success-sub">
              {alreadyLocked ? "تم إرسال نتيجة هذه القاعة مسبقاً ولا يمكن التعديل." :
               submitStatus === "sent" ? "النتيجة محفوظة. شكراً لك." :
               submitStatus === "sending" ? "يتم حفظ النتيجة الآن..." :
               submitStatus === "failed" ? "تأكد من الاتصال بالإنترنت ثم اضغط إعادة المحاولة." :
               "جاري الإرسال..."}
            </div>
          </div>
          {submitStatus === "failed" && !alreadyLocked && (
            <button onClick={() => doSubmit()} className="judge-btn judge-btn-submit" style={{ marginTop: 16 }}>
              🔁 إعادة المحاولة
            </button>
          )}
          {!lockedToRoom && (
            <button onClick={() => onBack(submitStatus === "sent")} className="judge-btn judge-btn-back">← الرجوع للقاعات</button>
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
        name: govNames[i] || room.govSpeakerNames[i] || `المتحدث ${i + 1}`,
        score: parseFloat(s) || 0,
      })),
      govReplySpeakerNumber: govReplyNum,
      govReplyScore: parseFloat(govReplyScore) || 0,
      oppSpeakers: oppScores.map((s, i) => ({
        speakerNumber: i + 1,
        name: oppNames[i] || room.oppSpeakerNames[i] || `المتحدث ${i + 1}`,
        score: parseFloat(s) || 0,
      })),
      oppReplySpeakerNumber: oppReplyNum,
      oppReplyScore: parseFloat(oppReplyScore) || 0,
      govTeamId: room.govTeamId,
      judgeName,
      judgeNotes,
      submittedAt: Date.now(),
      matchId: room.matchId,
      roundNumber,
      roomNumber: room.roomNumber,
    };

    setPendingScores(scores);
  };

  const handleConfirm = () => {
    if (!pendingScores) return;
    setSubmitted(true);
    setLastScores(pendingScores);
    void doSubmit(pendingScores);
    setPendingScores(null);
  };

  const speakerIcons = ["👤", "👥", "🙋", "🙋‍♂️"];

  if (pendingScores) {
    const ps = pendingScores;
    const govSum = ps.govSpeakers.reduce((s, x) => s + (x.score || 0), 0) + (ps.govReplyScore || 0);
    const oppSum = ps.oppSpeakers.reduce((s, x) => s + (x.score || 0), 0) + (ps.oppReplyScore || 0);
    const winnerLabel = govSum > oppSum ? room.govTeamName : room.oppTeamName;
    const rowStyle: React.CSSProperties = {
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "8px 10px", borderBottom: "1px solid #00000010", fontSize: 14,
    };
    const valStyle: React.CSSProperties = { fontWeight: 800, color: "#0a3a55" };
    return (
      <div className="judge-page" dir="rtl">
        <div className="judge-hdr">
          <div className="judge-hdr-brand">مناظرات عُمان · Oman Debates</div>
          <div className="judge-hdr-title">تأكيد الدرجات — {room.roomLabel?.trim() || `القاعة ${room.roomNumber}`}</div>
          <div className="judge-hdr-sub">{tournamentName} · الجولة {roundNumber}</div>
        </div>
        <div className="judge-wrap">
          <div style={{
            background: "#FFE5E5", border: "2px solid #DC2626", color: "#7F1D1D",
            borderRadius: 12, padding: "12px 14px", marginBottom: 14,
            fontSize: 14, lineHeight: 1.7, fontWeight: 700, textAlign: "center",
          }}>
            ⚠️ تنبيه: التأكيد نهائي ولا يمكن تعديل الدرجات بعد التأكيد
          </div>

          <div className="judge-card judge-card-gov">
            <div className="judge-row">
              <span className="judge-tname">{room.govTeamName}</span>
              <span className="judge-badge judge-badge-gov">موالاة</span>
            </div>
            <div className="judge-total-box judge-total-box-gov">
              <span className="judge-total-lbl">المجموع</span>
              <span className="judge-total-val judge-total-val-gov">{govSum}</span>
            </div>
            {ps.govSpeakers.map((sp, i) => (
              <div key={i} style={rowStyle}>
                <span>{speakerIcons[i] || "👤"} المتحدث {i + 1}: {sp.name}</span>
                <span style={valStyle}>{sp.score}</span>
              </div>
            ))}
            <div style={{ ...rowStyle, borderBottom: "none", background: "#7B2D8E0d" }}>
              <span>💬 خطاب الرد (المتحدث {ps.govReplySpeakerNumber})</span>
              <span style={valStyle}>{ps.govReplyScore}</span>
            </div>
          </div>

          <div className="judge-card judge-card-opp">
            <div className="judge-row">
              <span className="judge-tname">{room.oppTeamName}</span>
              <span className="judge-badge judge-badge-opp">معارضة</span>
            </div>
            <div className="judge-total-box judge-total-box-opp">
              <span className="judge-total-lbl">المجموع</span>
              <span className="judge-total-val judge-total-val-opp">{oppSum}</span>
            </div>
            {ps.oppSpeakers.map((sp, i) => (
              <div key={i} style={rowStyle}>
                <span>{speakerIcons[i] || "👤"} المتحدث {i + 1}: {sp.name}</span>
                <span style={valStyle}>{sp.score}</span>
              </div>
            ))}
            <div style={{ ...rowStyle, borderBottom: "none", background: "#7B2D8E0d" }}>
              <span>💬 خطاب الرد (المتحدث {ps.oppReplySpeakerNumber})</span>
              <span style={valStyle}>{ps.oppReplyScore}</span>
            </div>
          </div>

          <div className="judge-card" style={{
            background: "linear-gradient(135deg, #FFD70022, #FFD70011)",
            border: "2px solid #FFD700",
          }}>
            <div style={{ ...rowStyle, borderBottom: "none", fontSize: 16, fontWeight: 800 }}>
              <span>🏆 الفائز</span>
              <span style={{ color: "#7B2D8E" }}>{winnerLabel}</span>
            </div>
          </div>

          <div className="judge-card judge-card-info">
            <div style={rowStyle}>
              <span>👨‍⚖️ اسم المحكم</span>
              <span style={valStyle}>{ps.judgeName?.trim() || "—"}</span>
            </div>
            {ps.judgeNotes?.trim() && (
              <div style={{ padding: "8px 10px" }}>
                <div className="judge-info-label" style={{ marginBottom: 4 }}>📝 ملاحظات</div>
                <div style={{ fontSize: 13, whiteSpace: "pre-wrap", color: "#444" }}>{ps.judgeNotes}</div>
              </div>
            )}
          </div>

          <div style={{
            background: "#7B2D8E0d", border: "1px solid #7B2D8E33", color: "#5D1F6D",
            borderRadius: 10, padding: "10px 12px", marginTop: 12, marginBottom: 12,
            fontSize: 13, lineHeight: 1.6, textAlign: "center", fontWeight: 700,
          }}>
            هل أنت متأكد من إرسال الدرجات بشكل نهائي؟
          </div>

          <button onClick={handleConfirm} className="judge-btn judge-btn-submit">
            ✅ تأكيد نهائي وإرسال
          </button>
          <button onClick={() => setPendingScores(null)} className="judge-btn judge-btn-back" style={{ marginTop: 10 }}>
            ← رجوع للتعديل
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="judge-page" dir="rtl">
      <div className="judge-hdr">
        <div className="judge-hdr-brand">مناظرات عُمان · Oman Debates</div>
        <div className="judge-hdr-title">{room.roomLabel?.trim() || `القاعة ${room.roomNumber}`}</div>
        <div className="judge-hdr-sub">{tournamentName} · الجولة {roundNumber}</div>
      </div>
      <div className="judge-wrap">
        <button onClick={() => onBack(false)} className="judge-back-btn">→ الرجوع للقاعات</button>

        <div style={{
          background: "#7B2D8E0d", border: "1px solid #7B2D8E33", color: "#5D1F6D",
          borderRadius: 10, padding: "8px 12px", marginBottom: 12, fontSize: 12, lineHeight: 1.6,
        }}>
          <strong>قواعد الدرجات (ثابتة):</strong> درجة المتحدث يجب أن تكون بين {SPEAKER_MIN} و{SPEAKER_MAX} • درجة الرد بين {REPLY_MIN} و{REPLY_MAX}
        </div>

        <div className="judge-card judge-card-gov">
          <div className="judge-row">
            <span className="judge-tname">{room.govTeamName}</span>
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
              roster={room.govSpeakerNames}
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
            <span className="judge-tname">{room.oppTeamName}</span>
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
              roster={room.oppSpeakerNames}
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
          {identifiedJudge ? (
            <div className="judge-info-label">
              👨‍⚖️ المحكم: {identifiedJudge.name}
              {identifiedJudge.chair ? " (رئيس اللجنة)" : ""}
            </div>
          ) : (
            <>
              <div className="judge-info-label">👨‍⚖️ اسم المحكم</div>
              <input type="text" value={judgeName} onChange={(e) => setJudgeName(e.target.value)}
                placeholder="أدخل اسمك" className="judge-text-input" />
            </>
          )}
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
        <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 8 }}>اختر متحدث الرد (الأول أو الثاني فقط):</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {speakerNames.slice(0, 2).map((name, idx) => {
            const n = idx + 1;
            const active = replyNum === n;
            return (
              <button key={n} onClick={() => setReplyNum(n)}
                style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "8px 10px",
                  borderRadius: 10, border: "1px solid var(--border)",
                  background: active ? (isGov ? "#29ABE220" : "#7B2D8E20") : "var(--surface-2, #f5f5f5)",
                  color: active ? (isGov ? "#29ABE2" : "#7B2D8E") : "inherit",
                  fontWeight: active ? 700 : 500, fontSize: 13, textAlign: "right",
                  cursor: "pointer", width: "100%",
                }}>
                <span style={{
                  width: 22, height: 22, borderRadius: 6,
                  background: active ? (isGov ? "#29ABE2" : "#7B2D8E") : (isGov ? "#29ABE226" : "#7B2D8E26"),
                  color: active ? "#fff" : (isGov ? "#29ABE2" : "#7B2D8E"),
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700, flexShrink: 0,
                }}>{n}</span>
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
