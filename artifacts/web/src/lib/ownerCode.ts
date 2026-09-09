/**
 * رمز مالك النطاق — a master code that opens any protected tournament, so the
 * platform owner never gets locked out of a tournament whose organiser code is
 * lost. It never replaces the tournament's own code; it works alongside it.
 */
export const OWNER_CODE = "0324";

export const isOwnerCode = (code: string) => code.trim() === OWNER_CODE;
