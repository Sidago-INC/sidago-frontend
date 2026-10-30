import { getCompanySymbol } from "@/features/backoffice-shared/constants";
import type { EmailQueueItem } from "./apiTypes";

// Exactly the values `lead_brand_state_email_status_check` permits. "4th" and
// "5th" used to be listed here and would be rejected by that constraint.
export const EMAIL_PRIORITY_VALUES = [
  "1st",
  "2nd",
  "3rd",
  "finished",
  "send_contract",
  "resend_contract",
  "lukewarm",
] as const;

export type EmailPriority = (typeof EMAIL_PRIORITY_VALUES)[number];

export const EMAIL_STATUS_LABELS: Record<string, string> = {
  "1st": "1st",
  "2nd": "2nd",
  "3rd": "3rd",
  send_contract: "Send Contract",
  resend_contract: "Resend Contract",
  lukewarm: "Lukewarm",
  finished: "Finished",
};

/** Filter/select options, label-formatted. */
export const EMAIL_PRIORITY_OPTIONS: { value: string; label: string }[] =
  EMAIL_PRIORITY_VALUES.map((value) => ({
    value,
    label: EMAIL_STATUS_LABELS[value] ?? value,
  }));

export function formatEmailStatusLabel(value: string | null | undefined): string {
  const normalized = (value ?? "").trim();
  if (!normalized) return "";
  return EMAIL_STATUS_LABELS[normalized] ?? normalized;
}

export type AgentEmailRow = {
  id: string;
  lead: string;
  leadId: string;
  companyName: string;
  companySymbol: string;
  companyId: string | null;
  fullName: string;
  phone: string;
  email: string;
  timezone: string;
  contactType: string;
  bentonLeadType: string;
  callBackDate: string;
  lastActionDate: string;
  notes: string;
  additionalContacts: string;
  selectedOutcome: string;
  notWorked: boolean;
  emailToBeSent: string;
  history: string;
  checkToLog: boolean;
  missingDeadEmail: boolean;
  additionalEmails: string;
  brandCode: string;
};

/** Keep API status values as-is; never collapse Hot stages to "1st". */
function toEmailStatus(value: string | null): string {
  const normalized = (value ?? "").trim();
  return normalized || "1st";
}

export function mapEmailQueueItem(
  item: EmailQueueItem,
  brandCode: string,
): AgentEmailRow {
  const companySymbol =
    item.companySymbol ?? getCompanySymbol(item.companyName ?? "");
  const displayLeadId = item.leadIdExternal ?? item.leadId;

  return {
    id: item.id,
    lead: displayLeadId,
    leadId: item.leadId,
    companyName: item.companyName ?? "",
    companySymbol,
    companyId: item.companyId ?? null,
    fullName: item.fullName ?? "",
    phone: item.phone ?? "",
    email: item.email ?? "",
    timezone: item.timezone ?? "",
    contactType: item.contactType ?? "",
    bentonLeadType: item.leadType ?? "",
    callBackDate: item.callBackDate ?? "",
    lastActionDate: item.lastCalledDate ?? "",
    notes: "",
    additionalContacts: "",
    selectedOutcome: "",
    notWorked: item.notWorkAnymore,
    emailToBeSent: toEmailStatus(item.emailStatus),
    history: "",
    checkToLog: item.isEmailLogged,
    missingDeadEmail: item.isMissingDeadEmail,
    additionalEmails: "",
    brandCode,
  };
}

export const emailPriorityOptions = EMAIL_PRIORITY_VALUES.map((value) => ({
  label: formatEmailStatusLabel(value),
  value,
}));
