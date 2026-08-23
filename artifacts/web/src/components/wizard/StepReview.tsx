import {
  CalendarDays,
  Check,
  Gavel,
  LayoutGrid,
  Lock,
  MessageSquareReply,
  Quote,
  Repeat,
  Folder,
  Sparkles,
  Target,
  Unlock,
  Users,
  Zap,
} from "lucide-react";
import { BRAND, BRAND_GRADIENT } from "@/lib/brand";
import type { TournamentSetup } from "@/lib/wizard/types";
import { Panel } from "./ui";

interface StepReviewProps {
  setup: TournamentSetup;
  /** Name of the folder the tournament will be filed into, if any. */
  folderName?: string;
}

const fmtDate = (ts?: number) =>
  ts ? new Date(ts).toLocaleDateString("ar", { dateStyle: "medium" }) : "—";

/** One summary line: icon, label, value. */
function Row({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div
      className="flex items-center gap-3 py-2.5 border-b last:border-b-0"
      style={{ borderColor: BRAND.border }}
    >
      <span
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${tone ?? BRAND.purple}12` }}
      >
        <Icon className="w-4 h-4" style={{ color: tone ?? BRAND.purple }} />
      </span>
      <span className="flex-1 text-[13px] font-semibold" style={{ color: `${BRAND.ink}99` }}>
        {label}
      </span>
      <span className="text-[13.5px] font-bold" style={{ color: BRAND.ink }}>
        {value}
      </span>
    </div>
  );
}

/** Step 8 — full summary before the tournament is actually created. */
export default function StepReview({ setup, folderName }: StepReviewProps) {
  const s = setup.settings;
  const activeJudges = setup.judges.filter((j) => !j.disabled).length;

  return (
    <div className="space-y-4">
      {/* Hero summary */}
      <div
        className="rounded-2xl p-5 md:p-6 relative overflow-hidden shadow-sm"
        style={{ backgroundImage: BRAND_GRADIENT }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -top-16 -left-10 w-56 h-56 rounded-full bg-white/10 blur-2xl"
        />
        <div className="relative flex items-center gap-4">
          {setup.logoDataUrl && (
            <img
              src={setup.logoDataUrl}
              alt=""
              className="w-14 h-14 rounded-xl object-contain bg-white/15 p-1.5 shrink-0"
            />
          )}
          <div className="min-w-0">
            <p className="text-white/70 text-[11.5px] font-bold mb-1">
              البطولة جاهزة للإنشاء
            </p>
            <h3 className="text-white font-bold text-xl md:text-2xl leading-tight truncate">
              {setup.name || "بطولة بدون اسم"}
            </h3>
            {setup.description && (
              <p className="text-white/70 text-[12.5px] mt-1.5 line-clamp-2">
                {setup.description}
              </p>
            )}
          </div>
        </div>

        {/* Quick stats */}
        <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5">
          {[
            { value: setup.teams.length, label: "الفرق" },
            { value: setup.rooms.length, label: "القاعات" },
            { value: activeJudges, label: "المحكمون" },
            { value: setup.totalRounds, label: "الجولات" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl bg-white/15 backdrop-blur-sm px-3 py-2.5 text-center"
            >
              <p className="text-white font-bold text-xl leading-none">{stat.value}</p>
              <p className="text-white/70 text-[11px] font-semibold mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="التفاصيل">
          <Row icon={CalendarDays} label="تاريخ البداية" value={fmtDate(setup.startDate)} />
          <Row icon={CalendarDays} label="تاريخ النهاية" value={fmtDate(setup.endDate)} />
          <Row icon={Repeat} label="عدد الجولات" value={`${setup.totalRounds} جولات`} />
          <Row
            icon={Repeat}
            label="الجولة الابتدائية"
            value={`الجولة ${setup.startRound}`}
          />
          <Row
            icon={Folder}
            label="المجلد"
            value={folderName ?? "البطولات الحالية"}
          />
          <Row
            icon={Quote}
            label="نص القضية"
            value={setup.caseText?.trim() ? "تم إدخاله" : "لم يُدخل"}
          />
          <Row icon={Users} label="الفرق المسجّلة" value={`${setup.teams.length} فريق`} />
          <Row icon={LayoutGrid} label="القاعات" value={`${setup.rooms.length} قاعة`} />
          <Row
            icon={Gavel}
            label="المحكمون"
            value={`${activeJudges} نشط من ${setup.judges.length}`}
          />
        </Panel>

        <Panel title="النظام والحماية">
          <Row
            icon={setup.protection.enabled ? Lock : Unlock}
            label="حماية برمز دخول"
            value={
              setup.protection.enabled
                ? `مفعّلة (${setup.protection.code.length} أرقام)`
                : "غير مفعّلة"
            }
            tone={setup.protection.enabled ? BRAND.success : undefined}
          />
          <Row
            icon={MessageSquareReply}
            label="خطاب الرد"
            value={s.replySpeech ? "مفعّل" : "غير مفعّل"}
            tone={s.replySpeech ? BRAND.success : undefined}
          />
          <Row
            icon={Sparkles}
            label="موالاة ومعارضة"
            value={s.sides ? "مفعّل" : "غير مفعّل"}
          />
          <Row
            icon={Target}
            label="نطاق الدرجات"
            value={`${s.scoreMin} — ${s.scoreMax}`}
          />
          <Row
            icon={Gavel}
            label="محكمون لكل قاعة"
            value={`${s.judgesPerRoom}`}
          />
          <Row
            icon={Zap}
            label="توزيع الجولة الأولى"
            value={
              setup.drawApproved && setup.draw
                ? `معتمد (${setup.draw.length} قاعة)`
                : "لاحقاً"
            }
            tone={setup.drawApproved ? BRAND.success : BRAND.warning}
          />
        </Panel>
      </div>

      {s.rules?.trim() && (
        <Panel title="قواعد البطولة">
          <p
            className="text-[13px] leading-relaxed whitespace-pre-wrap"
            style={{ color: `${BRAND.ink}cc` }}
          >
            {s.rules}
          </p>
        </Panel>
      )}

      <div
        className="flex items-start gap-2.5 rounded-2xl p-3.5 border"
        style={{
          backgroundColor: `${BRAND.success}0d`,
          borderColor: `${BRAND.success}33`,
        }}
      >
        <Check className="w-4 h-4 mt-px shrink-0" style={{ color: BRAND.success }} />
        <p className="text-[12px] leading-relaxed" style={{ color: BRAND.ink }}>
          كل ما سبق قابل للتعديل لاحقاً من داخل البطولة. اضغط «إنشاء البطولة»
          للمتابعة.
        </p>
      </div>
    </div>
  );
}
