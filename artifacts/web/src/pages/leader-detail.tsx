import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import {
  deleteLeaderSheet, getLeader, newIndividual, newRoom, saveLeaderInfo,
  type LeaderInfo, type LeaderRoom, type LeaderTournament,
} from "@/lib/leaderApi";
import LeaderResults from "@/components/leader/LeaderResults";

const PURPLE = "#7B2D8E";
const CYAN = "#29ABE2";

export default function LeaderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [t, setT] = useState<LeaderTournament | null>(null);
  const [info, setInfo] = useState<LeaderInfo | null>(null);
  const [tab, setTab] = useState<number | "results">(1);
  const [dirty, setDirty] = useState(false);
  const [msg, setMsg] = useState("");
  const [missing, setMissing] = useState(false);

  const refresh = async () => {
    try {
      const data = await getLeader(id);
      setT(data);
      setInfo((prev) => (prev && dirty ? prev : data.info));
    } catch { setMissing(true); }
  };
  useEffect(() => { void refresh(); }, [id]);
  // Pull new judge sheets while the organiser watches.
  useEffect(() => {
    const h = setInterval(() => { if (!dirty) void refresh(); }, 5000);
    return () => clearInterval(h);
  }, [id, dirty]);

  if (missing) return <div className="p-10 text-center" dir="rtl">البطولة غير موجودة</div>;
  if (!t || !info) return <div className="p-10 text-center" dir="rtl">جارٍ التحميل…</div>;

  const edit = (fn: (draft: LeaderInfo) => void) => {
    const draft = structuredClone(info);
    fn(draft);
    setInfo(draft);
    setDirty(true);
  };
  const save = async (next = info) => {
    try {
      await saveLeaderInfo(id, next);
      setDirty(false);
      setMsg("✅ تم الحفظ");
      setTimeout(() => setMsg(""), 2000);
      await refresh();
    } catch { setMsg("⚠️ تعذّر الحفظ"); }
  };
  /** Lock/unlock saves immediately — it must reach judges right away. */
  const toggleLock = (dayIdx: number, roomIdx: number) => {
    const draft = structuredClone(info);
    const room = draft.days[dayIdx].rooms[roomIdx];
    room.locked = !room.locked;
    setInfo(draft);
    void save(draft);
  };

  const judgeLink = (roomId?: string) =>
    `${window.location.origin}${import.meta.env.BASE_URL.replace(/\/$/, "")}/leader/judge/${id}${roomId ? `?room=${roomId}` : ""}`;
  const copy = (text: string) => {
    void navigator.clipboard.writeText(text);
    setMsg("📋 تم نسخ الرابط");
    setTimeout(() => setMsg(""), 2000);
  };

  const dayIdx = typeof tab === "number" ? info.days.findIndex((d) => d.day === tab) : -1;
  const day = dayIdx >= 0 ? info.days[dayIdx] : null;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6" dir="rtl">
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <button onClick={() => setLocation("/")} className="text-sm text-gray-500">← البطولات</button>
            <h1 className="text-2xl font-extrabold" style={{ color: PURPLE }}>{info.name}</h1>
            <p className="text-sm text-gray-500">مناظرة قيادية · الدرجات من {info.scoreMin} إلى {info.scoreMax} · بدون فائز</p>
          </div>
          <div className="flex items-center gap-2">
            {msg && <span className="text-sm">{msg}</span>}
            <button onClick={() => copy(judgeLink())} className="rounded-lg border px-3 py-2 text-sm font-bold" style={{ color: CYAN, borderColor: CYAN }}>
              🔗 رابط التحكيم العام
            </button>
            <button onClick={() => save()} disabled={!dirty}
              className="rounded-lg px-4 py-2 text-sm font-bold text-white disabled:opacity-40" style={{ background: PURPLE }}
              data-testid="button-save-leader">
              💾 حفظ التعديلات
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {info.days.map((d) => (
            <TabBtn key={d.day} active={tab === d.day} onClick={() => setTab(d.day)}>الجولة {d.day}</TabBtn>
          ))}
          <TabBtn active={tab === "results"} onClick={() => setTab("results")}>🏅 النتائج</TabBtn>
          <button onClick={() => edit((dr) => { dr.days.push({ day: dr.days.length + 1, rooms: [newRoom(1)] }); })}
            className="rounded-full px-3 py-1.5 text-sm text-gray-500">+ جولة</button>
        </div>

        {tab === "results" && <LeaderResults t={t} />}

        {day && (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {day.rooms.map((room, ri) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  sheets={Object.entries(t.results).filter(([, s]) => s.roomId === room.id)}
                  onChange={(fn) => edit((dr) => fn(dr.days[dayIdx].rooms[ri]))}
                  onRemove={() => { if (confirm("حذف القاعة؟")) edit((dr) => { dr.days[dayIdx].rooms.splice(ri, 1); }); }}
                  onToggleLock={() => toggleLock(dayIdx, ri)}
                  onCopyLink={() => copy(judgeLink(room.id))}
                  onDeleteSheet={async (key) => {
                    if (!confirm("حذف ورقة هذا المحكم ليعيد الإدخال؟")) return;
                    await deleteLeaderSheet(id, key); await refresh();
                  }}
                />
              ))}
            </div>
            <button onClick={() => edit((dr) => { dr.days[dayIdx].rooms.push(newRoom(dr.days[dayIdx].rooms.length + 1)); })}
              className="rounded-lg border-2 border-dashed px-4 py-2 text-sm font-bold text-gray-500">+ إضافة قاعة</button>
          </>
        )}
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="rounded-full px-4 py-1.5 text-sm font-bold"
      style={active ? { background: PURPLE, color: "#fff" } : { background: "#fff", color: PURPLE }}>
      {children}
    </button>
  );
}

