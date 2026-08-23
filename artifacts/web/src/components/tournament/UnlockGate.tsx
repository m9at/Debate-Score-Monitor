import { useState } from "react";
import { Lock } from "lucide-react";
import { BRAND, BRAND_GRADIENT, BTN, BTN_PRIMARY_STYLE } from "@/lib/brand";

interface UnlockGateProps {
  tournamentName: string;
  codeLength: number;
  /** Returns true when the entered code is correct. */
  onSubmit: (code: string) => boolean;
  onBack: () => void;
}

/** Full-screen prompt shown when a tournament's view access is protected. */
export default function UnlockGate({
  tournamentName,
  codeLength,
  onSubmit,
  onBack,
}: UnlockGateProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const submit = () => {
    if (code.length !== codeLength) {
      setError(`أدخل ${codeLength} أرقام`);
      return;
    }
    if (!onSubmit(code)) {
      setError("الرمز غير صحيح");
      setCode("");
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ backgroundColor: BRAND.ink }}
      dir="rtl"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 right-1/4 w-80 h-80 rounded-full opacity-40 blur-3xl"
        style={{ backgroundImage: BRAND_GRADIENT }}
      />

      <div
        className="relative w-full max-w-sm rounded-3xl border backdrop-blur-md p-6 text-center
                   animate-in fade-in zoom-in-95 duration-300"
        style={{
          backgroundColor: "rgba(255,255,255,0.07)",
          borderColor: "rgba(255,255,255,0.15)",
        }}
        data-testid="unlock-gate"
      >
        <span
          className="w-16 h-16 rounded-2xl bg-white mx-auto flex items-center justify-center mb-4"
          style={{ boxShadow: `0 0 34px ${BRAND.purple}66` }}
        >
          <img
            src={`${import.meta.env.BASE_URL}logo-mark.png`}
            alt="مناظرات عُمان"
            className="w-12 h-12 object-contain"
          />
        </span>

        <div className="flex items-center justify-center gap-2 mb-1">
          <Lock className="w-4 h-4 text-white/70" />
          <p className="text-white/70 text-xs font-bold tracking-wide">بطولة محمية</p>
        </div>
        <h1 className="text-white font-bold text-lg mb-1 truncate">{tournamentName}</h1>
        <p className="text-white/55 text-xs mb-5">
          أدخل رمز الدخول لعرض البطولة
        </p>

        <input
          value={code}
          autoFocus
          onChange={(e) => {
            setCode(e.target.value.replace(/\D/g, "").slice(0, codeLength));
            setError("");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          type="password"
          inputMode="numeric"
          autoComplete="new-password"
          placeholder={"•".repeat(codeLength)}
          dir="ltr"
          className="w-full h-14 rounded-2xl border text-center text-2xl font-bold tracking-[0.5em]
                     text-white bg-white/[0.08] outline-none focus:border-white/40
                     placeholder:text-white/30 transition-colors"
          style={{ borderColor: "rgba(255,255,255,0.18)" }}
          data-testid="input-unlock-code"
        />

        {error && (
          <p
            className="text-xs font-semibold mt-2.5"
            style={{ color: "#FCA5A5" }}
            data-testid="text-unlock-error"
          >
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={submit}
          className={`${BTN.base} ${BTN.primary} w-full h-11 mt-4`}
          style={BTN_PRIMARY_STYLE}
          data-testid="button-unlock"
        >
          دخول
        </button>

        <button
          type="button"
          onClick={onBack}
          className="mt-3 text-white/55 hover:text-white/85 text-xs underline underline-offset-4 transition-colors"
          data-testid="button-unlock-back"
        >
          العودة للرئيسية
        </button>
      </div>
    </div>
  );
}
