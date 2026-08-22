import { useState } from "react";
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
  DialogTrigger,
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
  Plus,
  Trash2,
  Users,
  Layers,
  CheckCircle,
  Folder,
  FolderOpen,
  ChevronLeft,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CYAN = "#29ABE2";
const PURPLE = "#7B2D8E";

export default function Home() {
  const { tournaments, addTournament, deleteTournament } = useTournament();
  const { groups, addGroup, deleteGroup } = useGroups();
  const [, setLocation] = useLocation();
  const [newName, setNewName] = useState("");
  const [newRounds, setNewRounds] = useState("3");
  const [enableSemifinal, setEnableSemifinal] = useState(false);
  const [enableFinal, setEnableFinal] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Group creation state
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDesc, setGroupDesc] = useState("");

  const ungroupedTournaments = tournaments.filter(
    (t) => !groups.some((g) => g.tournamentIds.includes(t.id))
  );

  const logoSrc = `${import.meta.env.BASE_URL}logo-mark.png`;

  const handleCreate = () => {
    if (!newName.trim()) return;
    addTournament(newName.trim(), parseInt(newRounds) || 3, {
      semifinal: enableSemifinal,
      final: enableFinal,
    });
    setNewName("");
    setNewRounds("3");
    setEnableSemifinal(false);
    setEnableFinal(false);
    setDialogOpen(false);
  };

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return `${d.getFullYear()}/${(d.getMonth() + 1)
      .toString()
      .padStart(2, "0")}/${d.getDate().toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-x-hidden">
      {/* Hero Section */}
      <div className="relative pt-8 pb-7 overflow-hidden">
        {/* Split background: cyan covers left 65%, purple covers right 35% (matches mobile) */}
        <div
          className="absolute top-0 bottom-0 left-0"
          style={{ right: "35%", backgroundColor: CYAN }}
        />
        <div
          className="absolute top-0 bottom-0 right-0"
          style={{ left: "65%", backgroundColor: PURPLE }}
        />

        {/* Logo with concentric rings */}
        <div className="relative flex items-center justify-center mb-3.5">
          {/* Outermost glow backdrop */}
          <div
            className="absolute rounded-full"
            style={{
              width: 180,
              height: 180,
              backgroundColor: "rgba(41,171,226,0.21)",
            }}
          />
          {/* Inner glow backdrop (white) */}
          <div
            className="absolute rounded-full"
            style={{
              width: 160,
              height: 160,
              backgroundColor: "rgba(255,255,255,0.15)",
            }}
          />
          {/* Outer ring */}
          <div
            className="rounded-full flex items-center justify-center"
            style={{
              width: 140,
              height: 140,
              border: "3px solid rgba(255,255,255,0.25)",
            }}
          >
            {/* Middle ring */}
            <div
              className="rounded-full flex items-center justify-center"
              style={{
                width: 124,
                height: 124,
                border: "3px solid rgba(255,255,255,0.4)",
              }}
            >
              {/* Logo circle */}
              <div
                className="rounded-full overflow-hidden bg-white"
                style={{
                  width: 108,
                  height: 108,
                  border: "3px solid #fff",
                  boxShadow: "0 0 28px rgba(123,45,142,0.55)",
                }}
              >
                <img
                  src={logoSrc}
                  alt="مناظرات عُمان"
                  className="w-full h-full object-contain p-1.5"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Title + subtitle */}
        <div className="relative text-center">
          <h1
            className="text-white font-bold mb-1"
            style={{ fontSize: 26 }}
            data-testid="text-app-title"
          >
            مناظرات عُمان
          </h1>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 14 }}>
            نظام رصد الدرجات والتقييم
          </p>
        </div>

      </div>

      {/* Content Section (overlapping rounded top) */}
      <div
        className="flex-1 bg-background relative"
        style={{
          marginTop: -16,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          paddingTop: 20,
          paddingLeft: 16,
          paddingRight: 16,
          paddingBottom: 100,
        }}
      >
        <div className="max-w-2xl mx-auto w-full">

          {/* ── Groups section ── */}
          {groups.length > 0 && (
            <div className="mb-5">
              <div className="flex items-center justify-between mb-3 px-1">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <FolderOpen className="w-5 h-5" style={{ color: PURPLE }} />
                  المجلدات
                </h2>
                <div
                  className="px-2.5 py-1 rounded-lg"
                  style={{ backgroundColor: `${PURPLE}26` }}
                >
                  <span className="font-bold" style={{ color: PURPLE, fontSize: 13 }}>
                    {groups.length}
                  </span>
                </div>
              </div>
              <AnimatePresence mode="popLayout">
                <div className="flex flex-col gap-2.5">
                  {groups.map((g, i) => {
                    const gTournaments = g.tournamentIds
                      .map((id) => tournaments.find((t) => t.id === id))
                      .filter(Boolean);
                    const finishedCount = gTournaments.filter((t) => t?.finished).length;
                    return (
                      <motion.div
                        key={g.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: i * 0.04 }}
                        className="bg-card rounded-2xl overflow-hidden shadow-md cursor-pointer hover:shadow-lg transition-shadow"
                        style={{
                          borderRight: `4px solid ${PURPLE}`,
                          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                        }}
                        onClick={() => setLocation(`/group/${g.id}`)}
                        data-testid={`card-group-${g.id}`}
                      >
                        <div className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                style={{ background: `linear-gradient(135deg, ${PURPLE}, ${CYAN})` }}
                              >
                                <FolderOpen className="w-5 h-5 text-white" />
                              </div>
                              <div className="min-w-0">
                                <h3 className="font-bold truncate" style={{ fontSize: 16 }}>
                                  {g.name}
                                </h3>
                                {g.description && (
                                  <p className="text-muted-foreground text-xs mt-0.5 truncate">
                                    {g.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            <ChevronLeft className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-2" />
                          </div>
                          <div className="flex items-center gap-4 mt-3">
                            <div className="flex items-center gap-1.5">
                              <Layers className="w-3.5 h-3.5" style={{ color: PURPLE }} />
                              <span className="text-muted-foreground" style={{ fontSize: 12 }}>
                                {gTournaments.length} بطولة
                              </span>
                            </div>
                            {finishedCount > 0 && (
                              <div className="flex items-center gap-1.5">
                                <CheckCircle className="w-3.5 h-3.5" style={{ color: "#34C759" }} />
                                <span className="text-muted-foreground" style={{ fontSize: 12 }}>
                                  {finishedCount} منتهية
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="px-4 pb-3" onClick={(e) => e.stopPropagation()}>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <button
                                className="flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] hover:opacity-80 transition-opacity"
                                style={{ backgroundColor: "rgba(239,68,68,0.07)" }}
                              >
                                <Trash2 className="w-3.5 h-3.5 text-destructive" />
                                <span className="font-semibold text-destructive" style={{ fontSize: 12 }}>
                                  حذف المجلد
                                </span>
                              </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent dir="rtl">
                              <AlertDialogHeader>
                                <AlertDialogTitle>حذف المجلد</AlertDialogTitle>
                                <AlertDialogDescription>
                                  سيُحذف المجلد فقط. البطولات ستبقى كبطولات مستقلة.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive hover:bg-destructive/90"
                                  onClick={() => deleteGroup(g.id)}
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
            </div>
          )}

          {/* Section header */}
          <div className="flex items-center justify-between mb-3.5 px-1">
            <h2 className="text-lg font-bold text-foreground">
              {groups.length > 0 ? "بطولات مستقلة" : "البطولات المحفوظة"}
            </h2>
            <div
              className="px-2.5 py-1 rounded-lg"
              style={{ backgroundColor: `${CYAN}26` }}
            >
              <span
                className="font-bold"
                style={{ color: CYAN, fontSize: 13 }}
                data-testid="text-tournament-count"
              >
                {tournaments.length}
              </span>
            </div>
          </div>

          {/* Tournament list or empty state */}
          {ungroupedTournaments.length === 0 && groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center pt-12 gap-2">
              <Folder className="w-12 h-12 text-border" strokeWidth={1.5} />
              <p className="text-muted-foreground font-semibold" style={{ fontSize: 17 }}>
                لا توجد بطولات محفوظة
              </p>
              <p className="text-muted-foreground" style={{ fontSize: 13 }}>
                أنشئ بطولة جديدة للبدء
              </p>
            </div>
          ) : ungroupedTournaments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <Folder className="w-10 h-10 text-border" strokeWidth={1.5} />
              <p className="text-muted-foreground text-sm">
                جميع البطولات موجودة في مجلدات
              </p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="flex flex-col gap-3">
                {ungroupedTournaments.map((t, i) => {
                  const completedMatches = t.rounds.reduce(
                    (sum: number, r: any) =>
                      sum + r.matches.filter((m: any) => m.completed).length,
                    0
                  );
                  const totalMatches = t.rounds.reduce(
                    (sum: number, r: any) => sum + r.matches.length,
                    0
                  );
                  const accent = t.finished ? PURPLE : CYAN;

                  return (
                    <motion.div
                      key={t.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: i * 0.05 }}
                      className="bg-card rounded-2xl overflow-hidden shadow-md cursor-pointer hover:shadow-lg transition-shadow"
                      style={{
                        borderRight: `4px solid ${accent}`,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                      }}
                      onClick={() => setLocation(`/tournament/${t.id}`)}
                      data-testid={`card-tournament-${t.id}`}
                    >
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-foreground truncate" style={{ fontSize: 17 }}>
                              {t.name}
                            </h3>
                            <p className="text-muted-foreground mt-0.5" style={{ fontSize: 12 }}>
                              {formatDate(t.createdAt)}
                            </p>
                          </div>
                          <div
                            className="px-2.5 py-1 rounded-lg ml-2.5"
                            style={{ backgroundColor: `${accent}26` }}
                          >
                            <span
                              className="font-semibold"
                              style={{ color: accent, fontSize: 11 }}
                            >
                              {t.finished ? "منتهية" : "جارية"}
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
                            <CheckCircle
                              className="w-3.5 h-3.5"
                              style={{ color: "#34C759" }}
                            />
                            <span className="text-muted-foreground" style={{ fontSize: 12 }}>
                              {completedMatches}/{totalMatches}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="px-4 pb-3">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button
                              className="flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] transition-opacity hover:opacity-80"
                              style={{ backgroundColor: "rgba(239, 68, 68, 0.07)" }}
                              onClick={(e) => e.stopPropagation()}
                              data-testid={`button-delete-tournament-${t.id}`}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                              <span
                                className="font-semibold text-destructive"
                                style={{ fontSize: 13 }}
                              >
                                حذف
                              </span>
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent onClick={(e) => e.stopPropagation()} dir="rtl">
                            <AlertDialogHeader>
                              <AlertDialogTitle>حذف البطولة</AlertDialogTitle>
                              <AlertDialogDescription>
                                هل تريد حذف "{t.name}"؟ لا يمكن التراجع.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>إلغاء</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={(e) => {
                                  e.stopPropagation();
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
      </div>

      {/* Floating bottom buttons (FAB) */}
      <div
        className="fixed left-4 right-4 z-20 max-w-2xl mx-auto flex gap-2"
        style={{ bottom: 20 }}
      >
        {/* Create Group button */}
        <Dialog open={groupDialogOpen} onOpenChange={setGroupDialogOpen}>
          <DialogTrigger asChild>
            <button
              className="flex items-center justify-center gap-2 transition-opacity hover:opacity-90 active:opacity-80"
              style={{
                height: 56,
                width: 56,
                backgroundColor: CYAN,
                borderRadius: 16,
                boxShadow: "0 4px 14px rgba(41,171,226,0.4)",
                flexShrink: 0,
              }}
              data-testid="button-create-group"
              title="مجلد جديد"
            >
              <FolderOpen className="w-5 h-5 text-white" strokeWidth={2.5} />
            </button>
          </DialogTrigger>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle>إنشاء مجلد جديد</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label>اسم المجلد</Label>
                <Input
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="مثال: البطولة الوطنية 2025"
                  data-testid="input-group-name"
                />
              </div>
              <div>
                <Label>وصف اختياري</Label>
                <Input
                  value={groupDesc}
                  onChange={(e) => setGroupDesc(e.target.value)}
                  placeholder="مثال: تصفيات + نصف نهائي + نهائي"
                />
              </div>
              <Button
                className="w-full font-bold"
                disabled={!groupName.trim()}
                onClick={() => {
                  if (!groupName.trim()) return;
                  addGroup(groupName.trim(), groupDesc.trim() || undefined);
                  setGroupName("");
                  setGroupDesc("");
                  setGroupDialogOpen(false);
                }}
                style={{ background: `linear-gradient(135deg, ${CYAN}, ${PURPLE})` }}
                data-testid="button-submit-group"
              >
                إنشاء المجلد
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <button
              className="flex-1 flex items-center justify-center gap-2.5 transition-opacity hover:opacity-90 active:opacity-80"
              style={{
                height: 56,
                backgroundColor: PURPLE,
                borderRadius: 16,
                boxShadow: "0 4px 14px rgba(123,94,167,0.4)",
              }}
              data-testid="button-create-tournament"
            >
              <Plus className="w-5 h-5 text-white" strokeWidth={2.5} />
              <span className="text-white font-bold" style={{ fontSize: 17 }}>
                بطولة جديدة
              </span>
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إنشاء بطولة جديدة</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="name">اسم البطولة</Label>
                <Input
                  id="name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="مثال: بطولة المناظرات الأولى"
                  data-testid="input-tournament-name"
                />
              </div>
              <div>
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
              <div className="border rounded-lg p-3 space-y-3">
                <div className="font-medium text-sm">جولات الإقصاء (اختياري)</div>
                <label className="flex items-center justify-between gap-3 cursor-pointer">
                  <div className="flex-1">
                    <div className="text-sm">تفعيل نصف النهائي</div>
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
                    <div className="text-sm">تفعيل النهائي</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      الفائزان من نصف النهائي، أو أفضل فريقين إن لم يُفعَّل نصف النهائي.
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
              <Button
                className="w-full"
                onClick={handleCreate}
                disabled={!newName.trim()}
                data-testid="button-submit-tournament"
                style={{ backgroundColor: PURPLE }}
              >
                إنشاء
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
