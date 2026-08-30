import type { Rule } from "./index";
import { email, maxLength, pattern, required } from "./index";

/**
 * A number the dialler can actually call.
 *
 * Bulk import already enforces this shape — `applyUsCountryCode` in the
 * backend's import-normalize prefixes "+1" to anything that lacks a country
 * code, so every imported lead carries one. Leads typed into the New Lead
 * drawer bypassed that entirely and could be saved with any text at all, which
 * is how numbers that MightyCall cannot dial reached the queue.
 *
 * Deliberately permissive about punctuation — "+1 (202) 360-7147",
 * "+1 202-360-7147" and "+12023607147" are all the same number to the dialler.
 * What it insists on is a country code and 10-15 digits, matching E.164.
 */
const PHONE_RULE = /^\+\d[\d\s().-]{8,20}$/;

/** Digits only, so the length check ignores formatting. */
function digitCount(value: string): number {
  return value.replace(/\D/g, "").length;
}

const phoneShape = (): Rule => (value) => {
  const v = value.trim();
  if (!v) return null; // `required` owns emptiness
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
};

export type LeadCreateFormValues = {
  companyId: string;
  fullName: string;
  phone: string;
  phoneExtension: string;
  email: string;
  role: string;
};

// Every field is required at the form level except phone extension. The
// backend ultimately persists the phone extension as nullable text, so an
// empty value is fine — we just don't block the user on it.
export const leadCreateValidationSchema: Record<
  keyof LeadCreateFormValues,
  Rule[]
> = {
  companyId: [required("Company is required.")],
  fullName: [
    required("Full name is required."),
    maxLength(120, "Full name must be 120 characters or fewer."),
  ],
  phone: [
    required("Phone is required."),
    phoneShape(),
    maxLength(30, "Phone must be 30 characters or fewer."),
  ],
  phoneExtension: [
    maxLength(12, "Phone extension must be 12 characters or fewer."),
    pattern(/^\d*$/, "Phone extension must be digits only."),
  ],
  email: [
    required("Email is required."),
    email("Enter a valid email address."),
    maxLength(160, "Email must be 160 characters or fewer."),
  ],
  role: [
    required("Role is required."),
    maxLength(120, "Role must be 120 characters or fewer."),
  ],
};
