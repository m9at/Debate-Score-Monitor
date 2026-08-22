import { useState, useEffect } from "react";
import { Trophy, Plus, Trash2, FileText, Upload, Check } from "lucide-react";
import {
  decodeRegisterToken,
  type RegistrationInfo,
} from "@/lib/registrationCodec";
import {
  fetchPublicTournament,
  submitTeamRegistration,
} from "@/lib/registrationsApi";
import type { TeamDocument } from "@/types/tournament";

const CYAN = "#29ABE2";
const PURPLE = "#7B2D8E";

const MAX_FILE_SIZE = 800 * 1024;

export default function RegisterPage() {
  const [info, setInfo] = useState<RegistrationInfo | null>(null);
  const [topic, setTopic] = useState<string>("");
  const [error, setError] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [teamName, setTeamName] = useState("");
  const [institution, setInstitution] = useState("");
  const [speakersPerTeam, setSpeakersPerTeam] = useState<3 | 4>(3);
  const [speakerNames, setSpeakerNames] = useState<string[]>(["", "", ""]);
  const [documents, setDocuments] = useState<TeamDocument[]>([]);
  const [warning, setWarning] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const d = params.get("d");
    if (!d) {
      setError(true);
      return;
    }
    const parsed = decodeRegisterToken(d);
    if (!parsed) {
      setError(true);
      return;
    }
    setInfo(parsed);
    void fetchPublicTournament(parsed.tournamentId).then((pub) => {
      if (pub?.topic) setTopic(pub.topic);
      if (pub?.name) {
        setInfo((prev) => (prev ? { ...prev, tournamentName: pub.name } : prev));
      }
    });
  }, []);

  const updateCount = (n: 3 | 4) => {
    setSpeakersPerTeam(n);
    setSpeakerNames((prev) => {
      const next = [...prev];
      while (next.length < n) next.push("");
      return next.slice(0, n);
    });
  };

  const handleFile = (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      setWarning(`الملف "${file.name}" كبير جداً (الحد الأقصى 800KB)`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setDocuments((prev) => [
        ...prev,
        { name: file.name, type: file.type, dataUrl },
      ]);
      setWarning("");
    };
    reader.readAsDataURL(file);
  };

  const removeDoc = (idx: number) => {
    setDocuments((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!info) return;
    if (!teamName.trim()) {
      setWarning("اسم الفريق مطلوب");
      return;
    }
    if (!institution.trim()) {
      setWarning("اسم المؤسسة مطلوب");
      return;
    }
    if (speakerNames.some((s) => !s.trim())) {
      setWarning("يجب إدخال أسماء جميع المتحدثين");
      return;
    }
    setWarning("");
    setSubmitting(true);
    try {
      await submitTeamRegistration(info.tournamentId, {
        teamName: teamName.trim(),
        institution: institution.trim(),
        speakersPerTeam,
        speakerNames: speakerNames.map((s) => s.trim()),
        documents,
        submittedAt: Date.now(),
      });
      setSubmitted(true);
    } catch {
      setWarning("تعذّر إرسال التسجيل. تحقق من اتصالك ثم حاول مجدداً.");
    } finally {
      setSubmitting(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 text-center" dir="rtl">
        <div className="max-w-md">
          <div className="text-5xl mb-3">⚠️</div>
          <h1 className="text-xl font-bold mb-2">رابط غير صالح</h1>
          <p className="text-muted-foreground">الرابط غير صحيح أو منتهي الصلاحية.</p>
        </div>
      </div>
    );
  }

  if (!info) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <p className="text-muted-foreground">جارٍ التحميل...</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <Header info={info} topic={topic} />
        <main className="max-w-2xl mx-auto px-4 py-6">
          <div className="bg-card rounded-2xl p-6 text-center">
            <div
              className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-3"
              style={{ backgroundColor: "#34C75926" }}
            >
              <Check className="w-8 h-8" style={{ color: "#34C759" }} />
            </div>
            <h2 className="text-lg font-bold mb-1">تم استلام طلب التسجيل</h2>
            <p className="text-sm text-muted-foreground">
              ظهر طلبك في قائمة طلبات التسجيل لدى المنظم وسيتم اعتماده قريباً.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header info={info} topic={topic} />
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <div className="bg-card rounded-2xl p-4 space-y-3">
          <div>
            <label className="text-sm font-bold block mb-1.5">اسم المؤسسة</label>
            <input
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              placeholder="مثال: جامعة السلطان قابوس"
              className="w-full h-11 px-3 rounded-xl bg-muted outline-none"
              data-testid="input-institution"
            />
          </div>
          <div>
            <label className="text-sm font-bold block mb-1.5">اسم الفريق</label>
            <input
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="مثال: فريق الفصاحة"
              className="w-full h-11 px-3 rounded-xl bg-muted outline-none"
              data-testid="input-team-name"
            />
          </div>
          <div>
            <label className="text-sm font-bold block mb-1.5">عدد المتحدثين</label>
            <div className="flex gap-2">
              {[3, 4].map((n) => (
                <button
                  key={n}
                  onClick={() => updateCount(n as 3 | 4)}
                  className="flex-1 h-11 rounded-xl font-bold transition-colors"
                  style={{
                    backgroundColor:
                      speakersPerTeam === n ? CYAN : "var(--muted)",
                    color: speakersPerTeam === n ? "#fff" : undefined,
                  }}
                >
                  {n} متحدثين
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-4">
          <h3 className="text-sm font-bold mb-3">أسماء المتحدثين</h3>
          {speakerNames.map((name, i) => (
            <div key={i} className="flex items-center gap-2 mb-2">
              <span
                className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ backgroundColor: CYAN + "26", color: CYAN }}
              >
                {i + 1}
              </span>
              <input
                value={name}
                onChange={(e) => {
                  const next = [...speakerNames];
                  next[i] = e.target.value;
                  setSpeakerNames(next);
                }}
                placeholder={`اسم المتحدث ${i + 1}`}
                className="flex-1 h-10 px-3 rounded-xl bg-muted outline-none"
                data-testid={`input-speaker-${i}`}
              />
            </div>
          ))}
        </div>

        <div className="bg-card rounded-2xl p-4">
          <h3 className="text-sm font-bold mb-1">المستندات</h3>
          <p className="text-xs text-muted-foreground mb-3">
            يمكنك إرفاق مستندات داعمة (هويات، شهادات…) — حد أقصى 800KB لكل ملف.
          </p>
          {documents.map((doc, i) => (
            <div
              key={i}
              className="flex items-center gap-2 p-2 rounded-xl bg-muted mb-2"
            >
              <FileText className="w-5 h-5 flex-shrink-0" style={{ color: PURPLE }} />
              <span className="flex-1 text-sm truncate" title={doc.name}>
                {doc.name}
              </span>
              <button
                onClick={() => removeDoc(i)}
                aria-label="حذف"
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </button>
            </div>
          ))}
          <label className="flex items-center justify-center gap-2 h-11 rounded-xl border-2 border-dashed border-border cursor-pointer hover:bg-muted/50">
            <Upload className="w-4 h-4" style={{ color: PURPLE }} />
            <span className="text-sm font-medium">إرفاق ملف</span>
            <input
              type="file"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.target.value = "";
              }}
              accept="image/*,application/pdf"
              data-testid="input-file"
            />
          </label>
        </div>

        {warning && (
          <div className="bg-destructive/10 text-destructive text-sm font-medium p-3 rounded-xl">
            {warning}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full h-14 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 disabled:opacity-60"
          style={{
            backgroundColor: PURPLE,
            boxShadow: "0 4px 14px rgba(123,94,167,0.4)",
          }}
          data-testid="button-submit-registration"
        >
          <Plus className="w-5 h-5" />
          {submitting ? "جارٍ الإرسال..." : "تسجيل الفريق"}
        </button>
      </main>
    </div>
  );
}

function Header({ info, topic }: { info: RegistrationInfo; topic: string }) {
  return (
    <div className="relative pt-6 pb-5 overflow-hidden">
      <div className="absolute inset-0 left-0" style={{ right: "35%", backgroundColor: CYAN }} />
      <div className="absolute inset-0 right-0" style={{ left: "65%", backgroundColor: PURPLE }} />
      <div className="relative max-w-2xl mx-auto px-4 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/20 mb-2">
          <Trophy className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-white font-bold text-lg">{info.tournamentName}</h1>
        <p className="text-white/85 text-xs mt-0.5">تسجيل فريق جديد</p>
        {topic && (
          <div className="mt-3 mx-auto max-w-xl bg-white/15 backdrop-blur-sm rounded-xl px-3 py-2 text-white text-sm leading-relaxed">
            <span className="font-bold ml-1">موضوع البطولة:</span>
            {topic}
          </div>
        )}
      </div>
    </div>
  );
}
