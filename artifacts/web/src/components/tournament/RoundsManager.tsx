import { useState } from "react";
import {
  CheckCircle2,
  Layers,
  Monitor,
  Play,
  Radio,
  Shuffle,
  Eye,
} from "lucide-react";
import type { Tournament } from "@/types/tournament";
import { BRAND, BTN, BTN_PRIMARY_STYLE } from "@/lib/brand";
import { roundTitle } from "@/lib/reveal";
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
  /** The round being browsed in the admin panel — viewing only. */
  viewedRound: number;
  onViewRound: (roundNumber: number) => void;
  /** Promotes a round to the tournament's live round (confirmed first). */
  onSetCurrent: (roundNumber: number) => void;
  /** Chooses the round the audience screen shows. */
  onSetPresented: (roundNumber: number) => void;
  /** Draws the pairings of a round that has no rooms yet. */
  onDraw?: () => void;
}

/**
 * إدارة الجولات — the round control strip at the top of the tournament.
 *
 * It keeps three ideas strictly apart, because mixing them is what made the
 * tournament impossible to run:
 *   1. the round being VIEWED here (browsing, changes nothing),
 *   2. the CURRENT round the tournament works on (explicit, confirmed action),
 *   3. the round shown in وضع العرض (chosen for the audience).
 */
