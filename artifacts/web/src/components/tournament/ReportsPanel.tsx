import {
  Activity,
  BarChart2,
  FileSpreadsheet,
  FileText,
  Loader2,
  Printer,
  Users,
  UserCheck,
  Layers,
} from "lucide-react";
import { BRAND } from "@/lib/brand";
import type { Tournament } from "@/types/tournament";

interface Props {
  tournament: Tournament;
  pdfLoading: boolean;
  excelLoading: boolean;
  onExportPdf: () => void;
  onExportExcel: () => void;
  onPrint: () => void;
  onOpenStats: () => void;
  /** Jumps to the admin view a report is built from. */
  onGoTo: (tab: "standings" | "speakers" | "rounds" | "judges" | "teams") => void;
}

/**
 * التقارير — every export and report in one place. Nothing about registration
 * links, presentation mode or tournament settings belongs on this screen.
 */
export default function ReportsPanel({
  tournament,
  pdfLoading,
  excelLoading,
  onExportPdf,
  onExportExcel,
  onPrint,
  onOpenStats,
  onGoTo,
}: Props) {
  const completed = tournament.rounds.reduce(
    (n, r) => n + r.matches.filter((m) => m.completed).length,
    0,
  );

  return (
    <div className="space-y-5" dir="rtl">
      <Group title="تقارير البطولة">
        <Card
          icon={Activity}
          title="تقرير البطولة الشامل"
          hint={`${tournament.teams.length} فريق · ${tournament.rounds.length} جولة · ${completed} نتيجة مسجّلة`}
          onClick={onOpenStats}
          testId="report-tournament"
        />
        <Card
          icon={Layers}
          title="تقرير الجولات"
          hint="القضايا والقاعات والمواجهات لكل جولة"
          onClick={() => onGoTo("rounds")}
          testId="report-rounds"
        />
        <Card
          icon={BarChart2}
          title="تقرير النتائج والترتيب"
          hint="ترتيب الفرق ونتائج القاعات"
          onClick={() => onGoTo("standings")}
          testId="report-results"
        />
        <Card
          icon={Users}
          title="تقرير الفرق والمتحدثين"
          hint="بيانات الفرق ودرجات المتحدثين"
          onClick={() => onGoTo("speakers")}
          testId="report-teams"
        />
        <Card
          icon={UserCheck}
          title="تقرير المحكمين"
          hint="المحكمون وتوزيعهم على القاعات"
          onClick={() => onGoTo("judges")}
          testId="report-judges"
        />
      </Group>

      <Group title="التصدير والطباعة">
        <Card
          icon={pdfLoading ? Loader2 : FileText}
          spinning={pdfLoading}
          title="تصدير PDF"
          hint="تقرير كامل جاهز للأرشفة والمشاركة"
          onClick={onExportPdf}
          disabled={pdfLoading}
          testId="report-export-pdf"
        />
        <Card
          icon={excelLoading ? Loader2 : FileSpreadsheet}
          spinning={excelLoading}
          title="تصدير Excel"
          hint="جداول النتائج والدرجات"
          onClick={onExportExcel}
          disabled={excelLoading}
          testId="report-export-excel"
        />
        <Card
          icon={Printer}
          title="طباعة"
          hint="طباعة الصفحة الحالية"
          onClick={onPrint}
          testId="report-print"
        />
      </Group>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-[15px] font-bold" style={{ color: BRAND.ink }}>
        {title}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {children}
      </div>
    </section>
  );
}

function Card({
  icon: Icon,
  title,
  hint,
  onClick,
  disabled,
  spinning,
  testId,
}: {
  icon: typeof FileText;
  title: string;
  hint: string;
  onClick: () => void;
  disabled?: boolean;
  spinning?: boolean;
  testId: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="text-right rounded-2xl border bg-white p-4 flex items-start gap-3
                 transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99]
                 disabled:opacity-60 disabled:pointer-events-none"
      style={{ borderColor: BRAND.border }}
      data-testid={testId}
    >
      <span
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${BRAND.purple}12`, color: BRAND.purple }}
      >
        <Icon className={`w-5 h-5 ${spinning ? "animate-spin" : ""}`} />
      </span>
      <span className="min-w-0">
        <span className="block text-[14px] font-bold" style={{ color: BRAND.ink }}>
          {title}
        </span>
        <span className="block text-[12px] mt-0.5" style={{ color: `${BRAND.ink}99` }}>
          {hint}
        </span>
      </span>
    </button>
  );
}
