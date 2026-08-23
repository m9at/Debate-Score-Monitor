import { useState } from "react";
import { FolderPlus, Inbox, Folder, Check, Quote } from "lucide-react";
import { BRAND } from "@/lib/brand";
import type { TournamentSetup } from "@/lib/wizard/types";
import { useGroups } from "@/context/GroupContext";
import { Field, Panel, inputClass, inputStyle } from "./ui";

interface Props {
  setup: TournamentSetup;
  patch: (p: Partial<TournamentSetup>) => void;
}

/**
 * Filing and opening content: which folder the tournament goes into, the round
 * it starts from, and the motion text of that round.
 */
export default function StepOrganise({ setup, patch }: Props) {
  const { groups, addGroup } = useGroups();
  const [newFolder, setNewFolder] = useState("");

  const createFolder = () => {
    const name = newFolder.trim();
    if (!name) return;
    const id = addGroup(name);
    setNewFolder("");
    patch({ folderId: id });
  };

  const rounds = Array.from({ length: setup.totalRounds }, (_, i) => i + 1);

  return (
    <div className="space-y-4">
      <Panel
        title="مجلد البطولة"
        hint="نظّم البطولة داخل مجلد من الآن — يمكن نقلها لاحقاً"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => patch({ folderId: null })}
            className="flex items-center gap-2.5 p-3 rounded-xl border text-right
                       transition-colors hover:bg-[#7B2D8E]/[0.04]"
            style={{
              borderColor:
                setup.folderId === null ? BRAND.purple : BRAND.border,
            }}
            data-testid="wizard-folder-none"
          >
            <Inbox className="w-4 h-4 shrink-0" style={{ color: BRAND.blue }} />
            <span
              className="flex-1 font-bold text-[13.5px]"
              style={{ color: BRAND.ink }}
            >
              البطولات الحالية
            </span>
            {setup.folderId === null && (
              <Check className="w-4 h-4" style={{ color: BRAND.purple }} />
            )}
          </button>

          {groups.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => patch({ folderId: g.id })}
              className="flex items-center gap-2.5 p-3 rounded-xl border text-right
                         transition-colors hover:bg-[#7B2D8E]/[0.04]"
              style={{
                borderColor:
                  setup.folderId === g.id ? BRAND.purple : BRAND.border,
              }}
              data-testid={`wizard-folder-${g.id}`}
            >
              <Folder
                className="w-4 h-4 shrink-0"
                style={{
                  color: g.kind === "archive" ? BRAND.warning : BRAND.purple,
                }}
              />
              <span
                className="flex-1 font-bold text-[13.5px] truncate"
                style={{ color: BRAND.ink }}
              >
                {g.name}
              </span>
              {setup.folderId === g.id && (
                <Check className="w-4 h-4" style={{ color: BRAND.purple }} />
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 mt-3">
          <input
            value={newFolder}
            onChange={(e) => setNewFolder(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                createFolder();
              }
            }}
            placeholder="اسم مجلد جديد"
            className={inputClass}
            style={inputStyle}
            data-testid="wizard-input-new-folder"
          />
          <button
            type="button"
            onClick={createFolder}
            disabled={!newFolder.trim()}
            className="h-11 px-4 rounded-xl text-white font-bold text-[13px] shrink-0
                       inline-flex items-center gap-1.5 disabled:opacity-50"
            style={{ backgroundColor: BRAND.purple }}
            data-testid="wizard-button-new-folder"
          >
            <FolderPlus className="w-4 h-4" />
            إنشاء مجلد
          </button>
        </div>
      </Panel>

      <Panel
        title="الجولة الابتدائية"
        hint="من أي جولة تبدأ البطولة؟ عادةً الجولة الأولى"
      >
        <div className="flex flex-wrap gap-2">
          {rounds.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => patch({ startRound: n })}
              className="h-11 min-w-[5.5rem] px-4 rounded-xl border font-bold text-[13.5px] transition-all"
              style={
                setup.startRound === n
                  ? {
                      borderColor: BRAND.purple,
                      backgroundColor: `${BRAND.purple}12`,
                      color: BRAND.purple,
                    }
                  : { borderColor: BRAND.border, color: BRAND.ink }
              }
              data-testid={`wizard-start-round-${n}`}
            >
              الجولة {n}
            </button>
          ))}
        </div>
      </Panel>

      <Panel>
        <Field
          label="نص القضية"
          hint="قضية الجولة الابتدائية — تظهر بخط كبير في وضع العرض، ويمكن تعديلها لكل جولة لاحقاً"
        >
          <div className="relative">
            <Quote
              className="w-5 h-5 absolute top-3 right-3 pointer-events-none"
              style={{ color: `${BRAND.purple}66` }}
            />
            <textarea
              value={setup.caseText ?? ""}
              onChange={(e) => patch({ caseText: e.target.value })}
              rows={4}
              placeholder="مثال: هذا المجلس يرى أن التعليم عن بعد يضعف المهارات الاجتماعية"
              className="w-full rounded-xl bg-white border py-3 pr-11 pl-3 text-[17px] font-bold
                         leading-relaxed outline-none transition-colors resize-y
                         focus:border-[#7B2D8E]/45 placeholder:font-normal
                         placeholder:text-[15px] placeholder:text-[#2B1B45]/35"
              style={inputStyle}
              data-testid="wizard-input-case-text"
            />
          </div>
        </Field>
      </Panel>
    </div>
  );
}
