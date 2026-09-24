import { Copy, Dices, Eraser, Sparkles } from "lucide-react";
import { BRAND, BTN } from "@/lib/brand";
import { roundTitle } from "@/lib/reveal";
import type { Tournament } from "@/types/tournament";

interface Props {
  tournament: Tournament;
  roundNumber: number;
  onSetJudgesPerRoom: (n: number) => void;
  onRedraw: () => void;
  onAutoAssign: () => void;
  onClearJudges: () => void;
  onCreateTestCopy: () => void;
}

const btn = `${BTN.base} ${BTN.secondary} h-9 px-3.5 text-[12.5px]`;

/**
 * الإعدادات → القرعة والتحكيم: judges per room, redraw of the current round,
 * auto/clear judge distribution and a numbered test copy of the tournament.
 */
export default function RoundDrawSettings({
  tournament,
  roundNumber,
  onSetJudgesPerRoom,
  onRedraw,
  onAutoAssign,
  onClearJudges,
  onCreateTestCopy,
}: Props) {
  const round = tournament.rounds.find((r) => r.roundNumber === roundNumber);
  const matches = round?.matches ?? [];
  const teams = tournament.teams.length;
  const needed = Math.floor(teams / 2);
  const seated = new Set(matches.flatMap((m) => [m.team1.teamId, m.team2.teamId]));
  const outside = tournament.teams.filter((t) => !seated.has(t.id)).length;
  const hasResults = matches.some((m) => m.completed);
  const perRoom = round?.judgesPerRoom ?? tournament.settings?.judgesPerRoom ?? 3;
  const title = round ? roundTitle(round, roundNumber) : `الجولة ${roundNumber}`;

  return (
    <section
      className="rounded-2xl border bg-white p-4 space-y-3"
      style={{ borderColor: BRAND.border }}
      dir="rtl"
      data-testid="settings-round-draw"
    >
      <h2 className="text-[15px] font-bold" style={{ color: BRAND.ink }}>
        القرعة والتحكيم — {title}
      </h2>

      <Row
        title="عدد المحكمين في القاعة"
        hint="يُطبَّق على كل الجولات غير المنتهية. بعد التغيير اضغط «توزيع تلقائي»."
      >
        <select
          value={perRoom}
          onChange={(e) => onSetJudgesPerRoom(Number(e.target.value))}
          className="h-9 px-3 rounded-xl border bg-white font-bold text-[13px] outline-none"
          style={{ borderColor: BRAND.border, color: BRAND.ink }}
          data-testid="settings-judges-per-room"
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              {n} {n === 1 ? "محكم" : "محكمين"}
            </option>
          ))}
        </select>
      </Row>

      <Row
        title="إعادة القرعة"
        hint={
          hasResults
            ? "لا يمكن إعادة القرعة — سُجّلت نتائج في هذه الجولة."
            : `${teams} فريق ← ${needed} قاعة (حالياً ${matches.length} قاعة${
                outside > 0 ? ` · ${outside} فريق خارج القرعة` : ""
              }). تُعاد المواجهات بكل الفرق ويُعاد توزيع المحكمين.`
        }
      >
        <button
          type="button"
          onClick={onRedraw}
          disabled={hasResults || teams < 2}
          className={`${btn} disabled:opacity-50`}
          data-testid="settings-redraw"
        >
          <Dices className="w-4 h-4" />
          إعادة القرعة
        </button>
      </Row>

      <Row
        title="توزيع المحكمين"
        hint="التوزيع التلقائي عشوائي في كل مرة. التصفير يزيل كل المحكمين من القاعات."
      >
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={onAutoAssign}
            disabled={matches.length === 0}
            className={`${btn} disabled:opacity-50`}
            data-testid="settings-auto-assign"
          >
            <Sparkles className="w-4 h-4" />
            توزيع تلقائي
          </button>
          <button
            type="button"
            onClick={onClearJudges}
            disabled={matches.length === 0}
            className={`${btn} disabled:opacity-50`}
            data-testid="settings-clear-judges"
          >
            <Eraser className="w-4 h-4" />
            تصفير المحكمين
          </button>
        </div>
      </Row>

      <Row
        title="نسخة تجريبية"
        hint="نسخة جديدة بنفس العدد: الفرق «فريق 1، 2…» والمحكمون «محكم 1، 2…» مع قرعة جديدة — للتجربة فقط، البطولة الأصلية لا تتأثر."
      >
        <button
          type="button"
          onClick={onCreateTestCopy}
          className={btn}
          data-testid="settings-test-copy"
        >
          <Copy className="w-4 h-4" />
          إنشاء نسخة تجريبية
        </button>
      </Row>
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
