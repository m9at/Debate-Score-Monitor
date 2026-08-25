import { useState } from "react";
import { Clock, FileEdit, PlayCircle, Trash2 } from "lucide-react";
import { WIZARD_STEPS } from "@/lib/wizard/types";
import type { TournamentDraftRow } from "@/lib/draftsApi";
import { BRAND, BTN, BTN_PRIMARY_STYLE } from "@/lib/brand";
import DeleteTournamentDialog from "./DeleteTournamentDialog";

interface Props {
  draft: TournamentDraftRow;
  onResume: () => void;
  onDelete: () => void;
}

const relative = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString("ar", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/** An unfinished creation wizard, resumable from the exact step it stopped at. */
export default function DraftCard({ draft, onResume, onDelete }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const total = WIZARD_STEPS.length;
  const reached = Math.min(draft.stepIndex + 1, total);
  const stepLabel = WIZARD_STEPS[Math.min(draft.stepIndex, total - 1)].label;

  return (
    <div
      className="rounded-2xl bg-white border shadow-sm p-5 flex flex-col gap-3"
      style={{ borderColor: BRAND.border }}
      data-testid={`card-draft-${draft.id}`}
    >
      <div className="flex items-start gap-2">
        <h3
          className="font-bold text-[18px] leading-snug truncate"
          style={{ color: BRAND.ink }}
          data-testid="text-draft-name"
        >
          {draft.name || "بطولة بدون اسم"}
        </h3>
        <span
          className="ms-auto shrink-0 inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg"
          style={{ backgroundColor: `${BRAND.gold}1f`, color: BRAND.ink }}
        >
          <FileEdit className="w-3 h-3" />
          مسودة
        </span>
      </div>

      <div className="space-y-1.5">
        <p className="text-[13px] font-bold" style={{ color: BRAND.ink }}>
          آخر تقدم: {stepLabel} — {reached}/{total} خطوات
        </p>
        <div
          className="h-2 rounded-full overflow-hidden"
          style={{ backgroundColor: `${BRAND.ink}0f` }}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: `${(reached / total) * 100}%`,
              backgroundColor: BRAND.gold,
            }}
          />
        </div>
        <p
          className="text-[11.5px] font-semibold flex items-center gap-1"
          style={{ color: `${BRAND.ink}8c` }}
        >
          <Clock className="w-3 h-3" />
          آخر تحديث: {relative(draft.updatedAt)}
        </p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onResume}
          className={`${BTN.base} ${BTN.primary} h-11 flex-1`}
          style={BTN_PRIMARY_STYLE}
          data-testid="button-resume-draft"
        >
          <PlayCircle className="w-4 h-4" />
          متابعة الإنشاء
        </button>
        <button
          onClick={() => setConfirmDelete(true)}
          className={`${BTN.base} ${BTN.danger} h-11 px-3`}
          aria-label="حذف المسودة"
          data-testid="button-delete-draft"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <DeleteTournamentDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        tournamentName={draft.name || "بطولة بدون اسم"}
        onConfirm={onDelete}
      />
    </div>
  );
}
