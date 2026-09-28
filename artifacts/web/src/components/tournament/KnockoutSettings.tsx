import { useState } from "react";
import { Award } from "lucide-react";
import { BRAND, BTN, BTN_PRIMARY_STYLE } from "@/lib/brand";
import type { Tournament } from "@/types/tournament";
import { knockoutPool, knockoutReady, type KnockoutKind } from "@/context/TournamentContext";

interface Props {
  tournament: Tournament;
  onGenerate: (kind: KnockoutKind, teamCount: number) => void;
}

const KINDS: { value: KnockoutKind; label: string }[] = [
  { value: "quarterfinal", label: "ربع النهائي" },
  { value: "semifinal", label: "نصف النهائي (4 فرق)" },
  { value: "final", label: "النهائي (فريقان)" },
];

/** Lets the organiser end the regular rounds early and move to a knockout stage. */
export default function KnockoutSettings({ tournament, onGenerate }: Props) {
  const [kind, setKind] = useState<KnockoutKind>("semifinal");
  const [count, setCount] = useState(8);

  const pool = knockoutPool(tournament);
  const ready = knockoutReady(tournament);
  const size = kind === "semifinal" ? 4 : kind === "final" ? 2 : count;
  const seeds = pool.slice(0, size);
  // Same seeding as generateKnockout: 1×8, 2×7, 3×6, 4×5.
  const pairs = Array.from({ length: Math.floor(seeds.length / 2) }, (_, i) => [
    i,
    seeds.length - 1 - i,
  ]);
  const valid = ready && size >= 2 && size % 2 === 0 && pool.length >= size;

  const reason = !ready
    ? "متاح بعد اكتمال نتائج كل القاعات في آخر جولة."
    : pool.length < size
    ? `عدد الفرق المتأهلة المتاحة ${pool.length} فقط.`
    : size % 2 === 1
    ? "عدد الفرق يجب أن يكون زوجيًا."
    : "";

  return (
    <div className="space-y-3" data-testid="knockout-settings">
      <p className="text-[12px]" style={{ color: `${BRAND.ink}99` }}>
        بعد انتهاء أي جولة يمكنك إيقاف الجولات العادية والانتقال إلى الأدوار الإقصائية. يتأهل
        الأعلى ترتيبًا (أو الفائزون من الدور الإقصائي السابق).
      </p>
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-0.5 text-[11px]" style={{ color: BRAND.ink }}>
          الجولة القادمة
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as KnockoutKind)}
            className="h-8 rounded-lg border px-2 text-[12.5px] bg-white"
            style={{ borderColor: BRAND.border }}
            data-testid="knockout-kind"
          >
            {KINDS.map((k) => (
              <option key={k.value} value={k.value}>
                {k.label}
              </option>
            ))}
          </select>
        </label>
        {kind === "quarterfinal" && (
          <label className="flex flex-col gap-0.5 text-[11px]" style={{ color: BRAND.ink }}>
            عدد الفرق المتأهلة
            <input
              type="number"
              min={2}
              step={2}
              value={count}
              onChange={(e) => setCount(Math.max(2, Math.floor(Number(e.target.value) || 0)))}
              className="h-8 w-24 rounded-lg border px-2 text-[12.5px]"
              style={{ borderColor: BRAND.border }}
              data-testid="knockout-count"
            />
          </label>
        )}
        <button
          type="button"
          disabled={!valid}
          onClick={() => onGenerate(kind, size)}
          className={`${BTN.base} ${BTN.primary} h-8 px-3 text-[12.5px]`}
          style={BTN_PRIMARY_STYLE}
          data-testid="knockout-generate"
        >
          <Award className="w-4 h-4" />
          بدء {KINDS.find((k) => k.value === kind)!.label.split(" (")[0]}
        </button>
      </div>
      {reason && <p className="text-[12px] text-[#B45309]">{reason}</p>}
      {valid && (
        <ul className="grid gap-1 sm:grid-cols-2 text-[12px]" style={{ color: BRAND.ink }}>
          {pairs.map(([a, b], i) => (
            <li key={i} className="rounded-lg border px-2 py-1" style={{ borderColor: BRAND.border }}>
              <b style={{ color: BRAND.purple }}>القاعة {i + 1}:</b> ({a + 1}) {seeds[a].name} ضد ({b + 1}){" "}
              {seeds[b].name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
