import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { BarChart2, CheckCircle2, FileText, Layers, LayoutDashboard, Save, Settings, UserCheck, Users } from "lucide-react";
import {
  deleteLeaderSheet, getLeader, newIndividual, saveLeaderInfo,
  type LeaderInfo, type LeaderTournament,
} from "@/lib/leaderApi";
import { BRAND, BTN, BTN_PRIMARY_STYLE } from "@/lib/brand";
import TournamentSidebar, { type SidebarGroup } from "@/components/tournament/TournamentSidebar";
import LeaderResults from "@/components/leader/LeaderResults";
import LeaderReport from "@/components/leader/LeaderReport";
import LeaderOverview from "@/components/leader/LeaderOverview";
import NamePool from "@/components/leader/NamePool";
import RoundsPanel from "@/components/leader/RoundsPanel";
import LeaderSettings from "@/components/leader/LeaderSettings";
import { SectionHeader } from "@/components/leader/ui";

type Tab = "overview" | "rounds" | "people" | "judges" | "results" | "reports" | "settings";

export default function LeaderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [t, setT] = useState<LeaderTournament | null>(null);
  const [info, setInfo] = useState<LeaderInfo | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
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
  const copyLink = (query = "") => {
    const url = `${window.location.origin}${import.meta.env.BASE_URL.replace(/\/$/, "")}/leader/judge/${id}${query}`;
    void navigator.clipboard.writeText(url);
    flash("تم نسخ الرابط");
  };

  const people = info.individualPool ?? [];
  const judges = info.judgePool ?? [];
  /** "Round 1 · Room 2" style placement label for a registry entry. */
  const placement = (match: (r: LeaderInfo["days"][number]["rooms"][number]) => boolean) => {
    const at = info.days.flatMap((d) => d.rooms.filter(match).map((r) => `ج${d.day} · ${r.label}`));
    return at.length ? at.join("، ") : undefined;
  };

  const groups: SidebarGroup<Tab>[] = [
    {
      title: "المناظرة القيادية",
      tabs: [
        { key: "overview", label: "🏠 نظرة عامة", icon: LayoutDashboard },
        { key: "rounds", label: "⚔️ الجولات والقاعات", icon: Layers, badge: info.days.length },
        { key: "people", label: "👤 المتناظرون", icon: Users, badge: people.length },
        { key: "judges", label: "👨‍⚖️ المحكمون", icon: UserCheck, badge: judges.length },
        { key: "results", label: "📊 النتائج", icon: BarChart2 },
        { key: "reports", label: "📑 التقارير", icon: FileText },
      ],
    },
    { title: "الإدارة", tabs: [{ key: "settings", label: "⚙️ إعدادات البطولة", icon: Settings }] },
  ];

  return (
    <div className="min-h-screen md:flex" style={{ background: BRAND.surface }} dir="rtl">
      <TournamentSidebar<Tab> groups={groups} activeTab={tab} onTabChange={(k) => setTab(k)} onHome={() => setLocation("/")} />

      <main className="min-w-0 flex-1">
        {/* Top bar: tournament identity on the right, actions on the left */}
        <div className="sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b bg-white/90 px-4 py-3 backdrop-blur md:px-8"
          style={{ borderColor: BRAND.border }}>
          <div className="min-w-0 flex-1">
            <div className="text-[11.5px] font-bold" style={{ color: BRAND.purple }}>مناظرة قيادية · فردية</div>
            <h1 className="truncate text-[18px] font-extrabold" style={{ color: BRAND.ink }}>{info.name}</h1>
          </div>
          {msg && <span className="inline-flex items-center gap-1 text-[12px] font-bold" style={{ color: BRAND.success }}><CheckCircle2 className="w-4 h-4" />{msg}</span>}
          {dirty && !msg && <span className="text-[12px] font-bold" style={{ color: BRAND.warning }}>تعديلات غير محفوظة</span>}
          <button onClick={() => save()} disabled={!dirty} className={`${BTN.base} ${BTN.primary}`} style={BTN_PRIMARY_STYLE}
            data-testid="button-save-leader">
            <Save className="w-4 h-4" /> حفظ
          </button>
        </div>

        <div className="mx-auto max-w-6xl p-4 md:p-8">
          {tab === "overview" && (
            <div>
              <SectionHeader title="نظرة عامة" subtitle="حالة كل جولة ورابط التحكيم الخاص بها" />
              <LeaderOverview t={{ ...t, info }} copyLink={copyLink} />
            </div>
          )}

          {tab === "rounds" && (
            <RoundsPanel t={t} info={info} edit={edit} onToggleLock={toggleLock} copyLink={copyLink}
              onDeleteSheet={async (key) => { await deleteLeaderSheet(id, key); await refresh(); }} />
          )}

          {tab === "people" && (
            <div>
              <SectionHeader title="المتناظرون" subtitle="سجّل أسماء الأفراد هنا، ثم وزّعهم على القاعات من قسم الجولات" />
              <NamePool noun="المتناظر" placeholder="اسم المتناظر" names={people.map((p) => p.name)}
                assigned={(i) => placement((r) => r.individuals.some((x) => x.id === people[i].id))}
                onAdd={(n) => edit((d) => { d.individualPool = [...(d.individualPool ?? []), newIndividual(n)]; })}
                onRename={(i, n) => edit((d) => {
                  const pid = d.individualPool![i].id;
                  d.individualPool![i].name = n;
                  d.days.forEach((x) => x.rooms.forEach((r) => r.individuals.forEach((ind) => { if (ind.id === pid) ind.name = n; })));
                })}
                onRemove={(i) => edit((d) => {
                  const pid = d.individualPool![i].id;
                  d.individualPool!.splice(i, 1);
                  d.days.forEach((x) => x.rooms.forEach((r) => { r.individuals = r.individuals.filter((ind) => ind.id !== pid); }));
                })} />
            </div>
          )}

          {tab === "judges" && (
            <div>
              <SectionHeader title="المحكمون" subtitle="محكم واحد لكل قاعة، ولا يتكرر المحكم في قاعتين داخل نفس الجولة" />
              <NamePool noun="المحكم" placeholder="اسم المحكم" names={judges}
                assigned={(i) => placement((r) => r.judges.includes(judges[i]))}
                onAdd={(n) => edit((d) => { d.judgePool = [...(d.judgePool ?? []), n]; })}
                onRename={(i, n) => edit((d) => {
                  const old = d.judgePool![i];
                  d.judgePool![i] = n;
                  d.days.forEach((x) => x.rooms.forEach((r) => { r.judges = r.judges.map((j) => (j === old ? n : j)); }));
                })}
                onRemove={(i) => edit((d) => {
                  const old = d.judgePool![i];
                  d.judgePool!.splice(i, 1);
                  d.days.forEach((x) => x.rooms.forEach((r) => { r.judges = r.judges.filter((j) => j !== old); }));
                })} />
            </div>
          )}

          {tab === "results" && (
            <div>
              <SectionHeader title="النتائج" subtitle="الترتيب حسب المجموع الكلي، الجولة، أو القاعة — مع تصدير Excel" />
              <LeaderResults t={t} />
            </div>
          )}

          {tab === "reports" && (
            <div>
              <SectionHeader title="التقارير" subtitle="ملخص الجولات، القاعات، المحكمين، وكشف الأفراد التفصيلي" />
              <LeaderReport t={{ ...t, info }} />
            </div>
          )}

          {tab === "settings" && <LeaderSettings info={info} edit={edit} />}
        </div>
      </main>
    </div>
  );
}
