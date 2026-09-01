import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useTournament } from "@/context/TournamentContext";
import ShareLinkDialog from "@/components/tournament/ShareLinkDialog";
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
import {
  Archive,
  ChevronDown,
  Eye,
  FolderPlus,
  Plus,
  Search,
  SearchX,
  Trophy,
} from "lucide-react";
import { motion } from "framer-motion";
import HomeHeader from "@/components/home/HomeHeader";
import TournamentCard from "@/components/home/TournamentCard";
import FolderStrip from "@/components/home/FolderStrip";
import MoveToFolderDialog from "@/components/home/MoveToFolderDialog";
import DraftCard from "@/components/home/DraftCard";
import {
  deleteDraft,
  fetchDrafts,
  type TournamentDraftRow,
} from "@/lib/draftsApi";
import { BRAND, BTN, BTN_PRIMARY_STYLE, BTN_SIZE } from "@/lib/brand";

export default function Home() {
  const {
    tournaments,
    deleteTournament,
    setTournamentArchived,
    updateTournamentInfo,
  } = useTournament();
  const {
    groups,
    addGroup,
    deleteGroup,
    groupOfTournament,
    moveTournamentToGroup,
  } = useGroups();
  const [, setLocation] = useLocation();

  // Create-folder dialog
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  /** Shows the shareable وضع الجمهور link of the whole platform. */
  const [publicLinkOpen, setPublicLinkOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDesc, setGroupDesc] = useState("");
  const [groupIsArchive, setGroupIsArchive] = useState(false);

  // Rename dialog
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  // Move-to-folder dialog
  const [moveId, setMoveId] = useState<string | null>(null);

  // Unfinished creation wizards, kept online so they survive refreshes/devices.
  const [drafts, setDrafts] = useState<TournamentDraftRow[]>([]);
  useEffect(() => {
    fetchDrafts()
      .then(setDrafts)
      .catch(() => {});
  }, []);

  const removeDraft = (id: string) => {
    setDrafts((d) => d.filter((x) => x.id !== id));
    deleteDraft(id).catch(() => {});
  };

  const [query, setQuery] = useState("");
  const [archiveOpen, setArchiveOpen] = useState(false);

  /** Tournaments that sit in no folder — the working list. */
  const ungrouped = useMemo(
    () =>
      tournaments.filter(
        (t) => !groups.some((g) => g.tournamentIds.includes(t.id))
      ),
    [tournaments, groups]
  );

  const matchesQuery = (name: string) => {
    const q = query.trim().toLowerCase();
    return !q || name.toLowerCase().includes(q);
  };

  const current = useMemo(
    () =>
      ungrouped
        .filter((t) => !t.archived)
        .filter((t) => matchesQuery(t.name))
        .sort((a, b) => b.createdAt - a.createdAt),
    [ungrouped, query]
  );

  const archived = useMemo(
    () =>
      ungrouped
        .filter((t) => t.archived)
        .filter((t) => matchesQuery(t.name))
        .sort((a, b) => b.createdAt - a.createdAt),
    [ungrouped, query]
  );

  const startRename = (id: string, currentName: string) => {
    setRenameId(id);
    setRenameValue(currentName);
  };

  const submitRename = () => {
    if (!renameId || !renameValue.trim()) return;
    updateTournamentInfo(renameId, { name: renameValue.trim() });
    setRenameId(null);
  };

  const moveTarget = tournaments.find((t) => t.id === moveId) ?? null;

  const renderCard = (t: (typeof tournaments)[number], i: number) => (
    <motion.div
      key={t.id}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(i * 0.04, 0.3) }}
    >
      <TournamentCard
        tournament={t}
        folderName={groupOfTournament(t.id)?.name}
        onOpen={() => setLocation(`/tournament/${t.id}`)}
        onRename={() => startRename(t.id, t.name)}
        onMoveToFolder={() => setMoveId(t.id)}
        onToggleArchive={() => setTournamentArchived(t.id, !t.archived)}
        onSettings={() => setLocation(`/tournament/${t.id}?tab=settings`)}
        onDelete={() => deleteTournament(t.id)}
      />
    </motion.div>
  );

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
              onClick={() => setPublicLinkOpen(true)}
              className={`${BTN.base} ${BTN.secondary} ${BTN_SIZE.md}`}
              data-testid="button-public-mode-link"
            >
              <Eye className="w-4 h-4" strokeWidth={2.5} />
              رابط وضع الجمهور
            </button>
            <button
              onClick={() => setGroupDialogOpen(true)}
              className={`${BTN.base} ${BTN.primary} ${BTN_SIZE.md} shadow-lg`}
              style={BTN_PRIMARY_STYLE}
              data-testid="button-create-group"
            >
              <FolderPlus className="w-4 h-4" strokeWidth={2.5} />
              مجلد جديد
            </button>
            <button
              onClick={() => setLocation("/tournament/new")}
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

      <ShareLinkDialog
        open={publicLinkOpen}
        onOpenChange={setPublicLinkOpen}
        title="رابط وضع الجمهور"
        description="رابط المنصة للجمهور: مشاهدة فقط للبطولات التي سُمح للجمهور بمتابعتها، مع الجولات والقضايا والفرق ونتائج الجولات المعلنة."
        url={`${window.location.origin}${import.meta.env.BASE_URL.replace(/\/$/, "")}/public`}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 py-5 md:py-7">
        {/* Current tournaments */}
        <section>
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <div className="flex items-baseline gap-2">
              <h2 className="text-2xl font-bold" style={{ color: BRAND.ink }}>
                البطولات الحالية
              </h2>
              <span
                className="text-[13px] font-semibold"
                style={{ color: `${BRAND.ink}80` }}
                data-testid="text-tournament-count"
              >
                {current.length} بطولة
              </span>
            </div>
            <div className="relative w-full sm:w-72">
              <Search
                className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: `${BRAND.ink}66` }}
              />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ابحث عن بطولة…"
                className="pr-9 h-10 bg-white"
                data-testid="input-search-tournaments"
              />
            </div>
          </div>

          {current.length === 0 ? (
            <div
              className="rounded-2xl bg-white border py-14 px-6 flex flex-col items-center text-center gap-2"
              style={{ borderColor: BRAND.border }}
              data-testid="empty-state"
            >
              <span
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-1"
                style={{ backgroundColor: `${BRAND.purple}12` }}
              >
                {query ? (
                  <SearchX
                    className="w-7 h-7"
                    style={{ color: BRAND.purple }}
                  />
                ) : (
                  <Trophy className="w-7 h-7" style={{ color: BRAND.purple }} />
                )}
              </span>
              <p className="font-bold text-[16px]" style={{ color: BRAND.ink }}>
                {query ? "لا توجد نتائج مطابقة" : "لا توجد بطولات حالية"}
              </p>
              <p className="text-[13px]" style={{ color: `${BRAND.ink}8c` }}>
                {query
                  ? "جرّب تغيير كلمة البحث"
                  : "ابدأ بإنشاء بطولتك الأولى وأضف الفرق والقاعات والمحكمين"}
              </p>
              {!query && (
                <button
                  onClick={() => setLocation("/tournament/new")}
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
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {current.map(renderCard)}
            </div>
          )}
        </section>

        {/* Folders */}
        {groups.length > 0 && (
          <section className="mt-9">
            <h2
              className="text-xl font-bold mb-3.5"
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

        {/* Unfinished drafts — resume where the wizard stopped */}
        {drafts.length > 0 && (
          <section className="mt-9">
            <div className="flex items-baseline gap-2 mb-4">
              <h2 className="text-2xl font-bold" style={{ color: BRAND.ink }}>
                مسودات لم تكتمل
              </h2>
              <span
                className="text-[13px] font-semibold"
                style={{ color: `${BRAND.ink}80` }}
                data-testid="text-draft-count"
              >
                {drafts.length} مسودة
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {drafts.map((d) => (
                <DraftCard
                  key={d.id}
                  draft={d}
                  onResume={() => setLocation(`/tournament/new?draft=${d.id}`)}
                  onDelete={() => removeDraft(d.id)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Archive */}
        {archived.length > 0 && (
          <section className="mt-9">
            <button
              onClick={() => setArchiveOpen((v) => !v)}
              className="flex items-center gap-2 mb-3.5"
              data-testid="button-toggle-archive"
            >
              <Archive className="w-5 h-5" style={{ color: BRAND.warning }} />
              <h2 className="text-xl font-bold" style={{ color: BRAND.ink }}>
                الأرشيف
              </h2>
              <span
                className="text-[13px] font-semibold"
                style={{ color: `${BRAND.ink}80` }}
              >
                {archived.length} بطولة
              </span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  archiveOpen ? "rotate-180" : ""
                }`}
                style={{ color: `${BRAND.ink}80` }}
              />
            </button>
            {archiveOpen && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {archived.map(renderCard)}
              </div>
            )}
          </section>
        )}
      </main>

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
                placeholder="مثال: بطولات المدارس"
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
            <label
              className="flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer"
              style={{ borderColor: BRAND.border }}
            >
              <input
                type="checkbox"
                checked={groupIsArchive}
                onChange={(e) => setGroupIsArchive(e.target.checked)}
                className="w-4 h-4 accent-[#7B2D8E]"
                data-testid="checkbox-group-archive"
              />
              <span
                className="text-[13px] font-semibold"
                style={{ color: BRAND.ink }}
              >
                هذا مجلد أرشيف
              </span>
            </label>
            <Button
              className="w-full text-white"
              disabled={!groupName.trim()}
              onClick={() => {
                if (!groupName.trim()) return;
                addGroup(
                  groupName.trim(),
                  groupDesc.trim() || undefined,
                  groupIsArchive ? "archive" : "normal"
                );
                setGroupName("");
                setGroupDesc("");
                setGroupIsArchive(false);
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

      {/* Move to folder */}
      {moveTarget && (
        <MoveToFolderDialog
          open={!!moveId}
          onOpenChange={(o) => !o && setMoveId(null)}
          tournamentName={moveTarget.name}
          currentGroupId={groupOfTournament(moveTarget.id)?.id ?? null}
          groups={groups}
          onMove={(groupId) => moveTournamentToGroup(moveTarget.id, groupId)}
          onCreateFolder={(name) => addGroup(name)}
        />
      )}

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
