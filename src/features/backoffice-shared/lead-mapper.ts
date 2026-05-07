import { generateRandomLeads, type LEAD } from "@/types/lead.types";
import type { HotLeadRow } from "./types";

const CAMPAIGN_TYPES = [
  "Current Interest",
  "Reactivation",
  "Inbound",
  "Outbound",
  "Referral",
] as const;

function stripTimezonePrefix(tz: string | undefined): string {
  return (tz ?? "").replace(/^\d+-/, "");
}

function isoToDate(iso: string | undefined): string {
  if (!iso) return "";
  return new Date(iso).toISOString().split("T")[0];
}

function isoToActionDate(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  const date = d.toISOString().split("T")[0];
  const time = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  return `${date} ${time}`;
}

function isoToFollowUpLabel(iso: string | undefined): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function leadToHotLeadRow(lead: LEAD): HotLeadRow {
  return {
    lead: lead.lead_type ?? "",
    companyName: lead.company?.name ?? "",
    fullName: lead.full_name ?? "",
    phone: lead.phone ?? "",
    role: lead.role ?? "",
    email: lead.email ?? "",
    timezone: stripTimezonePrefix(lead.company?.timezone),
    contactType: lead.contact_type ?? "",
    svgLeadType: lead.lead_type ?? "",
    svgToBeCalledBy: lead.to_be_called_by_sidago ?? "",
    svgLastCallDate: isoToDate(lead.last_called_date_sidago),
    bentonLeadType: lead.lead_type_benton ?? "",
    bentonToBeCalledBy: lead.to_be_called_by_benton ?? "",
    bentonLastCallDate: isoToDate(lead.last_called_date_benton),
    rm95LeadType: lead.lead_type_95rm ?? "",
    rm95ToBeCalledBy: lead.last_called_by_95rm ?? "",
    rm95LastCallDate: isoToDate(lead.last_called_date_95rm),
    svgDateBecomeHot: isoToDate(lead.date_become_hot),
    bentonDateBecomeHot: isoToDate(lead.date_become_hot_benton),
    rm95DateBecomeHot: isoToDate(lead.date_become_hot_95rm),
    lastActionDate: isoToActionDate(lead["last_action_date(svg,benton)"]),
    lastFixedDate: isoToDate(lead.last_fixed_date),
    notWorked: lead.not_work_anymore ?? false,
  };
}

export function leadToRecentInterestRow(
  lead: LEAD,
  index: number,
): {
  followUpDate: string;
  followUpDateCleaned: string;
  lead: string;
  campaignType: string;
  contactPerson: string;
  companyName: string;
  email: string;
  assignedTo: string;
  callResult: string;
  leadType: string;
  notes: string;
  phone: string;
  timezone: string;
  created?:string;
} {
  const followUpIso = lead.follow_up_date ?? lead.next_follow_up_date_sidago;
  return {
    followUpDate: isoToFollowUpLabel(followUpIso),
    followUpDateCleaned: isoToDate(followUpIso),
    lead: lead.lead_type ?? "",
    campaignType: CAMPAIGN_TYPES[index % CAMPAIGN_TYPES.length],
    contactPerson: lead.full_name ?? "",
    companyName: lead.company?.name ?? "",
    email: lead.email ?? "",
    assignedTo: lead.to_be_called_by_sidago ?? "",
    callResult: lead.call_result_sidago ?? "",
    leadType: lead.lead_type ?? "",
    notes: lead.call_notes_sidago ?? "",
    phone: lead.phone ?? "",
    timezone: stripTimezonePrefix(lead.company?.timezone),
    created: isoToDate(lead.created),
  };
}

export function leadToClosedContactRow(lead: LEAD): {
  lead: string;
  companyName: string;
  fullName: string;
  phone: string;
  email: string;
  timezone: string;
  contactType: string;
  leadType: string;
  bentonLeadType: string;
  svgToBeCalledBy: string;
  bentonToBeCalledBy: string;
  callBackDate: string;
  lastActionDate: string;
} {
  const followUpIso =
    lead.next_follow_up_date_sidago ??
    lead.follow_up_date ??
    lead.next_follow_up_date_benton ??
    lead.follow_up_date_benton ??
    lead.next_follow_up_date_95rm ??
    lead.follow_up_date_95rm;

  return {
    lead: lead.lead_type ?? "",
    companyName: lead.company?.name ?? "",
    fullName: lead.full_name ?? "",
    phone: lead.phone ?? "",
    email: lead.email ?? "",
    timezone: stripTimezonePrefix(lead.company?.timezone),
    contactType: lead.contact_type ?? "",
    leadType: lead.lead_type ?? "",
    bentonLeadType: lead.lead_type_benton ?? "",
    svgToBeCalledBy: lead.to_be_called_by_sidago ?? "",
    bentonToBeCalledBy: lead.to_be_called_by_benton ?? "",
    callBackDate: isoToDate(followUpIso),
    lastActionDate: isoToActionDate(lead["last_action_date(svg,benton)"]),
  };
}

export function generateHotLeadRows(count: number): HotLeadRow[] {
  return generateRandomLeads(count).map(leadToHotLeadRow);
}

export function generateRecentInterestRows(count: number) {
  return generateRandomLeads(count).map(leadToRecentInterestRow);
}

export function generateClosedContactRows(count: number) {
  return generateRandomLeads(count).map(leadToClosedContactRow);
}
