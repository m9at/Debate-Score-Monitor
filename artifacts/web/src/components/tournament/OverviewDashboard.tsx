import { useMemo } from "react";
import {
  Gavel,
  LayoutGrid,
  ListChecks,
  Megaphone,
  Repeat,
  Trophy,
  Users,
} from "lucide-react";
import type { Match, Tournament } from "@/types/tournament";
import { BRAND, BRAND_GRADIENT, BTN, BTN_PRIMARY_STYLE, BTN_SIZE } from "@/lib/brand";
import { getRoomStatus, roomStatusMeta, type RoomStatus } from "@/lib/roomStatus";
import PublicRoomCard from "./PublicRoomCard";

interface OverviewDashboardProps {
  tournament: Tournament;
  onOpenRounds: () => void;
  onFollowJudging: () => void;
  onRoomDetails: (match: Match) => void;
  onAnnounce: () => void;
}

/** Small metric tile — counts only, never scores. */
function StatCard({
  icon: Icon,
  value,
  label,
  tone,
}: {
  icon: typeof Users;
  value: string | number;
  label: string;
  tone: string;
}) {
  return (
    <div
      className="rounded-2xl bg-white border shadow-sm p-4 flex items-center gap-3
                 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
      style={{ borderColor: BRAND.border }}
      data-testid={`stat-${label}`}
    >
      <span
        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${tone}14` }}
      >
        <Icon className="w-5 h-5" style={{ color: tone }} />
      </span>
      <div className="min-w-0">
        <p
          className="font-bold text-2xl leading-none tabular-nums"
          style={{ color: BRAND.ink }}
        >
          {value}
        </p>
        <p className="text-[12px] font-semibold mt-1" style={{ color: `${BRAND.ink}8c` }}>
          {label}
        </p>
      </div>
    </div>
  );
}

/**
 * The tournament's landing screen: where we are, how far along, and the state of
 * every room. Contains no scores so it is safe to project in front of an audience.
 */
export default function OverviewDashboard({
  tournament,
  onOpenRounds,
  onFollowJudging,
  onRoomDetails,
  onAnnounce,
}: OverviewDashboardProps) {
  const currentRound = tournament.rounds[tournament.currentRound - 1];
  const matches = currentRound?.matches ?? [];

  const teamMap = useMemo(
    () => new Map(tournament.teams.map((t) => [t.id, { name: t.name }])),
    [tournament.teams]
  );

  const statuses = useMemo(() => {
    const pending = tournament.pendingResults ?? [];
    const expectedJudges =
      currentRound?.judgesPerRoom ?? tournament.settings?.judgesPerRoom ?? 0;
    return matches.map((m) => ({
      match: m,
      status: getRoomStatus({ match: m, pending, expectedJudges }),
    }));
  }, [matches, tournament.pendingResults, tournament.settings, currentRound]);

  const counts = useMemo(() => {
    const c = {} as Record<RoomStatus, number>;
    for (const { status } of statuses) c[status] = (c[status] ?? 0) + 1;
    return c;
  }, [statuses]);

  const roomsCount = tournament.rooms?.length ?? matches.length;
  const judgesCount = (tournament.judges ?? []).filter((j) => !j.disabled).length;
  const progress =
    tournament.totalRounds > 0
      ? Math.min(100, (tournament.currentRound / tournament.totalRounds) * 100)
      : 0;

  const readyToAnnounce = statuses.filter((s) => s.status === "ready").length;

  return (
    <div className="space-y-5">
      {/* Hero: name + round progress */}
      <section
        className="rounded-2xl p-5 md:p-6 relative overflow-hidden shadow-sm"
        style={{ backgroundImage: BRAND_GRADIENT }}
        data-testid="dashboard-hero"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 -left-10 w-64 h-64 rounded-full bg-white/10 blur-3xl"
        />
        <div className="relative flex items-start gap-4 flex-wrap">
          {tournament.logoDataUrl && (
            <img
              src={tournament.logoDataUrl}
              alt=""
              className="w-14 h-14 rounded-xl object-contain shrink-0"
            />
          )}
          <div className="flex-1 min-w-[12rem]">
            <h2 className="text-white font-bold text-xl md:text-3xl leading-tight">
              {tournament.name}
            </h2>
            <p className="text-white/75 text-[13px] font-semibold mt-1.5">
              {tournament.started
                ? `الجولة الحالية: ${tournament.currentRound} من ${tournament.totalRounds}`
                : "قيد الإعداد — لم تبدأ الجولات بعد"}
            </p>
          </div>

          <button
            type="button"
            onClick={onAnnounce}
            className={`${BTN.base} ${BTN_SIZE.lg} shrink-0 bg-white text-[#5D1F6D]
                        shadow-md hover:shadow-lg hover:brightness-105`}
            data-testid="button-dashboard-announce"
          >
            <Megaphone className="w-4 h-4" />
            إعلان نتائج الجولة
            {readyToAnnounce > 0 && (
              <span
                className="min-w-[20px] h-5 px-1.5 rounded-full text-[11px] text-white
                           flex items-center justify-center"
                style={{ backgroundColor: BRAND.success }}
              >
                {readyToAnnounce}
              </span>
            )}
          </button>
        </div>

        {/* Progress bar */}
        <div className="relative mt-5">
          <div className="h-2.5 rounded-full bg-white/20 overflow-hidden">
            <div
              className="h-full rounded-full bg-white transition-all duration-700"
              style={{ width: `${progress}%` }}
              data-testid="progress-rounds"
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-white/60 text-[11px] font-bold">
              {Math.round(progress)}% من الجولات
            </span>
            <span className="text-white/60 text-[11px] font-bold">
              {tournament.totalRounds} جولات
            </span>
          </div>
        </div>
      </section>

      {/* Stat cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <StatCard icon={LayoutGrid} value={roomsCount} label="القاعات" tone={BRAND.blue} />
        <StatCard icon={Users} value={tournament.teams.length} label="الفِرق" tone={BRAND.purple} />
        <StatCard icon={Gavel} value={judgesCount} label="المحكمون" tone={BRAND.blueDeep} />
        <StatCard
          icon={Repeat}
          value={tournament.started ? `الجولة ${tournament.currentRound}` : "—"}
          label="الجولة الحالية"
          tone={BRAND.gold}
        />
      </section>

      {/* Current round status */}
      {tournament.started && matches.length > 0 && (
        <section
          className="rounded-2xl bg-white border shadow-sm p-4 md:p-5"
          style={{ borderColor: BRAND.border }}
          data-testid="round-status"
        >
          <div className="flex items-center gap-2.5 mb-3.5 flex-wrap">
            <h3 className="font-bold text-[15px]" style={{ color: BRAND.ink }}>
              حالة الجولة الحالية
            </h3>
            <span className="flex-1" />
            <button
              type="button"
              onClick={onFollowJudging}
              className={`${BTN.base} ${BTN.secondary} ${BTN_SIZE.md}`}
              data-testid="button-open-control-center"
            >
              <ListChecks className="w-4 h-4" />
              مركز تحكم الجولة
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {(Object.keys(counts) as RoomStatus[]).map((key) => {
              const meta = roomStatusMeta(key);
              return (
                <span
                  key={key}
                  className="inline-flex items-center gap-2 h-8 px-3 rounded-xl text-[12.5px] font-bold"
                  style={{ backgroundColor: meta.bg, color: meta.fg }}
                  data-testid={`round-count-${key}`}
                >
                  <span
                    aria-hidden
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: meta.dot }}
                  />
                  {counts[key]} {counts[key] === 1 ? "قاعة" : "قاعات"} — {meta.label}
                </span>
              );
            })}
          </div>
        </section>
      )}

      {/* Rooms */}
      <section>
        <div className="flex items-center gap-2.5 mb-3 flex-wrap">
          <h3 className="font-bold text-[15px]" style={{ color: BRAND.ink }}>
            قاعات الجولة {tournament.started ? tournament.currentRound : ""}
          </h3>
          <span className="flex-1" />
          <button
            type="button"
            onClick={onOpenRounds}
            className={`${BTN.base} ${BTN.secondary} ${BTN_SIZE.md}`}
            data-testid="button-open-rounds"
          >
            <Repeat className="w-4 h-4" />
            إدارة الجولات
          </button>
        </div>

        {matches.length === 0 ? (
          <div
            className="rounded-2xl bg-white border shadow-sm py-12 flex flex-col items-center
                       gap-2.5 text-center px-6"
            style={{ borderColor: BRAND.border }}
            data-testid="empty-rooms"
          >
            <span
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-1"
              style={{ backgroundColor: `${BRAND.purple}12` }}
            >
              <Trophy className="w-7 h-7" style={{ color: BRAND.purple }} />
            </span>
            <p className="font-bold text-[15px]" style={{ color: BRAND.ink }}>
              لا توجد قاعات في الجولة الحالية
            </p>
            <p className="text-[12.5px] max-w-sm" style={{ color: `${BRAND.ink}8c` }}>
              ابدأ الجولة الأولى من صفحة الجولات ليتم توزيع الفرق على القاعات.
            </p>
            <button
              type="button"
              onClick={onOpenRounds}
              className={`${BTN.base} ${BTN.primary} ${BTN_SIZE.lg} mt-2`}
              style={BTN_PRIMARY_STYLE}
              data-testid="button-empty-open-rounds"
            >
              <Repeat className="w-4 h-4" />
              الانتقال إلى الجولات
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3.5">
            {statuses.map(({ match, status }) => (
              <PublicRoomCard
                key={match.id}
                match={match}
                status={status}
                teamMap={teamMap}
                onDetails={() => onRoomDetails(match)}
                onFollowJudging={onFollowJudging}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
