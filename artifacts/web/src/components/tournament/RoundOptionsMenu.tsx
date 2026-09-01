import { useState } from "react";
import {
  Dices,
  Lock,
  LockOpen,
  MoreVertical,
  PlayCircle,
  Projector,
  Trash2,
  Users,
} from "lucide-react";
import type { Round } from "@/types/tournament";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
import { BRAND } from "@/lib/brand";

interface RoundOptionsMenuProps {
  roundNumber: number;
  round: Round | undefined;
  isCurrent: boolean;
  isPresented: boolean;
  /** Rooms of this round that already have a recorded result. */
  completedCount: number;
  onSetCurrent: () => void;
  onSetPresented: () => void;
  onDraw: () => void;
  onAutoAssignJudges: () => void;
  onToggleLock: (locked: boolean) => void;
  onDelete: () => void;
}

/**
 * All actions of ONE round gathered behind a single ⋮ in the page toolbar, next
 * to the other icon buttons — so no round action is scattered across the tabs.
 */
export default function RoundOptionsMenu({
  roundNumber,
  round,
  isCurrent,
  isPresented,
  completedCount,
  onSetCurrent,
  onSetPresented,
  onDraw,
  onAutoAssignJudges,
  onToggleLock,
  onDelete,
}: RoundOptionsMenuProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const hasMatches = (round?.matches.length ?? 0) > 0;
  const locked = !!round?.locked;
  const canDelete = completedCount === 0 && !round?.completed;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            aria-label={`خيارات الجولة ${roundNumber}`}
            title={`خيارات الجولة ${roundNumber}`}
            className="w-10 h-10 rounded-xl border bg-white hover:bg-[#7B2D8E]/[0.06] flex items-center
                       justify-center shrink-0 transition-all active:scale-95"
            style={{ borderColor: BRAND.border, color: BRAND.ink }}
            data-testid="button-round-options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60 text-right">
          <DropdownMenuLabel className="text-right">
            خيارات الجولة {roundNumber}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem
            disabled={isCurrent}
            onSelect={onSetCurrent}
            className="gap-2"
            data-testid="option-round-set-current"
          >
            <PlayCircle className="w-4 h-4" />
            {isCurrent ? "هذه هي الجولة الحالية" : "تعيينها كالجولة الحالية"}
          </DropdownMenuItem>

          <DropdownMenuItem
            disabled={isPresented}
            onSelect={onSetPresented}
            className="gap-2"
            data-testid="option-round-set-presented"
          >
            <Projector className="w-4 h-4" />
            {isPresented ? "معروضة في وضع العرض" : "عرضها في وضع العرض"}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            disabled={hasMatches}
            onSelect={onDraw}
            className="gap-2"
            data-testid="option-round-draw"
          >
            <Dices className="w-4 h-4" />
            {hasMatches ? "القرعة أُجريت" : "إجراء القرعة"}
          </DropdownMenuItem>

          <DropdownMenuItem
            disabled={!hasMatches}
            onSelect={onAutoAssignJudges}
            className="gap-2"
            data-testid="option-round-auto-judges"
          >
            <Users className="w-4 h-4" />
            توزيع المحكمين تلقائياً
          </DropdownMenuItem>

          <DropdownMenuItem
            disabled={!hasMatches}
            onSelect={() => onToggleLock(!locked)}
            className="gap-2"
            data-testid="option-round-toggle-lock"
          >
            {locked ? <LockOpen className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            {locked ? "فتح إدخال النتائج" : "قفل إدخال النتائج"}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            disabled={!canDelete}
            onSelect={() => setConfirmDelete(true)}
            className="gap-2 text-destructive font-semibold"
            data-testid="option-round-delete"
          >
            <Trash2 className="w-4 h-4" />
            {canDelete ? `حذف الجولة ${roundNumber}` : "لا يمكن الحذف — سُجّلت نتائج"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف الجولة {roundNumber}</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف الجولة {roundNumber} ومبارياتها. هذا الإجراء لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={onDelete}
              data-testid="button-confirm-delete-round"
            >
              حذف الجولة
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
