import { Info } from "lucide-react";
import { BRAND } from "@/lib/brand";
import type { TournamentSetup } from "@/lib/wizard/types";
import { Field, Panel, Toggle, inputClass, inputStyle } from "./ui";

interface StepSystemProps {
  setup: TournamentSetup;
  patch: (p: Partial<TournamentSetup>) => void;
}

/** Step 6 — format rules: rounds, reply speech, sides, score range. */
export default function StepSystem({ setup, patch }: StepSystemProps) {
  const s = setup.settings;
  const setSettings = (p: Partial<typeof s>) =>
    patch({ settings: { ...s, ...p } });

  return (
    <div className="space-y-4">
      <Panel title="الجولات والقاعات">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="عدد الجولات">
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
              data-testid="input-system-rounds"
            />
          </Field>
          <Field label="عدد القاعات المستخدمة" hint="من خطوة القاعات">
            <input
              value={setup.rooms.length}
              readOnly
              className={`${inputClass} bg-[#F7F8FC] cursor-not-allowed`}
              style={inputStyle}
              data-testid="input-system-rooms"
            />
          </Field>
          <Field label="عدد المحكمين لكل قاعة">
            <input
              type="number"
              min={1}
              max={9}
              value={s.judgesPerRoom}
              onChange={(e) =>
                setSettings({ judgesPerRoom: Math.max(1, Number(e.target.value) || 1) })
              }
              className={inputClass}
              style={inputStyle}
              data-testid="input-system-judges-per-room"
            />
          </Field>
        </div>
      </Panel>

      <Panel title="نظام المناظرة">
        <div className="space-y-3">
          <Toggle
            checked={s.replySpeech}
            onChange={(v) => setSettings({ replySpeech: v })}
            label="خطاب الرد"
            description="عند التفعيل يُسمح للمتحدث الأول أو الثاني فقط بأداء خطاب الرد"
            testId="toggle-reply-speech"
          />
          <Toggle
            checked={s.sides}
            onChange={(v) => setSettings({ sides: v })}
            label="فريق موالاة وفريق معارضة"
            description="توزيع الأدوار على الفريقين في كل قاعة"
            testId="toggle-sides"
          />
          <Toggle
            checked={s.showScoresOnAnnounce}
            onChange={(v) => setSettings({ showScoresOnAnnounce: v })}
            label="إظهار الدرجات في شاشة إعلان النتائج"
            description="افتراضياً مُعطّل — شاشة الإعلان تُعرض أمام الجمهور"
            testId="toggle-show-scores"
          />
        </div>
      </Panel>

      <Panel title="نطاق الدرجات">
        <div className="grid grid-cols-2 gap-4">
          <Field label="الحد الأدنى">
            <input
              type="number"
              value={s.scoreMin}
              onChange={(e) => setSettings({ scoreMin: Number(e.target.value) || 0 })}
              className={inputClass}
              style={inputStyle}
              data-testid="input-score-min"
            />
          </Field>
          <Field label="الحد الأعلى">
            <input
              type="number"
              value={s.scoreMax}
              onChange={(e) => setSettings({ scoreMax: Number(e.target.value) || 0 })}
              className={inputClass}
              style={inputStyle}
              data-testid="input-score-max"
            />
          </Field>
        </div>
        {s.scoreMax <= s.scoreMin && (
          <p
            className="flex items-center gap-1.5 text-[12px] font-semibold mt-2"
            style={{ color: BRAND.danger }}
          >
            <Info className="w-3.5 h-3.5" />
            الحد الأعلى يجب أن يكون أكبر من الحد الأدنى
          </p>
        )}
      </Panel>

      <Panel title="قواعد البطولة" hint="اختياري — تظهر للمحكمين ضمن صفحة التحكيم">
        <textarea
          value={s.rules ?? ""}
          onChange={(e) => setSettings({ rules: e.target.value })}
          rows={4}
          placeholder="مثال: مدة الخطاب 7 دقائق، خطاب الرد 4 دقائق، نقاط النظام مسموحة بعد الدقيقة الأولى..."
          className="w-full rounded-xl bg-white border p-3 text-[13.5px] font-medium outline-none
                     transition-colors focus:border-[#7B2D8E]/45 resize-none
                     placeholder:font-normal placeholder:text-[#2B1B45]/35"
          style={inputStyle}
          data-testid="input-rules"
        />
      </Panel>
    </div>
  );
}
