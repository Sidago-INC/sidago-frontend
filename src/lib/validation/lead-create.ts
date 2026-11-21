import type { Rule } from "./index";
import { emailList, maxLength, required } from "./index";
import { digitCount, validateExtension, validatePhoneNumber } from "./phone";

// A number the dialler can actually call. Bulk import already enforces this
// shape (the backend prefixes "+1" to anything without a country code); leads
// typed into the New Lead drawer used to bypass it and could be saved with any
// text, which is how numbers MightyCall cannot dial reached the queue. `required`
// owns emptiness, so an empty value passes here.
const phoneShape = (): Rule => (value) => validatePhoneNumber(value);

export type PhoneEntry = {
  phone: string;
  phoneExtension: string;
};

export type LeadCreateFormValues = {
  companyId: string;
  fullName: string;
  phone: string;
  phoneExtension: string;
  /** One or more addresses, comma-joined — the shape the column stores. */
  email: string;
  role: string;
  /** Free text: extra phones, alternate contacts, notes. Optional. */
  otherContacts: string;
};

export function validatePhonesList(phones: PhoneEntry[]): string | null {
  if (!phones || phones.length === 0) return null;
  const seenDigits = new Set<string>();
  for (let i = 0; i < phones.length; i++) {
    const item = phones[i];
    const p = item?.phone?.trim() ?? "";
    if (i === 0 && !p) {
      return "Phone is required.";
    }
    if (p) {
      const err = phoneShape()(p);
      if (err) return `Phone ${i + 1}: ${err}`;
      const pureDigits = digitCount(p) >= 7 ? p.replace(/\D/g, "") : "";
      if (pureDigits && seenDigits.has(pureDigits)) {
        return `Phone ${i + 1}: Duplicate phone number entered.`;
      }
      if (pureDigits) seenDigits.add(pureDigits);
    }
    const extError = validateExtension(
      item?.phoneExtension ?? "",
      `Phone ${i + 1} extension`,
    );
    if (extError) return extError;
  }
  return null;
}

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
  phoneExtension: [(value) => validateExtension(value)],
  // A lead may carry several addresses. `emailList` checks each one and names
  // the offending address, and the length cap is generous because the column is
  // `text` and the longest list in the migrated data is 316 characters.
  email: [
    required("At least one email address is required."),
    emailList("Enter a valid email address"),
    maxLength(1000, "Email list must be 1000 characters or fewer."),
  ],
  role: [
    required("Role is required."),
    maxLength(120, "Role must be 120 characters or fewer."),
  ],
  otherContacts: [
    maxLength(2000, "Other contacts must be 2000 characters or fewer."),
  ],
};
