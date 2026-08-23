import { BRAND } from "@/lib/brand";

/** White panel used to group related fields inside a wizard step. */
export function Panel({
  title,
  hint,
  children,
  className = "",
}: {
  title?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl bg-white border shadow-sm p-4 md:p-5 ${className}`}
      style={{ borderColor: BRAND.border }}
    >
      {title && (
        <div className="mb-4">
          <h3 className="font-bold text-[15px]" style={{ color: BRAND.ink }}>
            {title}
          </h3>
          {hint && (
            <p className="text-[12px] mt-0.5" style={{ color: `${BRAND.ink}8c` }}>
              {hint}
            </p>
          )}
        </div>
      )}
      {children}
    </section>
  );
}

/** Labelled form field wrapper. */
export function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span
        className="block text-[12.5px] font-bold mb-1.5"
        style={{ color: BRAND.ink }}
      >
        {label}
        {required && <span style={{ color: BRAND.danger }}> *</span>}
      </span>
      {children}
      {hint && (
        <span className="block text-[11px] mt-1" style={{ color: `${BRAND.ink}80` }}>
          {hint}
        </span>
      )}
    </label>
  );
}

/** Shared input styling for wizard text/number/date inputs. */
export const inputClass =
  "w-full h-11 rounded-xl bg-white border px-3 text-[14px] font-medium outline-none " +
  "transition-colors focus:border-[#7B2D8E]/45 placeholder:font-normal placeholder:text-[#2B1B45]/35";

export const inputStyle: React.CSSProperties = {
  borderColor: BRAND.border,
  color: BRAND.ink,
};

/** Pill toggle with a label and description. */
export function Toggle({
  checked,
  onChange,
  label,
  description,
  testId,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
  testId?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="w-full flex items-center gap-3 text-right rounded-xl border p-3 transition-colors hover:bg-[#7B2D8E]/[0.03]"
      style={{ borderColor: checked ? `${BRAND.purple}59` : BRAND.border }}
      data-testid={testId}
    >
      <span
        className="relative w-11 h-6 rounded-full shrink-0 transition-colors duration-200"
        style={{ backgroundColor: checked ? BRAND.purple : `${BRAND.ink}26` }}
      >
        <span
          className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200"
          style={{ right: checked ? 2 : 22 }}
        />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block font-bold text-[13.5px]" style={{ color: BRAND.ink }}>
          {label}
        </span>
        {description && (
          <span className="block text-[11.5px] mt-0.5" style={{ color: `${BRAND.ink}8c` }}>
            {description}
          </span>
        )}
      </span>
      <span
        className="text-[11px] font-bold shrink-0"
        style={{ color: checked ? BRAND.purple : `${BRAND.ink}66` }}
      >
        {checked ? "مفعّل" : "غير مفعّل"}
      </span>
    </button>
  );
}
