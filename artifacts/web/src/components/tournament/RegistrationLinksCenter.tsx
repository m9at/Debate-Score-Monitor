import { useEffect, useState } from "react";
import {
  Archive,
  ArchiveRestore,
  Check,
  Copy,
  ExternalLink,
  Link2,
  Lock,
  QrCode,
  Unlock,
  Users,
  UserCheck,
} from "lucide-react";
import { BRAND, BTN, BTN_PRIMARY_STYLE } from "@/lib/brand";
import {
  getRegistrationLinks,
  setRegistrationLinkState,
  type LinkState,
} from "@/lib/profilesApi";

interface Props {
  tournamentId: string;
  teamUrl: string;
  judgeUrl: string;
  /** Opens the list of everyone registered through a link. */
  onViewRegistrants: (kind: Kind) => void;
}

type Kind = "team" | "judge";

const QR_SRC = (url: string) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(url)}`;

/**
 * مركز روابط التسجيل — one place for both public links, each with its own
 * lifecycle (open / closed / archived) persisted on the API. Archiving keeps
 * every registration already made and only clears the link from the panel.
 */
export default function RegistrationLinksCenter({
  tournamentId,
  teamUrl,
  judgeUrl,
  onViewRegistrants,
}: Props) {
  const [states, setStates] = useState<Record<Kind, LinkState>>({
    team: "open",
    judge: "open",
  });
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    let alive = true;
    void getRegistrationLinks(tournamentId)
      .then((r) => {
        if (alive) {
          setStates({
            team: r.team.state as LinkState,
            judge: r.judge.state as LinkState,
          });
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [tournamentId]);

  const update = async (kind: Kind, state: LinkState) => {
    setStates((s) => ({ ...s, [kind]: state })); // optimistic
    await setRegistrationLinkState(tournamentId, kind, state).catch(() => {});
  };

  const cards: { kind: Kind; title: string; url: string; icon: typeof Users }[] = [
    { kind: "team", title: "تسجيل الفرق", url: teamUrl, icon: Users },
    { kind: "judge", title: "تسجيل المحكمين", url: judgeUrl, icon: UserCheck },
  ];

  const visible = cards.filter((c) =>
    showArchived ? true : states[c.kind] !== "archived",
  );
  const archivedCount = cards.filter((c) => states[c.kind] === "archived").length;

  return (
    <section className="space-y-4" data-testid="registration-links-center">
      <div className="flex items-center gap-2.5 flex-wrap">
        <Link2 className="w-5 h-5" style={{ color: BRAND.purple }} />
        <h2 className="text-lg font-bold" style={{ color: BRAND.ink }}>
          روابط التسجيل
        </h2>
        <span className="flex-1" />
        {archivedCount > 0 && (
          <button
            type="button"
            onClick={() => setShowArchived((v) => !v)}
            className={`${BTN.base} ${BTN.secondary} h-9 px-3 text-[12px]`}
            data-testid="button-toggle-archived-links"
          >
            {showArchived ? "إخفاء المؤرشفة" : `عرض المؤرشفة (${archivedCount})`}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {visible.map((c) => (
          <LinkCard
            key={c.kind}
            title={c.title}
            icon={c.icon}
            url={c.url}
            state={states[c.kind]}
            onState={(s) => update(c.kind, s)}
            onViewRegistrants={() => onViewRegistrants(c.kind)}
          />
        ))}
      </div>
    </section>
  );
}

function LinkCard({
  title,
  icon: Icon,
  url,
  state,
  onState,
  onViewRegistrants,
}: {
  title: string;
  icon: typeof Users;
  url: string;
  state: LinkState;
  onState: (s: LinkState) => void;
  onViewRegistrants: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [qr, setQr] = useState(false);
  const open = state === "open";
  const archived = state === "archived";

  const copy = async () => {
    await navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div
      className="rounded-2xl border bg-white p-4 space-y-3"
      style={{ borderColor: BRAND.border, opacity: archived ? 0.75 : 1 }}
      data-testid={`link-card-${title}`}
    >
      <div className="flex items-center gap-2.5 flex-wrap">
        <span
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${BRAND.purple}14`, color: BRAND.purple }}
        >
          <Icon className="w-4.5 h-4.5" />
        </span>
        <h3 className="font-bold text-[15px]" style={{ color: BRAND.ink }}>
          {title}
        </h3>
        <span className="flex-1" />
        <span
          className="px-2.5 h-7 inline-flex items-center gap-1.5 rounded-lg text-[12px] font-bold"
          style={{
            backgroundColor: archived
              ? "#6B72801f"
              : open
                ? `${BRAND.success}1f`
                : `${BRAND.danger}1f`,
            color: archived ? "#6B7280" : open ? BRAND.success : BRAND.danger,
          }}
          data-testid="link-state"
        >
          {archived ? (
            <>
              <Archive className="w-3.5 h-3.5" />
              مؤرشف
            </>
          ) : open ? (
            <>
              <Unlock className="w-3.5 h-3.5" />
              التسجيل مفتوح
            </>
          ) : (
            <>
              <Lock className="w-3.5 h-3.5" />
              التسجيل مغلق
            </>
          )}
        </span>
      </div>

      <p
        dir="ltr"
        className="text-[11.5px] font-mono truncate rounded-xl px-3 py-2"
        style={{ backgroundColor: BRAND.surface, color: `${BRAND.ink}b3` }}
      >
        {url}
      </p>

      {/* Named buttons — no hidden three-dot menu */}
      <div className="flex flex-wrap gap-2">
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className={`${BTN.base} ${BTN.secondary} h-9 px-3 text-[12.5px]`}
          data-testid="button-open-link"
        >
          <ExternalLink className="w-4 h-4" />
          فتح الرابط
        </a>
        <button
          type="button"
          onClick={copy}
          className={`${BTN.base} ${BTN.secondary} h-9 px-3 text-[12.5px]`}
          data-testid="button-copy-link"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? "تم النسخ" : "نسخ الرابط"}
        </button>
        <button
          type="button"
          onClick={onViewRegistrants}
          className={`${BTN.base} ${BTN.secondary} h-9 px-3 text-[12.5px]`}
          data-testid="button-view-registrants"
        >
          <Users className="w-4 h-4" />
          عرض المسجلين
        </button>
        <button
          type="button"
          onClick={() => setQr((v) => !v)}
          className={`${BTN.base} ${BTN.secondary} h-9 px-3 text-[12.5px]`}
          data-testid="button-qr-link"
        >
          <QrCode className="w-4 h-4" />
          QR
        </button>
        {open ? (
          <button
            type="button"
            onClick={() => onState("closed")}
            className={`${BTN.base} ${BTN.secondary} h-9 px-3 text-[12.5px]`}
            data-testid="button-close-registration"
          >
            <Lock className="w-4 h-4" />
            تعطيل التسجيل
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onState("open")}
            className={`${BTN.base} h-9 px-3 text-[12.5px] text-white`}
            style={BTN_PRIMARY_STYLE}
            data-testid="button-reopen-registration"
          >
            <Unlock className="w-4 h-4" />
            إعادة فتح التسجيل
          </button>
        )}
        <button
          type="button"
          onClick={() => onState(archived ? "closed" : "archived")}
          className={`${BTN.base} ${BTN.secondary} h-9 px-3 text-[12.5px]`}
          data-testid="button-archive-link"
        >
          {archived ? (
            <>
              <ArchiveRestore className="w-4 h-4" />
              إلغاء الأرشفة
            </>
          ) : (
            <>
              <Archive className="w-4 h-4" />
              أرشفة الرابط
            </>
          )}
        </button>
      </div>

      {qr && (
        <div className="flex justify-center pt-1">
          <img
            src={QR_SRC(url)}
            alt={`QR ${title}`}
            className="w-40 h-40 rounded-xl border"
            style={{ borderColor: BRAND.border }}
            data-testid="link-qr"
          />
        </div>
      )}

      {!open && !archived && (
        <p className="text-[11.5px]" style={{ color: `${BRAND.ink}99` }}>
          الرابط مغلق: من يفتحه الآن لن يستطيع إكمال التسجيل.
        </p>
      )}
    </div>
  );
}
