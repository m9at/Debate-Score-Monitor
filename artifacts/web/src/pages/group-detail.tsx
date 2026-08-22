import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { useGroups } from "@/context/GroupContext";
import { useTournament } from "@/context/TournamentContext";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowRight,
  Plus,
  Trash2,
  Users,
  Layers,
  CheckCircle,
  FolderOpen,
  LinkIcon,
  Pencil,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Tournament } from "@/types/tournament";

const CYAN = "#4ECDC4";
const PURPLE = "#7B5EA7";

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function GroupDetail() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const {
    groups,
    getGroup,
    renameGroup,
    deleteGroup,
    addTournamentToGroup,
    removeTournamentFromGroup,
  } = useGroups();
  const { tournaments, addTournament, deleteTournament } = useTournament();

  const group = getGroup(params.id);

  // New tournament dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRounds, setNewRounds] = useState("3");
  const [enableSemifinal, setEnableSemifinal] = useState(false);
  const [enableFinal, setEnableFinal] = useState(false);

  // Rename group dialog
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameVal, setRenameVal] = useState("");
  const [descVal, setDescVal] = useState("");

  // Add existing tournament dialog
  const [addOpen, setAddOpen] = useState(false);

  if (!group) {
    return (
      <div
        dir="rtl"
        className="min-h-[100dvh] flex items-center justify-center p-6 text-center"
      >
        <div>
          <div className="text-lg font-bold mb-2">المجلد غير موجود</div>
          <button
            onClick={() => setLocation("/")}
            className="text-sm font-semibold mt-2"
            style={{ color: CYAN }}
          >
            العودة للرئيسية
          </button>
        </div>
      </div>
    );
  }

  const groupTournaments = group.tournamentIds
    .map((id) => tournaments.find((t) => t.id === id))
    .filter((t): t is Tournament => !!t);

  const ungroupedTournaments = tournaments.filter(
    (t) =>
      !groups.some((g) => g.tournamentIds.includes(t.id))
  );

  const handleCreate = () => {
    if (!newName.trim()) return;
    const newId = addTournament(newName.trim(), parseInt(newRounds) || 3, {
      semifinal: enableSemifinal,
      final: enableFinal,
    });
    addTournamentToGroup(group.id, newId);
    setNewName("");
    setNewRounds("3");
    setEnableSemifinal(false);
    setEnableFinal(false);
    setCreateOpen(false);
  };

  const handleRename = () => {
    if (!renameVal.trim()) return;
    renameGroup(group.id, renameVal.trim(), descVal.trim() || undefined);
    setRenameOpen(false);
  };

  const openRename = () => {
    setRenameVal(group.name);
    setDescVal(group.description ?? "");
    setRenameOpen(true);
  };

  const handleDeleteGroup = () => {
    deleteGroup(group.id);
    setLocation("/");
  };

  return (
    <div dir="rtl" className="min-h-[100dvh] bg-background pb-16">
      {/* Header */}
      <div
        className="px-4 pt-8 pb-6"
        style={{
          background: `linear-gradient(135deg, ${PURPLE}18 0%, ${CYAN}12 100%)`,
          borderBottom: `2px solid ${PURPLE}22`,
        }}
      >
        <div className="max-w-lg mx-auto">
          <button
            onClick={() => setLocation("/")}
            className="flex items-center gap-1.5 text-sm font-semibold mb-4"
            style={{ color: PURPLE }}
          >
            <ArrowRight className="w-4 h-4" />
            الرئيسية
          </button>

          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow"
                style={{
                  background: `linear-gradient(135deg, ${PURPLE}, ${CYAN})`,
                }}
              >
                <FolderOpen className="w-6 h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-extrabold truncate">{group.name}</h1>
                {group.description && (
                  <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                    {group.description}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {groupTournaments.length} بطولة · أُنشئ {formatDate(group.createdAt)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0 mt-1">
              <button
                onClick={openRename}
                className="p-2 rounded-xl hover:bg-background/60"
                style={{ color: PURPLE }}
                title="تعديل المجلد"
              >
                <Pencil className="w-4.5 h-4.5" />
              </button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    className="p-2 rounded-xl hover:bg-red-50"
                    style={{ color: "#EF4444" }}
                    title="حذف المجلد"
                  >
                    <Trash2 className="w-4.5 h-4.5" />
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent dir="rtl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>حذف المجلد</AlertDialogTitle>
                    <AlertDialogDescription>
                      هل تريد حذف مجلد "{group.name}"؟ البطولات بداخله لن تُحذف،
                      ستظهر مجدداً كبطولات مستقلة في الصفحة الرئيسية.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteGroup}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      حذف المجلد
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 pt-6 space-y-4">
        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setCreateOpen(true)}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm text-white shadow"
            style={{ background: `linear-gradient(135deg, ${CYAN}, ${PURPLE})` }}
            data-testid="button-create-tournament-in-group"
          >
            <Plus className="w-4 h-4" />
            بطولة جديدة
          </button>
          <button
            onClick={() => setAddOpen(true)}
            disabled={ungroupedTournaments.length === 0}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm disabled:opacity-40 border-2"
            style={{ borderColor: PURPLE, color: PURPLE }}
            data-testid="button-add-existing-tournament"
          >
            <LinkIcon className="w-4 h-4" />
            إضافة بطولة موجودة
          </button>
        </div>

        {/* Tournament list */}
        {groupTournaments.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-12 gap-2">
            <FolderOpen className="w-12 h-12 text-border" strokeWidth={1.5} />
            <p className="text-muted-foreground font-semibold" style={{ fontSize: 17 }}>
              لا توجد بطولات في هذا المجلد
            </p>
            <p className="text-muted-foreground text-sm">
              أضف بطولة جديدة أو انقل بطولة موجودة
            </p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="flex flex-col gap-3">
              {groupTournaments.map((t, i) => {
                const completedMatches = t.rounds.reduce(
                  (sum: number, r) => sum + r.matches.filter((m) => m.completed).length,
                  0
                );
                const totalMatches = t.rounds.reduce(
                  (sum: number, r) => sum + r.matches.length,
                  0
                );
                const accent = t.finished ? PURPLE : CYAN;
                return (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.04 }}
                    className="bg-card rounded-2xl overflow-hidden shadow-md cursor-pointer hover:shadow-lg transition-shadow"
                    style={{
                      borderRight: `4px solid ${accent}`,
                    }}
                    onClick={() => setLocation(`/tournament/${t.id}`)}
                    data-testid={`card-tournament-${t.id}`}
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold truncate" style={{ fontSize: 17 }}>
                            {t.name}
                          </h3>
                          <p className="text-muted-foreground mt-0.5" style={{ fontSize: 12 }}>
                            {formatDate(t.createdAt)}
                          </p>
                        </div>
                        <div
                          className="px-2.5 py-1 rounded-lg ms-2.5"
                          style={{ backgroundColor: `${accent}26` }}
                        >
                          <span className="font-semibold" style={{ color: accent, fontSize: 11 }}>
                            {t.finished ? "منتهية" : t.started ? "جارية" : "لم تبدأ"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5" style={{ color: CYAN }} />
                          <span className="text-muted-foreground" style={{ fontSize: 12 }}>
                            {t.teams.length} فريق
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5" style={{ color: PURPLE }} />
                          <span className="text-muted-foreground" style={{ fontSize: 12 }}>
                            {t.currentRound ?? t.rounds.length}
                            {t.totalRounds > 0 ? `/${t.totalRounds}` : ""} جولة
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5" style={{ color: "#34C759" }} />
                          <span className="text-muted-foreground" style={{ fontSize: 12 }}>
                            {completedMatches}/{totalMatches}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Remove from group / delete */}
                    <div className="px-4 pb-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeTournamentFromGroup(group.id, t.id);
                        }}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] hover:opacity-80 transition-opacity"
                        style={{ backgroundColor: `${PURPLE}14`, color: PURPLE, fontSize: 12 }}
                        data-testid={`button-remove-from-group-${t.id}`}
                      >
                        <X className="w-3.5 h-3.5" />
                        إزالة من المجلد
                      </button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] hover:opacity-80 transition-opacity"
                            style={{
                              backgroundColor: "rgba(239,68,68,0.07)",
                              fontSize: 12,
                            }}
                            data-testid={`button-delete-tournament-${t.id}`}
                          >
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                            <span className="font-semibold text-destructive">حذف</span>
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent dir="rtl">
                          <AlertDialogHeader>
                            <AlertDialogTitle>حذف البطولة</AlertDialogTitle>
                            <AlertDialogDescription>
                              سيتم حذف بطولة "{t.name}" نهائياً مع جميع بياناتها.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive hover:bg-destructive/90"
                              onClick={() => {
                                deleteTournament(t.id);
                              }}
                            >
                              حذف
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </AnimatePresence>
        )}
      </div>

      {/* Create tournament dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent dir="rtl" className="max-w-sm">
          <DialogHeader>
            <DialogTitle>بطولة جديدة في "{group.name}"</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>اسم البطولة</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="مثال: تصفيات المنطقة الشمالية"
                data-testid="input-group-tournament-name"
              />
            </div>
            <div className="space-y-1.5">
              <Label>عدد الجولات</Label>
              <Input
                type="number"
                min={1}
                max={20}
                value={newRounds}
                onChange={(e) => setNewRounds(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="grp-semifinal"
                checked={enableSemifinal}
                onChange={(e) => setEnableSemifinal(e.target.checked)}
              />
              <Label htmlFor="grp-semifinal">نصف نهائي</Label>
              <input
                type="checkbox"
                id="grp-final"
                checked={enableFinal}
                onChange={(e) => setEnableFinal(e.target.checked)}
              />
              <Label htmlFor="grp-final">نهائي</Label>
            </div>
            <Button
              onClick={handleCreate}
              className="w-full font-bold"
              style={{ background: `linear-gradient(135deg, ${CYAN}, ${PURPLE})` }}
              data-testid="button-confirm-create-group-tournament"
            >
              إنشاء البطولة
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rename group dialog */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent dir="rtl" className="max-w-sm">
          <DialogHeader>
            <DialogTitle>تعديل المجلد</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>اسم المجلد</Label>
              <Input
                value={renameVal}
                onChange={(e) => setRenameVal(e.target.value)}
                placeholder="اسم المجلد"
              />
            </div>
            <div className="space-y-1.5">
              <Label>وصف اختياري</Label>
              <Input
                value={descVal}
                onChange={(e) => setDescVal(e.target.value)}
                placeholder="مثال: مراحل البطولة الوطنية"
              />
            </div>
            <Button onClick={handleRename} className="w-full font-bold" style={{ background: `linear-gradient(135deg, ${CYAN}, ${PURPLE})` }}>
              حفظ
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add existing tournament dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent dir="rtl" className="max-w-sm">
          <DialogHeader>
            <DialogTitle>إضافة بطولة موجودة</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 pt-2 max-h-80 overflow-y-auto">
            {ungroupedTournaments.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-4">
                لا توجد بطولات مستقلة لإضافتها
              </p>
            ) : (
              ungroupedTournaments.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    addTournamentToGroup(group.id, t.id);
                    setAddOpen(false);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/60 transition-colors text-start"
                  data-testid={`button-add-to-group-${t.id}`}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center"
                    style={{ backgroundColor: CYAN + "22" }}
                  >
                    <Layers className="w-4 h-4" style={{ color: CYAN }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm truncate">{t.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {t.teams.length} فريق · {formatDate(t.createdAt)}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
