import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useTournament } from "@/context/TournamentContext";
import { useGroups } from "@/context/GroupContext";
import { useToast } from "@/hooks/use-toast";
import { WIZARD_STEPS, emptySetup, type TournamentSetup } from "@/lib/wizard/types";
import { deleteDraft, fetchDraft, saveDraft } from "@/lib/draftsApi";
import WizardShell from "@/components/wizard/WizardShell";
import StepInfo from "@/components/wizard/StepInfo";
import StepOrganise from "@/components/wizard/StepOrganise";
import StepProtection from "@/components/wizard/StepProtection";
import StepRooms from "@/components/wizard/StepRooms";
import StepJudges from "@/components/wizard/StepJudges";
import StepTeams from "@/components/wizard/StepTeams";
import StepSystem from "@/components/wizard/StepSystem";
import StepDraw from "@/components/wizard/StepDraw";
import StepReview from "@/components/wizard/StepReview";

const STEP_META: Record<
  string,
  { title: string; hint: string }
> = {
  info: {
    title: "معلومات البطولة",
    hint: "البيانات الأساسية التي تُعرّف البطولة",
  },
  organise: {
    title: "المجلد والقضية",
    hint: "مكان البطولة في المجلدات، الجولة التي تبدأ منها، ونص القضية",
  },
  protection: {
    title: "حماية البطولة",
    hint: "حدد الآن من يستطيع تعديل البطولة — يمكن تغييره لاحقاً",
  },
  rooms: {
    title: "القاعات",
    hint: "أنشئ قاعات البطولة وسمّها قبل البدء",
  },
  judges: {
    title: "المحكمون",
    hint: "أضف المحكمين المشاركين في البطولة",
  },
  teams: {
    title: "الفِرق المشاركة",
    hint: "إضافة سريعة — اسم الفريق والمتحدثون",
  },
  system: {
    title: "نظام البطولة",
    hint: "قواعد المناظرة ونطاق الدرجات",
  },
  draw: {
    title: "توزيع الجولة الأولى",
    hint: "توزيع تلقائي للفرق والقاعات والمحكمين مع مراجعة قبل الاعتماد",
  },
  review: {
    title: "مراجعة البطولة",
    hint: "تأكد من كل التفاصيل قبل الإنشاء",
  },
};

/**
 * Multi-step tournament creation wizard. The tournament itself is only created
 * on the last step, but progress is continuously saved online as a draft, so
 * leaving the wizard never loses work — `?draft=<id>` resumes it.
 */
export default function TournamentNewPage() {
  const [, navigate] = useLocation();
  const { createTournamentFromSetup } = useTournament();
  const { groups, moveTournamentToGroup } = useGroups();
  const { toast } = useToast();

  const [stepIndex, setStepIndex] = useState(0);
  const [setup, setSetup] = useState<TournamentSetup>(emptySetup);
  const [confirmCode, setConfirmCode] = useState("");
  const resumeId = new URLSearchParams(window.location.search).get("draft");
  const [loading, setLoading] = useState(!!resumeId);
  /** Drafts are only written once the tournament has a name worth listing. */
  const savable = setup.name.trim().length > 1;

  // Resume an unfinished draft.
  useEffect(() => {
    if (!resumeId) return;
    let alive = true;
    fetchDraft(resumeId)
      .then((row) => {
        if (!alive || !row) return;
        setSetup(row.setup);
        setStepIndex(Math.min(row.stepIndex, WIZARD_STEPS.length - 1));
        setConfirmCode(row.setup.protection?.code ?? "");
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [resumeId]);

  // Autosave progress — debounced so typing doesn't hammer the API.
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    if (loading || !savable) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveDraft(setup, stepIndex).catch(() => {});
    }, 800);
    return () => clearTimeout(saveTimer.current);
  }, [setup, stepIndex, loading, savable]);

  const patch = (p: Partial<TournamentSetup>) =>
    setSetup((prev) => ({ ...prev, ...p }));

  const stepKey = WIZARD_STEPS[stepIndex].key;
  const isLast = stepIndex === WIZARD_STEPS.length - 1;

  /** Per-step gate for the "next" button. */
  const canGoNext = (() => {
    switch (stepKey) {
      case "info":
        return setup.name.trim().length > 1 && setup.totalRounds >= 1;
      case "protection": {
        const { enabled, code } = setup.protection;
        if (!enabled) return true;
        return code.length >= 4 && code.length <= 6 && code === confirmCode;
      }
      case "system":
        return setup.settings.scoreMax > setup.settings.scoreMin;
      default:
        return true;
    }
  })();

  const create = () => {
    const id = createTournamentFromSetup(setup);
    deleteDraft(setup.draftId).catch(() => {});
    if (setup.folderId) moveTournamentToGroup(id, setup.folderId);
    toast({
      title: "تم إنشاء البطولة",
      description: setup.drawApproved
        ? "التوزيع معتمد والجولة الأولى جاهزة"
        : "يمكنك إجراء التوزيع من داخل البطولة",
    });
    navigate(`/tournament/${id}`);
  };

  const onNext = () => {
    if (isLast) return create();
    setStepIndex((i) => Math.min(i + 1, WIZARD_STEPS.length - 1));
  };

  /** Closing the wizard saves, never discards. */
  const onCancel = async () => {
    if (savable) {
      clearTimeout(saveTimer.current);
      await saveDraft(setup, stepIndex).catch(() => {});
      toast({
        title: "تم الحفظ كمسودة",
        description: `يمكنك متابعة إنشاء «${setup.name.trim()}» من لوحة البطولات`,
      });
    }
    navigate("/");
  };

  const onBack = () => {
    if (stepIndex === 0) return void onCancel();
    setStepIndex((i) => i - 1);
  };

  const meta = STEP_META[stepKey];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm">
        جارٍ تحميل المسودة…
      </div>
    );
  }

  return (
    <WizardShell
      stepIndex={stepIndex}
      title={meta.title}
      hint={meta.hint}
      canGoNext={canGoNext}
      nextLabel={isLast ? "إنشاء البطولة" : "التالي"}
      onBack={onBack}
      onNext={onNext}
      onCancel={onCancel}
    >
      {stepKey === "info" && <StepInfo setup={setup} patch={patch} />}
      {stepKey === "organise" && <StepOrganise setup={setup} patch={patch} />}
      {stepKey === "protection" && (
        <StepProtection
          setup={setup}
          patch={patch}
          confirmCode={confirmCode}
          onConfirmCodeChange={setConfirmCode}
        />
      )}
      {stepKey === "rooms" && <StepRooms setup={setup} patch={patch} />}
      {stepKey === "judges" && <StepJudges setup={setup} patch={patch} />}
      {stepKey === "teams" && <StepTeams setup={setup} patch={patch} />}
      {stepKey === "system" && <StepSystem setup={setup} patch={patch} />}
      {stepKey === "draw" && <StepDraw setup={setup} patch={patch} />}
      {stepKey === "review" && (
        <StepReview
          setup={setup}
          folderName={groups.find((g) => g.id === setup.folderId)?.name}
        />
      )}
    </WizardShell>
  );
}
