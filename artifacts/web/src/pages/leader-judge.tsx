import { useEffect, useState } from "react";
import { useParams } from "wouter";
import {
  dayRange, getLeader, roomPanel, saveLeaderDraft, submitLeaderSheet, type JudgeEntry, type LeaderRoom, type LeaderTournament,
} from "@/lib/leaderApi";

/** Judge link for a leadership debate: pick room → pick name → score each individual. */
export default function LeaderJudgePage() {
  const { id } = useParams<{ id: string }>();
  const fixedRoom = new URLSearchParams(window.location.search).get("room");
  // Each round has its own judge link (?day=N) listing only that round's rooms.
  const fixedDay = Number(new URLSearchParams(window.location.search).get("day")) || null;
  const [t, setT] = useState<LeaderTournament | null>(null);
  const [error, setError] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(fixedRoom);

  const load = () => getLeader(id).then(setT).catch(() => setError(true));
  useEffect(() => { void load(); }, [id]);

  if (error) return <Shell title="الرابط غير صالح"><p className="judge-success-sub">تأكد من الرابط.</p></Shell>;
  if (!t) return <Shell title="جارٍ التحميل…" />;

  const all = t.info.days.flatMap((d) => d.rooms.map((r) => ({ day: d.day, room: r })));
  const picked = all.find((x) => x.room.id === roomId);

  if (picked) {
    return (
      <Scoring
        t={t} day={picked.day} room={picked.room}
        onBack={fixedRoom ? undefined : () => { setRoomId(null); void load(); }}
        onSent={load}
      />
    );
  }

  return (
    <Shell title={t.info.name} subtitle="مناظرة قيادية · اختر قاعتك">
      {t.info.days.filter((d) => !fixedDay || d.day === fixedDay).map((d) => (
        <div key={d.day}>
          <div className="judge-info-label" style={{ margin: "12px 0 6px" }}>الجولة {d.day}{d.closed ? " · 🔒 مغلقة" : ""}</div>
          {d.rooms.map((r) => {
            // Once a sheet is sent the room is final: green, not clickable, shows the sender.
            const sent = t.results[r.id];
            const blocked = !!sent || r.locked || d.closed;
            return (
              <div key={r.id} className="judge-card judge-card-room" onClick={() => !blocked && setRoomId(r.id)}
                style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8,
                  cursor: blocked ? "not-allowed" : "pointer",
                  ...(sent ? { background: "#DCFCE7", borderColor: "#22C55E", color: "#166534" } : blocked ? { opacity: 0.6 } : {}),
                }}>
                <div>
                  <b>{r.label}</b>
                  {sent && <div style={{ fontSize: 12 }}>أرسلها: {sent.judgeName} · {new Date(sent.submittedAt).toLocaleTimeString("ar", { timeStyle: "short" })}</div>}
                  {!sent && r.chair && <div style={{ fontSize: 12, opacity: 0.8 }}>رئيس الجلسة: {r.chair}</div>}
                </div>
                <span style={{ fontWeight: 700 }}>{sent ? "✅ تم الإرسال" : blocked ? "🔒 مغلقة" : `${r.individuals.length} فرق ←`}</span>
              </div>
            );
          })}
        </div>
      ))}
    </Shell>
  );
}

