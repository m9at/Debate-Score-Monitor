/**
 * Optional fields of each registration form that an organiser may mark as
 * mandatory. Name and contact are always required and never listed here.
 */
export interface RegistrationFieldDef {
  key: string;
  label: string;
  hint: string;
}

export const TEAM_FIELDS: RegistrationFieldDef[] = [
  { key: "institution", label: "الجهة / المؤسسة", hint: "الجامعة أو المدرسة أو النادي" },
  { key: "logoUrl", label: "شعار الفريق", hint: "صورة شعار الفريق" },
  { key: "documents", label: "مستندات الفريق", hint: "ملفات يرفعها الفريق عند التسجيل" },
];

export const JUDGE_FIELDS: RegistrationFieldDef[] = [
  { key: "institution", label: "الجهة / المؤسسة", hint: "الجهة التي يمثلها المحكم" },
  { key: "experience", label: "الخبرة في التحكيم", hint: "نبذة عن خبرة المحكم" },
  { key: "photoUrl", label: "صورة المحكم", hint: "صورة شخصية" },
];

export const fieldsFor = (kind: "team" | "judge") =>
  kind === "team" ? TEAM_FIELDS : JUDGE_FIELDS;

export const labelOf = (kind: "team" | "judge", key: string) =>
  fieldsFor(kind).find((f) => f.key === key)?.label ?? key;
