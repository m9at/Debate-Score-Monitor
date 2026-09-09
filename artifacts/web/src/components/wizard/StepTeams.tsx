import { useState } from "react";
import { ChevronDown, Plus, Trash2, Users } from "lucide-react";
import { BRAND, BTN, BTN_PRIMARY_STYLE, BTN_SIZE } from "@/lib/brand";
import type { Team } from "@/types/tournament";
import type { TournamentSetup } from "@/lib/wizard/types";
import { Panel, inputClass, inputStyle } from "./ui";
import JoinLinkPanel from "./JoinLinkPanel";

interface StepTeamsProps {
  setup: TournamentSetup;
  patch: (p: Partial<TournamentSetup>) => void;
}

const EMPTY = { name: "", institution: "", s1: "", s2: "", s3: "", sub: "" };

function makeTeam(f: typeof EMPTY): Team {
  const speakers = [f.s1, f.s2, f.s3, f.sub].map((s) => s.trim());
  const hasSub = !!speakers[3];
  return {
    id: crypto.randomUUID(),
    name: f.name.trim(),
    institution: f.institution.trim() || undefined,
    speakerNames: hasSub ? speakers : speakers.slice(0, 3),
    speakersPerTeam: hasSub ? 4 : 3,
    totalPoints: 0,
    wins: 0,
    losses: 0,
    matchesPlayed: 0,
    registeredAt: Date.now(),
  };
}

/** Step 5 — fast team entry: name, institution and speakers in one row. */
export default function StepTeams({ setup, patch }: StepTeamsProps) {
  const [form, setForm] = useState(EMPTY);
  const [expanded, setExpanded] = useState<string | null>(null);
  const teams = setup.teams;

  const set = (k: keyof typeof EMPTY, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const add = () => {
    if (!form.name.trim()) return;
    patch({ teams: [...teams, makeTeam(form)], draw: null, drawApproved: false });
    setForm(EMPTY);
  };

  const remove = (id: string) =>
    patch({
      teams: teams.filter((t) => t.id !== id),
      draw: null,
      drawApproved: false,
    });

  const updateSpeaker = (id: string, idx: number, value: string) =>
    patch({
      teams: teams.map((t) =>
        t.id === id
          ? {
              ...t,
              speakerNames: t.speakerNames.map((n, i) => (i === idx ? value : n)),
            }
          : t
      ),
    });

  return (
    <div className="space-y-4">
      <JoinLinkPanel
        role="teams"
        tournamentId={setup.draftId}
        tournamentName={setup.name}
        topic={setup.caseText}
      />

      <Panel title="إضافة فريق" hint="اسم الفريق فقط كافٍ للإضافة — يمكن استكمال المتحدثين لاحقاً">
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && add()}
              placeholder="اسم الفريق *"
              className={inputClass}
              style={inputStyle}
              autoFocus
              data-testid="input-team-name"
            />
            <input
              value={form.institution}
              onChange={(e) => set("institution", e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && add()}
              placeholder="المؤسسة / الجامعة"
              className={inputClass}
              style={inputStyle}
              data-testid="input-team-institution"
            />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {(
              [
                ["s1", "المتحدث الأول"],
                ["s2", "المتحدث الثاني"],
                ["s3", "المتحدث الثالث"],
                ["sub", "الاحتياط"],
              ] as const
            ).map(([key, label]) => (
              <input
                key={key}
                value={form[key]}
                onChange={(e) => set(key, e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && add()}
                placeholder={label}
                className={`${inputClass} h-10 text-[13px]`}
                style={inputStyle}
                data-testid={`input-team-${key}`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={add}
            disabled={!form.name.trim()}
            className={`${BTN.base} ${BTN.primary} ${BTN_SIZE.lg} w-full sm:w-auto`}
            style={BTN_PRIMARY_STYLE}
            data-testid="button-add-team"
          >
            <Plus className="w-4 h-4" />
            إضافة فريق
          </button>
        </div>
      </Panel>

      <Panel title={`الفرق المشاركة (${teams.length})`}>
        {teams.length === 0 ? (
          <div className="py-8 flex flex-col items-center gap-2 text-center">
            <Users className="w-9 h-9" style={{ color: `${BRAND.purple}59` }} />
            <p className="font-bold text-[14px]" style={{ color: BRAND.ink }}>
              لم يُضف أي فريق بعد
            </p>
            <p className="text-[12px]" style={{ color: `${BRAND.ink}8c` }}>
              العدد المتوقع الذي حددته: {setup.expectedTeams} فريق
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {teams.map((team, i) => {
              const open = expanded === team.id;
              return (
                <li
                  key={team.id}
                  className="rounded-xl border overflow-hidden"
                  style={{ borderColor: BRAND.border }}
                  data-testid={`row-team-${team.id}`}
                >
                  <div className="flex items-center gap-2 p-2">
                    <span
                      className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[12px] shrink-0"
                      style={{ backgroundColor: `${BRAND.purple}12`, color: BRAND.purple }}
                    >
                      {i + 1}
                    </span>

                    <div className="flex-1 min-w-0">
                      <p
                        className="font-bold text-[14px] truncate"
                        style={{ color: BRAND.ink }}
                      >
                        {team.name}
                      </p>
                      <p
                        className="text-[11.5px] truncate"
                        style={{ color: `${BRAND.ink}8c` }}
                      >
                        {team.institution || "بدون مؤسسة"} · {team.speakersPerTeam} متحدثين
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setExpanded(open ? null : team.id)}
                      className={`${BTN.base} ${BTN.secondary} ${BTN_SIZE.sm} shrink-0`}
                      data-testid={`button-expand-team-${team.id}`}
                    >
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`}
                      />
                      المتحدثون
                    </button>

                    <button
                      type="button"
                      onClick={() => remove(team.id)}
                      className={`${BTN.base} ${BTN.danger} ${BTN_SIZE.sm} shrink-0`}
                      data-testid={`button-delete-team-${team.id}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      حذف
                    </button>
                  </div>

                  {open && (
                    <div
                      className="grid grid-cols-2 lg:grid-cols-4 gap-2 p-2 pt-0"
                      style={{ backgroundColor: BRAND.surface }}
                    >
                      {team.speakerNames.map((n, idx) => (
                        <input
                          key={idx}
                          value={n}
                          onChange={(e) => updateSpeaker(team.id, idx, e.target.value)}
                          placeholder={`متحدث ${idx + 1}`}
                          className={`${inputClass} h-9 text-[12.5px]`}
                          style={inputStyle}
                          data-testid={`input-speaker-${team.id}-${idx}`}
                        />
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}