function Scoring({ t, day, room, onBack, onSent }: {
  t: LeaderTournament; day: number; room: LeaderRoom; onBack?: () => void; onSent: () => void;
}) {
  const { min, max } = dayRange(t.info, t.info.days.find((d) => d.day === day));
  // Restore any autosaved draft so a judge who leaves the page loses nothing.
  const draft = t.drafts?.[room.id];
  const [judgeName, setJudgeName] = useState(draft?.judgeName ?? "");
  // Rows start with the room's registered debaters; the judge adds more with "+".
  const [entries, setEntries] = useState<JudgeEntry[]>(() => draft?.entries?.length ? draft.entries
    : room.individuals.map((i) => ({ id: i.id, name: i.name, score: draft?.scores?.[i.id] != null ? String(draft.scores[i.id]) : "" })));
  const [touched, setTouched] = useState(false);
  const [saved, setSaved] = useState<"" | "saving" | "saved">("");
  useEffect(() => {
    if (!touched || t.results[room.id] || room.locked) return;
    setSaved("saving");
    const h = setTimeout(() => {
      saveLeaderDraft(t.id, room.id, judgeName, entries).then(() => setSaved("saved")).catch(() => setSaved(""));
    }, 800);
    return () => clearTimeout(h);
  }, [judgeName, entries]);
  const change = (fn: (e: JudgeEntry[]) => JudgeEntry[]) => { setTouched(true); setEntries(fn); };
  const [confirming, setConfirming] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "failed" | "dup" | "locked">("idle");

  const title = `${room.label} · الجولة ${day}`;
  // One judge per room — once any sheet arrives the room is final.
  const sent = t.results[room.id];

  const closed = t.info.days.find((d) => d.day === day)?.closed;
  if (room.locked || closed || status === "locked") {
    return (
      <Shell title={title} subtitle={t.info.name}>
        <Done icon="🔒" head="رابط هذه القاعة مغلق" sub="أغلق المنظّم إدخال الدرجات لهذه القاعة." />
        {onBack && <button onClick={onBack} className="judge-btn judge-btn-back">← الرجوع للقاعات</button>}
      </Shell>
    );
  }
  if (status === "sent" || status === "dup" || sent) {
    return (
      <Shell title={title} subtitle={t.info.name}>
        <div style={{ background: "#DCFCE7", border: "2px solid #22C55E", borderRadius: 16, padding: 4 }}>
          <Done icon="✅" head="تم الإرسال — القاعة مغلقة" sub={`أرسل «${sent?.judgeName || judgeName}» درجات هذه القاعة${sent ? ` الساعة ${new Date(sent.submittedAt).toLocaleTimeString("ar", { timeStyle: "short" })}` : ""}. لا يمكن لأي أحد الدخول أو التعديل.`} />
        </div>
        {onBack && <button onClick={onBack} className="judge-btn judge-btn-back">← الرجوع للقاعات</button>}
      </Shell>
    );
  }

  const valid = (v?: string) => !!v && /^\d+$/.test(v) && +v >= min && +v <= max;
  const allValid = entries.length > 0 && entries.every((e) => e.name.trim() !== "" && valid(e.score));
  const canSend = allValid && judgeName.trim() !== "";

  const send = async () => {
    setStatus("sending");
    try {
      await submitLeaderSheet(t.id, room.id, judgeName.trim(),
        entries.map((e) => ({ id: e.id || undefined, name: e.name.trim(), score: parseInt(e.score) })));
      setStatus("sent");
      onSent();
    } catch (e) {
      const m = e instanceof Error ? e.message : "";
      setStatus(m.includes("409") ? "dup" : m.includes("423") ? "locked" : "failed");
      setConfirming(false);
    }
  };

  if (confirming) {
    return (
      <Shell title={title} subtitle="تأكيد الإرسال">
        <div className="judge-card judge-card-info">
          <div className="judge-info-label">👨‍⚖️ المحكم: {judgeName}</div>
          {entries.map((e, n) => (
            <div key={e.id || `c-${n}`} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
              <span>{e.name}{!e.id && " (جديد)"}</span><b>{e.score}</b>
            </div>
          ))}
        </div>
        <button onClick={send} disabled={status === "sending"} className="judge-btn judge-btn-submit">
          {status === "sending" ? "جارٍ الإرسال…" : "✅ تأكيد إنهاء التحكيم"}
        </button>
        <button onClick={() => setConfirming(false)} className="judge-btn judge-btn-back">← تعديل</button>
      </Shell>
    );
  }

  return (
    <Shell title={title} subtitle={t.info.name}>
      <div className="judge-card judge-card-info">
        <div className="judge-info-label">👨‍⚖️ اسم المحكم</div>
        <input value={judgeName} onChange={(e) => { setTouched(true); setJudgeName(e.target.value); }}
          placeholder="اكتب اسمك" list="leader-judge-names" className="judge-text-input" style={{ fontWeight: 700 }} />
        <datalist id="leader-judge-names">{roomPanel(room).map((j) => <option key={j} value={j} />)}</datalist>
      </div>

      <div className="judge-card judge-card-gov">
        <div className="judge-info-label">المتناظرون والدرجات ({min}–{max})</div>
        {entries.map((e, n) => {
          const bad = e.score !== "" && !valid(e.score);
          const set = (patch: Partial<JudgeEntry>) => change((l) => l.map((x, k) => (k === n ? { ...x, ...patch } : x)));
          return (
            <div key={e.id || `new-${n}`} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0" }}>
              <span style={{ fontWeight: 700, minWidth: 20 }}>{n + 1}.</span>
              {e.id ? <span style={{ flex: 1, fontWeight: 700 }}>{e.name}</span> : (
                <input value={e.name} onChange={(ev) => set({ name: ev.target.value })} placeholder="اسم المتناظر"
                  className="judge-text-input" style={{ flex: 1, fontWeight: 700 }} />
              )}
              <select value={e.score} onChange={(ev) => set({ score: ev.target.value })}
                className="judge-text-input" style={{ width: 96, textAlign: "center", fontWeight: 700, borderColor: bad ? "#dc2626" : undefined }}>
                <option value="">—</option>
                {Array.from({ length: max - min + 1 }, (_, k) => min + k).map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
              {!e.id && <button onClick={() => change((l) => l.filter((_, k) => k !== n))} aria-label="حذف"
                style={{ border: 0, background: "none", color: "#dc2626", fontSize: 18, cursor: "pointer" }}>✕</button>}
            </div>
          );
        })}
        <button onClick={() => change((l) => [...l, { id: "", name: "", score: "" }])} className="judge-btn judge-btn-back"
          style={{ marginTop: 8 }}>＋ إضافة متناظر</button>
      </div>

      {status === "failed" && <div className="judge-warn">تعذّر الإرسال — تأكد من الاتصال وحاول مرة أخرى</div>}
      {!judgeName.trim() && <div className="judge-warn">يجب كتابة اسم المحكم</div>}
      {!entries.length && <div className="judge-warn">أضف متناظراً واحداً على الأقل</div>}

      <button onClick={() => setConfirming(true)} disabled={!canSend}
        className={`judge-btn ${canSend ? "judge-btn-submit" : "judge-btn-disabled"}`}>🏁 إنهاء التحكيم</button>
      {saved && <div className="judge-success-sub" style={{ textAlign: "center" }}>{saved === "saving" ? "جارٍ الحفظ التلقائي…" : "✓ تم الحفظ التلقائي — يمكنك تعديل الدرجات قبل إنهاء التحكيم"}</div>}
      {onBack && <button onClick={onBack} className="judge-btn judge-btn-back">← الرجوع للقاعات</button>}
    </Shell>
  );
}

function Done({ icon, head, sub }: { icon: string; head: string; sub: string }) {
  return (
    <div className="judge-success">
      <div className="judge-success-icon">{icon}</div>
      <div className="judge-success-title">{head}</div>
      <div className="judge-success-sub">{sub}</div>
    </div>
  );
}

function Shell({ title, subtitle, children }: { title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <div className="judge-page" dir="rtl">
      <div style={{ background: "linear-gradient(135deg,#7B2D8E,#29ABE2)", color: "#fff", padding: "18px 16px", textAlign: "center" }}>
        <div style={{ fontSize: 20, fontWeight: 800 }}>{title}</div>
        {subtitle && <div style={{ fontSize: 13, opacity: 0.9 }}>{subtitle}</div>}
      </div>
      <div className="judge-wrap">{children}</div>
    </div>
  );
}
