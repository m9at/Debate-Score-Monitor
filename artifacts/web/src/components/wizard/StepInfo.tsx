import { ImagePlus, X } from "lucide-react";
import { BRAND } from "@/lib/brand";
import type { TournamentSetup } from "@/lib/wizard/types";
import { Field, Panel, inputClass, inputStyle } from "./ui";

interface StepInfoProps {
  setup: TournamentSetup;
  patch: (p: Partial<TournamentSetup>) => void;
}

const toDateInput = (ts?: number) =>
  ts ? new Date(ts).toISOString().slice(0, 10) : "";

/** Step 1 — name, logo, schedule, rounds, expected teams, description. */
export default function StepInfo({ setup, patch }: StepInfoProps) {
  const pickLogo = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => patch({ logoDataUrl: String(reader.result) });
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      <Panel>
        <div className="space-y-4">
          <Field label="اسم البطولة" required>
            <input
              value={setup.name}
              onChange={(e) => patch({ name: e.target.value })}
              placeholder="مثال: بطولة مناظرات عُمان الوطنية 2026"
              className={inputClass}
              style={inputStyle}
              autoFocus
              data-testid="input-wizard-name"
            />
          </Field>

          <Field label="شعار البطولة" hint="اختياري — يظهر بجانب شعار مناظرات عُمان">
            {setup.logoDataUrl ? (
              <div className="flex items-center gap-3">
                <img
                  src={setup.logoDataUrl}
                  alt="شعار البطولة"
                  className="w-14 h-14 rounded-xl object-contain border"
                  style={{ borderColor: BRAND.border }}
                />
                <button
                  type="button"
                  onClick={() => patch({ logoDataUrl: undefined })}
                  className="inline-flex items-center gap-1.5 text-[12px] font-bold text-destructive
                             hover:underline"
                  data-testid="button-remove-logo"
                >
                  <X className="w-3.5 h-3.5" />
                  إزالة الشعار
                </button>
              </div>
            ) : (
              <label
                className="flex items-center justify-center gap-2 h-16 rounded-xl border border-dashed
                           cursor-pointer transition-colors hover:bg-[#7B2D8E]/[0.03]"
                style={{ borderColor: `${BRAND.purple}4d` }}
                data-testid="input-wizard-logo"
              >
                <ImagePlus className="w-4.5 h-4.5" style={{ color: BRAND.purple }} />
                <span className="text-[12.5px] font-bold" style={{ color: BRAND.purple }}>
                  اختر صورة الشعار
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => pickLogo(e.target.files?.[0])}
                />
              </label>
            )}
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="تاريخ البداية">
              <input
                type="date"
                value={toDateInput(setup.startDate)}
                onChange={(e) =>
                  patch({
                    startDate: e.target.value
                      ? new Date(e.target.value).getTime()
                      : undefined,
                  })
                }
                className={inputClass}
                style={inputStyle}
                data-testid="input-wizard-start-date"
              />
            </Field>
            <Field label="تاريخ النهاية">
              <input
                type="date"
                value={toDateInput(setup.endDate)}
                onChange={(e) =>
                  patch({
                    endDate: e.target.value
                      ? new Date(e.target.value).getTime()
                      : undefined,
                  })
                }
                className={inputClass}
                style={inputStyle}
                data-testid="input-wizard-end-date"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="عدد الجولات" required>
              <input
                type="number"
                min={1}
                max={20}
                value={setup.totalRounds}
                onChange={(e) =>
                  patch({ totalRounds: Math.max(1, Number(e.target.value) || 1) })
                }
                className={inputClass}
                style={inputStyle}
                data-testid="input-wizard-rounds"
              />
            </Field>
            <Field label="عدد الفرق المتوقع" hint="تقديري فقط — تضيف الفرق في خطوة لاحقة">
              <input
                type="number"
                min={2}
                value={setup.expectedTeams}
                onChange={(e) =>
                  patch({ expectedTeams: Math.max(2, Number(e.target.value) || 2) })
                }
                className={inputClass}
                style={inputStyle}
                data-testid="input-wizard-expected-teams"
              />
            </Field>
          </div>

          <Field label="وصف مختصر" hint="اختياري">
            <textarea
              value={setup.description ?? ""}
              onChange={(e) => patch({ description: e.target.value })}
              rows={3}
              placeholder="نبذة عن البطولة، الجهة المنظمة، أو ملاحظات عامة"
              className="w-full rounded-xl bg-white border p-3 text-[14px] font-medium outline-none
                         transition-colors focus:border-[#7B2D8E]/45 resize-none
                         placeholder:font-normal placeholder:text-[#2B1B45]/35"
              style={inputStyle}
              data-testid="input-wizard-description"
            />
          </Field>
        </div>
      </Panel>
    </div>
  );
}
