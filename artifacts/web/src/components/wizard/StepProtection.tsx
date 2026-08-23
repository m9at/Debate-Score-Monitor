import { AlertCircle, Check, Lock, ShieldCheck } from "lucide-react";
import { BRAND } from "@/lib/brand";
import type { TournamentSetup } from "@/lib/wizard/types";
import { Field, Panel, Toggle, inputClass, inputStyle } from "./ui";

const MIN_PIN = 4;
const MAX_PIN = 6;

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
  // One field, digits only, any length from 4 to 6.
  const validLength = length >= MIN_PIN && length <= MAX_PIN;
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
        <Panel title="رمز دخول البطولة" hint="أرقام فقط، من 4 إلى 6 أرقام">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="رمز دخول البطولة" required>
                <input
                  type="password"
                  inputMode="numeric"
                  autoComplete="new-password"
                  value={code}
                  onChange={(e) =>
                    patch({
                      protection: {
                        enabled: true,
                        code: digitsOnly(e.target.value, MAX_PIN),
                      },
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
                  onChange={(e) => onConfirmCodeChange(digitsOnly(e.target.value, MAX_PIN))}
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
                  يجب أن يكون الرمز من {MIN_PIN} إلى {MAX_PIN} أرقام
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
