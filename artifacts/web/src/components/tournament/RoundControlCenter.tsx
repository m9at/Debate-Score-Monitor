import { useMemo, useState } from "react";
import { AlertTriangle, BellRing, Lock, Megaphone, Unlock } from "lucide-react";
import type { Match, Tournament } from "@/types/tournament";
import { BRAND, BRAND_GRADIENT, BTN, BTN_PRIMARY_STYLE, BTN_SIZE } from "@/lib/brand";
import { getRoomStatus, missingJudgeNames, roomStatusMeta } from "@/lib/roomStatus";
import RoomStatusBadge from "./RoomStatusBadge";

interface RoundControlCenterProps {
  tournament: Tournament;
  onOpenMatch: (match: Match) => void;
  onAnnounce: () => void;
  onToggleLock: (locked: boolean) => void;
  onRemindJudge: (judgeName: string, match: Match) => void;
}

/**
 * مركز تحكم الجولة — the tournament director's single screen: state of every
 * room, who is late, and the round lock. Counts and statuses only, no scores.
 */
export default function RoundControlCenter({
  tournament,
  onOpenMatch,
  onAnnounce,
  onToggleLock,
  onRemindJudge,
}: RoundControlCenterProps) {
  const round = tournament.rounds.find(
    (r) => r.roundNumber === tournament.currentRound
  );
  const [confirmLock, setConfirmLock] = useState(false);

  const teamName = useMemo(() => {
    const byId = new Map(tournament.teams.map((t) => [t.id, t.name]));
    return (id: string) => byId.get(id) ?? "—";
  }, [tournament.teams]);

  const rows = useMemo(() => {
    const pending = tournament.pendingResults ?? [];
    const expectedJudges =
      round?.judgesPerRoom ?? tournament.settings?.judgesPerRoom ?? 0;
    return (round?.matches ?? []).map((match) => {
      const input = { match, pending, expectedJudges };
      return {
        match,
        status: getRoomStatus(input),
        missing: missingJudgeNames(input),
      };
    });
  }, [round, tournament.pendingResults, tournament.settings]);

  const alerts = rows.filter(
    (r) => r.missing.length > 0 && r.status !== "ready" && r.status !== "announced"
  );
  const locked = !!round?.locked;

  return (
    <div className="space-y-4">
      {/* Head */}
      <section
        className="rounded-2xl p-5 relative overflow-hidden shadow-sm"
        style={{ backgroundImage: BRAND_GRADIENT }}
      >
        <div className="relative flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-[10rem]">
            <p className="text-white/70 text-[11.5px] font-bold">مركز تحكم الجولة</p>
            <h2 className="text-white font-bold text-2xl md:text-3xl mt-1">
              الجولة {tournament.currentRound} من {tournament.totalRounds}
            </h2>
          </div>

          <button
            type="button"
            onClick={onAnnounce}
            className={`${BTN.base} ${BTN_SIZE.lg} bg-white text-[#5D1F6D] shadow-md hover:shadow-lg`}
            data-testid="button-control-announce"
          >
            <Megaphone className="w-4 h-4" />
            إعلان نتائج الجولة
          </button>

          <button
            type="button"
            onClick={() => (locked ? setConfirmLock(true) : setConfirmLock(true))}
            className={`${BTN.base} ${BTN_SIZE.lg} bg-white/15 text-white border border-white/25
                        hover:bg-white/25`}
            data-testid="button-toggle-round-lock"
          >
            {locked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            {locked ? "فتح الجولة للتعديل" : "إغلاق الجولة"}
          </button>
        </div>

        {locked && (
          <p className="relative mt-3 text-white/80 text-[12.5px] font-semibold">
            🔒 الجولة مغلقة — لا يمكن تعديل النتائج حتى يتم فتحها.
          </p>
        )}
      </section>

      {/* Lock confirmation */}
      {confirmLock && (
        <div
          className="rounded-2xl border p-4 flex flex-wrap items-center gap-3"
          style={{
            backgroundColor: `${BRAND.warning}0d`,
            borderColor: `${BRAND.warning}40`,
          }}
          data-testid="confirm-round-lock"
        >
          <p className="flex-1 text-[13px] font-semibold" style={{ color: BRAND.ink }}>
            {locked
              ? `سيتم فتح الجولة ${tournament.currentRound} للتعديل مرة أخرى. متابعة؟`
              : `سيتم إغلاق الجولة ${tournament.currentRound} ومنع تعديل النتائج. متابعة؟`}
          </p>
          <button
            type="button"
            onClick={() => {
              onToggleLock(!locked);
              setConfirmLock(false);
            }}
            className={`${BTN.base} ${BTN.primary} ${BTN_SIZE.md}`}
            style={BTN_PRIMARY_STYLE}
            data-testid="button-confirm-round-lock"
          >
            تأكيد
          </button>
          <button
            type="button"
            onClick={() => setConfirmLock(false)}
            className={`${BTN.base} ${BTN.secondary} ${BTN_SIZE.md}`}
          >
            إلغاء
          </button>
        </div>
      )}

      {/* Smart alerts */}
      {alerts.length > 0 && (
        <section
          className="rounded-2xl bg-white border shadow-sm p-4"
          style={{ borderColor: BRAND.border }}
          data-testid="smart-alerts"
        >
          <h3
            className="font-bold text-[14px] mb-3 flex items-center gap-2"
            style={{ color: BRAND.ink }}
          >
            <AlertTriangle className="w-4 h-4" style={{ color: BRAND.warning }} />
            تنبيهات
          </h3>
          <div className="space-y-2">
            {alerts.flatMap(({ match, missing }) =>
              missing.map((judge) => (
                <div
                  key={`${match.id}-${judge}`}
                  className="flex items-center gap-3 flex-wrap rounded-xl border p-3"
                  style={{
                    borderColor: `${BRAND.warning}33`,
                    backgroundColor: `${BRAND.warning}0a`,
                  }}
                >
                  <div className="flex-1 min-w-[10rem]">
                    <p className="font-bold text-[13px]" style={{ color: BRAND.ink }}>
                      {match.roomLabel?.trim() || `القاعة ${match.roomNumber}`}
                    </p>
                    <p className="text-[12.5px] mt-0.5" style={{ color: `${BRAND.ink}99` }}>
                      بانتظار نتيجة المحكم {judge}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemindJudge(judge, match)}
                    className={`${BTN.base} ${BTN.secondary} ${BTN_SIZE.sm}`}
                    data-testid={`button-remind-${match.roomNumber}`}
                  >
                    <BellRing className="w-3.5 h-3.5" />
                    إرسال تذكير
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {/* Room state list */}
      <section
        className="rounded-2xl bg-white border shadow-sm overflow-hidden"
        style={{ borderColor: BRAND.border }}
      >
        <div className="px-4 py-3 border-b" style={{ borderColor: BRAND.border }}>
          <h3 className="font-bold text-[14px]" style={{ color: BRAND.ink }}>
            حالة القاعات
          </h3>
        </div>

        {rows.length === 0 ? (
          <p
            className="text-[13px] text-center py-10"
            style={{ color: `${BRAND.ink}8c` }}
          >
            لا توجد قاعات في الجولة الحالية.
          </p>
        ) : (
          <ul>
            {rows.map(({ match, status }) => {
              const meta = roomStatusMeta(status);
              return (
                <li
                  key={match.id}
                  className="px-4 py-3 border-b last:border-b-0 flex items-center gap-3 flex-wrap
                             hover:bg-[#7B2D8E]/[0.03] transition-colors"
                  style={{ borderColor: BRAND.border }}
                  data-testid={`control-room-${match.roomNumber}`}
                >
                  <span
                    aria-hidden
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: meta.dot, boxShadow: `0 0 8px ${meta.dot}` }}
                  />
                  <div className="flex-1 min-w-[9rem]">
                    <p className="font-bold text-[13.5px]" style={{ color: BRAND.ink }}>
                      {match.roomLabel?.trim() || `قاعة ${match.roomNumber}`}
                    </p>
                    <p className="text-[12px] truncate" style={{ color: `${BRAND.ink}99` }}>
                      {teamName(match.team1.teamId)} × {teamName(match.team2.teamId)}
                    </p>
                  </div>
                  <RoomStatusBadge status={status} size="sm" />
                  <button
                    type="button"
                    onClick={() => onOpenMatch(match)}
                    className={`${BTN.base} ${BTN.secondary} ${BTN_SIZE.sm}`}
                    data-testid={`button-control-open-${match.roomNumber}`}
                  >
                    متابعة التحكيم
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
