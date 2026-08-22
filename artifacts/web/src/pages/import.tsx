import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { decodeAdminTournament } from "@/lib/registrationCodec";
import { useTournament } from "@/context/TournamentContext";
import type { Tournament } from "@/types/tournament";
import { ShieldCheck, AlertTriangle, Check } from "lucide-react";

const CYAN = "#29ABE2";
const PURPLE = "#7B2D8E";

export default function ImportPage() {
  const [, setLocation] = useLocation();
  const { tournaments, addImportedTournament } = useTournament();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [error, setError] = useState(false);
  const [imported, setImported] = useState(false);
  const [conflict, setConflict] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const d = params.get("d");
    if (!d) {
      setError(true);
      return;
    }
    const parsed = decodeAdminTournament(d);
    if (!parsed) {
      setError(true);
      return;
    }
    setTournament(parsed);
    if (tournaments.some((t) => t.id === parsed.id)) {
      setConflict(true);
    }
  }, [tournaments]);

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 text-center" dir="rtl">
        <div>
          <AlertTriangle className="w-12 h-12 mx-auto text-destructive mb-2" />
          <h1 className="text-xl font-bold mb-1">رابط غير صالح</h1>
          <p className="text-muted-foreground text-sm">
            الرابط غير صحيح أو لا يحتوي على بيانات صالحة.
          </p>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <p className="text-muted-foreground">جارٍ التحميل...</p>
      </div>
    );
  }

  const handleImport = () => {
    addImportedTournament(tournament, { overwrite: true });
    setImported(true);
    setTimeout(() => setLocation(`/tournament/${tournament.id}`), 600);
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="relative pt-6 pb-5 overflow-hidden">
        <div className="absolute inset-0 left-0" style={{ right: "35%", backgroundColor: CYAN }} />
        <div className="absolute inset-0 right-0" style={{ left: "65%", backgroundColor: PURPLE }} />
        <div className="relative max-w-md mx-auto px-4 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/20 mb-2">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-white font-bold text-lg">رابط الإدارة</h1>
          <p className="text-white/85 text-xs mt-0.5">
            تحكم كامل في البطولة من هذا الجهاز
          </p>
        </div>
      </div>

      <main className="max-w-md mx-auto px-4 py-6">
        <div className="bg-card rounded-2xl p-5 mb-4">
          <h2 className="text-base font-bold mb-3">{tournament.name}</h2>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-muted rounded-xl p-2">
              <div className="text-lg font-bold" style={{ color: CYAN }}>
                {tournament.teams.length}
              </div>
              <div className="text-[11px] text-muted-foreground">فريق</div>
            </div>
            <div className="bg-muted rounded-xl p-2">
              <div className="text-lg font-bold" style={{ color: PURPLE }}>
                {tournament.totalRounds}
              </div>
              <div className="text-[11px] text-muted-foreground">جولة</div>
            </div>
            <div className="bg-muted rounded-xl p-2">
              <div className="text-lg font-bold">
                {tournament.rounds.reduce((s, r) => s + r.matches.length, 0)}
              </div>
              <div className="text-[11px] text-muted-foreground">مباراة</div>
            </div>
          </div>
        </div>

        {conflict && !imported && (
          <div
            className="rounded-xl p-3 mb-4 text-sm flex items-start gap-2"
            style={{ backgroundColor: "#FF950015", color: "#946200" }}
          >
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>
              توجد بطولة بنفس المعرّف على هذا الجهاز. سيؤدي الاستيراد إلى استبدالها.
            </span>
          </div>
        )}

        <button
          onClick={handleImport}
          disabled={imported}
          className="w-full h-14 rounded-2xl text-white font-bold flex items-center justify-center gap-2 disabled:opacity-60"
          style={{
            backgroundColor: imported ? "#34C759" : PURPLE,
            boxShadow: "0 4px 14px rgba(123,94,167,0.4)",
          }}
          data-testid="button-import"
        >
          {imported ? (
            <>
              <Check className="w-5 h-5" />
              تم الاستيراد
            </>
          ) : (
            <>
              <ShieldCheck className="w-5 h-5" />
              استيراد البطولة وفتحها
            </>
          )}
        </button>
      </main>
    </div>
  );
}
