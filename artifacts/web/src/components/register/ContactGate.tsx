import { useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";

const PURPLE = "#7B2D8E";

/**
 * Identity-first step: we ask for the phone/email before anything else so a
 * returning judge or team is recognised instead of filling the form again.
 */
export default function ContactGate({
  title,
  hint,
  submitting,
  onSubmit,
}: {
  title: string;
  hint: string;
  submitting: boolean;
  onSubmit: (contact: string) => void;
}) {
  const [contact, setContact] = useState("");
  const [error, setError] = useState("");

  const valid =
    /^[0-9+\s()-]{6,}$/.test(contact.trim()) ||
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.trim());

  return (
    <div className="bg-card rounded-2xl p-5 space-y-3" data-testid="contact-gate">
      <div>
        <h2 className="font-bold text-base mb-1">{title}</h2>
        <p className="text-muted-foreground text-sm">{hint}</p>
      </div>
      <input
        value={contact}
        onChange={(e) => {
          setContact(e.target.value);
          setError("");
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && valid) onSubmit(contact.trim());
        }}
        dir="ltr"
        placeholder="9xxxxxxx  أو  name@example.com"
        className="w-full h-12 px-3 rounded-xl bg-muted outline-none text-center"
        data-testid="input-contact"
      />
      {error && <p className="text-destructive text-sm font-medium">{error}</p>}
      <button
        type="button"
        onClick={() => {
          if (!valid) {
            setError("أدخل رقم هاتف أو بريداً إلكترونياً صحيحاً");
            return;
          }
          onSubmit(contact.trim());
        }}
        disabled={submitting}
        className="w-full h-13 py-3.5 rounded-2xl text-white font-bold flex items-center justify-center gap-2 disabled:opacity-60"
        style={{ backgroundColor: PURPLE }}
        data-testid="button-contact-continue"
      >
        {submitting ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <ArrowLeft className="w-5 h-5" />
        )}
        متابعة
      </button>
    </div>
  );
}
