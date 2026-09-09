import { useEffect, useState } from "react";
import { Eye, Clock3, BarChart3, Trophy } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { fetchPublicStats, type PublicViewStats } from "@/lib/publicStatsApi";

/** "منذ دقيقتين" style relative time in Arabic. */
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "الآن";
  if (m < 60) return `منذ ${m} دقيقة`;
  const h = Math.floor(m / 60);
  if (h < 24) return `منذ ${h} ساعة`;
  return `منذ ${Math.floor(h / 24)} يوم`;
}

/**
 * إحصائيات الجمهور — admin-only insight into how much the audience follows this
 * tournament. Counted exclusively from وضع الجمهور.
 */
export default function PublicStatsPanel({
  tournamentId,
}: {
  tournamentId: string;
}) {
  const [stats, setStats] = useState<PublicViewStats | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const s = await fetchPublicStats(tournamentId);
      if (alive) setStats(s);
    };
    void load();
    const timer = window.setInterval(load, 30000);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, [tournamentId]);

  const topRound = stats
    ? Object.entries(stats.roundViews).sort((a, b) => b[1] - a[1])[0]
    : undefined;

  return (
    <section
      className="rounded-2xl border bg-white p-4 space-y-3"
      style={{ borderColor: BRAND.border }}
      data-testid="public-stats-panel"
    >
      <h2 className="text-[15px] font-bold" style={{ color: BRAND.ink }}>
        اهتمام الجمهور
      </h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat
          icon={<Eye className="w-4 h-4" />}
          label="الزوار الفريدون"
          value={stats ? String(stats.uniqueVisitors) : "…"}
          color={BRAND.purple}
        />
        <Stat
          icon={<BarChart3 className="w-4 h-4" />}
          label="إجمالي المشاهدات"
          value={stats ? String(stats.views) : "…"}
          color={BRAND.blue}
        />
        <Stat
          icon={<Trophy className="w-4 h-4" />}
          label="الجولة الأكثر مشاهدة"
          value={topRound ? `الجولة ${topRound[0]}` : "—"}
          color={BRAND.gold}
        />
        <Stat
          icon={<Clock3 className="w-4 h-4" />}
          label="آخر زيارة"
          value={stats?.lastViewAt ? timeAgo(stats.lastViewAt) : "—"}
          color={BRAND.inkSoft}
        />
      </div>

      <p className="text-[12px]" style={{ color: `${BRAND.ink}80` }}>
        تُحتسب من دخول الجمهور إلى وضع الجمهور فقط، ولا تُحتسب زيارات لوحة الإدارة.
        {stats ? ` · ${stats.resultViews} مرة فُتحت فيها صفحات النتائج.` : ""}
      </p>
    </section>
  );
}

function Stat({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div
      className="rounded-xl border p-3"
      style={{ borderColor: BRAND.border, backgroundColor: `${color}0a` }}
    >
      <p
        className="text-[11.5px] font-bold inline-flex items-center gap-1.5"
        style={{ color }}
      >
        {icon}
        {label}
      </p>
      <p
        className="text-[19px] font-black mt-1 tabular-nums"
        style={{ color: BRAND.ink }}
      >
        {value}
      </p>
    </div>
  );
}
