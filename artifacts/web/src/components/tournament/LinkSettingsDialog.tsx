import { useEffect, useState } from "react";
import { CalendarClock, ListChecks, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { BRAND, BTN, BTN_PRIMARY_STYLE } from "@/lib/brand";
import { fieldsFor } from "@/lib/registrationFields";
import type { RegistrationLinkSettings } from "@/lib/profilesApi";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  kind: "team" | "judge";
  title: string;
  registrantCount: number;
  requiredFields: string[];
  closesAt: string | null;
  maxRegistrants: number | null;
  onSave: (settings: RegistrationLinkSettings) => void;
}

/** `<input type="datetime-local">` wants local time without the timezone. */
const toLocalInput = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
};

/**
 * إعدادات رابط التسجيل — required form fields, a closing date/time, and a
 * registrant cap that closes the link automatically once reached.
 */
export default function LinkSettingsDialog({
  open,
  onOpenChange,
  kind,
  title,
  registrantCount,
  requiredFields,
  closesAt,
  maxRegistrants,
  onSave,
}: Props) {
  const [fields, setFields] = useState<string[]>(requiredFields);
  const [deadline, setDeadline] = useState(toLocalInput(closesAt));
  const [cap, setCap] = useState(maxRegistrants ? String(maxRegistrants) : "");

  // Reopen always shows what is actually stored.
  useEffect(() => {
    if (!open) return;
    setFields(requiredFields);
    setDeadline(toLocalInput(closesAt));
    setCap(maxRegistrants ? String(maxRegistrants) : "");
  }, [open, requiredFields, closesAt, maxRegistrants]);

  const toggle = (key: string) =>
    setFields((f) =>
      f.includes(key) ? f.filter((k) => k !== key) : [...f, key],
    );

  const capNumber = Number(cap);
  const capInvalid = cap !== "" && (!Number.isFinite(capNumber) || capNumber < 1);

  const save = () => {
    onSave({
      requiredFields: fields,
      closesAt: deadline ? new Date(deadline).toISOString() : null,
      maxRegistrants: cap === "" ? null : Math.floor(capNumber),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle style={{ color: BRAND.ink }}>
            إعدادات رابط {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Required fields */}
          <div className="space-y-2.5">
            <p
              className="text-[13px] font-bold flex items-center gap-1.5"
              style={{ color: BRAND.ink }}
            >
              <ListChecks className="w-4 h-4" style={{ color: BRAND.purple }} />
              الحقول المطلوبة في النموذج
            </p>
            <p className="text-[12px]" style={{ color: `${BRAND.ink}8c` }}>
              الاسم ووسيلة التواصل مطلوبان دائماً. اختر ما تريد إلزامه أيضاً.
            </p>
            <div className="space-y-2">
              {fieldsFor(kind).map((f) => (
                <label
                  key={f.key}
                  className="flex items-center gap-3 rounded-xl border px-3 py-2.5 cursor-pointer"
                  style={{ borderColor: BRAND.border }}
                  data-testid={`toggle-required-${f.key}`}
                >
                  <Switch
                    checked={fields.includes(f.key)}
                    onCheckedChange={() => toggle(f.key)}
                  />
                  <span className="min-w-0">
                    <span
                      className="block text-[13.5px] font-bold"
                      style={{ color: BRAND.ink }}
                    >
                      {f.label}
                    </span>
                    <span
                      className="block text-[11.5px]"
                      style={{ color: `${BRAND.ink}8c` }}
                    >
                      {f.hint}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Deadline */}
          <div className="space-y-1.5">
            <Label
              className="text-[13px] font-bold flex items-center gap-1.5"
              style={{ color: BRAND.ink }}
            >
              <CalendarClock className="w-4 h-4" style={{ color: BRAND.purple }} />
              موعد إغلاق التسجيل
            </Label>
            <Input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="h-11 bg-white"
              data-testid="input-link-deadline"
            />
            <p className="text-[11.5px]" style={{ color: `${BRAND.ink}8c` }}>
              اتركه فارغاً لعدم وجود موعد إغلاق.
            </p>
          </div>

          {/* Cap */}
          <div className="space-y-1.5">
            <Label
              className="text-[13px] font-bold flex items-center gap-1.5"
              style={{ color: BRAND.ink }}
            >
              <Users className="w-4 h-4" style={{ color: BRAND.purple }} />
              حد أقصى للمسجلين
            </Label>
            <Input
              type="number"
              min={1}
              inputMode="numeric"
              value={cap}
              onChange={(e) => setCap(e.target.value)}
              placeholder="بدون حد"
              className="h-11 bg-white"
              data-testid="input-link-cap"
            />
            <p className="text-[11.5px]" style={{ color: `${BRAND.ink}8c` }}>
              المسجلون حالياً: {registrantCount} — يُغلق الرابط تلقائياً عند
              الوصول للحد.
            </p>
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={save}
            disabled={capInvalid}
            className={`${BTN.base} ${BTN.primary} h-11 flex-1 disabled:opacity-50`}
            style={BTN_PRIMARY_STYLE}
            data-testid="button-save-link-settings"
          >
            حفظ الإعدادات
          </button>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className={`${BTN.base} ${BTN.secondary} h-11 px-4`}
            data-testid="button-cancel-link-settings"
          >
            إلغاء
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
