import { useState } from "react";
import { Check, Pencil } from "lucide-react";
import { BRAND, BTN } from "@/lib/brand";

interface CaseCardProps {
  roundNumber: number;
  value: string;
  readOnly: boolean;
  onChange: (v: string) => void;
}

/**
 * Motion / case text for the round. Collapsed to a clean single row by default,
 * expands into an editor when the edit button is pressed.
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
      className="rounded-2xl bg-white border shadow-sm px-3 py-2.5 animate-in fade-in duration-300"
      style={{ borderColor: BRAND.border }}
      data-testid="case-card"
    >
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0 text-right">
          <div
            className="text-[13px] font-bold"
            style={{ color: BRAND.ink }}
          >
            نص القضية للجولة {roundNumber}
          </div>
          {!editing && (
            <p
              className={`text-xs mt-0.5 truncate ${text ? "" : "italic"}`}
              style={{ color: `${BRAND.ink}80` }}
              data-testid="text-case-preview"
            >
              {text || "لم يُضف نص القضية بعد"}
            </p>
          )}
        </div>

        {!readOnly && (
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className={`${BTN.base} ${editing ? BTN.primary : BTN.secondary}`}
            style={editing ? { backgroundColor: BRAND.purple } : undefined}
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

      {editing && !readOnly && (
        <textarea
          id={`case-${roundNumber}`}
          autoFocus
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="اكتب نص القضية هنا (سيظهر للمحكمين والفرق)..."
          className="mt-2.5 w-full rounded-xl p-3 bg-[#F7F8FC] border resize-y min-h-[90px]
                     text-right leading-relaxed text-[15px] outline-none
                     focus:border-[#7B2D8E]/50 transition-colors animate-in fade-in slide-in-from-top-1 duration-200"
          style={{ borderColor: BRAND.border }}
          data-testid="input-case-text"
        />
      )}

      {!editing && readOnly && text && (
        <p
          className="mt-2 text-sm leading-relaxed text-right"
          style={{ color: `${BRAND.ink}CC` }}
        >
          {text}
        </p>
      )}
    </div>
  );
}
