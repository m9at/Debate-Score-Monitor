import { Eye, EyeOff, Flag, ShieldCheck, Trash2, Trophy } from "lucide-react";
import { BRAND, BTN } from "@/lib/brand";
import type { Tournament } from "@/types/tournament";

interface Props {
  tournament: Tournament;
  hideScores: boolean;
  onToggleHideScores: () => void;
  onOpenProtection: () => void;
  onToggleSemifinal: () => void;
  onToggleFinal: () => void;
  onFinish: () => void;
  onReopen: () => void;
  onDelete: () => void;
}

/**
 * الإعدادات — tournament-level switches that used to hide inside the "المزيد"
 * menu: protection, knockout rounds, result visibility and the lifecycle.
 */
export default function SettingsPanel({
  tournament,
  hideScores,
  onToggleHideScores,
  onOpenProtection,
  onToggleSemifinal,
  onToggleFinal,
  onFinish,
  onReopen,
  onDelete,
}: Props) {
  return (
    <div className="space-y-4" dir="rtl">
      <Card title="إظهار النتائج">
        <Row
          title="إخفاء النتائج عن الشاشات الإدارية"
          hint="عند التفعيل تُخفى الدرجات والفائز وأفضل متحدث في بطاقات القاعات حتى إعلان النتيجة."
        >
          <button
            type="button"
            onClick={onToggleHideScores}
            aria-pressed={hideScores}
            className={`${BTN.base} h-9 px-3.5 text-[12.5px] ${
              hideScores ? "text-white" : BTN.secondary
            }`}
            style={
              hideScores
                ? { backgroundColor: BRAND.purple, borderColor: BRAND.purple }
                : undefined
            }
            data-testid="settings-toggle-hide-scores"
          >
            {hideScores ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {hideScores ? "النتائج مخفية" : "النتائج ظاهرة"}
          </button>
        </Row>
      </Card>

      <Card title="الحماية">
        <Row
          title="حماية البطولة برمز"
          hint="طلب رمز قبل العرض أو التعديل."
        >
          <button
            type="button"
            onClick={onOpenProtection}
            className={`${BTN.base} ${BTN.secondary} h-9 px-3.5 text-[12.5px]`}
            data-testid="settings-protection"
          >
            <ShieldCheck className="w-4 h-4" />
            {tournament.protection?.enabled ? "مُفعّلة — تعديل" : "إعداد الحماية"}
          </button>
        </Row>
      </Card>

      <Card title="الأدوار الإقصائية">
        <Row title="نصف النهائي" hint="إتاحة توليد جولة نصف نهائي.">
          <Toggle
            on={!!tournament.semifinalEnabled}
            onClick={onToggleSemifinal}
            testId="settings-toggle-semifinal"
          />
        </Row>
        <Row title="النهائي" hint="إتاحة توليد الجولة النهائية.">
          <Toggle
            on={!!tournament.finalEnabled}
            onClick={onToggleFinal}
            testId="settings-toggle-final"
          />
        </Row>
      </Card>

      <Card title="حالة البطولة">
        <Row
          title={tournament.finished ? "البطولة منتهية" : "البطولة جارية"}
          hint={
            tournament.finished
              ? "إعادة الفتح تتيح تعديل النتائج وإضافة جولات."
              : "الإنهاء يقفل النتائج ويعلن الترتيب النهائي."
          }
        >
          {tournament.finished ? (
            <button
              type="button"
              onClick={onReopen}
              className={`${BTN.base} ${BTN.secondary} h-9 px-3.5 text-[12.5px]`}
              data-testid="settings-reopen"
            >
              <Flag className="w-4 h-4" />
              إعادة فتح البطولة
            </button>
          ) : (
            <button
              type="button"
              onClick={onFinish}
              className={`${BTN.base} ${BTN.secondary} h-9 px-3.5 text-[12.5px]`}
              data-testid="settings-finish"
            >
              <Trophy className="w-4 h-4" />
              إنهاء البطولة
            </button>
          )}
        </Row>
      </Card>

      <Card title="منطقة الخطر">
        <Row title="حذف البطولة" hint="لا يمكن التراجع عن هذا الإجراء.">
          <button
            type="button"
            onClick={onDelete}
            className={`${BTN.base} h-9 px-3.5 text-[12.5px] border`}
            style={{
              backgroundColor: `${BRAND.danger}0f`,
              borderColor: `${BRAND.danger}40`,
              color: BRAND.danger,
            }}
            data-testid="settings-delete"
          >
            <Trash2 className="w-4 h-4" />
            حذف البطولة
          </button>
        </Row>
      </Card>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      className="rounded-2xl border bg-white p-4 space-y-3"
      style={{ borderColor: BRAND.border }}
    >
      <h2 className="text-[15px] font-bold" style={{ color: BRAND.ink }}>
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Row({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
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

function Toggle({
  on,
  onClick,
  testId,
}: {
  on: boolean;
  onClick: () => void;
  testId: string;
}) {
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
