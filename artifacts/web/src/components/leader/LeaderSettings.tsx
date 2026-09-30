import { Field, Panel, inputClass, inputStyle } from "@/components/wizard/ui";
import type { LeaderInfo } from "@/lib/leaderApi";
import { BRAND } from "@/lib/brand";
import { SectionHeader } from "./ui";

/** Tournament-wide settings; each round can override the score range. */
export default function LeaderSettings({ info, edit }: { info: LeaderInfo; edit: (fn: (d: LeaderInfo) => void) => void }) {
  const text = (k: "name" | "organizer" | "venue" | "startDate" | "description") =>
    ({ value: info[k] ?? "", onChange: (e: { target: { value: string } }) => edit((d) => { d[k] = e.target.value; }), className: inputClass, style: inputStyle });
  return (
    <div className="space-y-4">
      <SectionHeader title="إعدادات البطولة" subtitle="البيانات العامة، نظام الدرجات، والتوزيع — يمكن تخصيص الدرجات لكل جولة من إعدادات الجولة" />

      <Panel>
        <h3 className="mb-3 font-bold" style={{ color: BRAND.purple }}>🏷️ بيانات البطولة</h3>
        <div className="space-y-4">
          <Field label="اسم البطولة" required><input {...text("name")} /></Field>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="الجهة المنظمة"><input {...text("organizer")} placeholder="مثال: مركز عُمان للمناظرات" /></Field>
            <Field label="المكان"><input {...text("venue")} placeholder="مثال: مسقط" /></Field>
            <Field label="تاريخ البدء"><input type="date" {...text("startDate")} /></Field>
          </div>
          <Field label="وصف البطولة">
            <textarea rows={3} value={info.description ?? ""} onChange={(e) => edit((d) => { d.description = e.target.value; })}
              className={inputClass} style={{ ...inputStyle, height: "auto" }} />
          </Field>
        </div>
      </Panel>

      <Panel>
        <h3 className="mb-3 font-bold" style={{ color: BRAND.purple }}>🎯 نظام الدرجات</h3>
        <div className="grid grid-cols-2 gap-3">
          <Field label="أقل درجة افتراضية">
            <input type="number" value={info.scoreMin} onChange={(e) => edit((d) => { d.scoreMin = +e.target.value; })} className={inputClass} style={inputStyle} />
          </Field>
          <Field label="أعلى درجة افتراضية">
            <input type="number" value={info.scoreMax} onChange={(e) => edit((d) => { d.scoreMax = +e.target.value; })} className={inputClass} style={inputStyle} />
          </Field>
        </div>
        <p className="mt-2 text-[12px]" style={{ color: `${BRAND.ink}80` }}>أرقام صحيحة فقط · بدون فائز · ترتيب نهائي بمجموع درجات الجولات.</p>
      </Panel>

      <Panel>
        <h3 className="mb-3 font-bold" style={{ color: BRAND.purple }}>🔀 التوزيع والتحكيم</h3>
        <Field label="عدد الأفراد في القاعة (للتوزيع التلقائي)">
          <input type="number" min={1} value={info.individualsPerRoom ?? 4}
            onChange={(e) => edit((d) => { d.individualsPerRoom = Math.max(1, +e.target.value); })} className={inputClass} style={inputStyle} />
        </Field>
        <ul className="mt-3 list-disc space-y-1 pr-5 text-[12.5px]" style={{ color: `${BRAND.ink}99` }}>
          <li>محكم واحد لكل قاعة، ولا يتكرر المحكم أو المتناظر في قاعتين داخل نفس الجولة.</li>
          <li>التوزيع التلقائي يتجنّب قدر الإمكان أن يحكّم المحكم نفس الأفراد مرة أخرى.</li>
          <li>لكل جولة رابط تحكيم خاص بها، وتُقفل القاعة بعد أول إرسال.</li>
        </ul>
      </Panel>
    </div>
  );
}
