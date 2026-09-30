import { useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "wouter";
import { BarChart2, CheckCircle2, CloudUpload, FileText, Layers, LayoutDashboard, Settings, TriangleAlert, UserCheck, Users } from "lucide-react";
import {
  deleteLeaderSheet, getLeader, newIndividual, saveLeaderInfo,
  type LeaderInfo, type LeaderTournament,
} from "@/lib/leaderApi";
import { BRAND } from "@/lib/brand";
import PdfMenu from "@/components/leader/PdfMenu";
import { judgeUrl } from "@/components/leader/JudgeLinkCard";
import TournamentSidebar, { type SidebarGroup } from "@/components/tournament/TournamentSidebar";
import LeaderResults from "@/components/leader/LeaderResults";
import LeaderReport from "@/components/leader/LeaderReport";
import LeaderOverview from "@/components/leader/LeaderOverview";
import NamePool from "@/components/leader/NamePool";
import RoundsPanel from "@/components/leader/RoundsPanel";
import LeaderSettings from "@/components/leader/LeaderSettings";
import { SectionHeader } from "@/components/leader/ui";
import UnlockGate from "@/components/tournament/UnlockGate";
import { useTournament } from "@/context/TournamentContext";
import { isOwnerCode } from "@/lib/ownerCode";

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
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const dirtyRef = useRef(false);
  dirtyRef.current = dirty;
  const lastJson = useRef("");
  const unlockKey = `leader_unlocked_${id}`;
  const [unlocked, setUnlocked] = useState(false);
  // Tournaments created before the code moved to the server keep it only locally.
  const localProtection = useTournament().tournaments.find((x) => x.leaderId === id)?.protection;

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(""), 3000); };
  const refresh = async () => {
    try {
      const data = await getLeader(id);
      if (!data.info.protection && localProtection?.enabled && localProtection.code) {
        data.info.protection = localProtection;
        void saveLeaderInfo(id, data.info);
      }
      const json = JSON.stringify([data.info, data.results, data.drafts]);
      if (lastJson.current && json !== lastJson.current && !dirtyRef.current) flash("🔄 تحديث مباشر: تمت إضافة تغييرات جديدة");
      lastJson.current = json;
      setT(data);
      // Never overwrite what this user is typing right now.
      if (!dirtyRef.current) setInfo(data.info);
    } catch { setMissing(true); }
  };
  useEffect(() => { void refresh(); }, [id]);
  // Live sync: pick up other editors' changes and judges' scores every 2 seconds.
  useEffect(() => {
    const h = setInterval(() => { if (!dirtyRef.current && !document.hidden) void refresh(); }, 2000);
    return () => clearInterval(h);
  }, [id]);

  if (missing) return <div className="p-10 text-center" dir="rtl">البطولة غير موجودة</div>;
  if (!t || !info) return <div className="p-10 text-center" dir="rtl">جارٍ التحميل…</div>;

  const prot = info.protection;
  const stored = sessionStorage.getItem(unlockKey);
  if (prot?.enabled && prot.code && !unlocked && stored !== prot.code && !(stored !== null && isOwnerCode(stored))) {
    return (
      <UnlockGate tournamentName={info.name} codeLength={prot.code.length}
        onSubmit={(code) => {
          if (code !== prot.code && !isOwnerCode(code)) return false;
          sessionStorage.setItem(unlockKey, code);
          setUnlocked(true);
          return true;
        }}
        onBack={() => setLocation("/")} />
    );
  }

  /** Every edit autosaves shortly after the user stops typing. */
  const edit = (fn: (draft: LeaderInfo) => void) => {
    const draft = structuredClone(info);
    fn(draft);
    setInfo(draft);
    setDirty(true);
    setSaveState("saving");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => void save(draft), 700);
  };
  const save = async (next: LeaderInfo) => {
    try {
      await saveLeaderInfo(id, next);
      lastJson.current = "";
      setDirty(false);
      dirtyRef.current = false;
      setSaveState("saved");
      await refresh();
    } catch { setSaveState("error"); }
  };
  /** Lock/unlock saves immediately — it must reach judges right away. */
  const toggleLock = (dayIdx: number, roomIdx: number) => {
    edit((d) => { const room = d.days[dayIdx].rooms[roomIdx]; room.locked = !room.locked; });
  };
  const copyLink = (query = "") => {
    void navigator.clipboard.writeText(judgeUrl(id, query));
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
      <div className="print:hidden"><TournamentSidebar<Tab> groups={groups} activeTab={tab} onTabChange={(k) => setTab(k)} onHome={() => setLocation("/")} /></div>

      <main className="min-w-0 flex-1">
        {/* Top bar: tournament identity on the right, actions on the left */}
        <div className="sticky top-0 z-20 flex flex-wrap print:hidden items-center gap-3 border-b bg-white/90 px-4 py-3 backdrop-blur md:px-8"
          style={{ borderColor: BRAND.border }}>
          <div className="min-w-0 flex-1">
            <div className="text-[11.5px] font-bold" style={{ color: BRAND.purple }}>مناظرة قيادية · فردية</div>
            <h1 className="truncate text-[18px] font-extrabold" style={{ color: BRAND.ink }}>{info.name}</h1>
          </div>
          {msg && <span className="inline-flex items-center gap-1 text-[12px] font-bold" style={{ color: BRAND.purple }}><CheckCircle2 className="w-4 h-4" />{msg}</span>}
          {saveState === "saving" && <span className="inline-flex items-center gap-1 text-[12px] font-bold" style={{ color: BRAND.warning }}><CloudUpload className="w-4 h-4" />جاري الحفظ…</span>}
          {saveState === "saved" && <span className="inline-flex items-center gap-1 text-[12px] font-bold" style={{ color: BRAND.success }}><CheckCircle2 className="w-4 h-4" />تم الحفظ تلقائياً</span>}
          {saveState === "error" && <button onClick={() => save(info)} className="inline-flex items-center gap-1 text-[12px] font-bold" style={{ color: BRAND.danger }}><TriangleAlert className="w-4 h-4" />تعذّر الحفظ — إعادة المحاولة</button>}
        </div>

        <div className="mx-auto max-w-6xl p-4 md:p-8">
          {tab === "overview" && (
            <div>
              <SectionHeader title="نظرة عامة" subtitle="لوحة متابعة البطولة القيادية" />
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
                assigned={(i) => placement((r) => [...(r.chair ? [r.chair] : []), ...r.judges].includes(judges[i]))}
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
              <div className="mb-3 flex justify-end"><PdfMenu t={{ ...t, info }} /></div>
              <LeaderResults t={t} />
            </div>
          )}

          {tab === "reports" && (
            <div>
              <SectionHeader title="التقارير" subtitle="ملخص الجولات، القاعات، المحكمين، وكشف الأفراد التفصيلي" />
              <LeaderReport t={{ ...t, info }} />
            </div>
          )}

          {tab === "settings" && <LeaderSettings t={t} info={info} edit={edit} onReset={() => { flash("تمت إعادة ضبط الدرجات"); void refresh(); }} />}
        </div>
      </main>
    </div>
  );
}
