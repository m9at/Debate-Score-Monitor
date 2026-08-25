import { useRef, useState } from "react";
import { ImageIcon, Trash2, Upload } from "lucide-react";

const PURPLE = "#7B2D8E";
/** Longest side of the stored image — keeps the payload small. */
const MAX_SIDE = 512;

interface ImageUploadFieldProps {
  label: string;
  /** Data URL of the stored image, "" when none. */
  value: string;
  onChange: (dataUrl: string) => void;
  testId?: string;
}

/** Reads a picture file and returns a downscaled JPEG data URL. */
async function toDataUrl(file: File): Promise<string> {
  const raw = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("read failed"));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("decode failed"));
    el.src = raw;
  });

  const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return raw;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.82);
}

/**
 * Picture field that stores the file INSIDE the system — no external URL, no
 * drive link. The organiser (or the registrant) uploads, sees a preview, and can
 * replace or remove it.
 */
export default function ImageUploadField({
  label,
  value,
  onChange,
  testId,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const pick = async (file: File) => {
    setError("");
    setBusy(true);
    try {
      onChange(await toDataUrl(file));
    } catch {
      setError("تعذّر قراءة الملف — جرّب صورة أخرى");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div dir="rtl">
      <label className="text-sm font-bold block mb-1.5">{label}</label>

      <div className="flex items-center gap-3">
        <div
          className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center overflow-hidden shrink-0"
          data-testid={testId ? `${testId}-preview` : undefined}
        >
          {value ? (
            <img src={value} alt={label} className="w-full h-full object-cover" />
          ) : (
            <ImageIcon className="w-6 h-6 text-muted-foreground/50" />
          )}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="flex items-center gap-2 h-10 px-3.5 rounded-xl border-2 border-dashed
                       border-border text-sm font-bold hover:bg-muted/50 disabled:opacity-60"
            data-testid={testId}
          >
            <Upload className="w-4 h-4" style={{ color: PURPLE }} />
            {busy ? "جارٍ الرفع…" : value ? "استبدال" : "📎 رفع ملف"}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-destructive/10"
              aria-label="حذف الصورة"
              data-testid={testId ? `${testId}-remove` : undefined}
            >
              <Trash2 className="w-4 h-4 text-destructive" />
            </button>
          )}
        </div>
      </div>

      {error && (
        <p className="text-destructive text-xs font-semibold mt-1.5">{error}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        hidden
        accept="image/*"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void pick(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}