export default function RoundsManager({
  tournament,
  viewedRound,
  onViewRound,
  onSetCurrent,
  onSetPresented,
  onDraw,
}: Props) {
  const [confirmFor, setConfirmFor] = useState<number | null>(null);

  const rounds = [...tournament.rounds].sort(
    (a, b) => a.roundNumber - b.roundNumber,
  );
  const current = Math.max(tournament.currentRound || 0, 0);
  const presented = tournament.presentedRound ?? current;
  const viewed = rounds.find((r) => r.roundNumber === viewedRound);
  const viewedIsCurrent = viewedRound === current;
  const viewedIsPresented = viewedRound === presented;
  const viewedIsEmpty = (viewed?.matches.length ?? 0) === 0;

  return (
    <section
      className="rounded-2xl bg-white border shadow-sm p-4 space-y-3.5"
      style={{ borderColor: BRAND.border }}
      data-testid="rounds-manager"
    >
      <div className="flex items-center gap-2.5 flex-wrap">
        <Layers className="w-5 h-5" style={{ color: BRAND.purple }} />
        <h2 className="text-[15px] font-bold" style={{ color: BRAND.ink }}>
          إدارة الجولات
        </h2>
        <span className="flex-1" />
        <Fact
          icon={Radio}
          color={BRAND.success}
          label="الجولة الحالية"
          value={current > 0 ? roundTitle(rounds.find((r) => r.roundNumber === current), current) : "لم تبدأ"}
          testId="fact-current-round"
        />
        <Fact
          icon={Monitor}
          color={BRAND.purple}
          label="المعروضة في وضع العرض"
          value={roundTitle(rounds.find((r) => r.roundNumber === presented), presented)}
          testId="fact-presented-round"
        />
      </div>

      {/* Round chips — selecting one only changes what is displayed here */}
      <div className="flex flex-wrap items-center gap-2">
        {rounds.map((r) => {
          const isViewed = r.roundNumber === viewedRound;
          const isCurrent = r.roundNumber === current;
          const isPresented = r.roundNumber === presented;
          return (
            <button
              key={r.roundNumber}
              type="button"
              onClick={() => onViewRound(r.roundNumber)}
              aria-current={isViewed ? "true" : undefined}
              className="h-10 px-3.5 rounded-xl border text-[13px] font-bold inline-flex items-center gap-2 transition-all active:scale-95"
              style={
                isViewed
                  ? {
                      borderColor: BRAND.purple,
                      backgroundColor: `${BRAND.purple}12`,
                      color: BRAND.purple,
                      boxShadow: `0 0 0 2px ${BRAND.purple}26`,
                    }
                  : { borderColor: BRAND.border, color: `${BRAND.ink}b3` }
              }
              data-testid={`chip-round-${r.roundNumber}`}
            >
              {roundTitle(r, r.roundNumber)}
              {isCurrent && (
                <span
                  className="inline-flex items-center gap-1 text-[10.5px] px-1.5 py-0.5 rounded-md"
                  style={{ backgroundColor: `${BRAND.success}1f`, color: BRAND.success }}
                >
                  <Radio className="w-3 h-3" />
                  الحالية
                </span>
              )}
              {isPresented && (
                <span
                  className="inline-flex items-center gap-1 text-[10.5px] px-1.5 py-0.5 rounded-md"
                  style={{ backgroundColor: `${BRAND.purple}1f`, color: BRAND.purple }}
                >
                  <Monitor className="w-3 h-3" />
                  العرض
                </span>
              )}
              {r.completed && (
                <CheckCircle2 className="w-3.5 h-3.5" style={{ color: BRAND.success }} />
              )}
            </button>
          );
        })}
      </div>

      <div
        className="flex flex-wrap items-center gap-2 pt-3 border-t"
        style={{ borderColor: BRAND.border }}
      >
        <span
          className="inline-flex items-center gap-1.5 text-[12.5px] font-bold px-2.5 h-8 rounded-lg"
          style={{ backgroundColor: `${BRAND.ink}0a`, color: `${BRAND.ink}99` }}
          data-testid="viewing-note"
        >
          <Eye className="w-3.5 h-3.5" />
          تشاهد الآن: {roundTitle(viewed, viewedRound)}
          {!viewedIsCurrent && " (استعراض فقط)"}
        </span>

        <span className="flex-1" />

        {viewedIsEmpty && onDraw && (
          <button
            type="button"
            onClick={onDraw}
            className={`${BTN.base} ${BTN.secondary} h-9 px-3.5 text-[12.5px]`}
            data-testid="button-draw-round"
          >
            <Shuffle className="w-4 h-4" />
            إجراء قرعة هذه الجولة
          </button>
        )}

        <button
          type="button"
          onClick={() => onSetPresented(viewedRound)}
          disabled={viewedIsPresented}
          className={`${BTN.base} ${BTN.secondary} h-9 px-3.5 text-[12.5px] disabled:opacity-50`}
          data-testid="button-set-presented-round"
        >
          <Monitor className="w-4 h-4" />
          {viewedIsPresented ? "معروضة في وضع العرض" : "عرض هذه الجولة للجمهور"}
        </button>

        <button
          type="button"
          onClick={() => setConfirmFor(viewedRound)}
          disabled={viewedIsCurrent}
          className={`${BTN.base} h-9 px-4 text-[12.5px] text-white disabled:opacity-50`}
          style={BTN_PRIMARY_STYLE}
          data-testid="button-set-current-round"
        >
          <Play className="w-4 h-4" />
          {viewedIsCurrent ? "هذه هي الجولة الحالية" : "تعيين كجولة حالية"}
        </button>
      </div>

      <AlertDialog
        open={confirmFor !== null}
        onOpenChange={(o) => !o && setConfirmFor(null)}
      >
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              تعيين {roundTitle(viewed, viewedRound)} كجولة حالية؟
            </AlertDialogTitle>
            <AlertDialogDescription>
              ستصبح هذه هي الجولة التي تعمل عليها البطولة، ويستخدمها التحكيم
              وإدخال النتائج. لن يتغيّر ما يظهر في وضع العرض إلا إذا اخترته بنفسك.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmFor !== null) onSetCurrent(confirmFor);
                setConfirmFor(null);
              }}
              data-testid="button-confirm-set-current-round"
            >
              تعيين كجولة حالية
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

function Fact({
  icon: Icon,
  color,
  label,
  value,
  testId,
}: {
  icon: typeof Radio;
  color: string;
  label: string;
  value: string;
  testId: string;
}) {
  return (
    <span
      className="inline-flex items-center gap-2 px-3 h-9 rounded-xl border"
      style={{ borderColor: `${color}40`, backgroundColor: `${color}0f` }}
      data-testid={testId}
    >
      <Icon className="w-4 h-4" style={{ color }} />
      <span className="text-[11.5px] font-medium" style={{ color: `${BRAND.ink}99` }}>
        {label}:
      </span>
      <span className="text-[13px] font-bold" style={{ color }}>
        {value}
      </span>
    </span>
  );
}
