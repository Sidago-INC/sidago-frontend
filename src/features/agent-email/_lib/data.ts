import { getCompanySymbol } from "@/features/backoffice-shared/constants";
import type { EmailQueueItem } from "./apiTypes";

export const EMAIL_PRIORITY_VALUES = [
  "1st",
  "2nd",
  "3rd",
  "4th",
  "5th",
  "send_contract",
  "resend_contract",
  "lukewarm",
  "finished",
] as const;

export type EmailPriority = (typeof EMAIL_PRIORITY_VALUES)[number];

export const EMAIL_STATUS_LABELS: Record<string, string> = {
  "1st": "1st",
  "2nd": "2nd",
  "3rd": "3rd",
  "4th": "4th",
  "5th": "5th",
  send_contract: "Send Contract",
  resend_contract: "Resend Contract",
  lukewarm: "Lukewarm",
  finished: "Finished",
};

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
