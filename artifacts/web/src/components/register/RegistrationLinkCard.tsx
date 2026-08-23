import { useState } from "react";
import {
  Check,
  Copy,
  ExternalLink,
  QrCode,
  Share2,
  type LucideIcon,
} from "lucide-react";
import { BRAND, BTN } from "@/lib/brand";

interface Props {
  title: string;
  hint: string;
  icon: LucideIcon;
  /** The real, shareable URL — never a placeholder. */
  url: string;
}

const QR_SRC = (url: string) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(url)}`;

/**
 * A real registration link with its actions — usable both inside the creation
 * wizard (on the draft tournament id) and after the tournament exists. The QR
 * is always built from the same URL shown in the read-only field.
 */
export default function RegistrationLinkCard({
  title,
  hint,
  icon: Icon,
  url,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [qr, setQr] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        /* dismissed */
      }
      return;
    }
    await copy();
  };

  return (
    <div
      className="rounded-2xl border bg-white p-4 space-y-3"
      style={{ borderColor: BRAND.border }}
      data-testid={`registration-link-card-${title}`}
    >
      <div className="flex items-center gap-2.5">
        <span
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${BRAND.purple}14`, color: BRAND.purple }}
        >
          <Icon className="w-4.5 h-4.5" />
        </span>
        <div className="min-w-0">
          <h3 className="font-bold text-[15px]" style={{ color: BRAND.ink }}>
            {title}
          </h3>
          <p className="text-[11.5px]" style={{ color: `${BRAND.ink}8c` }}>
            {hint}
          </p>
        </div>
      </div>

      <input
        readOnly
        dir="ltr"
        value={url}
        onFocus={(e) => e.currentTarget.select()}
        className="w-full text-[11.5px] font-mono rounded-xl px-3 py-2 border outline-none"
        style={{
          backgroundColor: BRAND.surface,
          color: `${BRAND.ink}b3`,
          borderColor: BRAND.border,
        }}
        data-testid="input-registration-url"
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={copy}
          className={`${BTN.base} ${BTN.secondary} h-9 px-3 text-[12.5px]`}
          data-testid="button-copy-link"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? "تم النسخ" : "نسخ الرابط"}
        </button>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className={`${BTN.base} ${BTN.secondary} h-9 px-3 text-[12.5px]`}
          data-testid="button-open-link"
        >
          <ExternalLink className="w-4 h-4" />
          فتح الرابط
        </a>
        <button
          type="button"
          onClick={share}
          className={`${BTN.base} ${BTN.secondary} h-9 px-3 text-[12.5px]`}
          data-testid="button-share-link"
        >
          <Share2 className="w-4 h-4" />
          مشاركة
        </button>
        <button
          type="button"
          onClick={() => setQr((v) => !v)}
          className={`${BTN.base} ${BTN.secondary} h-9 px-3 text-[12.5px]`}
          data-testid="button-qr-link"
        >
          <QrCode className="w-4 h-4" />
          {qr ? "إخفاء QR" : "عرض QR"}
        </button>
      </div>

      {qr && (
        <div className="flex justify-center pt-1">
          <img
            src={QR_SRC(url)}
            alt={`QR — ${title}`}
            width={180}
            height={180}
            className="rounded-xl border p-2 bg-white"
            style={{ borderColor: BRAND.border }}
            data-testid="img-qr"
          />
        </div>
      )}
    </div>
  );
}
