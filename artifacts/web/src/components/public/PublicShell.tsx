import type { ReactNode } from "react";
import { Eye } from "lucide-react";
import { BRAND, BRAND_GRADIENT, LAYOUT } from "@/lib/brand";

/**
 * وضع الجمهور shell — the brand header plus a permanent «مشاهدة فقط» badge, so
 * it is always obvious that this view carries no administration whatsoever.
 */
export default function PublicShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div
      dir="rtl"
      className="min-h-[100dvh] pb-16"
      style={{ backgroundColor: BRAND.surface }}
      data-testid="public-mode"
    >
      <header
        className="text-white py-8 md:py-11"
        style={{ backgroundImage: BRAND_GRADIENT }}
      >
        <div className={`${LAYOUT.page} flex flex-col items-center text-center gap-3`}>
          <span className="inline-flex items-center gap-2 px-3 h-8 rounded-full bg-white/20 text-[12.5px] font-bold">
            <Eye className="w-4 h-4" />
            وضع الجمهور · مشاهدة فقط
          </span>
          <h1 className="font-black text-3xl md:text-5xl leading-tight">{title}</h1>
          {subtitle && (
            <p className="text-white/85 font-bold text-sm md:text-lg">{subtitle}</p>
          )}
        </div>
      </header>

      <main className={`${LAYOUT.page} ${LAYOUT.stack} mt-6`}>{children}</main>
    </div>
  );
}
