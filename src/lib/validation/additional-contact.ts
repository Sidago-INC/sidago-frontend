import type { Rule } from "./index";
import { email, maxLength, required } from "./index";

export type AdditionalContactFormValues = {
  firstName: string;
  lastName: string;
  fullName: string;
  role: string;
  email: string;
  companyId: string;
};

export const additionalContactValidationSchema: Record<
  keyof AdditionalContactFormValues,
  Rule[]
> = {
  firstName: [
    required("First name is required."),
    maxLength(128, "First name must be 128 characters or fewer."),
  ],
  lastName: [
    required("Last name is required."),
    maxLength(128, "Last name must be 128 characters or fewer."),
  ],
  fullName: [
    maxLength(255, "Full name must be 255 characters or fewer."),
  ],
  role: [
    maxLength(128, "Role must be 128 characters or fewer."),
  ],
  email: [
    required("Email is required."),
    email("Enter a valid email address."),
    maxLength(255, "Email must be 255 characters or fewer."),
  ],
  companyId: [required("Company is required.")],
};
