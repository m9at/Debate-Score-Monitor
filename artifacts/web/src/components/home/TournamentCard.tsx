import { useState } from "react";
import {
  Archive,
  ArchiveRestore,
  FolderInput,
  Gavel,
  LayoutGrid,
  Lock,
  LogIn,
  Pencil,
  Trash2,
  Users,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Tournament } from "@/types/tournament";
import { BRAND, BRAND_GRADIENT, BTN, BTN_PRIMARY_STYLE } from "@/lib/brand";
import { getTournamentCounts, getTournamentStatus } from "@/lib/tournamentStatus";
import { getRoundProgress } from "@/lib/roundProgress";
import StatusBadge from "./StatusBadge";

interface TournamentCardProps {
  tournament: Tournament;
  /** Folder the tournament currently sits in, if any. */
  folderName?: string;
  onOpen: () => void;
  onRename: () => void;
  onMoveToFolder: () => void;
  onToggleArchive: () => void;
  onDelete: () => void;
}

/** One metric inside the card's stats strip. */
function Stat({
  icon: Icon,
  value,
  label,
  color,
}: {
  icon: typeof Users;
  value: string | number;
  label: string;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5 flex-1 min-w-0">
      <Icon className="w-4 h-4 mb-0.5" style={{ color }} />
      <span
        className="font-bold text-[17px] leading-none"
        style={{ color: BRAND.ink }}
      >
        {value}
      </span>
      <span
        className="text-[11px] font-semibold"
        style={{ color: `${BRAND.ink}8c` }}
      >
        {label}
      </span>
    </div>
  );
}

/** Small written action — every important command stays visible, never in a ⋮ menu. */
function CardAction({
  icon: Icon,
  label,
  onClick,
  tone = "normal",
  testId,
}: {
  icon: typeof Users;
  label: string;
  onClick: () => void;
  tone?: "normal" | "danger";
  testId: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`${BTN.base} ${
        tone === "danger" ? BTN.danger : BTN.secondary
      } flex-1 min-w-[7.5rem] px-2.5`}
      data-testid={testId}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

export default function TournamentCard({
  tournament,
  folderName,
  onOpen,
  onRename,
  onMoveToFolder,
  onToggleArchive,
  onDelete,
}: TournamentCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const status = getTournamentStatus(tournament);
  const c = getTournamentCounts(tournament);
  const isProtected = !!tournament.protection?.enabled;
  const progress = c.totalRounds ? (c.currentRound / c.totalRounds) * 100 : 0;
  const round = getRoundProgress(tournament);

  return (
    <div
      className="group relative rounded-2xl bg-white border shadow-sm flex flex-col
                 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
      style={{ borderColor: BRAND.border }}
      data-testid={`card-tournament-${tournament.id}`}
    >
      {/* brand accent edge */}
      <span
        aria-hidden
        className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
        style={{ backgroundImage: BRAND_GRADIENT }}
      />

      <div className="p-5 pt-6 flex-1">
        {/* Title row */}
        <div className="mb-3">
          <div className="flex items-center gap-1.5 mb-2">
            <h3
              className="font-bold text-[19px] leading-snug truncate"
              style={{ color: BRAND.ink }}
              data-testid="text-tournament-card-name"
            >
              {tournament.name}
            </h3>
            {isProtected && (
              <Lock
                className="w-4 h-4 shrink-0"
                style={{ color: BRAND.purple }}
                aria-label="بطولة محمية"
                data-testid="icon-protected"
              />
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={status} />
            {folderName && (
              <span
                className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg"
                style={{
                  backgroundColor: `${BRAND.blue}14`,
                  color: BRAND.blueDeep,
                }}
                data-testid="badge-card-folder"
              >
                <FolderInput className="w-3 h-3" />
                {folderName}
              </span>
            )}
          </div>
        </div>

        {/* Current round — stated plainly, plus how the round is going */}
        <div className="mb-3.5">
          <div className="flex items-center justify-between mb-1.5 gap-2">
            <span
              className="text-[13px] font-bold"
              style={{ color: BRAND.ink }}
              data-testid="text-card-current-round"
            >
              {c.currentRound > 0
                ? `الجولة ${c.currentRound} من ${c.totalRounds}`
                : "لم تبدأ الجولات"}
            </span>
            <span
              className="text-[11px] font-bold px-2 py-0.5 rounded-lg shrink-0"
              style={{ backgroundColor: `${round.color}1a`, color: round.color }}
              data-testid="badge-card-round-state"
            >
              {round.label}
            </span>
          </div>
          <div
            className="h-2 rounded-full overflow-hidden"
            style={{ backgroundColor: `${BRAND.ink}0f` }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, progress)}%`,
                backgroundImage: BRAND_GRADIENT,
              }}
            />
          </div>
        </div>

        {/* Stats strip */}
        <div
          className="flex items-stretch rounded-xl py-3 divide-x divide-x-reverse"
          style={{ backgroundColor: BRAND.surface, borderColor: BRAND.border }}
        >
          <Stat icon={Users} value={c.teams} label="الفِرق" color={BRAND.blue} />
          <Stat
            icon={LayoutGrid}
            value={c.rooms}
            label="القاعات"
            color={BRAND.purple}
          />
          <Stat
            icon={Gavel}
            value={c.judges}
            label="المحكمون"
            color={BRAND.gold}
          />
        </div>
      </div>

      {/* Actions — all written out, nothing hidden behind an icon menu */}
      <div className="px-5 pb-5 space-y-2">
        <button
          onClick={onOpen}
          className={`${BTN.base} ${BTN.primary} h-11 w-full text-[14px]`}
          style={BTN_PRIMARY_STYLE}
          data-testid="button-open-tournament"
        >
          <LogIn className="w-4 h-4" />
          دخول البطولة
        </button>
        <div className="flex flex-wrap gap-2">
          <CardAction
            icon={Pencil}
            label="تعديل البطولة"
            onClick={onRename}
            testId="button-card-edit"
          />
          <CardAction
            icon={FolderInput}
            label="نقل إلى مجلد"
            onClick={onMoveToFolder}
            testId="button-card-move"
          />
          <CardAction
            icon={tournament.archived ? ArchiveRestore : Archive}
            label={tournament.archived ? "استعادة" : "أرشفة"}
            onClick={onToggleArchive}
            testId="button-card-archive"
          />
          <CardAction
            icon={Trash2}
            label="حذف"
            tone="danger"
            onClick={() => setConfirmDelete(true)}
            testId="button-card-delete"
          />
        </div>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف البطولة</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف «{tournament.name}» وجميع جولاتها ونتائجها نهائياً. لا يمكن
              التراجع عن هذه العملية.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={onDelete}
              data-testid="button-confirm-delete-tournament"
            >
              حذف نهائي
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
