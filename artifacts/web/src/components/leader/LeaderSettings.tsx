import { Field, inputClass, inputStyle } from "@/components/wizard/ui";
import { periodLabel, type LeaderInfo, type LeaderTournament } from "@/lib/leaderApi";
import { BRAND } from "@/lib/brand";
import PdfMenu from "./PdfMenu";
import { SectionHeader } from "./ui";

type Edit = (fn: (d: LeaderInfo) => void) => void;
type TextKey = "name" | "organizer" | "startDate" | "endDate" | "description" | "logoUrl" | "watermarkText";

/** Tournament settings grouped into clear sections. Every change autosaves. */
export default function LeaderSettings({ t, info, edit }: { t: LeaderTournament; info: LeaderInfo; edit: Edit }) {
  const text = (k: TextKey) => ({
    value: info[k] ?? "", className: inputClass, style: inputStyle,
    onChange: (e: { target: { value: string } }) => edit((d) => { d[k] = e.target.value; }),
  });
  const num = (k: "individualsPerRoom" | "judgesPerRoom" | "scoreMin" | "scoreMax", def: number) => ({
    type: "number", value: info[k] ?? def, className: inputClass, style: inputStyle,
    onChange: (e: { target: { value: string } }) => edit((d) => { d[k] = +e.target.value; }),
  });
  const logo = info.logoUrl || `${import.meta.env.BASE_URL}logo-mark.png`;
  const periods = Math.max(1, ...info.days.map((d) => d.period ?? 1)) + 1;

  return (
    <div className="space-y-4">
      <SectionHeader title="إعدادات البطولة" subtitle="كل تعديل يُحفظ تلقائياً" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card icon="🏷️" title="معلومات البطولة" wide>
          <Field label="اسم البطولة" required><input {...text("name")} /></Field>
          <Field label="وصف البطولة">
            <textarea rows={2} {...text("description")} style={{ ...inputStyle, height: "auto" }} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="الجهة المنظمة"><input {...text("organizer")} placeholder="مركز عُمان للمناظرات" /></Field>
            <Field label="تاريخ البداية"><input type="date" {...text("startDate")} /></Field>
            <Field label="تاريخ النهاية"><input type="date" {...text("endDate")} /></Field>
          </div>
        </Card>

        <Card icon="👤" title="إعدادات المشاركين">
          <Info label="عدد الأفرقاء المسجلين" value={info.individualPool?.length ?? 0} />
          <Note>يُسجَّل كل مشارك بشكل مستقل (بدون فرق) من قسم «المتناظرون»، ويُرقَّم تلقائياً داخل كل قاعة.</Note>
        </Card>

        <Card icon="🏛️" title="إعدادات القاعات">
          <Field label="سعة القاعة (عدد الأفرقاء في القاعة)"><input min={1} {...num("individualsPerRoom", 4)} /></Field>
          <Note>يستخدم التوزيع التلقائي هذه السعة لتقسيم الأفرقاء بالتساوي، وتُسمّى القاعات من بطاقة كل قاعة.</Note>
        </Card>

        <Card icon="⚔️" title="إعدادات الجولات والفترات" wide>
          <div className="space-y-2">
            {info.days.map((d, i) => (
              <div key={d.day} className="grid grid-cols-[70px_1fr_150px] items-center gap-2">
                <b className="text-[13px]" style={{ color: BRAND.purple }}>الجولة {d.day}</b>
                <input value={d.title ?? ""} placeholder="اسم الجولة" onChange={(e) => edit((x) => { x.days[i].title = e.target.value; })}
                  className={inputClass} style={inputStyle} />
                <select value={d.period ?? 1} onChange={(e) => edit((x) => { x.days[i].period = +e.target.value; })} className={inputClass} style={inputStyle}>
                  {Array.from({ length: periods }, (_, k) => k + 1).map((k) => <option key={k} value={k}>{periodLabel(k)}</option>)}
                </select>
              </div>
            ))}
          </div>
          <Note>إضافة الجولات وإغلاقها من قسم «الجولات والقاعات» — كل فترة مستقلة بتوزيعها وقاعاتها ومحكميها.</Note>
        </Card>

        <Card icon="⚖️" title="إعدادات التحكيم">
          <Field label="عدد المحكمين لكل قاعة (يشمل رئيس الجلسة)"><input min={1} {...num("judgesPerRoom", 1)} /></Field>
          <Note>أول محكم يُعيَّن رئيساً للجلسة. يُرسل ورقة الدرجات رئيس الجلسة أو أحد المحكمين، وتُقفل القاعة فور الإرسال.</Note>
        </Card>

        <Card icon="🎯" title="إعدادات الدرجات">
          <div className="grid grid-cols-2 gap-3">
            <Field label="الحد الأدنى"><input {...num("scoreMin", 59)} /></Field>
            <Field label="الحد الأعلى"><input {...num("scoreMax", 82)} /></Field>
          </div>
          <Note>أرقام صحيحة فقط. يستطيع المحكم التعديل (مع حفظ تلقائي) حتى يضغط «إنهاء التحكيم»، وبعدها تُعتمد الدرجات وتُغلق.</Note>
        </Card>

        <Card icon="📊" title="إعدادات النتائج">
          <Note>النتائج درجات فقط — بدون فائز أو خاسر. الترتيب حسب مجموع الدرجات عبر الجولات.</Note>
          <PdfMenu t={{ ...t, info }} />
        </Card>

        <Card icon="🎨" title="إعدادات الهوية">
          <Field label="رابط شعار البطولة (اتركه فارغاً لشعار المركز)"><input {...text("logoUrl")} placeholder="https://…" dir="ltr" /></Field>
          <Field label="نص العلامة المائية"><input {...text("watermarkText")} placeholder="مركز عُمان للمناظرات" /></Field>
          <div className="flex items-center gap-3 rounded-xl p-3" style={{ background: BRAND.surface }}>
            <img src={logo} alt="" className="h-12 w-12 object-contain" />
            <span className="text-[12px]" style={{ color: `${BRAND.ink}99` }}>يظهر الشعار في رأس تقارير PDF، والعلامة المائية خفيفة في الخلفية.</span>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Card({ icon, title, wide, children }: { icon: string; title: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <div className={`space-y-3 rounded-2xl border bg-white p-4 shadow-sm ${wide ? "lg:col-span-2" : ""}`} style={{ borderColor: BRAND.border }}>
      <h3 className="font-extrabold" style={{ color: BRAND.purple }}>{icon} {title}</h3>
      {children}
    </div>
  );
}
const Note = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[12px] leading-relaxed" style={{ color: `${BRAND.ink}90` }}>{children}</p>
);
const Info = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex justify-between rounded-xl px-3 py-2 text-[13px]" style={{ background: BRAND.surface }}>
    <span>{label}</span><b style={{ color: BRAND.purple }}>{value}</b>
  </div>
);
