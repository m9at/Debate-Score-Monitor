import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useTournament } from "@/context/TournamentContext";
import { useGroups } from "@/context/GroupContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FolderPlus, Plus, SearchX, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import HomeHeader from "@/components/home/HomeHeader";
import TournamentCard from "@/components/home/TournamentCard";
import TournamentFilters, {
  type StatusFilter,
} from "@/components/home/TournamentFilters";
import FolderStrip from "@/components/home/FolderStrip";
import { BRAND, BTN, BTN_PRIMARY_STYLE, BTN_SIZE } from "@/lib/brand";
import { getTournamentStatus } from "@/lib/tournamentStatus";

export default function Home() {
  const {
    tournaments,
    addTournament,
    deleteTournament,
    duplicateTournament,
    setTournamentArchived,
    updateTournamentInfo,
  } = useTournament();
  const { groups, addGroup, deleteGroup } = useGroups();
  const [, setLocation] = useLocation();

  // Create-tournament dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRounds, setNewRounds] = useState("3");
  const [enableSemifinal, setEnableSemifinal] = useState(false);
  const [enableFinal, setEnableFinal] = useState(false);

  // Create-folder dialog
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDesc, setGroupDesc] = useState("");

  // Rename dialog
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  // List controls
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");

  const ungrouped = useMemo(
    () =>
      tournaments.filter(
        (t) => !groups.some((g) => g.tournamentIds.includes(t.id))
      ),
    [tournaments, groups]
  );

  const counts = useMemo(() => {
    const c: Record<StatusFilter, number> = {
      all: 0,
      running: 0,
      draft: 0,
      upcoming: 0,
      completed: 0,
      archived: 0,
    };
    for (const t of ungrouped) {
      const s = getTournamentStatus(t);
      c[s] += 1;
      // Archived tournaments live behind their own filter, not in "الكل".
      if (s !== "archived") c.all += 1;
    }
    return c;
  }, [ungrouped]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ungrouped
      .filter((t) => {
        const s = getTournamentStatus(t);
        if (filter === "all") return s !== "archived";
        return s === filter;
      })
      .filter((t) => !q || t.name.toLowerCase().includes(q))
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [ungrouped, filter, query]);

  const handleCreate = () => {
    if (!newName.trim()) return;
    const id = addTournament(newName.trim(), parseInt(newRounds) || 3, {
      semifinal: enableSemifinal,
      final: enableFinal,
    });
    setNewName("");
    setNewRounds("3");
    setEnableSemifinal(false);
    setEnableFinal(false);
    setDialogOpen(false);
    if (id) setLocation(`/tournament/${id}`);
  };

  const startRename = (id: string, current: string) => {
    setRenameId(id);
    setRenameValue(current);
  };

  const submitRename = () => {
    if (!renameId || !renameValue.trim()) return;
    updateTournamentInfo(renameId, { name: renameValue.trim() });
    setRenameId(null);
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: BRAND.surface }}
      dir="rtl"
    >
      <HomeHeader
        actions={
          <>
            <button
              onClick={() => setGroupDialogOpen(true)}
              className={`${BTN.base} ${BTN_SIZE.md} bg-white/10 border border-white/20
                          text-white hover:bg-white/20 backdrop-blur-sm`}
              data-testid="button-create-group"
            >
              <FolderPlus className="w-4 h-4" />
              <span className="hidden sm:inline">مجلد جديد</span>
            </button>
            <button
              onClick={() => setDialogOpen(true)}
              className={`${BTN.base} ${BTN.primary} ${BTN_SIZE.md} shadow-lg`}
              style={BTN_PRIMARY_STYLE}
              data-testid="button-create-tournament"
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              بطولة جديدة
            </button>
          </>
        }
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 md:px-6 py-5 md:py-7">
        {/* Folders */}
        {groups.length > 0 && (
          <section className="mb-7">
            <h2
              className="text-[15px] font-bold mb-3"
              style={{ color: BRAND.ink }}
            >
              المجلدات
            </h2>
            <FolderStrip
              groups={groups}
              countOf={(g) =>
                g.tournamentIds.filter((id) =>
                  tournaments.some((t) => t.id === id)
                ).length
              }
              onOpen={(id) => setLocation(`/group/${id}`)}
              onDelete={deleteGroup}
            />
          </section>
        )}

        {/* My tournaments */}
        <section>
          <div className="flex items-baseline gap-2 mb-3.5">
            <h2 className="text-xl font-bold" style={{ color: BRAND.ink }}>
              بطولاتي
            </h2>
            <span
              className="text-[13px] font-semibold"
              style={{ color: `${BRAND.ink}80` }}
              data-testid="text-tournament-count"
            >
              {visible.length} بطولة
            </span>
          </div>

          <div className="mb-5">
            <TournamentFilters
              query={query}
              onQueryChange={setQuery}
              filter={filter}
              onFilterChange={setFilter}
              counts={counts}
            />
          </div>

          {visible.length === 0 ? (
            <div
              className="rounded-2xl bg-white border py-14 px-6 flex flex-col items-center text-center gap-2"
              style={{ borderColor: BRAND.border }}
              data-testid="empty-state"
            >
              <span
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-1"
                style={{ backgroundColor: `${BRAND.purple}12` }}
              >
                {query || filter !== "all" ? (
                  <SearchX className="w-7 h-7" style={{ color: BRAND.purple }} />
                ) : (
                  <Trophy className="w-7 h-7" style={{ color: BRAND.purple }} />
                )}
              </span>
              <p className="font-bold text-[16px]" style={{ color: BRAND.ink }}>
                {query || filter !== "all"
                  ? "لا توجد نتائج مطابقة"
                  : "لا توجد بطولات بعد"}
              </p>
              <p className="text-[13px]" style={{ color: `${BRAND.ink}8c` }}>
                {query || filter !== "all"
                  ? "جرّب تغيير البحث أو الفلتر"
                  : "ابدأ بإنشاء بطولتك الأولى وأضف الفرق والقاعات والمحكمين"}
              </p>
              {!query && filter === "all" && (
                <button
                  onClick={() => setDialogOpen(true)}
                  className={`${BTN.base} ${BTN.primary} ${BTN_SIZE.lg} mt-3`}
                  style={BTN_PRIMARY_STYLE}
                  data-testid="button-create-first-tournament"
                >
                  <Plus className="w-4 h-4" strokeWidth={2.5} />
                  إنشاء بطولة جديدة
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {visible.map((t, i) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.04, 0.3) }}
                >
                  <TournamentCard
                    tournament={t}
                    onOpen={() => setLocation(`/tournament/${t.id}`)}
                    onRename={() => startRename(t.id, t.name)}
                    onDuplicate={() => duplicateTournament(t.id)}
                    onToggleArchive={() =>
                      setTournamentArchived(t.id, !t.archived)
                    }
                    onDelete={() => deleteTournament(t.id)}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Create tournament */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>إنشاء بطولة جديدة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">اسم البطولة</Label>
              <Input
                id="name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="مثال: بطولة المناظرات الأولى"
                data-testid="input-tournament-name"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rounds">عدد الجولات</Label>
              <Input
                id="rounds"
                type="number"
                min="1"
                value={newRounds}
                onChange={(e) => setNewRounds(e.target.value)}
                data-testid="input-tournament-rounds"
              />
            </div>
            <div
              className="border rounded-xl p-3 space-y-3"
              style={{ borderColor: BRAND.border }}
            >
              <div className="font-bold text-sm">جولات الإقصاء (اختياري)</div>
              <label className="flex items-center justify-between gap-3 cursor-pointer">
                <div className="flex-1">
                  <div className="text-sm font-semibold">تفعيل نصف النهائي</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    أفضل 4 فرق: 1×4 و 2×3 بعد إكمال جميع الجولات.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={enableSemifinal}
                  onChange={(e) => setEnableSemifinal(e.target.checked)}
                  className="w-5 h-5"
                  data-testid="toggle-semifinal"
                />
              </label>
              <label className="flex items-center justify-between gap-3 cursor-pointer">
                <div className="flex-1">
                  <div className="text-sm font-semibold">تفعيل النهائي</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    الفائزان من نصف النهائي، أو أفضل فريقين إن لم يُفعَّل نصف
                    النهائي.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={enableFinal}
                  onChange={(e) => setEnableFinal(e.target.checked)}
                  className="w-5 h-5"
                  data-testid="toggle-final"
                />
              </label>
            </div>
            <button
              onClick={handleCreate}
              disabled={!newName.trim()}
              className={`${BTN.base} ${BTN.primary} ${BTN_SIZE.lg} w-full`}
              style={BTN_PRIMARY_STYLE}
              data-testid="button-submit-tournament"
            >
              إنشاء البطولة
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create folder */}
      <Dialog open={groupDialogOpen} onOpenChange={setGroupDialogOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>إنشاء مجلد جديد</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>اسم المجلد</Label>
              <Input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="مثال: البطولة الوطنية 2025"
                data-testid="input-group-name"
              />
            </div>
            <div className="space-y-1.5">
              <Label>وصف اختياري</Label>
              <Input
                value={groupDesc}
                onChange={(e) => setGroupDesc(e.target.value)}
                placeholder="مثال: تصفيات + نصف نهائي + نهائي"
                data-testid="input-group-desc"
              />
            </div>
            <Button
              className="w-full text-white"
              disabled={!groupName.trim()}
              onClick={() => {
                if (!groupName.trim()) return;
                addGroup(groupName.trim(), groupDesc.trim() || undefined);
                setGroupName("");
                setGroupDesc("");
                setGroupDialogOpen(false);
              }}
              style={BTN_PRIMARY_STYLE}
              data-testid="button-submit-group"
            >
              إنشاء المجلد
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rename tournament */}
      <Dialog open={!!renameId} onOpenChange={(o) => !o && setRenameId(null)}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>تعديل اسم البطولة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <Input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitRename()}
              autoFocus
              data-testid="input-rename-tournament"
            />
            <button
              onClick={submitRename}
              disabled={!renameValue.trim()}
              className={`${BTN.base} ${BTN.primary} ${BTN_SIZE.lg} w-full`}
              style={BTN_PRIMARY_STYLE}
              data-testid="button-submit-rename"
            >
              حفظ
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
