import { useState } from "react";
import { MoreVertical } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BRAND } from "@/lib/brand";

export interface MenuAction {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  /** Destructive actions ask for confirmation first and sit last, separated. */
  danger?: { title: string; description: string };
}

/** Three-dot menu; destructive items open a confirmation dialog instead of acting at once. */
export function ActionsMenu({ actions }: { actions: MenuAction[] }) {
  const [pending, setPending] = useState<MenuAction | null>(null);
  const safe = actions.filter((a) => !a.danger);
  const risky = actions.filter((a) => a.danger);
  return (
    <>
      <DropdownMenu dir="rtl">
        <DropdownMenuTrigger asChild>
          <button onClick={(e) => e.stopPropagation()} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-black/5"
            style={{ color: `${BRAND.ink}99` }} aria-label="خيارات">
            <MoreVertical className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          {safe.map((a) => (
            <DropdownMenuItem key={a.label} onClick={a.onClick} className="gap-2">{a.icon}{a.label}</DropdownMenuItem>
          ))}
          {risky.length > 0 && safe.length > 0 && <DropdownMenuSeparator />}
          {risky.map((a) => (
            <DropdownMenuItem key={a.label} onClick={() => setPending(a)} className="gap-2 text-red-600 focus:text-red-600">
              {a.icon}{a.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmDialog
        open={!!pending}
        title={pending?.danger?.title ?? ""}
        description={pending?.danger?.description ?? ""}
        onCancel={() => setPending(null)}
        onConfirm={() => { pending?.onClick(); setPending(null); }}
      />
    </>
  );
}

export function ConfirmDialog({ open, title, description, onConfirm, onCancel }: {
  open: boolean; title: string; description: string; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
      <AlertDialogContent dir="rtl" onClick={(e) => e.stopPropagation()}>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-right">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-right">{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel>إلغاء</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-red-600 hover:bg-red-700">تأكيد الحذف</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** Section title row used at the top of every tab. */
export function SectionHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-[20px] font-extrabold" style={{ color: BRAND.ink }}>{title}</h2>
        {subtitle && <p className="text-[12.5px]" style={{ color: `${BRAND.ink}80` }}>{subtitle}</p>}
      </div>
      <div className="flex flex-wrap gap-2 [&_button]:whitespace-nowrap">{children}</div>
    </div>
  );
}
