import { useState, useEffect } from "react";
import { Trophy, Plus, Check, UserCheck } from "lucide-react";
import {
  decodeJudgeRegisterToken,
  type JudgeRegistrationInfo,
} from "@/lib/judgeRegistrationCodec";
import {
  fetchPublicTournament,
  submitJudgeRegistration,
} from "@/lib/registrationsApi";

const CYAN = "#29ABE2";
const PURPLE = "#7B2D8E";

export default function JudgeRegisterPage() {
  const [info, setInfo] = useState<JudgeRegistrationInfo | null>(null);
  const [topic, setTopic] = useState("");
  const [error, setError] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [institution, setInstitution] = useState("");
  const [experience, setExperience] = useState("");
  const [canChair, setCanChair] = useState(false);
  const [warning, setWarning] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const d = params.get("d");
    if (!d) {
      setError(true);
      return;
    }
    const parsed = decodeJudgeRegisterToken(d);
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

  const handleSubmit = async () => {
    if (!info) return;
    if (!name.trim()) {
      setWarning("الاسم مطلوب");
      return;
    }
    setWarning("");
    setSubmitting(true);
    try {
      await submitJudgeRegistration(info.tournamentId, {
        name: name.trim(),
        institution: institution.trim(),
        experience: experience.trim(),
        canChair,
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
      <div
        className="min-h-screen bg-background flex items-center justify-center p-6 text-center"
        dir="rtl"
      >
        <div className="max-w-md">
          <div className="text-5xl mb-3">⚠️</div>
          <h1 className="text-xl font-bold mb-2">رابط غير صالح</h1>
          <p className="text-muted-foreground">
            الرابط غير صحيح أو منتهي الصلاحية.
          </p>
        </div>
      </div>
    );
  }

  if (!info) {
    return (
      <div
        className="min-h-screen bg-background flex items-center justify-center"
        dir="rtl"
      >
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
            <h2 className="text-lg font-bold mb-1">تم استلام طلب التحكيم</h2>
            <p className="text-sm text-muted-foreground">
              ظهر طلبك في قائمة طلبات التحكيم لدى المنظم وسيتم اعتماده قريباً.
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
            <label className="text-sm font-bold block mb-1.5">الاسم الكامل</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: د. سلمى الراشدية"
              className="w-full h-11 px-3 rounded-xl bg-muted outline-none"
              data-testid="input-judge-name"
            />
          </div>
          <div>
            <label className="text-sm font-bold block mb-1.5">المؤسسة</label>
            <input
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              placeholder="مثال: جامعة السلطان قابوس"
              className="w-full h-11 px-3 rounded-xl bg-muted outline-none"
              data-testid="input-judge-institution"
            />
          </div>
          <div>
            <label className="text-sm font-bold block mb-1.5">
              الخبرة في التحكيم
            </label>
            <textarea
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              placeholder="اذكر الخبرات والبطولات التي حكّمت فيها..."
              className="w-full p-3 rounded-xl bg-muted outline-none resize-none"
              style={{ minHeight: 110 }}
              data-testid="input-judge-experience"
            />
          </div>
          <button
            onClick={() => setCanChair((v) => !v)}
            className="w-full flex items-center gap-3 px-3 h-12 rounded-xl border transition-colors"
            style={{
              borderColor: canChair ? PURPLE : "var(--border)",
              backgroundColor: canChair ? PURPLE + "1f" : "var(--muted)",
            }}
            data-testid="toggle-judge-can-chair"
          >
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center"
              style={{
                backgroundColor: canChair ? PURPLE : "var(--card)",
                color: canChair ? "#fff" : "transparent",
              }}
            >
              <Check className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium flex-1 text-right">
              مؤهل لرئاسة الجلسة
            </span>
          </button>
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
          data-testid="button-submit-judge-registration"
        >
          <Plus className="w-5 h-5" />
          {submitting ? "جارٍ الإرسال..." : "تسجيل المحكم"}
        </button>
      </main>
    </div>
  );
}

function Header({
  info,
  topic,
}: {
  info: JudgeRegistrationInfo;
  topic: string;
}) {
  return (
    <div className="relative pt-6 pb-5 overflow-hidden">
      <div
        className="absolute inset-0 left-0"
        style={{ right: "35%", backgroundColor: CYAN }}
      />
      <div
        className="absolute inset-0 right-0"
        style={{ left: "65%", backgroundColor: PURPLE }}
      />
      <div className="relative max-w-2xl mx-auto px-4 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/20 mb-2">
          <UserCheck className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-white font-bold text-lg">{info.tournamentName}</h1>
        <p className="text-white/85 text-xs mt-0.5">تسجيل محكم جديد</p>
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
