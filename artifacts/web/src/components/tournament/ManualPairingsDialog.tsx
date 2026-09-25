import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowLeftRight, Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BRAND, BTN, BTN_PRIMARY_STYLE } from "@/lib/brand";
import type { Tournament } from "@/types/tournament";
import { canEditRoundPairings, type ManualPair } from "@/context/TournamentContext";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournament: Tournament;
  onSave: (roundNumber: number, pairs: ManualPair[]) => void;
}

const EMPTY: ManualPair = { govTeamId: "", oppTeamId: "" };

/** Lets the organiser decide, room by room, which team faces which. */
export default function ManualPairingsDialog({ open, onOpenChange, tournament, onSave }: Props) {
  const editableRounds = useMemo(() => {
    if (tournament.rounds.length === 0) return [1];
    return tournament.rounds
      .filter((r) => !r.kind || r.kind === "regular")
      .map((r) => r.roundNumber)
      .filter((n) => canEditRoundPairings(tournament, n));
  }, [tournament]);

  const [roundNumber, setRoundNumber] = useState<number>(0);
  const [pairs, setPairs] = useState<ManualPair[]>([]);

  const loadRound = (n: number) => {
    const round = tournament.rounds.find((r) => r.roundNumber === n);
    setRoundNumber(n);
    setPairs(
      round && round.matches.length > 0
        ? round.matches.map((m) => ({ govTeamId: m.team1.teamId, oppTeamId: m.team2.teamId }))
        : Array.from({ length: Math.max(1, Math.floor(tournament.teams.length / 2)) }, () => ({ ...EMPTY })),
    );
  };

  useEffect(() => {
    if (!open) return;
    const initial = editableRounds.includes(tournament.currentRound)
      ? tournament.currentRound
      : editableRounds[0];
    if (initial) loadRound(initial);
    // Only reset when the dialog opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const usage = new Map<string, number>();
  pairs.forEach((p) =>
    [p.govTeamId, p.oppTeamId].forEach((id) => id && usage.set(id, (usage.get(id) ?? 0) + 1)),
  );
  const duplicates = tournament.teams.filter((t) => (usage.get(t.id) ?? 0) > 1);
  const unplaced = tournament.teams.filter((t) => !usage.has(t.id));
  const incomplete = pairs.some((p) => !p.govTeamId || !p.oppTeamId);
  const canSave = editableRounds.length > 0 && pairs.length > 0 && !incomplete && duplicates.length === 0;

  const update = (i: number, patch: Partial<ManualPair>) =>
    setPairs((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));

  const roomName = (i: number) =>
    tournament.rooms?.find((r) => r.number === i + 1)?.label.trim() || `القاعة ${i + 1}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[88vh] overflow-y-auto" dir="rtl">
        <DialogHeader className="text-right sm:text-right">
          <DialogTitle>تحديد المواجهات يدويًا</DialogTitle>
          <DialogDescription>
            اختر لكل قاعة فريق الحكومة وفريق المعارضة. الحفظ يستبدل قرعة الجولة المختارة مع
            الإبقاء على محكمي كل قاعة.
          </DialogDescription>
        </DialogHeader>

        {editableRounds.length === 0 ? (
          <p className="text-[13px]" style={{ color: BRAND.ink }}>
            لا توجد جولة يمكن تعديلها — كل الجولات سُجّلت لها نتائج.
          </p>
        ) : (
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-[13px] font-bold" style={{ color: BRAND.ink }}>
              الجولة
              <select
                value={roundNumber}
                onChange={(e) => loadRound(Number(e.target.value))}
                className="h-9 rounded-lg border px-2 text-[13px] bg-white"
                style={{ borderColor: BRAND.border }}
                data-testid="manual-pairings-round"
              >
                {editableRounds.map((n) => (
                  <option key={n} value={n}>
                    الجولة {n}
                  </option>
                ))}
              </select>
            </label>

            <div className="space-y-2">
              {pairs.map((p, i) => (
                <div
                  key={i}
                  className="flex items-end gap-2 flex-wrap rounded-xl border p-2.5"
                  style={{ borderColor: BRAND.border }}
                  data-testid={`manual-pair-${i}`}
                >
                  <span
                    className="w-20 shrink-0 self-center text-[12.5px] font-bold"
                    style={{ color: BRAND.purple }}
                  >
                    {roomName(i)}
                  </span>
                  <TeamSelect
                    label="الحكومة"
                    value={p.govTeamId}
                    onChange={(id) => update(i, { govTeamId: id })}
                    tournament={tournament}
                    usage={usage}
                    testId={`manual-pair-${i}-gov`}
                  />
                  <button
                    type="button"
                    title="تبديل الجهتين"
                    onClick={() => update(i, { govTeamId: p.oppTeamId, oppTeamId: p.govTeamId })}
                    className={`${BTN.base} ${BTN.ghost} h-9 w-9 px-0`}
                  >
                    <ArrowLeftRight className="w-4 h-4" />
                  </button>
                  <TeamSelect
                    label="المعارضة"
                    value={p.oppTeamId}
                    onChange={(id) => update(i, { oppTeamId: id })}
                    tournament={tournament}
                    usage={usage}
                    testId={`manual-pair-${i}-opp`}
                  />
                  <button
                    type="button"
                    title="حذف القاعة"
                    onClick={() => setPairs((prev) => prev.filter((_, idx) => idx !== i))}
                    className={`${BTN.base} ${BTN.ghost} h-9 w-9 px-0 text-[#EF4444]`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setPairs((prev) => [...prev, { ...EMPTY }])}
              className={`${BTN.base} ${BTN.secondary} h-8 px-3 text-[12.5px]`}
              data-testid="manual-pairings-add-room"
            >
              <Plus className="w-4 h-4" />
              إضافة قاعة
            </button>

            {duplicates.length > 0 && (
              <Warning tone="red">
                فرق مكررة في أكثر من مكان: {duplicates.map((t) => t.name).join("، ")}
              </Warning>
            )}
            {unplaced.length > 0 && (
              <Warning tone="yellow">
                فرق غير موزعة على أي قاعة: {unplaced.map((t) => t.name).join("، ")}
              </Warning>
            )}
          </div>
        )}

        <DialogFooter className="gap-2 sm:justify-start">
          <button
            type="button"
            disabled={!canSave}
            onClick={() => {
              onSave(roundNumber, pairs);
              onOpenChange(false);
            }}
            className={`${BTN.base} ${BTN.primary}`}
            style={BTN_PRIMARY_STYLE}
            data-testid="manual-pairings-save"
          >
            حفظ المواجهات
          </button>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className={`${BTN.base} ${BTN.secondary}`}
          >
            إلغاء
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TeamSelect({
  label,
  value,
  onChange,
  tournament,
  usage,
  testId,
}: {
  label: string;
  value: string;
  onChange: (id: string) => void;
  tournament: Tournament;
  usage: Map<string, number>;
  testId: string;
}) {
  return (
    <label className="flex-1 min-w-[9rem] flex flex-col gap-0.5 text-[11px]" style={{ color: BRAND.ink }}>
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 rounded-lg border px-2 text-[13px] bg-white"
        style={{ borderColor: BRAND.border }}
        data-testid={testId}
      >
        <option value="">— اختر فريقًا —</option>
        {tournament.teams.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
            {usage.has(t.id) && t.id !== value ? " (مستخدم)" : ""}
          </option>
        ))}
      </select>
    </label>
  );
}

function Warning({ tone, children }: { tone: "red" | "yellow"; children: React.ReactNode }) {
  const red = tone === "red";
  return (
    <p
      className="flex items-start gap-1.5 rounded-lg px-2.5 py-2 text-[12.5px]"
      style={{ color: red ? "#EF4444" : "#B45309", backgroundColor: red ? "#FEF2F2" : "#FFFBEB" }}
    >
      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
      <span>{children}</span>
    </p>
  );
}
