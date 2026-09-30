import { useEffect, useState } from "react";
import { useParams } from "wouter";
import {
  getLeader, submitLeaderSheet, type LeaderRoom, type LeaderTournament,
} from "@/lib/leaderApi";

/** Judge link for a leadership debate: pick room → pick name → score each individual. */
export default function LeaderJudgePage() {
  const { id } = useParams<{ id: string }>();
  const fixedRoom = new URLSearchParams(window.location.search).get("room");
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
      {t.info.days.map((d) => (
        <div key={d.day}>
          <div className="judge-info-label" style={{ margin: "12px 0 6px" }}>الجولة {d.day}</div>
          {d.rooms.map((r) => (
            <div key={r.id} className="judge-card judge-card-room" onClick={() => setRoomId(r.id)}
              style={{ display: "flex", justifyContent: "space-between", opacity: r.locked ? 0.6 : 1 }}>
              <b>{r.label}</b>
              <span>{r.locked ? "🔒 مغلقة" : `${r.individuals.length} أفراد ←`}</span>
            </div>
          ))}
        </div>
      ))}
    </Shell>
  );
}

function Scoring({ t, day, room, onBack, onSent }: {
  t: LeaderTournament; day: number; room: LeaderRoom; onBack?: () => void; onSent: () => void;
}) {
  const { scoreMin: min, scoreMax: max } = t.info;
  const [judgeName, setJudgeName] = useState("");
  const [scores, setScores] = useState<Record<string, string>>({});
  const [confirming, setConfirming] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "failed" | "dup" | "locked">("idle");

  const title = `${room.label} · الجولة ${day}`;
  // One judge per room — once any sheet arrives the room is final.
  const sent = t.results[room.id];

  if (room.locked || status === "locked") {
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
        <Done icon="🔒✅" head="تم تسجيل الدرجات" sub={`أرسل المحكم «${sent?.judgeName || judgeName}» درجات هذه القاعة ولا يمكن تعديلها.`} />
        {onBack && <button onClick={onBack} className="judge-btn judge-btn-back">← الرجوع للقاعات</button>}
      </Shell>
    );
  }

  const valid = (v?: string) => !!v && /^\d+$/.test(v) && +v >= min && +v <= max;
  const allValid = room.individuals.length > 0 && room.individuals.every((i) => valid(scores[i.id]));
  const canSend = allValid && judgeName.trim() !== "";

  const send = async () => {
    setStatus("sending");
    try {
      await submitLeaderSheet(t.id, room.id, judgeName.trim(),
        Object.fromEntries(room.individuals.map((i) => [i.id, parseInt(scores[i.id])])));
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
          {room.individuals.map((i) => (
            <div key={i.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
              <span>{i.name}</span><b>{scores[i.id]}</b>
            </div>
          ))}
        </div>
        <button onClick={send} disabled={status === "sending"} className="judge-btn judge-btn-submit">
          {status === "sending" ? "جارٍ الإرسال…" : "✅ تأكيد وإرسال نهائي"}
        </button>
        <button onClick={() => setConfirming(false)} className="judge-btn judge-btn-back">← تعديل</button>
      </Shell>
    );
  }

  return (
    <Shell title={title} subtitle={t.info.name}>
      <div className="judge-card judge-card-info">
        <div className="judge-info-label">👨‍⚖️ اسم المحكم</div>
        {room.judges.length > 0 ? (
          <select value={judgeName} onChange={(e) => setJudgeName(e.target.value)} className="judge-text-input" style={{ fontWeight: 700 }}>
            <option value="">— اختر اسمك —</option>
            {room.judges.map((j) => <option key={j} value={j}>{j}</option>)}
          </select>
        ) : (
          <input value={judgeName} onChange={(e) => setJudgeName(e.target.value)} placeholder="أدخل اسمك" className="judge-text-input" />
        )}
      </div>

      <div className="judge-card judge-card-gov">
        <div className="judge-info-label">الدرجات ({min}–{max}، أرقام صحيحة)</div>
        {room.individuals.map((i, n) => {
          const v = scores[i.id] ?? "";
          const bad = v !== "" && !valid(v);
          return (
            <div key={i.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0" }}>
              <span style={{ flex: 1, fontWeight: 700 }}>{n + 1}. {i.name || `الفرد ${n + 1}`}</span>
              <input inputMode="numeric" value={v} placeholder={`${min}-${max}`}
                onChange={(e) => setScores((s) => ({ ...s, [i.id]: e.target.value.replace(/\D/g, "") }))}
                className="judge-text-input" style={{ width: 90, textAlign: "center", borderColor: bad ? "#dc2626" : undefined }} />
            </div>
          );
        })}
        {!room.individuals.length && <p className="judge-success-sub">لا يوجد أفراد في هذه القاعة بعد.</p>}
      </div>

      {status === "failed" && <div className="judge-warn">تعذّر الإرسال — تأكد من الاتصال وحاول مرة أخرى</div>}
      {!judgeName.trim() && <div className="judge-warn">يجب اختيار/إدخال اسم المحكم</div>}

      <button onClick={() => setConfirming(true)} disabled={!canSend}
        className={`judge-btn ${canSend ? "judge-btn-submit" : "judge-btn-disabled"}`}>📤 تسليم الدرجات</button>
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
