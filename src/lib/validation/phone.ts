// The one set of rules for a typed phone number and extension. The Add Lead
// forms, the phone list field and the phones panel all check through here, so a
// value cannot be accepted on one screen and refused on the next.

/** A leading "+", then 9 to 21 digits and the punctuation people type. */
const PHONE_RULE = /^\+\d[\d\s().-]{8,20}$/;

/** Longest extension a form accepts. */
export const EXTENSION_MAX_LENGTH = 12;

/** Digits only, so a length check ignores formatting. */
export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export function digitCount(value: string): number {
  return digitsOnly(value).length;
}

/**
 * A number the dialler can actually call: a country code and 10-15 digits,
 * matching E.164. Deliberately permissive about punctuation - "+1 (202)
 * 360-7147", "+1 202-360-7147" and "+12023607147" are the same number.
 *
 * Returns the message to show, or null when the value is fine (or empty - the
 * caller decides whether a number is required).
 */
export function validatePhoneNumber(value: string): string | null {
  const v = value.trim();
  if (!v) return null;
  if (!v.startsWith("+")) {
    return "Include the country code, for example +1 (202) 360-7147.";
  }
  if (!PHONE_RULE.test(v)) {
    return "Use digits, spaces, brackets or dashes only, for example +1 (202) 360-7147.";
  }
  const digits = digitCount(v);
  if (digits < 10 || digits > 15) {
    return "A phone number needs between 10 and 15 digits.";
  }
  return null;
}

/**
 * An extension is optional, digits only, and short. `label` names the field in
 * the message ("Phone 2 extension must be digits only.").
 */
export function validateExtension(
  value: string,
  label = "Phone extension",
): string | null {
  const v = value.trim();
  if (!v) return null;
  if (!/^\d+$/.test(v)) return `${label} must be digits only.`;
  if (v.length > EXTENSION_MAX_LENGTH) {
    return `${label} must be ${EXTENSION_MAX_LENGTH} characters or fewer.`;
  }
  return null;
}
