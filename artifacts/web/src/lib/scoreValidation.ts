export const SPEAKER_MIN = 59;
export const SPEAKER_MAX = 82;
export const REPLY_MIN = 29;
export const REPLY_MAX = 41;

export function isSpeakerScoreValid(value: string | number): boolean {
  if (value === "" || value === null || value === undefined) return false;
  const n = typeof value === "number" ? value : parseFloat(value);
  if (isNaN(n)) return false;
  return n >= SPEAKER_MIN && n <= SPEAKER_MAX;
}

export function isReplyScoreValid(value: string | number): boolean {
  if (value === "" || value === null || value === undefined) return false;
  const n = typeof value === "number" ? value : parseFloat(value);
  if (isNaN(n)) return false;
  return n >= REPLY_MIN && n <= REPLY_MAX;
}

export const SPEAKER_RANGE_LABEL = `${SPEAKER_MIN}–${SPEAKER_MAX}`;
export const REPLY_RANGE_LABEL = `${REPLY_MIN}–${REPLY_MAX}`;
export const SPEAKER_RANGE_MESSAGE = `درجة المتحدث يجب أن تكون بين ${SPEAKER_MIN} و ${SPEAKER_MAX}`;
export const REPLY_RANGE_MESSAGE = `درجة خطاب الرد يجب أن تكون بين ${REPLY_MIN} و ${REPLY_MAX}`;

/**
 * The tournament's score rules are fixed: no input may ever leave the range,
 * whether typed or stepped. Returns the accepted string for the field.
 */
export function clampScoreInput(
  raw: string,
  min: number,
  max: number,
): string {
  if (raw.trim() === "") return "";
  const cleaned = raw.replace(/[^\d.]/g, "");
  const n = parseFloat(cleaned);
  if (isNaN(n)) return "";
  if (n > max) return String(max);
  return cleaned;
}

/** Rejects a value that fell below the minimum once the field is left. */
export function clampScoreOnBlur(raw: string, min: number, max: number): string {
  if (raw.trim() === "") return "";
  const n = parseFloat(raw);
  if (isNaN(n)) return "";
  if (n < min) return String(min);
  if (n > max) return String(max);
  return raw;
}
