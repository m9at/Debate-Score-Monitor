import { usePublicTournaments } from "@/hooks/usePublicTournaments";
import PublicShell from "@/components/public/PublicShell";
import PublicTournamentCard from "@/components/public/PublicTournamentCard";
import { BRAND } from "@/lib/brand";

/**
 * صفحة الجمهور الرئيسية — the whole platform in read-only form: every
 * tournament whose organiser allowed the audience to follow it. No creation, no
 * editing, no administration anywhere on the page.
 */
export default function PublicHomePage() {
  const { tournaments, loading, error } = usePublicTournaments();

  return (
    <PublicShell
      title="مناظرات عُمان"
      subtitle="البطولات المتاحة للجمهور — الجولات والقضايا والفرق ونتائج الجولات المعلنة"
    >
      {loading && (
        <p className="text-center py-16 font-bold" style={{ color: `${BRAND.ink}80` }}>
          جارٍ تحميل البطولات…
        </p>
      )}

      {error && (
        <p className="text-center py-16 font-bold" style={{ color: BRAND.danger }}>
          تعذّر تحميل البطولات. حدّث الصفحة للمحاولة مرة أخرى.
        </p>
      )}

      {tournaments && tournaments.length === 0 && (
        <p
          className="text-center py-16 font-bold"
          style={{ color: `${BRAND.ink}80` }}
          data-testid="public-empty"
        >
          لا توجد بطولات متاحة للجمهور حالياً.
        </p>
      )}

      {tournaments && tournaments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {tournaments.map((t) => (
            <PublicTournamentCard key={t.id} tournament={t} />
          ))}
        </div>
      )}
    </PublicShell>
  );
}
