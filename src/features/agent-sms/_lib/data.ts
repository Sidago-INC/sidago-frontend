import {
  getCompanySymbol,
  getLeadId,
} from "@/features/backoffice-shared/constants";
import { generateHotLeadRows } from "@/features/backoffice-shared/lead-mapper";
import type { HotLeadRow } from "@/features/backoffice-shared/types";

export type SmsBrand = "Sidago" | "Benton" | "95RM";
export const SMS_STATUS_VALUES = [
  "Queued",
  "Sent",
  "Delivered",
  "Replied",
  "Failed",
] as const;
export type SmsStatus = (typeof SMS_STATUS_VALUES)[number];
export const smsStatusOptions = SMS_STATUS_VALUES.map((value) => ({
  label: value,
  value,
}));

export type AgentSmsRow = {
  id: string;
  lead: string;
  leadId: string;
  companyName: string;
  companySymbol: string;
  fullName: string;
  timezone: string;
  contactType: string;
  bentonLeadType: string;
  callBackDate: string;
  lastActionDate: string;
  notes: string;
  additionalContacts: string;
  selectedOutcome: string;
  notWorked: boolean;
  smsStatus: SmsStatus;
  smsLogged: boolean;
  smsLog: string;
  brand: SmsBrand;
  phone: string;
  email: string;
};

export const smsAgentProfiles: Record<
  string,
  { agentName: string; brand: SmsBrand }
> = {
  "mariz-cabido": { agentName: "Mariz Cabido", brand: "Sidago" },
  "tom-silver": { agentName: "Tom Silver", brand: "Sidago" },
  "bryan-taylor": { agentName: "Bryan Taylor", brand: "Benton" },
  "chris-moore": { agentName: "Chris Moore", brand: "95RM" },
};

function getSmsLog(brand: SmsBrand, index: number) {
  const label = `${brand} SMS Log`;
  const day = String(index + 10).padStart(2, "0");

  return `${label}: 04/${day}/2026 - Message ${
    index % 2 === 0 ? "sent" : "reviewed"
  } for lead follow-up.`;
}

function getCallbackDate(lead: HotLeadRow) {
  return (
    lead.svgLastCallDate ||
    lead.bentonLastCallDate ||
    lead.rm95LastCallDate ||
    ""
  );
}

export function getSmsRowsForAgent(agentSlug: string): AgentSmsRow[] {
  const profile = smsAgentProfiles[agentSlug] ?? {
    agentName: agentSlug,
    brand: "Sidago" as SmsBrand,
  };

  return generateHotLeadRows(12).map((lead, index) => ({
    id: `${agentSlug}-sms-${index + 1}`,
    lead: lead.lead,
    leadId: getLeadId(lead),
    companyName: lead.companyName,
    companySymbol: getCompanySymbol(lead.companyName),
    fullName: lead.fullName,
    timezone: lead.timezone,
    contactType: lead.contactType,
    bentonLeadType: lead.bentonLeadType,
    callBackDate: getCallbackDate(lead),
    lastActionDate: lead.lastActionDate,
    notes: "",
    additionalContacts: "",
    selectedOutcome: "",
    notWorked: Boolean(lead.notWorked),
    smsStatus: SMS_STATUS_VALUES[index % SMS_STATUS_VALUES.length],
    smsLogged: index % 3 !== 0,
    smsLog: getSmsLog(profile.brand, index),
    brand: profile.brand,
    phone: lead.phone,
    email: lead.email,
  }));
}
