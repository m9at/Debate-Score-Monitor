import { useRef } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { BRAND, BTN } from "@/lib/brand";
import type { Tournament } from "@/types/tournament";

type ImageField = "logoDataUrl" | "logoWhiteDataUrl" | "coverImageDataUrl";

/**
 * الهوية والشعارات — the tournament's own visual assets: the colour logo, a
 * white version of it for dark backgrounds and images, and the cover image used
 * as the hero of وضع الجمهور and of the tournament cards.
 */
export default function IdentityPanel({
  tournament,
  onChange,
}: {
  tournament: Tournament;
  onChange: (patch: Partial<Pick<Tournament, ImageField>>) => void;
}) {
  return (
    <section
      className="rounded-2xl border bg-white p-4 space-y-4"
      style={{ borderColor: BRAND.border }}
      dir="rtl"
      data-testid="identity-panel"
    >
      <h2 className="text-[15px] font-bold" style={{ color: BRAND.ink }}>
        الهوية والشعارات
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Slot
          title="الشعار الأساسي"
          hint="الشعار الملون، يُستخدم على الخلفيات الفاتحة."
          value={tournament.logoDataUrl}
          dark={false}
          onPick={(v) => onChange({ logoDataUrl: v })}
          testId="identity-logo"
        />
        <Slot
          title="الشعار الأبيض"
          hint="يُستخدم تلقائياً على الخلفيات الداكنة والصور."
          value={tournament.logoWhiteDataUrl}
          dark
          onPick={(v) => onChange({ logoWhiteDataUrl: v })}
          testId="identity-logo-white"
        />
        <Slot
          title="صورة البطولة"
          hint="تظهر كصورة رئيسية في صفحة الجمهور وبطاقة البطولة."
          value={tournament.coverImageDataUrl}
          dark={false}
          onPick={(v) => onChange({ coverImageDataUrl: v })}
          testId="identity-cover"
        />
      </div>
    </section>
  );
}

function Slot({
  title,
  hint,
  value,
  dark,
  onPick,
  testId,
}: {
  title: string;
  hint: string;
  value?: string;
  dark: boolean;
  onPick: (dataUrl: string | undefined) => void;
  testId: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const read = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => onPick(String(reader.result));
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-2">
      <p className="text-[13px] font-bold" style={{ color: BRAND.ink }}>
        {title}
      </p>
      <div
        className="h-28 rounded-xl border overflow-hidden flex items-center justify-center"
        style={{
          borderColor: BRAND.border,
          backgroundColor: dark ? BRAND.ink : `${BRAND.ink}06`,
        }}
      >
        {value ? (
          <img
            src={value}
            alt={title}
            className="w-full h-full object-contain p-2"
          />
        ) : (
          <span className="text-[12px]" style={{ color: dark ? "#ffffff80" : `${BRAND.ink}80` }}>
            لا توجد صورة
          </span>
        )}
      </div>
      <p className="text-[11.5px]" style={{ color: `${BRAND.ink}99` }}>
        {hint}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={`${BTN.base} ${BTN.secondary} h-9 px-3 text-[12.5px]`}
          data-testid={`${testId}-upload`}
        >
          <ImagePlus className="w-4 h-4" />
          {value ? "تغيير" : "رفع صورة"}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onPick(undefined)}
            className={`${BTN.base} ${BTN.danger} h-9 px-3 text-[12.5px]`}
            data-testid={`${testId}-remove`}
          >
            <Trash2 className="w-4 h-4" />
            إزالة
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) read(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}
