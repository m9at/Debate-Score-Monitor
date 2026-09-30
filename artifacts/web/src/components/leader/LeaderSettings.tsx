import { Field, inputClass, inputStyle } from "@/components/wizard/ui";
import { useState } from "react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useLocation } from "wouter";
import { useTournament } from "@/context/TournamentContext";
import { createLeader, periodLabel, resetLeaderScores, type LeaderInfo, type LeaderTournament } from "@/lib/leaderApi";
import { BRAND } from "@/lib/brand";
import PdfMenu from "./PdfMenu";
import { SectionHeader } from "./ui";

type Edit = (fn: (d: LeaderInfo) => void) => void;
type TextKey = "name" | "organizer" | "startDate" | "endDate" | "description" | "logoUrl" | "watermarkText";

/** Tournament settings grouped into clear sections. Every change autosaves. */
export default function LeaderSettings({ t, info, edit, onReset }: {
  t: LeaderTournament; info: LeaderInfo; edit: Edit; onReset: () => void;
}) {
  // null = closed, 0 = all rounds, N = round N only.
  const [confirmReset, setConfirmReset] = useState<number | null>(null);
  const sheetsIn = (day?: number) => info.days.filter((d) => !day || d.day === day)
    .flatMap((d) => d.rooms).filter((r) => t.results[r.id] || t.drafts?.[r.id]).length;
  const sheets = sheetsIn();
  const [, setLocation] = useLocation();
  const { tournaments, duplicateTournament } = useTournament();
  const [cloning, setCloning] = useState(false);
  /** Same setup under the same name (marked «نسخة»), without any scores. */
  const clone = async () => {
    const local = tournaments.find((x) => x.leaderId === t.id);
    setCloning(true);
    try {
      const copy = structuredClone(info);
      copy.days.forEach((d) => { d.closed = false; d.rooms.forEach((r) => { r.locked = false; }); });
      const leaderId = await createLeader(copy);
      if (local) duplicateTournament(local.id, { leaderId });
      setLocation(`/leader/${leaderId}`);
    } catch { alert("تعذّر استنساخ البطولة — حاول مرة أخرى"); }
    setCloning(false);
  };
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
            <Field label="الجهة المنظمة"><input {...text("organizer")} placeholder="اسم الجهة" /></Field>
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

        <Card icon="🔄" title="إعادة إدخال الدرجات">
          <Note>يحذف الدرجات المرسلة والمسودات ويعيد فتح القاعات ليُدخل المحكمون الدرجات من جديد. الأفراد والقاعات والإعدادات تبقى كما هي.</Note>
          <div className="space-y-1.5">
            {info.days.map((d) => (
              <div key={d.day} className="flex items-center justify-between rounded-xl px-3 py-2 text-[13px]" style={{ background: BRAND.surface }}>
                <span>الجولة {d.day}{d.title ? ` · ${d.title}` : ""} — <b style={{ color: BRAND.purple }}>{sheetsIn(d.day)}</b> ورقة</span>
                <button onClick={() => setConfirmReset(d.day)} disabled={!sheetsIn(d.day)}
                  className="rounded-lg px-3 py-1 text-[12px] font-bold disabled:opacity-40"
                  style={{ color: BRAND.purple, border: `1px solid ${BRAND.purple}` }}>إعادة درجات الجولة</button>
              </div>
            ))}
          </div>
          <button onClick={() => setConfirmReset(0)} disabled={!sheets}
            className="rounded-xl px-4 py-2 text-[13px] font-bold text-white disabled:opacity-40"
            style={{ background: BRAND.purple }} data-testid="button-reset-scores">🔄 إعادة ضبط كل الجولات</button>
        </Card>

        <Card icon="📄" title="استنساخ البطولة">
          <Note>ينشئ بطولة جديدة بنفس الاسم والجولات والقاعات والأفراد والمحكمين — بدون أي درجات — وتظهر في القائمة بعلامة «نسخة».</Note>
          <button onClick={() => void clone()} disabled={cloning}
            className="rounded-xl px-4 py-2 text-[13px] font-bold text-white disabled:opacity-40"
            style={{ background: BRAND.purple }} data-testid="button-clone">{cloning ? "جارٍ الاستنساخ…" : "📄 استنساخ البطولة"}</button>
        </Card>

        <Card icon="🎨" title="إعدادات الهوية">
          <Field label="رابط شعار البطولة (اتركه فارغاً لشعار المركز)"><input {...text("logoUrl")} placeholder="https://…" dir="ltr" /></Field>
          <Field label="نص العلامة المائية"><input {...text("watermarkText")} placeholder="اختياري — الشعار فقط إن تُرك فارغاً" /></Field>
          <div className="flex items-center gap-3 rounded-xl p-3" style={{ background: BRAND.surface }}>
            <img src={logo} alt="" className="h-12 w-12 object-contain" />
            <span className="text-[12px]" style={{ color: `${BRAND.ink}99` }}>يظهر الشعار في رأس تقارير PDF، والعلامة المائية خفيفة في الخلفية.</span>
          </div>
        </Card>
      </div>
      <AlertDialog open={confirmReset !== null} onOpenChange={(o) => !o && setConfirmReset(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmReset ? `إعادة درجات الجولة ${confirmReset}؟` : "إعادة ضبط درجات كل الجولات؟"}</AlertDialogTitle>
            <AlertDialogDescription>سيتم حذف {sheetsIn(confirmReset || undefined)} ورقة درجات نهائياً وإعادة فتح {confirmReset ? "قاعات هذه الجولة" : "جميع القاعات"}. لا يمكن التراجع.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={() => void resetLeaderScores(t.id, confirmReset || undefined).then(onReset)}>نعم، أعد الضبط</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
