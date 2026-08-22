export interface JudgeRegistrationInfo {
  tournamentId: string;
  tournamentName: string;
}

export interface JudgeRegistration {
  name: string;
  institution: string;
  experience: string;
  canChair: boolean;
  submittedAt: number;
}

function b64encode(s: string) {
  return btoa(unescape(encodeURIComponent(s)));
}
function b64decode(s: string) {
  return decodeURIComponent(escape(atob(s)));
}

export function encodeJudgeRegistration(reg: JudgeRegistration): string {
  return b64encode(JSON.stringify(reg));
}

export function decodeJudgeRegistration(s: string): JudgeRegistration | null {
  try {
    return JSON.parse(b64decode(s));
  } catch {
    return null;
  }
}

export function buildJudgeRegisterUrl(info: JudgeRegistrationInfo): string {
  const base =
    window.location.origin + import.meta.env.BASE_URL.replace(/\/$/, "");
  const data = b64encode(JSON.stringify(info));
  return `${base}/judge-register?d=${encodeURIComponent(data)}`;
}

export function decodeJudgeRegisterToken(
  s: string
): JudgeRegistrationInfo | null {
  try {
    return JSON.parse(b64decode(s));
  } catch {
    return null;
  }
}
