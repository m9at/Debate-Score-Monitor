import { FolderOpen, Trash2 } from "lucide-react";
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
import type { TournamentGroup } from "@/types/tournament";
import { BRAND, BRAND_GRADIENT } from "@/lib/brand";

interface FolderStripProps {
  groups: TournamentGroup[];
  /** Tournament count per folder id. */
  countOf: (group: TournamentGroup) => number;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}

/** Compact folders row — keeps grouping visible without eating vertical space. */
export default function FolderStrip({
  groups,
  countOf,
  onOpen,
  onDelete,
}: FolderStripProps) {
  if (groups.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
      {groups.map((g) => (
        <div
          key={g.id}
          onClick={() => onOpen(g.id)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && onOpen(g.id)}
          className="group rounded-2xl bg-white border shadow-sm p-3.5 flex items-center gap-3
                     cursor-pointer transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
          style={{ borderColor: BRAND.border }}
          data-testid={`card-group-${g.id}`}
        >
          <span
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundImage: BRAND_GRADIENT }}
          >
            <FolderOpen className="w-5 h-5 text-white" />
          </span>

          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-[15px] truncate" style={{ color: BRAND.ink }}>
              {g.name}
            </h3>
            <p className="text-[11px] font-semibold" style={{ color: `${BRAND.ink}8c` }}>
              {countOf(g)} بطولة
            </p>
          </div>

          <div onClick={(e) => e.stopPropagation()}>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  className="w-8 h-8 rounded-lg flex items-center justify-center opacity-0
                             group-hover:opacity-100 focus:opacity-100 transition-all
                             text-destructive hover:bg-destructive/10"
                  aria-label="حذف المجلد"
                  data-testid={`button-delete-group-${g.id}`}
                >
                  <Trash2 className="w-4 h-4" />
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
                    onClick={() => onDelete(g.id)}
                  >
                    حذف
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      ))}
    </div>
  );
}
