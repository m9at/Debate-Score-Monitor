import { useMemo, useState } from "react";
import { Gavel, Plus, Search, Trash2, UserCheck, UserX } from "lucide-react";
import { BRAND, BTN, BTN_PRIMARY_STYLE, BTN_SIZE } from "@/lib/brand";
import type { Judge } from "@/types/tournament";
import type { TournamentSetup } from "@/lib/wizard/types";
import { Panel, inputClass, inputStyle } from "./ui";
import JoinLinkPanel from "./JoinLinkPanel";

interface StepJudgesProps {
  setup: TournamentSetup;
  patch: (p: Partial<TournamentSetup>) => void;
}

function makeJudge(name: string): Judge {
  return {
    id: crypto.randomUUID(),
    name,
    canChair: true,
    conflictTeamIds: [],
    registeredAt: Date.now(),
  };
}

/** Step 4 — add judges one by one, rename, disable or remove them. */
export default function StepJudges({ setup, patch }: StepJudgesProps) {
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const judges = setup.judges;

  const add = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    patch({ judges: [...judges, makeJudge(trimmed)], draw: null, drawApproved: false });
    setName("");
  };

  const update = (id: string, p: Partial<Judge>) =>
    patch({ judges: judges.map((j) => (j.id === id ? { ...j, ...p } : j)) });

  const remove = (id: string) =>
    patch({
      judges: judges.filter((j) => j.id !== id),
      draw: null,
      drawApproved: false,
    });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return judges
      .map((j, i) => ({ judge: j, index: i }))
      .filter(({ judge }) => !q || judge.name.toLowerCase().includes(q));
  }, [judges, query]);

  const activeCount = judges.filter((j) => !j.disabled).length;

  return (
    <div className="space-y-4">
      <JoinLinkPanel
        role="judges"
        tournamentId={setup.draftId}
        tournamentName={setup.name}
        topic={setup.caseText}
      />

      <Panel title="إضافة محكم" hint="اكتب الاسم واضغط Enter لإضافة سريعة">
        <div className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="اسم المحكم"
            className={`${inputClass} flex-1`}
            style={inputStyle}
            autoFocus
            data-testid="input-judge-name"
          />
          <button
            type="button"
            onClick={add}
            disabled={!name.trim()}
            className={`${BTN.base} ${BTN.primary} ${BTN_SIZE.lg} shrink-0`}
            style={BTN_PRIMARY_STYLE}
            data-testid="button-add-judge"
          >
            <Plus className="w-4 h-4" />
            إضافة محكم
          </button>
        </div>
      </Panel>

      <Panel
        title={`المحكمون (${activeCount} نشط من ${judges.length})`}
        hint="يمكن تعطيل محكم مؤقتاً دون حذفه — لن يُدرج في التوزيع التلقائي"
      >
        {judges.length === 0 ? (
          <div className="py-8 flex flex-col items-center gap-2 text-center">
            <Gavel className="w-9 h-9" style={{ color: `${BRAND.purple}59` }} />
            <p className="font-bold text-[14px]" style={{ color: BRAND.ink }}>
              لم يُضف أي محكم بعد
            </p>
          </div>
        ) : (
          <>
            {judges.length > 5 && (
              <div className="relative mb-3">
                <Search
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                  style={{ color: `${BRAND.ink}66` }}
                />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="ابحث عن محكم..."
                  className={`${inputClass} pr-10 h-10`}
                  style={inputStyle}
                  data-testid="input-search-judges"
                />
              </div>
            )}

            <ul className="space-y-2">
              {filtered.map(({ judge, index }) => (
                <li
                  key={judge.id}
                  className="flex items-center gap-2 rounded-xl border p-2 transition-opacity"
                  style={{
                    borderColor: BRAND.border,
                    opacity: judge.disabled ? 0.55 : 1,
                  }}
                  data-testid={`row-judge-${judge.id}`}
                >
                  <span
                    className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[12px] shrink-0"
                    style={{ backgroundColor: `${BRAND.blue}14`, color: BRAND.blueDeep }}
                  >
                    {index + 1}
                  </span>

                  <input
                    value={judge.name}
                    onChange={(e) => update(judge.id, { name: e.target.value })}
                    className="flex-1 min-w-0 h-9 rounded-lg bg-transparent border px-2.5 text-[13.5px]
                               font-semibold outline-none transition-colors focus:border-[#7B2D8E]/45"
                    style={inputStyle}
                    data-testid={`input-judge-name-${judge.id}`}
                  />

                  <button
                    type="button"
                    onClick={() => update(judge.id, { canChair: !judge.canChair })}
                    className={`${BTN.base} ${BTN_SIZE.sm} shrink-0 border`}
                    style={{
                      backgroundColor: judge.canChair ? `${BRAND.gold}1f` : "#fff",
                      borderColor: judge.canChair ? `${BRAND.gold}59` : BRAND.border,
                      color: judge.canChair ? "#8A6100" : `${BRAND.ink}99`,
                    }}
                    title="يمكنه رئاسة الجلسة"
                    data-testid={`button-toggle-chair-${judge.id}`}
                  >
                    رئيس جلسة
                  </button>

                  <button
                    type="button"
                    onClick={() => update(judge.id, { disabled: !judge.disabled })}
                    className={`${BTN.base} ${BTN.secondary} ${BTN_SIZE.sm} shrink-0`}
                    data-testid={`button-toggle-disabled-${judge.id}`}
                  >
                    {judge.disabled ? (
                      <>
                        <UserCheck className="w-3.5 h-3.5" />
                        تنشيط
                      </>
                    ) : (
                      <>
                        <UserX className="w-3.5 h-3.5" />
                        تعطيل
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => remove(judge.id)}
                    className={`${BTN.base} ${BTN.danger} ${BTN_SIZE.sm} shrink-0`}
                    data-testid={`button-delete-judge-${judge.id}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    حذف
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </Panel>
    </div>
  );
}
