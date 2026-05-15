import type { Rule } from "./index";
import { email, maxLength, required } from "./index";

export type LeadCreateFormValues = {
  companyId: string;
  fullName: string;
  firstName: string;
  lastName: string;
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
  firstName: [
    required("First name is required."),
    maxLength(80, "First name must be 80 characters or fewer."),
  ],
  lastName: [
    required("Last name is required."),
    maxLength(80, "Last name must be 80 characters or fewer."),
  ],
  phone: [
    required("Phone is required."),
    maxLength(30, "Phone must be 30 characters or fewer."),
  ],
  phoneExtension: [
    maxLength(12, "Phone extension must be 12 characters or fewer."),
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
