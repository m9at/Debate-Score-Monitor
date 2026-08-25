import { useState, useEffect } from "react";
import { Check, Plus, UserCheck } from "lucide-react";
import {
  decodeJudgeRegisterToken,
  type JudgeRegistrationInfo,
} from "@/lib/judgeRegistrationCodec";
import { joinTournamentIdFromPath } from "@/lib/joinLink";
import {
  fetchPublicTournament,
  submitJudgeRegistration,
} from "@/lib/registrationsApi";
import {
  lookupProfile,
  registerForTournament,
  type JudgeProfileRecord,
} from "@/lib/profilesApi";
import { useRequiredFields } from "@/hooks/useRequiredFields";
import { labelOf } from "@/lib/registrationFields";
import ContactGate from "@/components/register/ContactGate";
import ReturningProfileCard from "@/components/register/ReturningProfileCard";

const CYAN = "#29ABE2";
const PURPLE = "#7B2D8E";

type Step = "contact" | "returning" | "form" | "done";

/**
 * Judge registration link (one per tournament, carries its id).
 *
 * The judge identifies themselves once; the API then either reuses their
 * permanent profile — greeting them and only asking for confirmation — or
 * creates it on this first visit.
 */
export default function JudgeRegisterPage() {
  const [info, setInfo] = useState<JudgeRegistrationInfo | null>(null);
  const [topic, setTopic] = useState("");
  const [error, setError] = useState(false);

  const [step, setStep] = useState<Step>("contact");
  const [busy, setBusy] = useState(false);
  const [warning, setWarning] = useState("");
  const [reused, setReused] = useState(false);

  const [contact, setContact] = useState("");
  const [profile, setProfile] = useState<JudgeProfileRecord | null>(null);
  const [previousCount, setPreviousCount] = useState(0);

  const [name, setName] = useState("");
  const [institution, setInstitution] = useState("");
  const [experience, setExperience] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [canChair, setCanChair] = useState(false);
  // Fields the organiser marked mandatory for this tournament's judge link.
  const requiredFields = useRequiredFields(info?.tournamentId, "judge");

  useEffect(() => {
    // Either the per-tournament path link, or an older `?d=` token link.
    const pathId = joinTournamentIdFromPath("judges");
    const d = new URLSearchParams(window.location.search).get("d");
    const parsed: JudgeRegistrationInfo | null = pathId
      ? { tournamentId: pathId, tournamentName: "" }
      : d
        ? decodeJudgeRegisterToken(d)
        : null;
    if (!parsed) {
      setError(true);
      return;
    }
    setInfo(parsed);
    void fetchPublicTournament(parsed.tournamentId).then((pub) => {
      // The server is the authority on whether this tournament exists.
      if (!pub) {
        setError(true);
        return;
      }
      if (pub.topic) setTopic(pub.topic);
      if (pub.name) setInfo((p) => (p ? { ...p, tournamentName: pub.name } : p));
    });
  }, []);

  /** Step 1 — recognise the judge by their contact. */
  const handleContact = async (value: string) => {
    setContact(value);
    setBusy(true);
    setWarning("");
    try {
      const found = await lookupProfile<JudgeProfileRecord>("judge", value);
      if (found.found) {
        setProfile(found.profile);
        setName(found.profile.name);
        setInstitution(found.profile.institution ?? "");
        setExperience(found.profile.experience ?? "");
        setPhotoUrl(found.profile.photoUrl ?? "");
        setPreviousCount(found.participations.length);
        setStep("returning");
      } else {
        setStep("form");
      }
    } catch {
      // Lookup failure must not block a first-time registration.
      setStep("form");
    } finally {
      setBusy(false);
    }
  };

  /** Steps 2/3 — join this tournament with the profile (new or existing). */
  const submit = async () => {
    if (!info) return;
    if (!name.trim()) {
      setWarning("الاسم مطلوب");
      return;
    }
    const missing = requiredFields.find((f) =>
      f === "institution"
        ? !institution.trim()
        : f === "experience"
          ? !experience.trim()
          : f === "photoUrl"
            ? !photoUrl.trim()
            : false,
    );
    if (missing) {
      setWarning(`${labelOf("judge", missing)} مطلوب`);
      return;
    }
    setWarning("");
    setBusy(true);
    try {
      const result = await registerForTournament<JudgeProfileRecord>(
        info.tournamentId,
        "judge",
        {
          name: name.trim(),
          contact,
          institution: institution.trim(),
          experience: experience.trim(),
          photoUrl: photoUrl.trim(),
          payload: { canChair, submittedAt: Date.now() },
        },
      );
      setReused(result.reused);
      // Mirror into the organiser's approval queue so their panel is in sync.
      await submitJudgeRegistration(info.tournamentId, {
        name: name.trim(),
        institution: institution.trim(),
        experience: experience.trim(),
        canChair,
        submittedAt: Date.now(),
      }).catch(() => {});
      setStep("done");
    } catch (e) {
      setWarning(
        String(e).includes("registration_closed")
          ? "تسجيل المحكمين مغلق حالياً في هذه البطولة."
          : "تعذّر إرسال التسجيل. تحقق من اتصالك ثم حاول مجدداً.",
      );
    } finally {
      setBusy(false);
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

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header info={info} topic={topic} />
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {step === "contact" && (
          <ContactGate
            title="تسجيل الدخول كمحكم"
            hint="أدخل رقم هاتفك أو بريدك — إن كان لديك ملف محكم سنتعرّف عليه مباشرة."
            submitting={busy}
            onSubmit={handleContact}
          />
        )}

        {step === "returning" && profile && (
          <ReturningProfileCard
            name={profile.name}
            photoUrl={profile.photoUrl}
            tournamentName={info.tournamentName}
            roleLabel="كمحكم"
            previousCount={previousCount}
            submitting={busy}
            onConfirm={submit}
            onEdit={() => setStep("form")}
          />
        )}

        {step === "form" && (
          <div className="bg-card rounded-2xl p-4 space-y-3">
            <p className="text-muted-foreground text-sm">
              {profile
                ? "عدّل بياناتك ثم أكّد المشاركة."
                : "أول تسجيل لك — سيُنشأ ملف محكم دائم تستخدمه في كل البطولات القادمة."}
            </p>
            <Text label="الاسم الكامل" value={name} onChange={setName} testId="input-judge-name" placeholder="مثال: د. سلمى الراشدية" />
            <Text label="المؤسسة" value={institution} onChange={setInstitution} testId="input-judge-institution" placeholder="مثال: جامعة السلطان قابوس" />
            <Text
              label="رابط الصورة الشخصية (اختياري)"
              value={photoUrl}
              onChange={setPhotoUrl}
              testId="input-judge-photo"
              placeholder="https://..."
            />
            <div>
              <label className="text-sm font-bold block mb-1.5">الخبرة في التحكيم</label>
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

            <button
              onClick={submit}
              disabled={busy}
              className="w-full h-14 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ backgroundColor: PURPLE }}
              data-testid="button-submit-judge-registration"
            >
              <Plus className="w-5 h-5" />
              {busy ? "جارٍ الإرسال..." : profile ? "تأكيد المشاركة" : "إنشاء ملف المحكم"}
            </button>
          </div>
        )}

        {step === "done" && (
          <div className="bg-card rounded-2xl p-6 text-center">
            <div
              className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-3"
              style={{ backgroundColor: "#34C75926" }}
            >
              <Check className="w-8 h-8" style={{ color: "#34C759" }} />
            </div>
            <h2 className="text-lg font-bold mb-1">
              {reused ? "تم تأكيد مشاركتك" : "تم إنشاء ملف المحكم"}
            </h2>
            <p className="text-sm text-muted-foreground">
              ظهرت مشاركتك في لوحة إدارة البطولة بحالة «بانتظار الاعتماد».
            </p>
          </div>
        )}

        {warning && step !== "done" && (
          <div className="bg-destructive/10 text-destructive text-sm font-medium p-3 rounded-xl">
            {warning}
          </div>
        )}
      </main>
    </div>
  );
}

function Text({
  label,
  value,
  onChange,
  placeholder,
  testId,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  testId?: string;
}) {
  return (
    <div>
      <label className="text-sm font-bold block mb-1.5">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-11 px-3 rounded-xl bg-muted outline-none"
        data-testid={testId}
      />
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
        <p className="text-white/85 text-xs mt-0.5">تسجيل المحكمين</p>
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
