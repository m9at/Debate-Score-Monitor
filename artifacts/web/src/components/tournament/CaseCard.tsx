import { useState } from "react";
import { Check, Pencil, Quote } from "lucide-react";
import { BRAND, BRAND_GRADIENT, BTN, BTN_PRIMARY_STYLE } from "@/lib/brand";

interface CaseCardProps {
  roundNumber: number;
  value: string;
  readOnly: boolean;
  onChange: (v: string) => void;
}

/**
 * Motion / case text for the round — the headline content of the round,
 * shown large and readable, with an inline editor.
 */
export default function CaseCard({
  roundNumber,
  value,
  readOnly,
  onChange,
}: CaseCardProps) {
  const [editing, setEditing] = useState(false);
  const text = value?.trim() ?? "";

  return (
    <div
      className="relative rounded-2xl bg-white border shadow-sm overflow-hidden
                 animate-in fade-in slide-in-from-top-1 duration-300"
      style={{ borderColor: BRAND.border }}
      data-testid="case-card"
    >
      {/* brand accent edge */}
      <span
        aria-hidden
        className="absolute top-0 bottom-0 right-0 w-1"
        style={{ backgroundImage: BRAND_GRADIENT }}
      />

      <div className="p-4 pr-5">
        <div className="flex items-start gap-3 mb-2">
          <span
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${BRAND.purple}14`, color: BRAND.purple }}
          >
            <Quote className="w-4 h-4" />
          </span>

          <div className="flex-1 min-w-0 text-right">
            <div
              className="text-[11px] font-bold tracking-wide uppercase"
              style={{ color: `${BRAND.purple}` }}
            >
              نص القضية · الجولة {roundNumber}
            </div>
          </div>

          {!readOnly && (
            <button
              type="button"
              onClick={() => setEditing((v) => !v)}
              className={`${BTN.base} ${editing ? BTN.primary : BTN.secondary} shrink-0`}
              style={editing ? BTN_PRIMARY_STYLE : undefined}
              data-testid="button-edit-case"
            >
              {editing ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  تم
                </>
              ) : (
                <>
                  <Pencil className="w-3.5 h-3.5" />
                  تعديل
                </>
              )}
            </button>
          )}
        </div>

        {editing && !readOnly ? (
          <textarea
            id={`case-${roundNumber}`}
            autoFocus
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="اكتب نص القضية هنا (سيظهر للمحكمين والفرق)..."
            className="w-full rounded-xl p-3.5 bg-[#F7F8FC] border resize-y min-h-[120px]
                       text-right leading-loose text-lg font-semibold outline-none
                       focus:border-[#7B2D8E]/50 transition-colors
                       animate-in fade-in slide-in-from-top-1 duration-200"
            style={{ borderColor: BRAND.border, color: BRAND.ink }}
            dir="rtl"
            data-testid={`textarea-case-${roundNumber}`}
          />
        ) : (
          <p
            className={`text-right leading-loose ${
              text ? "text-lg md:text-xl font-bold" : "text-sm italic"
            }`}
            style={{ color: text ? BRAND.ink : `${BRAND.ink}80` }}
            data-testid="text-case-preview"
          >
            {text || "لم يُضف نص القضية لهذه الجولة بعد"}
          </p>
        )}
      </div>
    </div>
  );
}