function RoomCard({ room, sheets, onChange, onRemove, onToggleLock, onCopyLink, onDeleteSheet }: {
  room: LeaderRoom;
  sheets: [string, { judgeName: string }][];
  onChange: (fn: (r: LeaderRoom) => void) => void;
  onRemove: () => void;
  onToggleLock: () => void;
  onCopyLink: () => void;
  onDeleteSheet: (key: string) => void;
}) {
  const [judgeDraft, setJudgeDraft] = useState("");
  return (
    <div className="space-y-3 rounded-2xl bg-white p-4 shadow-sm" style={{ borderTop: `4px solid ${room.locked ? "#999" : CYAN}` }}>
      <div className="flex items-center gap-2">
        <input value={room.label} onChange={(e) => onChange((r) => { r.label = e.target.value; })}
          className="flex-1 rounded border px-2 py-1 font-bold" />
        <button onClick={onRemove} className="text-xs text-red-500">حذف</button>
      </div>

      <div className="flex gap-2">
        <button onClick={onToggleLock} className="flex-1 rounded-lg px-2 py-1.5 text-xs font-bold text-white"
          style={{ background: room.locked ? "#16a34a" : "#dc2626" }}>
          {room.locked ? "🔓 فتح الرابط" : "🔒 إغلاق الرابط"}
        </button>
        <button onClick={onCopyLink} className="flex-1 rounded-lg border px-2 py-1.5 text-xs font-bold" style={{ color: CYAN, borderColor: CYAN }}>
          🔗 نسخ رابط القاعة
        </button>
      </div>

      <div>
        <div className="mb-1 text-xs font-bold text-gray-500">👤 الأفراد ({room.individuals.length})</div>
        <div className="space-y-1">
          {room.individuals.map((ind, i) => (
            <div key={ind.id} className="flex gap-1">
              <input value={ind.name} placeholder={`الفرد ${i + 1}`}
                onChange={(e) => onChange((r) => { r.individuals[i].name = e.target.value; })}
                className="flex-1 rounded border px-2 py-1 text-sm" />
              <button onClick={() => onChange((r) => { r.individuals.splice(i, 1); })} className="px-1 text-xs text-red-400">✕</button>
            </div>
          ))}
        </div>
        <button onClick={() => onChange((r) => { r.individuals.push(newIndividual()); })}
          className="mt-1 text-xs font-bold" style={{ color: PURPLE }}>+ إضافة فرد</button>
      </div>

      <div>
        <div className="mb-1 text-xs font-bold text-gray-500">👨‍⚖️ المحكمون</div>
        <div className="flex flex-wrap gap-1">
          {room.judges.map((j, i) => (
            <span key={i} className="rounded-full bg-purple-50 px-2 py-0.5 text-xs">
              {j} <button onClick={() => onChange((r) => { r.judges.splice(i, 1); })} className="text-red-400">✕</button>
            </span>
          ))}
        </div>
        <div className="mt-1 flex gap-1">
          <input value={judgeDraft} onChange={(e) => setJudgeDraft(e.target.value)} placeholder="اسم المحكم"
            onKeyDown={(e) => { if (e.key === "Enter" && judgeDraft.trim()) { const v = judgeDraft.trim(); onChange((r) => { r.judges.push(v); }); setJudgeDraft(""); } }}
            className="flex-1 rounded border px-2 py-1 text-sm" />
          <button onClick={() => { const v = judgeDraft.trim(); if (v) { onChange((r) => { r.judges.push(v); }); setJudgeDraft(""); } }}
            className="text-xs font-bold" style={{ color: PURPLE }}>إضافة</button>
        </div>
      </div>

      <div className="border-t pt-2 text-xs">
        <div className="mb-1 font-bold text-gray-500">📥 أوراق مستلمة ({sheets.length}/{room.judges.length || "—"})</div>
        {sheets.map(([key, s]) => (
          <div key={key} className="flex justify-between">
            <span>✅ {s.judgeName}</span>
            <button onClick={() => onDeleteSheet(key)} className="text-red-400">حذف</button>
          </div>
        ))}
      </div>
    </div>
  );
}
