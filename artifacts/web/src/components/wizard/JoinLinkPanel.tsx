import { useEffect } from "react";
import { UserCheck, Users } from "lucide-react";
import { Panel } from "./ui";
import RegistrationLinkCard from "@/components/register/RegistrationLinkCard";
import { buildJoinUrl, type JoinRole } from "@/lib/joinLink";
import { publishTournament } from "@/lib/registrationsApi";

interface Props {
  role: JoinRole;
  /** Draft id — already the tournament's final id, so the link stays valid. */
  tournamentId: string;
  tournamentName: string;
  topic?: string;
}

const COPY: Record<JoinRole, { panel: string; hint: string; card: string; cardHint: string }> = {
  judges: {
    panel: "دعوة المحكمين",
    hint: "أرسل الرابط للمحكم — يسجّل نفسه ويظهر هنا تلقائياً",
    card: "رابط الانضمام للمحكمين",
    cardHint: "خاص بهذه البطولة فقط",
  },
  teams: {
    panel: "تسجيل الفرق",
    hint: "أرسل الرابط لمسؤول الفريق — يسجّل الفريق ويظهر هنا تلقائياً",
    card: "رابط تسجيل الفرق",
    cardHint: "خاص بهذه البطولة فقط",
  },
};

/**
 * The tournament's own invite link (+ QR) inside the creation wizard. The
 * tournament's public name/topic is upserted first so the link resolves for the
 * invitee even before the tournament is created.
 */
export default function JoinLinkPanel({
  role,
  tournamentId,
  tournamentName,
  topic,
}: Props) {
  const name = tournamentName.trim();

  useEffect(() => {
    if (!name) return;
    void publishTournament({ id: tournamentId, name, topic: topic ?? "" }).catch(
      () => {},
    );
  }, [tournamentId, name, topic]);

  const copy = COPY[role];

  if (!name) {
    return (
      <Panel title={copy.panel} hint={copy.hint}>
        <p className="text-[12.5px] text-neutral-500">
          اكتب اسم البطولة في الخطوة الأولى ليصبح الرابط جاهزاً.
        </p>
      </Panel>
    );
  }

  return (
    <Panel title={copy.panel} hint={copy.hint}>
      <RegistrationLinkCard
        title={copy.card}
        hint={copy.cardHint}
        icon={role === "judges" ? UserCheck : Users}
        url={buildJoinUrl(role, tournamentId)}
      />
    </Panel>
  );
}
