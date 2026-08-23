import { useState } from "react";
import {
  Archive,
  ArchiveRestore,
  Copy,
  Gavel,
  LayoutGrid,
  Lock,
  LogIn,
  MoreVertical,
  Pencil,
  Trash2,
  Users,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { BRAND, BRAND_GRADIENT, BTN, BTN_PRIMARY_STYLE, BTN_SIZE } from "@/lib/brand";
import { getTournamentCounts, getTournamentStatus } from "@/lib/tournamentStatus";
import StatusBadge from "./StatusBadge";

interface TournamentCardProps {
  tournament: Tournament;
  onOpen: () => void;
  onRename: () => void;
  onDuplicate: () => void;
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
      <span className="font-bold text-[15px] leading-none" style={{ color: BRAND.ink }}>
        {value}
      </span>
      <span className="text-[10px] font-semibold" style={{ color: `${BRAND.ink}8c` }}>
        {label}
      </span>
    </div>
  );
}

export default function TournamentCard({
  tournament,
  onOpen,
  onRename,
  onDuplicate,
  onToggleArchive,
  onDelete,
}: TournamentCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const status = getTournamentStatus(tournament);
  const c = getTournamentCounts(tournament);
  const isProtected = !!tournament.protection?.enabled;
  const progress = c.totalRounds ? (c.currentRound / c.totalRounds) * 100 : 0;

  return (
    <div
      className="group relative rounded-2xl bg-white border shadow-sm flex flex-col
                 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
      style={{ borderColor: BRAND.border }}
      data-testid={`card-tournament-${tournament.id}`}
    >
      {/* brand accent edge */}
      <span
        aria-hidden
        className="absolute top-4 bottom-4 right-0 w-[3px] rounded-full"
        style={{ backgroundImage: BRAND_GRADIENT }}
      />

      <div className="p-4 pr-5 flex-1">
        {/* Title row */}
        <div className="flex items-start gap-2 mb-2.5">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1.5">
              <h3
                className="font-bold text-[17px] leading-snug truncate"
                style={{ color: BRAND.ink }}
                data-testid="text-tournament-card-name"
              >
                {tournament.name}
              </h3>
              {isProtected && (
                <Lock
                  className="w-3.5 h-3.5 shrink-0"
                  style={{ color: BRAND.purple }}
                  aria-label="بطولة محمية"
                  data-testid="icon-protected"
                />
              )}
            </div>
            <StatusBadge status={status} />
          </div>

          {/* Overflow menu — destructive actions stay tucked away */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0
                           text-[#2B1B45]/45 hover:bg-[#2B1B45]/[0.06] hover:text-[#2B1B45]
                           transition-colors"
                aria-label="خيارات البطولة"
                data-testid="button-tournament-menu"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={onRename} data-testid="menu-rename">
                <Pencil className="w-4 h-4 ml-2" style={{ color: BRAND.blue }} />
                تعديل
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDuplicate} data-testid="menu-duplicate">
                <Copy className="w-4 h-4 ml-2" style={{ color: BRAND.purple }} />
                نسخ البطولة
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onToggleArchive} data-testid="menu-archive">
                {tournament.archived ? (
                  <>
                    <ArchiveRestore className="w-4 h-4 ml-2" style={{ color: BRAND.success }} />
                    استعادة
                  </>
                ) : (
                  <>
                    <Archive className="w-4 h-4 ml-2" style={{ color: BRAND.warning }} />
                    أرشفة
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setConfirmDelete(true)}
                className="text-destructive focus:text-destructive"
                data-testid="menu-delete"
              >
                <Trash2 className="w-4 h-4 ml-2" />
                حذف
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Round progress */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold" style={{ color: `${BRAND.ink}99` }}>
              الجولة
            </span>
            <span className="text-[11px] font-bold" style={{ color: BRAND.purple }}>
              {c.currentRound} من {c.totalRounds}
            </span>
          </div>
          <div
            className="h-1.5 rounded-full overflow-hidden"
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
          className="flex items-stretch rounded-xl py-2.5 divide-x divide-x-reverse"
          style={{ backgroundColor: BRAND.surface, borderColor: BRAND.border }}
        >
          <Stat icon={Users} value={c.teams} label="الفِرق" color={BRAND.blue} />
          <Stat icon={LayoutGrid} value={c.rooms} label="القاعات" color={BRAND.purple} />
          <Stat icon={Gavel} value={c.judges} label="المحكمون" color={BRAND.gold} />
        </div>
      </div>

      {/* Primary action */}
      <div className="px-4 pb-4 pr-5">
        <button
          onClick={onOpen}
          className={`${BTN.base} ${BTN.primary} ${BTN_SIZE.lg} w-full`}
          style={BTN_PRIMARY_STYLE}
          data-testid="button-open-tournament"
        >
          <LogIn className="w-4 h-4" />
          دخول البطولة
        </button>
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
