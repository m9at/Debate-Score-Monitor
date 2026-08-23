import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { motion } from "framer-motion";
import BrandLogo from "@/components/brand/BrandLogo";
import { BRAND, BRAND_GRADIENT, BTN, BTN_PRIMARY_STYLE, BTN_SIZE } from "@/lib/brand";
import { WIZARD_STEPS } from "@/lib/wizard/types";

interface WizardShellProps {
  stepIndex: number;
  title: string;
  hint?: string;
  canGoNext: boolean;
  nextLabel?: string;
  onBack: () => void;
  onNext: () => void;
  onCancel: () => void;
  children: React.ReactNode;
}

/**
 * Frame shared by every wizard step: branded header, progress stepper,
 * a centred content column and the back/next footer.
 */
export default function WizardShell({
  stepIndex,
  title,
  hint,
  canGoNext,
  nextLabel = "التالي",
  onBack,
  onNext,
  onCancel,
  children,
}: WizardShellProps) {
  const progress = ((stepIndex + 1) / WIZARD_STEPS.length) * 100;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: BRAND.surface }}
      dir="rtl"
    >
      {/* Header */}
      <header
        className="relative overflow-hidden shrink-0"
        style={{ backgroundColor: BRAND.ink }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 right-1/4 w-96 h-96 rounded-full opacity-25 blur-3xl"
          style={{ backgroundImage: BRAND_GRADIENT }}
        />
        <div className="relative max-w-4xl mx-auto px-4 md:px-6 py-3.5 flex items-center gap-3">
          <BrandLogo size={40} tone="dark" glow />
          <div className="flex-1 min-w-0">
            <h1 className="text-white font-bold text-[15px] md:text-lg leading-tight">
              إنشاء بطولة جديدة
            </h1>
            <p className="text-white/50 text-[11px] font-semibold">
              الخطوة {stepIndex + 1} من {WIZARD_STEPS.length} —{" "}
              {WIZARD_STEPS[stepIndex].label}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-white/60
                       hover:bg-white/10 hover:text-white transition-colors"
            aria-label="إلغاء وإغلاق"
            data-testid="button-cancel-wizard"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Progress rail */}
        <div className="relative h-1 bg-white/10">
          <div
            className="h-full transition-all duration-500"
            style={{ width: `${progress}%`, backgroundImage: BRAND_GRADIENT }}
          />
        </div>
      </header>

      {/* Step chips */}
      <nav className="shrink-0 bg-white border-b" style={{ borderColor: BRAND.border }}>
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-2.5 flex items-center gap-1.5 overflow-x-auto">
          {WIZARD_STEPS.map((s, i) => {
            const done = i < stepIndex;
            const active = i === stepIndex;
            return (
              <div
                key={s.key}
                className={`flex items-center gap-1.5 px-2.5 h-7 rounded-lg text-[11.5px] font-bold
                            whitespace-nowrap shrink-0 transition-all`}
                style={{
                  backgroundImage: active ? BRAND_GRADIENT : undefined,
                  backgroundColor: active
                    ? undefined
                    : done
                      ? `${BRAND.success}1a`
                      : `${BRAND.ink}0a`,
                  color: active ? "#fff" : done ? "#15803D" : `${BRAND.ink}80`,
                }}
                data-testid={`step-chip-${s.key}`}
              >
                <span
                  className="w-4 h-4 rounded-full flex items-center justify-center text-[9px]"
                  style={{
                    backgroundColor: active ? "rgba(255,255,255,0.25)" : "transparent",
                  }}
                >
                  {done ? "✓" : i + 1}
                </span>
                {s.label}
              </div>
            );
          })}
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-5 md:py-7">
          <div className="mb-5">
            <h2 className="text-xl md:text-2xl font-bold" style={{ color: BRAND.ink }}>
              {title}
            </h2>
            {hint && (
              <p className="text-[13px] mt-1" style={{ color: `${BRAND.ink}8c` }}>
                {hint}
              </p>
            )}
          </div>

          <motion.div
            key={stepIndex}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25 }}
          >
            {children}
          </motion.div>
        </div>
      </main>

      {/* Footer nav */}
      <footer
        className="shrink-0 bg-white border-t sticky bottom-0"
        style={{ borderColor: BRAND.border }}
      >
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-3 flex items-center gap-2.5">
          <button
            onClick={onBack}
            className={`${BTN.base} ${BTN.secondary} ${BTN_SIZE.lg}`}
            data-testid="button-wizard-back"
          >
            <ChevronRight className="w-4 h-4" />
            {stepIndex === 0 ? "إلغاء" : "السابق"}
          </button>

          <div className="flex-1" />

          <button
            onClick={onNext}
            disabled={!canGoNext}
            className={`${BTN.base} ${BTN.primary} ${BTN_SIZE.lg} min-w-[10rem]`}
            style={BTN_PRIMARY_STYLE}
            data-testid="button-wizard-next"
          >
            {nextLabel}
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </footer>
    </div>
  );
}
