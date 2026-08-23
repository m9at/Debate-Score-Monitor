import { Check, History, Pencil } from "lucide-react";

const PURPLE = "#7B2D8E";

/**
 * A recognised profile joining another tournament: greet, confirm, and allow
 * editing the fields the system lets them change — never a second profile.
 */
export default function ReturningProfileCard({
  name,
  photoUrl,
  tournamentName,
  roleLabel,
  previousCount,
  submitting,
  onConfirm,
  onEdit,
}: {
  name: string;
  photoUrl?: string | null;
  tournamentName: string;
  roleLabel: string;
  previousCount: number;
  submitting: boolean;
  onConfirm: () => void;
  onEdit: () => void;
}) {
  return (
    <div
      className="bg-card rounded-2xl p-5 text-center space-y-4"
      data-testid="returning-profile"
    >
      {photoUrl ? (
        <img
          src={photoUrl}
          alt={name}
          className="w-20 h-20 rounded-full object-cover mx-auto"
        />
      ) : (
        <div
          className="w-20 h-20 rounded-full mx-auto flex items-center justify-center text-2xl font-bold text-white"
          style={{ backgroundColor: PURPLE }}
        >
          {name.trim().charAt(0)}
        </div>
      )}

      <div>
        <h2 className="font-bold text-lg leading-relaxed">
          مرحباً {name}، هل تريد الانضمام إلى {tournamentName} {roleLabel}؟
        </h2>
        <p className="text-muted-foreground text-sm mt-1.5">
          لديك ملف مسجّل بالفعل — لا حاجة لإعادة إدخال بياناتك.
        </p>
      </div>

      {previousCount > 0 && (
        <p className="inline-flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-xl bg-muted">
          <History className="w-4 h-4" />
          شاركت سابقاً في {previousCount} بطولة
        </p>
      )}

      <button
        type="button"
        onClick={onConfirm}
        disabled={submitting}
        className="w-full h-14 rounded-2xl text-white font-bold flex items-center justify-center gap-2 disabled:opacity-60"
        style={{ backgroundColor: PURPLE }}
        data-testid="button-confirm-participation"
      >
        <Check className="w-5 h-5" />
        {submitting ? "جارٍ التأكيد..." : "تأكيد المشاركة"}
      </button>

      <button
        type="button"
        onClick={onEdit}
        className="w-full h-11 rounded-xl border font-bold text-sm inline-flex items-center justify-center gap-2"
        data-testid="button-edit-profile"
      >
        <Pencil className="w-4 h-4" />
        تعديل بياناتي أولاً
      </button>
    </div>
  );
}
