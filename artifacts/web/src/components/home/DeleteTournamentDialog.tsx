import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BRAND, BTN } from "@/lib/brand";
import { inputClass, inputStyle } from "@/components/wizard/ui";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournamentName: string;
  onConfirm: () => void;
}

/**
 * Deleting a tournament is irreversible, so it asks the organiser to type the
 * tournament's name — an accidental click can never destroy a tournament.
 */
export default function DeleteTournamentDialog({
  open,
  onOpenChange,
  tournamentName,
  onConfirm,
}: Props) {
  const [typed, setTyped] = useState("");

  useEffect(() => {
    if (open) setTyped("");
  }, [open]);

  const matches = typed.trim() === tournamentName.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            حذف البطولة؟
          </DialogTitle>
          <DialogDescription>
            سيتم حذف البطولة وجميع بياناتها المرتبطة بها (الجولات، النتائج،
            الفرق، المحكمون). لا يمكن التراجع عن هذا الإجراء.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <label
            className="block text-[12.5px] font-bold"
            style={{ color: BRAND.ink }}
          >
            اكتب اسم البطولة للتأكيد:
          </label>
          <p
            className="text-[13px] font-bold px-3 py-2 rounded-lg select-all"
            style={{ backgroundColor: BRAND.surface, color: BRAND.ink }}
          >
            {tournamentName}
          </p>
          <input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder="اسم البطولة"
            className={`${inputClass} w-full`}
            style={inputStyle}
            autoFocus
            data-testid="input-confirm-delete-name"
          />
        </div>

        <DialogFooter className="gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className={`${BTN.base} ${BTN.secondary} px-4`}
            data-testid="button-cancel-delete-tournament"
          >
            إلغاء
          </button>
          <button
            type="button"
            disabled={!matches}
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
            className={`${BTN.base} ${BTN.danger} px-4`}
            data-testid="button-confirm-delete-tournament"
          >
            حذف نهائي
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
