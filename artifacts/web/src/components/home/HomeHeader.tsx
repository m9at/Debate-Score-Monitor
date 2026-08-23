import BrandLogo from "@/components/brand/BrandLogo";
import { BRAND, BRAND_GRADIENT } from "@/lib/brand";

interface HomeHeaderProps {
  /** Right-hand slot for actions (new tournament, new folder, account...). */
  actions?: React.ReactNode;
}

/**
 * Compact branded header for the tournaments screen — the logo sits directly on
 * the ink surface with no white plate, and the vertical space stays tight.
 */
export default function HomeHeader({ actions }: HomeHeaderProps) {
  return (
    <header
      className="relative overflow-hidden"
      style={{ backgroundColor: BRAND.ink }}
      data-testid="home-header"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 right-1/3 w-[26rem] h-[26rem] rounded-full opacity-30 blur-3xl"
        style={{ backgroundImage: BRAND_GRADIENT }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 left-0 w-80 h-80 rounded-full opacity-20 blur-3xl"
        style={{ backgroundColor: BRAND.blue }}
      />

      <div className="relative max-w-6xl mx-auto px-4 md:px-6 py-4 md:py-5">
        <div className="flex items-center gap-3 md:gap-4">
          <BrandLogo size={52} tone="dark" glow className="md:!h-16 md:!w-16" />

          <div className="flex-1 min-w-0">
            <h1
              className="text-white font-bold text-lg md:text-2xl leading-tight truncate"
              data-testid="text-app-title"
            >
              نظام رصد الدرجات
            </h1>
            <p className="text-white/55 text-[11px] md:text-sm font-semibold">
              مناظرات عُمان
            </p>
          </div>

          {actions && (
            <div className="flex items-center gap-2 shrink-0">{actions}</div>
          )}
        </div>
      </div>
    </header>
  );
}
