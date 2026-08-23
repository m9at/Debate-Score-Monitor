import { AlertTriangle, Check, Gavel, Pencil, Zap } from "lucide-react";
import { BRAND, BRAND_GRADIENT, BTN, BTN_PRIMARY_STYLE, BTN_SIZE } from "@/lib/brand";
import { generateDraw, unseatedTeams } from "@/lib/wizard/draw";
import type { TournamentSetup } from "@/lib/wizard/types";
import { Panel } from "./ui";

interface StepDrawProps {
  setup: TournamentSetup;
  patch: (p: Partial<TournamentSetup>) => void;
}

/** Step 7 — generate and approve the first round's draw before creation. */
export default function StepDraw({ setup, patch }: StepDrawProps) {
  const activeJudges = setup.judges.filter((j) => !j.disabled);
  const draw = setup.draw;

  const nameOfTeam = (id: string) =>
    setup.teams.find((t) => t.id === id)?.name ?? "—";
  const nameOfJudge = (id?: string) =>
    setup.judges.find((j) => j.id === id)?.name ?? "—";

  const run = () =>
    patch({
      draw: generateDraw({
        teams: setup.teams,
        rooms: setup.rooms,
        judges: activeJudges,
        judgesPerRoom: setup.settings.judgesPerRoom,
      }),
      drawApproved: false,
    });

  const ready = setup.teams.length >= 2 && setup.rooms.length >= 1;
  const leftOut = draw ? unseatedTeams(setup.teams, draw) : [];

  return (
    <div className="space-y-4">
      <Panel>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <h3 className="font-bold text-[15px]" style={{ color: BRAND.ink }}>
              توزيع الجولة الأولى
            </h3>
            <p className="text-[12px] mt-0.5" style={{ color: `${BRAND.ink}8c` }}>
              {setup.teams.length} فريق · {setup.rooms.length} قاعة ·{" "}
              {activeJudges.length} محكم نشط
            </p>
          </div>
          <button
            type="button"
            onClick={run}
            disabled={!ready}
            className={`${BTN.base} ${BTN.primary} ${BTN_SIZE.lg} shrink-0`}
            style={BTN_PRIMARY_STYLE}
            data-testid="button-generate-draw"
          >
            <Zap className="w-4 h-4" />
            {draw ? "إعادة إنشاء التوزيع" : "إنشاء التوزيع التلقائي"}
          </button>
        </div>

        {!ready && (
          <p
            className="flex items-center gap-1.5 text-[12px] font-semibold mt-3"
            style={{ color: BRAND.warning }}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            تحتاج فريقين على الأقل وقاعة واحدة على الأقل لإنشاء التوزيع
          </p>
        )}
      </Panel>

      {draw && draw.length > 0 && (
        <>
          {leftOut.length > 0 && (
            <div
              className="flex items-start gap-2.5 rounded-2xl p-3.5 border"
              style={{
                backgroundColor: `${BRAND.warning}0f`,
                borderColor: `${BRAND.warning}40`,
              }}
              data-testid="warning-unseated"
            >
              <AlertTriangle
                className="w-4 h-4 mt-px shrink-0"
                style={{ color: BRAND.warning }}
              />
              <p className="text-[12px] leading-relaxed" style={{ color: BRAND.ink }}>
                <strong>{leftOut.length} فريق دون قاعة:</strong>{" "}
                {leftOut.map((t) => t.name).join("، ")} — أضف قاعات أخرى أو عدّل
                عدد الفرق.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
            {draw.map((p) => (
              <div
                key={p.roomId}
                className="rounded-2xl bg-white border shadow-sm overflow-hidden"
                style={{ borderColor: BRAND.border }}
                data-testid={`draw-room-${p.roomNumber}`}
              >
                <div
                  className="px-4 py-2.5 flex items-center gap-2"
                  style={{ backgroundImage: BRAND_GRADIENT }}
                >
                  <span className="text-white font-bold text-[13.5px]">
                    {p.roomLabel}
                  </span>
                  <span className="text-white/60 text-[11px] font-bold">
                    #{String(p.roomNumber).padStart(2, "0")}
                  </span>
                </div>

                <div className="p-4">
                  {/* Teams */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0 text-center">
                      <p
                        className="text-[10.5px] font-bold mb-1"
                        style={{ color: BRAND.success }}
                      >
                        موالاة
                      </p>
                      <p
                        className="font-bold text-[14px] truncate"
                        style={{ color: BRAND.ink }}
                      >
                        {nameOfTeam(p.govTeamId)}
                      </p>
                    </div>

                    <span
                      className="text-[12px] font-bold shrink-0 px-2 py-1 rounded-lg"
                      style={{
                        backgroundColor: `${BRAND.ink}0a`,
                        color: `${BRAND.ink}99`,
                      }}
                    >
                      VS
                    </span>

                    <div className="flex-1 min-w-0 text-center">
                      <p
                        className="text-[10.5px] font-bold mb-1"
                        style={{ color: BRAND.danger }}
                      >
                        معارضة
                      </p>
                      <p
                        className="font-bold text-[14px] truncate"
                        style={{ color: BRAND.ink }}
                      >
                        {nameOfTeam(p.oppTeamId)}
                      </p>
                    </div>
                  </div>

                  {/* Judges */}
                  <div
                    className="mt-3.5 pt-3 border-t space-y-1.5"
                    style={{ borderColor: BRAND.border }}
                  >
                    <div className="flex items-start gap-2">
                      <Gavel
                        className="w-3.5 h-3.5 mt-0.5 shrink-0"
                        style={{ color: BRAND.purple }}
                      />
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-[11px] font-bold"
                          style={{ color: `${BRAND.ink}99` }}
                        >
                          المحكمون
                        </p>
                        <p
                          className="text-[12.5px] font-semibold"
                          style={{ color: BRAND.ink }}
                        >
                          {p.panelistJudgeIds.length > 0
                            ? p.panelistJudgeIds.map(nameOfJudge).join(" · ")
                            : "—"}
                        </p>
                      </div>
                    </div>

                    {p.chairJudgeId && (
                      <div className="flex items-start gap-2">
                        <span
                          className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[10px] text-center font-bold"
                          style={{ color: BRAND.gold }}
                        >
                          ★
                        </span>
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-[11px] font-bold"
                            style={{ color: `${BRAND.ink}99` }}
                          >
                            رئيس الجلسة
                          </p>
                          <p
                            className="text-[12.5px] font-semibold"
                            style={{ color: BRAND.ink }}
                          >
                            {nameOfJudge(p.chairJudgeId)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Approve / edit */}
          <Panel>
            {setup.drawApproved ? (
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <p
                  className="flex-1 flex items-center gap-2 font-bold text-[13.5px]"
                  style={{ color: BRAND.success }}
                  data-testid="text-draw-approved"
                >
                  <Check className="w-4 h-4" />
                  تم اعتماد التوزيع — سيُثبَّت للجولة الأولى عند إنشاء البطولة
                </p>
                <button
                  type="button"
                  onClick={() => patch({ drawApproved: false })}
                  className={`${BTN.base} ${BTN.secondary} ${BTN_SIZE.md} shrink-0`}
                  data-testid="button-edit-draw"
                >
                  <Pencil className="w-4 h-4" />
                  فتح التوزيع للتعديل
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <p
                  className="flex-1 text-[12.5px]"
                  style={{ color: `${BRAND.ink}99` }}
                >
                  راجع التوزيع أعلاه، ثم اعتمده ليُثبَّت للجولة الأولى.
                </p>
                <button
                  type="button"
                  onClick={() => patch({ drawApproved: true })}
                  className={`${BTN.base} ${BTN.primary} ${BTN_SIZE.lg} shrink-0`}
                  style={BTN_PRIMARY_STYLE}
                  data-testid="button-approve-draw"
                >
                  <Check className="w-4 h-4" />
                  اعتماد التوزيع
                </button>
              </div>
            )}
          </Panel>
        </>
      )}

      {!draw && ready && (
        <Panel>
          <div className="py-8 flex flex-col items-center gap-2 text-center">
            <span
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-1"
              style={{ backgroundColor: `${BRAND.purple}12` }}
            >
              <Zap className="w-6 h-6" style={{ color: BRAND.purple }} />
            </span>
            <p className="font-bold text-[14.5px]" style={{ color: BRAND.ink }}>
              لم يُنشأ التوزيع بعد
            </p>
            <p className="text-[12px] max-w-sm" style={{ color: `${BRAND.ink}8c` }}>
              اضغط «إنشاء التوزيع التلقائي» ليقوم النظام بتوزيع الفرق على القاعات
              وتحديد الموالاة والمعارضة والمحكمين ورئيس الجلسة. يمكنك تخطي هذه
              الخطوة وإجراء التوزيع لاحقاً.
            </p>
          </div>
        </Panel>
      )}
    </div>
  );
}
