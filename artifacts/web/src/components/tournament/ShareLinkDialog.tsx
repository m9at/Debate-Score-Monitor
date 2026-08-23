import { useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Check, Copy, Download, ExternalLink, Share2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BRAND, BTN, BTN_PRIMARY_STYLE, BTN_SIZE } from "@/lib/brand";

interface ShareLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  url: string;
}

/**
 * One dialog for every shareable link: the link itself, a scannable QR code and
 * clearly labelled actions (copy / open / share / download the QR).
 */
export default function ShareLinkDialog({
  open,
  onOpenChange,
  title,
  description,
  url,
}: ShareLinkDialogProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — the textarea stays selectable */
    }
  };

  const downloadQr = () => {
    const canvas = document.querySelector<HTMLCanvasElement>(
      "canvas[data-share-qr]"
    );
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `${title}.png`;
    a.click();
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        /* user dismissed */
      }
    }
    copy();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3.5 mt-1">
          {description && (
            <p className="text-[12.5px] leading-relaxed" style={{ color: `${BRAND.ink}99` }}>
              {description}
            </p>
          )}

          {/* QR */}
          <div
            className="rounded-2xl border p-4 flex flex-col items-center gap-2"
            style={{ borderColor: BRAND.border, backgroundColor: `${BRAND.ink}04` }}
          >
            {url && (
              <QRCodeCanvas
                value={url}
                size={168}
                level="M"
                includeMargin
                fgColor={BRAND.ink}
                bgColor="#FFFFFF"
                data-share-qr=""
                data-testid="share-qr"
              />
            )}
            <p className="text-[11.5px] font-semibold" style={{ color: `${BRAND.ink}8c` }}>
              امسح الرمز للانتقال مباشرة
            </p>
          </div>

          {/* Link */}
          <textarea
            readOnly
            value={url}
            dir="ltr"
            className="w-full p-3 rounded-xl text-[11px] font-mono outline-none resize-none border"
            style={{
              minHeight: 76,
              wordBreak: "break-all",
              borderColor: BRAND.border,
              backgroundColor: `${BRAND.ink}05`,
              color: BRAND.ink,
            }}
            onClick={(e) => (e.target as HTMLTextAreaElement).select()}
            data-testid="share-url"
          />

          {/* Labelled actions — icon + text, never icon-only */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={copy}
              className={`${BTN.base} ${BTN.primary} ${BTN_SIZE.md} col-span-2`}
              style={copied ? { backgroundColor: BRAND.success } : BTN_PRIMARY_STYLE}
              data-testid="button-copy-link"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "تم نسخ الرابط" : "نسخ الرابط"}
            </button>
            <button
              type="button"
              onClick={() => window.open(url, "_blank")}
              className={`${BTN.base} ${BTN.secondary} ${BTN_SIZE.md}`}
              data-testid="button-open-link"
            >
              <ExternalLink className="w-4 h-4" />
              فتح الرابط
            </button>
            <button
              type="button"
              onClick={share}
              className={`${BTN.base} ${BTN.secondary} ${BTN_SIZE.md}`}
              data-testid="button-share-link"
            >
              <Share2 className="w-4 h-4" />
              مشاركة
            </button>
            <button
              type="button"
              onClick={downloadQr}
              className={`${BTN.base} ${BTN.secondary} ${BTN_SIZE.md} col-span-2`}
              data-testid="button-download-qr"
            >
              <Download className="w-4 h-4" />
              تنزيل رمز QR
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
