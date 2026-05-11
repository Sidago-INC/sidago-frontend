import type { Rule } from "./index";
import { email, maxLength, required } from "./index";

export type AdditionalContactFormValues = {
  name: string;
  fullName: string;
  role: string;
  email: string;
  companyName: string;
};

export const additionalContactValidationSchema: Record<
  keyof AdditionalContactFormValues,
  Rule[]
> = {
  name: [
    required("Name is required."),
    maxLength(80, "Name must be 80 characters or fewer."),
  ],
  fullName: [
    required("Full name is required."),
    maxLength(120, "Full name must be 120 characters or fewer."),
  ],
  role: [
    required("Role is required."),
    maxLength(120, "Role must be 120 characters or fewer."),
  ],
  email: [
    required("Email is required."),
    email("Enter a valid email address."),
    maxLength(160, "Email must be 160 characters or fewer."),
  ],
  companyName: [required("Company is required.")],
};
