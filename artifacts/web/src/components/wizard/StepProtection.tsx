import { AlertCircle, Check, Lock, ShieldCheck } from "lucide-react";
import { BRAND } from "@/lib/brand";
import type { TournamentSetup } from "@/lib/wizard/types";
import { Field, Panel, Toggle, inputClass, inputStyle } from "./ui";

interface StepProtectionProps {
  setup: TournamentSetup;
  patch: (p: Partial<TournamentSetup>) => void;
  confirmCode: string;
  onConfirmCodeChange: (v: string) => void;
}

/** Step 2 — optional PIN protection, chosen at creation time. */
export default function StepProtection({
  setup,
  patch,
  confirmCode,
  onConfirmCodeChange,
}: StepProtectionProps) {
  const { enabled, code } = setup.protection;
  const length = code.length;
  const validLength = length === 4 || length === 6;
  const matches = code === confirmCode && confirmCode.length > 0;

  const digitsOnly = (v: string, max: number) =>
    v.replace(/\D/g, "").slice(0, max);

  return (
    <div className="space-y-4">
      <Panel>
        <Toggle
          checked={enabled}
          onChange={(v) => {
            patch({ protection: { enabled: v, code: v ? code : "" } });
            if (!v) onConfirmCodeChange("");
          }}
          label="حماية البطولة برمز دخول"
          description="يُطلب الرمز قبل تعديل الجولات والدرجات والإعدادات"
          testId="toggle-protection"
        />
      </Panel>

      {enabled && (
        <Panel title="رمز الدخول (PIN)" hint="اختر رمزاً من 4 أو 6 أرقام">
          <div className="space-y-4">
            {/* length choice */}
            <div className="flex gap-2">
              {[4, 6].map((len) => {
                const active = length > 0 && length <= len && (len === 4 ? length <= 4 : true);
                return (
                  <button
                    key={len}
                    type="button"
                    onClick={() => {
                      patch({
                        protection: { enabled: true, code: code.slice(0, len) },
                      });
                      onConfirmCodeChange("");
                    }}
                    className="flex-1 h-10 rounded-xl border text-[13px] font-bold transition-colors"
                    style={{
                      borderColor: BRAND.border,
                      color: BRAND.ink,
                      backgroundColor: active ? `${BRAND.purple}0f` : "#fff",
                    }}
                    data-testid={`button-pin-length-${len}`}
                  >
                    {len} أرقام
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="الرمز" required>
                <input
                  type="password"
                  inputMode="numeric"
                  autoComplete="new-password"
                  value={code}
                  onChange={(e) =>
                    patch({
                      protection: { enabled: true, code: digitsOnly(e.target.value, 6) },
                    })
                  }
                  placeholder="••••"
                  className={`${inputClass} tracking-[0.4em] text-center`}
                  style={inputStyle}
                  data-testid="input-pin"
                />
              </Field>
              <Field label="تأكيد الرمز" required>
                <input
                  type="password"
                  inputMode="numeric"
                  autoComplete="new-password"
                  value={confirmCode}
                  onChange={(e) => onConfirmCodeChange(digitsOnly(e.target.value, 6))}
                  placeholder="••••"
                  className={`${inputClass} tracking-[0.4em] text-center`}
                  style={inputStyle}
                  data-testid="input-pin-confirm"
                />
              </Field>
            </div>

            {/* validation feedback */}
            <div className="space-y-1.5">
              {!validLength && length > 0 && (
                <p
                  className="flex items-center gap-1.5 text-[12px] font-semibold"
                  style={{ color: BRAND.warning }}
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  يجب أن يكون الرمز 4 أو 6 أرقام
                </p>
              )}
              {validLength && !matches && confirmCode.length > 0 && (
                <p
                  className="flex items-center gap-1.5 text-[12px] font-semibold"
                  style={{ color: BRAND.danger }}
                  data-testid="text-pin-mismatch"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  الرمزان غير متطابقين
                </p>
              )}
              {validLength && matches && (
                <p
                  className="flex items-center gap-1.5 text-[12px] font-semibold"
                  style={{ color: BRAND.success }}
                  data-testid="text-pin-ok"
                >
                  <Check className="w-3.5 h-3.5" />
                  الرمز جاهز
                </p>
              )}
            </div>

            <div
              className="flex items-start gap-2.5 rounded-xl p-3"
              style={{ backgroundColor: `${BRAND.blue}0f` }}
            >
              <ShieldCheck
                className="w-4 h-4 mt-px shrink-0"
                style={{ color: BRAND.blueDeep }}
              />
              <p className="text-[11.5px] leading-relaxed" style={{ color: BRAND.ink }}>
                لا يُعرض الرمز أبداً في صفحات الجمهور أو شاشة إعلان النتائج، ويمكن
                تغييره لاحقاً من إعدادات البطولة. ستظهر أيقونة <Lock className="w-3 h-3 inline mx-0.5" />
                بجانب اسم البطولة للدلالة على أنها محمية.
              </p>
            </div>
          </div>
        </Panel>
      )}
    </div>
  );
}
