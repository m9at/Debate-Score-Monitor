import { useState } from "react";
import { useLocation } from "wouter";
import { useTournament } from "@/context/TournamentContext";
import { useGroups } from "@/context/GroupContext";
import { useToast } from "@/hooks/use-toast";
import { WIZARD_STEPS, emptySetup, type TournamentSetup } from "@/lib/wizard/types";
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

/** Multi-step tournament creation wizard — nothing is saved until the last step. */
export default function TournamentNewPage() {
  const [, navigate] = useLocation();
  const { createTournamentFromSetup } = useTournament();
  const { groups, moveTournamentToGroup } = useGroups();
  const { toast } = useToast();

  const [stepIndex, setStepIndex] = useState(0);
  const [setup, setSetup] = useState<TournamentSetup>(emptySetup);
  const [confirmCode, setConfirmCode] = useState("");

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

  const onBack = () => {
    if (stepIndex === 0) return navigate("/");
    setStepIndex((i) => i - 1);
  };

  const meta = STEP_META[stepKey];

  return (
    <WizardShell
      stepIndex={stepIndex}
      title={meta.title}
      hint={meta.hint}
      canGoNext={canGoNext}
      nextLabel={isLast ? "إنشاء البطولة" : "التالي"}
      onBack={onBack}
      onNext={onNext}
      onCancel={() => navigate("/")}
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
