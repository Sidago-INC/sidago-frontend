import {
  getCompanySymbol,
  getLeadId,
} from "@/features/backoffice-shared/constants";
import { generateHotLeadRows } from "@/features/backoffice-shared/lead-mapper";
import type { HotLeadRow } from "@/features/backoffice-shared/types";

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
};

const histories = [
  "Intro email queued after recent interest.",
  "Follow-up email drafted after call attempt.",
  "Reactivation email scheduled for this week.",
  "Manual review requested before sending.",
  "Previous email opened, no reply yet.",
];

function buildAdditionalEmails(email: string, index: number) {
  const [name, domain] = email.split("@");
  return `${name}+alt${index + 1}@${domain}`;
}

function getCallbackDate(lead: HotLeadRow) {
  return (
    lead.svgLastCallDate ||
    lead.bentonLastCallDate ||
    lead.rm95LastCallDate ||
    ""
  );
}

export function getEmailRowsForAgent(agentSlug: string): AgentEmailRow[] {
  return generateHotLeadRows(12).map((lead, index) => ({
    id: `${agentSlug}-email-${index + 1}`,
    lead: lead.lead,
    leadId: getLeadId(lead),
    companyName: lead.companyName,
    companySymbol: getCompanySymbol(lead.companyName),
    fullName: lead.fullName,
    phone: lead.phone,
    email: lead.email,
    timezone: lead.timezone,
    contactType: lead.contactType,
    bentonLeadType: lead.bentonLeadType,
    callBackDate: getCallbackDate(lead),
    lastActionDate: lead.lastActionDate,
    notes: "",
    additionalContacts: buildAdditionalEmails(lead.email, index),
    selectedOutcome: "",
    notWorked: Boolean(lead.notWorked),
    emailToBeSent: EMAIL_PRIORITY_VALUES[index % EMAIL_PRIORITY_VALUES.length],
    history: histories[index % histories.length],
    checkToLog: index % 2 === 0,
    missingDeadEmail: index % 5 === 0,
    additionalEmails: buildAdditionalEmails(lead.email, index),
  }));
}

export const emailPriorityOptions = EMAIL_PRIORITY_VALUES.map((value) => ({
  label: value,
  value,
}));
