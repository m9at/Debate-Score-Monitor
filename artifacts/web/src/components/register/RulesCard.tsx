import { ScrollText } from "lucide-react";
import type { PublicTournamentRules } from "@/lib/registrationsApi";

interface RulesCardProps {
  rules?: PublicTournamentRules;
  /** Judges see the scoring system; teams see the participation rules. */
  kind: "team" | "judge";
}

const PURPLE = "#7B2D8E";

/**
 * قواعد البطولة, read straight from what the organiser published — so the
 * registration link, the scoring range and the rules can never drift apart.
 */
export default function RulesCard({ rules, kind }: RulesCardProps) {
  if (!rules) return null;

  const rows: { label: string; value: string }[] = [];
  if (rules.speakersPerTeam?.length)
    rows.push({
      label: "عدد أعضاء الفريق",
      value: rules.speakersPerTeam.join(" أو ") + " أعضاء",
    });
  if (kind === "judge") {
    if (rules.scoreMin !== undefined && rules.scoreMax !== undefined)
      rows.push({
        label: "نظام الدرجات",
        value: `من ${rules.scoreMin} إلى ${rules.scoreMax} لكل متحدث`,
      });
    if (rules.judgesPerRoom)
      rows.push({ label: "عدد المحكمين في القاعة", value: `${rules.judgesPerRoom}` });
    if (rules.replySpeech !== undefined)
      rows.push({
        label: "خطاب الرد",
        value: rules.replySpeech ? "مُفعّل" : "غير مُفعّل",
      });
  }

  if (rows.length === 0 && !rules.text?.trim()) return null;

  return (
    <section
      className="rounded-2xl border bg-white p-4 space-y-3 text-right"
      style={{ borderColor: `${PURPLE}33` }}
      dir="rtl"
      data-testid="rules-card"
    >
      <h3 className="flex items-center gap-2 font-bold text-[14.5px]" style={{ color: PURPLE }}>
        <ScrollText className="w-4 h-4" />
        {kind === "judge" ? "قواعد التحكيم ونظام التقييم" : "قواعد المشاركة"}
      </h3>

      {rows.length > 0 && (
        <dl className="space-y-1.5">
          {rows.map((r) => (
            <div key={r.label} className="flex justify-between gap-3 text-[13px]">
              <dt className="font-semibold text-[#2B1B45]/60">{r.label}</dt>
              <dd className="font-bold text-[#2B1B45]">{r.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {rules.text?.trim() && (
        <p className="text-[13px] leading-relaxed whitespace-pre-line text-[#2B1B45]/80">
          {rules.text.trim()}
        </p>
      )}
    </section>
  );
}
