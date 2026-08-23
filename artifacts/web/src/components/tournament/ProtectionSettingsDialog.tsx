import { useEffect, useState } from "react";
import { Eye, Lock, Pencil, ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { TournamentProtection } from "@/types/tournament";
import { BRAND, BTN, BTN_PRIMARY_STYLE } from "@/lib/brand";

const MIN_PIN = 4;
const MAX_PIN = 6;

interface ProtectionSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: TournamentProtection | undefined;
  onSave: (p: TournamentProtection) => void;
}

const EMPTY: TournamentProtection = {
  enabled: false,
  code: "",
  protectView: true,
  protectEdit: true,
};

/** A labelled switch row with a short explanation underneath. */
function ToggleRow({
  icon: Icon,
  title,
  hint,
  checked,
  disabled,
  onChange,
  testId,
}: {
  icon: typeof Eye;
  title: string;
  hint: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
  testId: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="w-full text-right rounded-xl border p-3 flex items-start gap-3 transition-all
                 disabled:opacity-50 hover:bg-[#7B2D8E]/[0.03]"
      style={{
        borderColor: checked ? `${BRAND.purple}59` : BRAND.border,
        backgroundColor: checked ? `${BRAND.purple}0a` : undefined,
      }}
      data-testid={testId}
    >
      <span
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{
          backgroundColor: checked ? `${BRAND.purple}1f` : `${BRAND.ink}0f`,
          color: checked ? BRAND.purple : `${BRAND.ink}80`,
        }}
      >
        <Icon className="w-4 h-4" />
      </span>

      <span className="flex-1 min-w-0">
        <span className="block text-[13px] font-bold" style={{ color: BRAND.ink }}>
          {title}
        </span>
        <span className="block text-[11px] mt-0.5 leading-relaxed" style={{ color: `${BRAND.ink}99` }}>
          {hint}
        </span>
      </span>

      <span
        className="w-10 h-6 rounded-full shrink-0 transition-colors relative"
        style={{ backgroundColor: checked ? BRAND.purple : `${BRAND.ink}26` }}
      >
        <span
          className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
          style={{ right: checked ? 2 : 18 }}
        />
      </span>
    </button>
  );
}

export default function ProtectionSettingsDialog({
  open,
  onOpenChange,
  value,
  onSave,
}: ProtectionSettingsDialogProps) {
  const [draft, setDraft] = useState<TournamentProtection>(value ?? EMPTY);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setDraft(value ?? EMPTY);
    setError("");
  }, [open, value]);

  const submit = () => {
    if (draft.enabled) {
      if (draft.code.length < MIN_PIN || draft.code.length > MAX_PIN) {
        setError(`الرمز يجب أن يكون من ${MIN_PIN} إلى ${MAX_PIN} أرقام`);
        return;
      }
      if (!draft.protectView && !draft.protectEdit) {
        setError("اختر ما تريد حمايته على الأقل: المشاهدة أو التعديل");
        return;
      }
    }
    onSave(draft.enabled ? draft : { ...draft, code: "" });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-right">
            <ShieldCheck className="w-5 h-5" style={{ color: BRAND.purple }} />
            حماية البطولة
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <ToggleRow
            icon={Lock}
            title="تفعيل حماية البطولة"
            hint="عند التفعيل يُطلب رمز الدخول قبل الوصول إلى هذه البطولة على هذا الجهاز."
            checked={draft.enabled}
            onChange={(v) => {
              setDraft((d) => ({ ...d, enabled: v }));
              setError("");
            }}
            testId="toggle-protection-enabled"
          />

          {draft.enabled && (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
              {/* Code */}
              <div
                className="rounded-xl border p-3"
                style={{ borderColor: BRAND.border }}
              >
                <div className="text-[13px] font-bold mb-1" style={{ color: BRAND.ink }}>
                  رمز الدخول
                </div>
                <p className="text-[11px] mb-2.5" style={{ color: `${BRAND.ink}99` }}>
                  أرقام فقط، من {MIN_PIN} إلى {MAX_PIN} أرقام.
                </p>
                <input
                  value={draft.code}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "").slice(0, MAX_PIN);
                    setDraft((d) => ({ ...d, code: digits }));
                    setError("");
                  }}
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder={"•".repeat(MIN_PIN)}
                  dir="ltr"
                  className="w-full h-12 rounded-xl border text-center text-2xl font-bold tracking-[0.5em]
                             outline-none focus:border-[#7B2D8E]/50 transition-colors bg-[#F7F8FC]"
                  style={{ borderColor: BRAND.border, color: BRAND.ink }}
                  data-testid="input-protection-code"
                />
              </div>

              <ToggleRow
                icon={Eye}
                title="حماية المشاهدة"
                hint="لا يمكن عرض الجولات والنتائج قبل إدخال الرمز."
                checked={draft.protectView}
                onChange={(v) => {
                  setDraft((d) => ({ ...d, protectView: v }));
                  setError("");
                }}
                testId="toggle-protect-view"
              />

              <ToggleRow
                icon={Pencil}
                title="حماية التعديل"
                hint="لا يمكن تعديل الجولات والدرجات والإعدادات قبل إدخال الرمز."
                checked={draft.protectEdit}
                onChange={(v) => {
                  setDraft((d) => ({ ...d, protectEdit: v }));
                  setError("");
                }}
                testId="toggle-protect-edit"
              />
            </div>
          )}

          {error && (
            <p
              className="text-xs font-semibold text-center"
              style={{ color: BRAND.danger }}
              data-testid="text-protection-error"
            >
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={submit}
              className={`${BTN.base} ${BTN.primary} flex-1 h-10`}
              style={BTN_PRIMARY_STYLE}
              data-testid="button-save-protection"
            >
              حفظ الإعدادات
            </button>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className={`${BTN.base} ${BTN.secondary} h-10`}
              data-testid="button-cancel-protection"
            >
              إلغاء
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
