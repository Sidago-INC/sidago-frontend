import { getCompanySymbol } from "@/features/backoffice-shared/constants";
import type { SmsQueueItem } from "./apiTypes";

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
  brandCode: string;
};

export const smsAgentProfiles: Record<
  string,
  { agentName: string; brand: SmsBrand }
> = {
  "mariz-cabido": { agentName: "Mariz Cabido", brand: "Sidago" },
  "tom-silver": { agentName: "Tom Silver", brand: "Sidago" },
  "chris-moore": { agentName: "Chris Moore", brand: "95RM" },
};

function toSmsStatus(value: string | null): SmsStatus {
  const normalized = (value ?? "Queued").trim();
  if (SMS_STATUS_VALUES.includes(normalized as SmsStatus)) {
    return normalized as SmsStatus;
  }
  return "Queued";
}

export function mapSmsQueueItem(
  item: SmsQueueItem,
  brandCode: string,
  brand: SmsBrand,
): AgentSmsRow {
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
    timezone: item.timezone ?? "",
    contactType: item.contactType ?? "",
    bentonLeadType: item.leadType ?? "",
    callBackDate: item.callBackDate ?? "",
    lastActionDate: item.lastCalledDate ?? "",
    notes: "",
    additionalContacts: "",
    selectedOutcome: "",
    notWorked: item.notWorkAnymore,
    smsStatus: toSmsStatus(item.smsStatus),
    smsLogged: item.isSmsLogged,
    smsLog: "",
    brand,
    phone: item.phone ?? "",
    email: item.email ?? "",
    brandCode,
  };
}
