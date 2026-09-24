import { useEffect, useState } from "react";
import { BRAND } from "@/lib/brand";
import { DEFAULT_SETTINGS } from "@/lib/wizard/types";
import type { TournamentSettings } from "@/types/tournament";
import { SPEAKER_MAX, SPEAKER_MIN } from "@/lib/scoreValidation";

interface Props {
  settings: TournamentSettings | undefined;
  onChange: (patch: Partial<TournamentSettings>) => void;
}

/**
 * نظام المناظرة — the format rules that stay editable after creation: reply
 * speech, default judges per room and the written tournament rules. These
 * travel with every new judging link.
 */
export default function DebateRulesSettings({ settings, onChange }: Props) {
  const s = { ...DEFAULT_SETTINGS, ...settings };
  const [rules, setRules] = useState(s.rules ?? "");
  useEffect(() => setRules(settings?.rules ?? ""), [settings?.rules]);

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3 flex-wrap">
        <div className="flex-1 min-w-[14rem]">
          <p className="text-[13.5px] font-bold" style={{ color: BRAND.ink }}>
            خطاب الرد
          </p>
          <p className="text-[12px] mt-0.5" style={{ color: `${BRAND.ink}99` }}>
            عند الإيقاف يختفي خطاب الرد من روابط تسجيل الدرجات الجديدة للمحكمين.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onChange({ replySpeech: !s.replySpeech })}
          aria-pressed={s.replySpeech}
          className="w-14 h-8 rounded-full border relative transition-colors shrink-0"
          style={{
            backgroundColor: s.replySpeech ? BRAND.purple : `${BRAND.ink}14`,
            borderColor: s.replySpeech ? BRAND.purple : BRAND.border,
          }}
          data-testid="settings-toggle-reply-speech"
        >
          <span
            className="absolute top-1 w-6 h-6 rounded-full bg-white transition-all"
            style={{ right: s.replySpeech ? "0.25rem" : "1.75rem" }}
          />
        </button>
      </div>

      <div className="flex items-start gap-3 flex-wrap">
        <div className="flex-1 min-w-[14rem]">
          <p className="text-[13.5px] font-bold" style={{ color: BRAND.ink }}>
            عدد المحكمين الافتراضي لكل قاعة
          </p>
          <p className="text-[12px] mt-0.5" style={{ color: `${BRAND.ink}99` }}>
            يمكن تغييره لكل جولة ولكل قاعة من صفحة توزيع المحكمين.
          </p>
        </div>
        <input
          type="number"
          min={0}
          max={9}
          value={s.judgesPerRoom}
          onChange={(e) =>
            onChange({
              judgesPerRoom: Math.max(0, Math.min(9, Math.floor(Number(e.target.value) || 0))),
            })
          }
          className="w-16 h-9 px-2 rounded-xl border bg-white text-center font-bold outline-none"
          style={{ borderColor: BRAND.border }}
          data-testid="settings-judges-per-room"
        />
      </div>

      <div className="flex items-start gap-3 flex-wrap">
        <div className="flex-1 min-w-[14rem]">
          <p className="text-[13.5px] font-bold" style={{ color: BRAND.ink }}>
            نطاق الدرجات (ثابت)
          </p>
          <p className="text-[12px] mt-0.5" style={{ color: `${BRAND.ink}99` }}>
            أرقام صحيحة فقط — بدون كسور.
          </p>
        </div>
        <span className="text-[13.5px] font-bold" style={{ color: BRAND.ink }}>
          {SPEAKER_MIN} — {SPEAKER_MAX}
        </span>
      </div>

      <div>
        <p className="text-[13.5px] font-bold" style={{ color: BRAND.ink }}>
          قواعد البطولة
        </p>
        <p className="text-[12px] mt-0.5 mb-2" style={{ color: `${BRAND.ink}99` }}>
          تظهر في واجهة البطولة وفي روابط تسجيل الدرجات للمحكمين.
        </p>
        <textarea
          value={rules}
          onChange={(e) => setRules(e.target.value)}
          onBlur={() => {
            if (rules !== (settings?.rules ?? "")) onChange({ rules: rules.trim() || undefined });
          }}
          rows={4}
          placeholder="اكتب قواعد البطولة هنا…"
          className="w-full rounded-xl border bg-white p-3 text-[13px] outline-none"
          style={{ borderColor: BRAND.border, color: BRAND.ink }}
          data-testid="settings-rules"
        />
      </div>
    </div>
  );
}
