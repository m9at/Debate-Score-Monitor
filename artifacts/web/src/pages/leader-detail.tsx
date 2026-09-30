import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { ArrowRight, Gavel, Link2, Plus, Save, Trash2, Trophy, UserRound, Users } from "lucide-react";
import {
  dayRange, deleteLeaderSheet, getLeader, newIndividual, newRoom, saveLeaderInfo,
  type LeaderInfo, type LeaderTournament,
} from "@/lib/leaderApi";
import { BRAND, BRAND_GRADIENT, BTN, BTN_PRIMARY_STYLE, BTN_SIZE } from "@/lib/brand";
import BrandLogo from "@/components/brand/BrandLogo";
import { Field, Panel, inputClass, inputStyle } from "@/components/wizard/ui";
import LeaderResults from "@/components/leader/LeaderResults";
import RoomCard from "@/components/leader/RoomCard";
import NamePool from "@/components/leader/NamePool";

type Tab = number | "people" | "results";

export default function LeaderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [t, setT] = useState<LeaderTournament | null>(null);
  const [info, setInfo] = useState<LeaderInfo | null>(null);
  const [tab, setTab] = useState<Tab>("people");
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

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(""), 2000); };
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
      flash("تم الحفظ");
      await refresh();
    } catch { flash("تعذّر الحفظ"); }
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
  const copy = (text: string) => { void navigator.clipboard.writeText(text); flash("تم نسخ الرابط"); };

  const dayIdx = typeof tab === "number" ? info.days.findIndex((d) => d.day === tab) : -1;
  const day = dayIdx >= 0 ? info.days[dayIdx] : null;
  const people = info.individualPool ?? [];
  const judges = info.judgePool ?? [];

  return (
    <div className="min-h-screen p-4 sm:p-6" style={{ background: BRAND.surface }} dir="rtl">
      <div className="mx-auto max-w-6xl space-y-5">
        {/* Header — logo on the right, like the rest of the system */}
        <header className="rounded-2xl bg-white border shadow-sm overflow-hidden" style={{ borderColor: BRAND.border }}>
          <div className="h-1.5" style={{ backgroundImage: BRAND_GRADIENT }} />
          <div className="p-4 md:p-5 flex flex-wrap items-center gap-4">
            <BrandLogo size={56} />
            <div className="flex-1 min-w-[200px]">
              <button onClick={() => setLocation("/")} className="inline-flex items-center gap-1 text-[12px] font-bold" style={{ color: `${BRAND.ink}80` }}>
                <ArrowRight className="w-3.5 h-3.5" /> البطولات
              </button>
              <h1 className="text-[22px] font-extrabold" style={{ color: BRAND.ink }}>{info.name}</h1>
              <div className="mt-1 flex flex-wrap gap-1.5 text-[11.5px] font-bold">
                <Chip>مناظرة قيادية · فردية</Chip>
                <Chip>{info.days.length} جولات</Chip>
                <Chip>{people.length} متناظر</Chip>
                <Chip>{judges.length} محكم</Chip>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {msg && <span className="text-[12px] font-bold" style={{ color: BRAND.purple }}>{msg}</span>}
              <button onClick={() => copy(judgeLink())} className={`${BTN.base} ${BTN.secondary}`}>
                <Link2 className="w-4 h-4" /> رابط التحكيم العام
              </button>
              <button onClick={() => save()} disabled={!dirty} className={`${BTN.base} ${BTN.primary}`} style={BTN_PRIMARY_STYLE}
                data-testid="button-save-leader">
                <Save className="w-4 h-4" /> حفظ التعديلات
              </button>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <nav className="flex flex-wrap gap-1.5 rounded-2xl bg-white border p-1.5 shadow-sm" style={{ borderColor: BRAND.border }}>
          <TabBtn active={tab === "people"} onClick={() => setTab("people")}><Users className="w-4 h-4" /> المتناظرون والمحكمون</TabBtn>
          {info.days.map((d) => (
            <TabBtn key={d.day} active={tab === d.day} onClick={() => setTab(d.day)}>
              الجولة {d.day}{d.title ? ` · ${d.title}` : ""}
            </TabBtn>
          ))}
          <TabBtn active={tab === "results"} onClick={() => setTab("results")}><Trophy className="w-4 h-4" /> النتائج والتقرير</TabBtn>
          <button onClick={() => edit((dr) => { dr.days.push({ day: dr.days.length + 1, rooms: [newRoom(1)] }); })}
            className={`${BTN.base} ${BTN.ghost} ${BTN_SIZE.sm} mr-auto`}>
            <Plus className="w-4 h-4" /> جولة
          </button>
        </nav>

        {tab === "results" && <LeaderResults t={t} />}

        {tab === "people" && (
          <div className="grid gap-4 md:grid-cols-2">
            <NamePool title="المتناظرون (الأفراد)" icon={<UserRound className="w-4 h-4" />} placeholder="اسم المتناظر"
              names={people.map((p) => p.name)}
              onAdd={(n) => edit((dr) => { dr.individualPool = [...(dr.individualPool ?? []), newIndividual(n)]; })}
              onRemove={(i) => edit((dr) => { dr.individualPool!.splice(i, 1); })} />
            <NamePool title="المحكمون" icon={<Gavel className="w-4 h-4" />} placeholder="اسم المحكم"
              names={judges}
              onAdd={(n) => edit((dr) => { dr.judgePool = [...(dr.judgePool ?? []), n]; })}
              onRemove={(i) => edit((dr) => { dr.judgePool!.splice(i, 1); })} />
          </div>
        )}

        {day && (
          <>
            <Panel title={`إعدادات الجولة ${day.day}`} hint="لكل جولة موضوعها ونطاق درجاتها — وتُجمع كل الجولات في النتيجة النهائية">
              <div className="grid gap-3 sm:grid-cols-[1fr_120px_120px_auto] items-end">
                <Field label="عنوان / موضوع الجولة">
                  <input value={day.title ?? ""} placeholder="مثال: الجولة التمهيدية"
                    onChange={(e) => edit((dr) => { dr.days[dayIdx].title = e.target.value; })}
                    className={inputClass} style={inputStyle} />
                </Field>
                <Field label="أقل درجة">
                  <input type="number" value={dayRange(info, day).min}
                    onChange={(e) => edit((dr) => { dr.days[dayIdx].scoreMin = +e.target.value; })}
                    className={inputClass} style={inputStyle} />
                </Field>
                <Field label="أعلى درجة">
                  <input type="number" value={dayRange(info, day).max}
                    onChange={(e) => edit((dr) => { dr.days[dayIdx].scoreMax = +e.target.value; })}
                    className={inputClass} style={inputStyle} />
                </Field>
                {info.days.length > 1 && (
                  <button onClick={() => {
                    if (!confirm("حذف هذه الجولة؟")) return;
                    edit((dr) => { dr.days.splice(dayIdx, 1); dr.days.forEach((d, i) => { d.day = i + 1; }); });
                    setTab("people");
                  }} className={`${BTN.base} ${BTN.secondary} h-11`}>
                    <Trash2 className="w-4 h-4" /> حذف الجولة
                  </button>
                )}
              </div>
            </Panel>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {day.rooms.map((room, ri) => {
                const others = day.rooms.filter((_, i) => i !== ri);
                return (
                  <RoomCard
                    key={room.id}
                    room={room}
                    people={people.filter((p) => !others.some((r) => r.individuals.some((x) => x.id === p.id)))}
                    judges={judges.filter((j) => !others.some((r) => r.judges.includes(j)))}
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
                );
              })}
              <button onClick={() => edit((dr) => { dr.days[dayIdx].rooms.push(newRoom(dr.days[dayIdx].rooms.length + 1)); })}
                className="min-h-[180px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 font-bold text-[14px] transition-colors hover:bg-white"
                style={{ borderColor: `${BRAND.purple}40`, color: BRAND.purple }}>
                <Plus className="w-6 h-6" /> إضافة قاعة
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full px-2.5 py-0.5" style={{ background: `${BRAND.purple}10`, color: BRAND.purple }}>{children}</span>;
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`${BTN.base} ${BTN_SIZE.sm} ${active ? BTN.primary : BTN.ghost}`}
      style={active ? BTN_PRIMARY_STYLE : undefined}>
      {children}
    </button>
  );
}
