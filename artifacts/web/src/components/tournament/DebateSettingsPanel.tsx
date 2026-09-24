import { useEffect, useState } from "react";
import { RotateCcw, Save } from "lucide-react";
import { BRAND, BTN } from "@/lib/brand";
import { SPEAKER_MAX, SPEAKER_MIN } from "@/lib/scoreValidation";
import type { Tournament } from "@/types/tournament";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Props {
  tournament: Tournament;
  onToggleReplySpeech: () => void;
  onSaveRules: (rules: string) => void;
  /** Undoes the draw of one round so it can be drawn again from scratch. */
  onResetDraw: (roundNumber: number) => void;
}

/**
 * نظام المناظرة والقرعة — format switches that stay editable after creation:
 * the reply speech, the tournament rules and resetting a round's draw.
 */
export default function DebateSettingsPanel({
  tournament,
  onToggleReplySpeech,
  onSaveRules,
  onResetDraw,
}: Props) {
  const savedRules = tournament.settings?.rules ?? "";
  const [rules, setRules] = useState(savedRules);
  const [confirmRound, setConfirmRound] = useState<number | null>(null);
  useEffect(() => setRules(savedRules), [savedRules]);

  const replyOn = tournament.settings?.replySpeech !== false;
  const drawnRounds = tournament.rounds.filter((r) => r.matches.length > 0);

  return (
    <div className="space-y-4" dir="rtl">
      <Card title="نظام المناظرة">
        <Row
          title="خطاب الرد"
          hint="عند الإيقاف يختفي خطاب الرد تلقائياً من روابط تسجيل الدرجات لدى المحكمين."
        >
          <Toggle on={replyOn} onClick={onToggleReplySpeech} testId="settings-toggle-reply-speech" />
        </Row>
        <Row
          title="نطاق الدرجات"
          hint="ثابت وفق الروابط المعتمدة — أرقام صحيحة فقط دون كسور."
        >
          <span
            className="h-9 px-3.5 rounded-xl text-[12.5px] font-bold inline-flex items-center whitespace-nowrap shrink-0"
            style={{ backgroundColor: `${BRAND.purple}12`, color: BRAND.purple }}
            data-testid="settings-score-range"
          >
            من {SPEAKER_MIN} إلى {SPEAKER_MAX}
          </span>
        </Row>
      </Card>

      <Card title="قواعد البطولة">
        <p className="text-[12px]" style={{ color: `${BRAND.ink}99` }}>
          تظهر في واجهة البطولة وفي روابط تسجيل الدرجات لدى المحكمين.
        </p>
        <textarea
          value={rules}
          onChange={(e) => setRules(e.target.value)}
          rows={4}
          placeholder="مثال: مدة الخطاب 7 دقائق، خطاب الرد 4 دقائق..."
          className="w-full rounded-xl bg-white border p-3 text-[13.5px] font-medium outline-none
                     focus:border-[#7B2D8E]/45 resize-y"
          style={{ borderColor: BRAND.border, color: BRAND.ink }}
          data-testid="settings-input-rules"
        />
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => onSaveRules(rules)}
            disabled={rules === savedRules}
            className={`${BTN.base} h-9 px-3.5 text-[12.5px] text-white disabled:opacity-50`}
            style={{ backgroundColor: BRAND.purple, borderColor: BRAND.purple }}
            data-testid="settings-save-rules"
          >
            <Save className="w-4 h-4" />
            حفظ القواعد
          </button>
        </div>
      </Card>

      <Card title="القرعة">
        {drawnRounds.length === 0 ? (
          <p className="text-[12.5px]" style={{ color: `${BRAND.ink}99` }}>
            لم تُجرَ قرعة لأي جولة بعد.
          </p>
        ) : (
          drawnRounds.map((r) => {
            const hasResults = r.matches.some((m) => m.completed);
            return (
              <Row
                key={r.roundNumber}
                title={`الجولة ${r.roundNumber}`}
                hint={
                  hasResults
                    ? "سُجّلت نتائج في هذه الجولة — لا يمكن إعادة ضبط قرعتها."
                    : "إلغاء التوزيع الحالي وإعادة الجولة إلى البداية لإجراء قرعة جديدة."
                }
              >
                <button
                  type="button"
                  onClick={() => setConfirmRound(r.roundNumber)}
                  disabled={hasResults}
                  className={`${BTN.base} ${BTN.secondary} h-9 px-3.5 text-[12.5px] disabled:opacity-50`}
                  data-testid={`settings-reset-draw-${r.roundNumber}`}
                >
                  <RotateCcw className="w-4 h-4" />
                  إعادة ضبط الجولة من الصفر
                </button>
              </Row>
            );
          })
        )}
      </Card>

      <AlertDialog open={confirmRound !== null} onOpenChange={(o) => !o && setConfirmRound(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>إعادة ضبط قرعة الجولة {confirmRound}</AlertDialogTitle>
            <AlertDialogDescription>
              سيُلغى توزيع الفرق والقاعات والمحكمين لهذه الجولة، ويمكنك إجراء قرعة جديدة بعدها.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmRound !== null && onResetDraw(confirmRound)}
              data-testid="button-confirm-reset-draw"
            >
              إعادة الضبط
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border bg-white p-4 space-y-3" style={{ borderColor: BRAND.border }}>
      <h2 className="text-[15px] font-bold" style={{ color: BRAND.ink }}>
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Row({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 flex-wrap">
      <div className="flex-1 min-w-[14rem]">
        <p className="text-[13.5px] font-bold" style={{ color: BRAND.ink }}>
          {title}
        </p>
        <p className="text-[12px] mt-0.5" style={{ color: `${BRAND.ink}99` }}>
          {hint}
        </p>
      </div>
      {children}
    </div>
  );
}

function Toggle({ on, onClick, testId }: { on: boolean; onClick: () => void; testId: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className="w-14 h-8 rounded-full border relative transition-colors shrink-0"
      style={{
        backgroundColor: on ? BRAND.purple : `${BRAND.ink}14`,
        borderColor: on ? BRAND.purple : BRAND.border,
      }}
      data-testid={testId}
    >
      <span
        className="absolute top-1 w-6 h-6 rounded-full bg-white transition-all"
        style={{ right: on ? "0.25rem" : "1.75rem" }}
      />
    </button>
  );
}
