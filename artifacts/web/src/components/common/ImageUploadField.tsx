import { useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { BRAND, BTN, BTN_SIZE } from "@/lib/brand";

interface ImageUploadFieldProps {
  label: string;
  /** Current image as a data URL — stored with the record, not a remote link. */
  value?: string;
  onChange: (dataUrl: string | undefined) => void;
  /** Rejects anything larger, keeping the stored tournament small. */
  maxKb?: number;
  testId?: string;
}

/**
 * Direct file upload: the picked image is read in the browser and kept with the
 * record itself (team logo, judge photo), so it never depends on an external
 * link and can be replaced at any time. Nothing here reloads the page.
 */
export default function ImageUploadField({
  label,
  value,
  onChange,
  maxKb = 400,
  testId,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");

  const pick = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("يجب اختيار ملف صورة");
      return;
    }
    if (file.size > maxKb * 1024) {
      setError(`حجم الصورة أكبر من ${maxKb} كيلوبايت`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setError("");
      onChange(typeof reader.result === "string" ? reader.result : undefined);
    };
    reader.onerror = () => setError("تعذّر قراءة الملف");
    reader.readAsDataURL(file);
  };

  return (
    <div dir="rtl">
      <p className="text-[13px] font-bold mb-1.5" style={{ color: BRAND.ink }}>
        {label}
      </p>
      <div className="flex items-center gap-2.5 flex-wrap">
        {value ? (
          <img
            src={value}
            alt=""
            className="w-14 h-14 rounded-xl object-cover border"
            style={{ borderColor: BRAND.border }}
          />
        ) : (
          <span
            className="w-14 h-14 rounded-xl flex items-center justify-center border"
            style={{ borderColor: BRAND.border, color: `${BRAND.ink}66` }}
          >
            <ImagePlus className="w-5 h-5" />
          </span>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => pick(e.target.files?.[0])}
          data-testid={testId}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={`${BTN.base} ${BTN.secondary} ${BTN_SIZE.sm}`}
        >
          {value ? "استبدال الملف" : "رفع ملف"}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className={`${BTN.base} ${BTN.danger} ${BTN_SIZE.sm}`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            إزالة
          </button>
        )}
      </div>
      {error && (
        <p className="text-[12px] font-semibold mt-1.5" style={{ color: BRAND.danger }}>
          {error}
        </p>
      )}
    </div>
  );
}
