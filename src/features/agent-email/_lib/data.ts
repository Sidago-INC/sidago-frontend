import { getCompanySymbol } from "@/features/backoffice-shared/constants";
import type { EmailQueueItem } from "./apiTypes";

export const EMAIL_PRIORITY_VALUES = [
  "1st",
  "2nd",
  "3rd",
  "4th",
  "5th",
] as const;

export type EmailPriority = (typeof EMAIL_PRIORITY_VALUES)[number];

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
  emailToBeSent: EmailPriority;
  history: string;
  checkToLog: boolean;
  missingDeadEmail: boolean;
  additionalEmails: string;
  brandCode: string;
};

function toEmailPriority(value: string | null): EmailPriority {
  const normalized = (value ?? "1st").trim();
  if (EMAIL_PRIORITY_VALUES.includes(normalized as EmailPriority)) {
    return normalized as EmailPriority;
  }
  return "1st";
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
    emailToBeSent: toEmailPriority(item.emailStatus),
    history: "",
    checkToLog: item.isEmailLogged,
    missingDeadEmail: item.isMissingDeadEmail,
    additionalEmails: "",
    brandCode,
  };
}

export const emailPriorityOptions = EMAIL_PRIORITY_VALUES.map((value) => ({
  label: value,
  value,
}));
