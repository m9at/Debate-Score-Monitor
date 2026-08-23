import { useMemo, useState } from "react";
import { CheckCircle2, Megaphone, Trophy } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Match, Tournament } from "@/types/tournament";
import { BRAND, BTN, BTN_PRIMARY_STYLE, BTN_SIZE } from "@/lib/brand";
import { getRoomStatus, roomStatusMeta } from "@/lib/roomStatus";
import RoomStatusBadge from "@/components/tournament/RoomStatusBadge";

interface AnnouncePickerDialogProps {
  tournament: Tournament;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Opens the projector screen for the chosen room. */
  onAnnounce: (match: Match) => void;
}

/**
 * Step 1 of announcing: pick a room. Rooms whose result is not final cannot be
 * chosen, and a confirmation step guards against announcing the wrong room twice.
 */
export default function AnnouncePickerDialog({
  tournament,
  open,
  onOpenChange,
  onAnnounce,
}: AnnouncePickerDialogProps) {
  const [confirming, setConfirming] = useState<Match | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const round = tournament.rounds.find(
    (r) => r.roundNumber === tournament.currentRound
  );

  const teamName = useMemo(() => {
    const byId = new Map(tournament.teams.map((t) => [t.id, t.name]));
    return (id: string) => byId.get(id) ?? "—";
  }, [tournament.teams]);

  const rooms = useMemo(() => {
    const pending = tournament.pendingResults ?? [];
    const expectedJudges =
      round?.judgesPerRoom ?? tournament.settings?.judgesPerRoom ?? 0;
    return (round?.matches ?? []).map((match) => ({
      match,
      status: getRoomStatus({ match, pending, expectedJudges }),
    }));
  }, [round, tournament.pendingResults, tournament.settings]);

  const close = () => {
    setConfirming(null);
    setSubmitting(false);
    onOpenChange(false);
  };

  const confirm = () => {
    if (!confirming || submitting) return;
    // Guard against a double click producing two announcements.
    setSubmitting(true);
    onAnnounce(confirming);
    close();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(v) : close())}>
      <DialogContent dir="rtl" className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="w-4.5 h-4.5" style={{ color: BRAND.purple }} />
            {confirming ? "تأكيد الإعلان" : "اختر القاعة التي تريد إعلان نتيجتها"}
          </DialogTitle>
        </DialogHeader>

        {confirming ? (
          <div className="space-y-4 mt-1" data-testid="announce-confirm">
            <div
              className="rounded-2xl p-4 border text-center"
              style={{ backgroundColor: `${BRAND.purple}0a`, borderColor: BRAND.border }}
            >
              <p className="text-[13.5px] font-bold mb-3" style={{ color: BRAND.ink }}>
                هل أنت متأكد من إعلان نتيجة{" "}
                {confirming.roomLabel?.trim() || `القاعة ${confirming.roomNumber}`}؟
              </p>
              <div className="flex items-center justify-center gap-3 text-[15px] font-bold">
                <span style={{ color: BRAND.blue }}>
                  {teamName(confirming.team1.teamId)}
                </span>
                <span className="text-xs" style={{ color: `${BRAND.ink}80` }}>
                  VS
                </span>
                <span style={{ color: BRAND.purple }}>
                  {teamName(confirming.team2.teamId)}
                </span>
              </div>
              <p className="text-[11.5px] mt-3" style={{ color: `${BRAND.ink}8c` }}>
                ستُفتح شاشة العرض الخاصة بالجمهور مباشرة بعد التأكيد.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={confirm}
                disabled={submitting}
                className={`${BTN.base} ${BTN.primary} ${BTN_SIZE.lg} flex-1`}
                style={BTN_PRIMARY_STYLE}
                data-testid="button-confirm-announce"
              >
                <Trophy className="w-4 h-4" />
                إعلان النتيجة الآن
              </button>
              <button
                type="button"
                onClick={() => setConfirming(null)}
                className={`${BTN.base} ${BTN.secondary} ${BTN_SIZE.lg}`}
                data-testid="button-cancel-announce"
              >
                رجوع
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2 mt-1 max-h-[60vh] overflow-y-auto">
            {rooms.length === 0 && (
              <p
                className="text-[13px] text-center py-8"
                style={{ color: `${BRAND.ink}8c` }}
              >
                لا توجد قاعات في الجولة الحالية.
              </p>
            )}

            {rooms.map(({ match, status }) => {
              const selectable = status === "ready" || status === "announced";
              const meta = roomStatusMeta(status);
              return (
                <button
                  key={match.id}
                  type="button"
                  disabled={!selectable}
                  onClick={() => setConfirming(match)}
                  className={`w-full text-right rounded-xl border p-3 flex items-center gap-3
                              transition-all ${
                                selectable
                                  ? "bg-white hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99]"
                                  : "opacity-60 cursor-not-allowed"
                              }`}
                  style={{ borderColor: BRAND.border }}
                  data-testid={`announce-pick-${match.roomNumber}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[13.5px]" style={{ color: BRAND.ink }}>
                      {match.roomLabel?.trim() || `القاعة ${match.roomNumber}`}
                    </p>
                    <p
                      className="text-[12px] truncate mt-0.5"
                      style={{ color: `${BRAND.ink}99` }}
                    >
                      {teamName(match.team1.teamId)} × {teamName(match.team2.teamId)}
                    </p>
                  </div>
                  {status === "announced" ? (
                    <span
                      className="inline-flex items-center gap-1.5 text-[11.5px] font-bold"
                      style={{ color: meta.fg }}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      أُعلنت — إعادة العرض
                    </span>
                  ) : (
                    <RoomStatusBadge status={status} size="sm" />
                  )}
                </button>
              );
            })}

            <p
              className="text-[11.5px] pt-1 text-center"
              style={{ color: `${BRAND.ink}80` }}
            >
              لا يمكن إعلان نتيجة قاعة لم تكتمل نتيجتها.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
