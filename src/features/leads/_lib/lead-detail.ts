import { formatRelatedContacts } from "@/features/agent-call-logs/_lib/format";
import type {
  BrandStates,
  FullLead,
  RelatedLead,
} from "@/features/fix-leads/_lib/data";
import { resolveLeadTimezone, stripTimezonePrefix } from "@/types/timezone.types";
import { createLeadDirectoryRow, type LeadDirectoryRow } from "./data";

type CallHistoryEntry = {
  calledAt: string;
  agentName?: string | null;
  userName?: string | null;
  resultCode?: string | null;
  notes?: string | null;
};

type ExtendedBrandState = {
  leadType?: string | null;
  followUpDate?: string | null;
  lastCalledDate?: string | null;
  toBeCalledBy?: string | null;
  to_be_called_by?: string | null;
  callHistory?: CallHistoryEntry[];
  history?: CallHistoryEntry[];
};

type ExtendedBrandStates = {
  svg?: ExtendedBrandState;
  benton?: ExtendedBrandState;
  "95rm"?: ExtendedBrandState;
};

export type LeadDetailPayload = {
  lead: FullLead;
  brandStates: BrandStates & ExtendedBrandStates;
};

export type LeadDrawerFormState = {
  companyName: string;
  contactType: string;
  fullName: string;
  firstName: string;
  lastName: string;
  role: string;
  email: string;
  phone: string;
  phoneExtension: string;
  notWorked: boolean;
  otherContacts: string;
  svgLeadType: string;
  svgToBeCalledBy: string;
  svgHistoryCalls: string;
  svgHistoryNotes: string;
  svgToBeCalledOn: string;
  bentonLeadType: string;
  bentonToBeCalledBy: string;
  bentonHistoryCalls: string;
  bentonHistoryNotes: string;
  bentonToBeCalledOn: string;
  rm95LeadType: string;
  rm95ToBeCalledBy: string;
  rm95HistoryCalls: string;
  rm95HistoryNotes: string;
  rm95ToBeCalledOn: string;
};

function isoToDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function formatCallLogDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
}

function formatBrandCallsHistory(
  entries: CallHistoryEntry[] | undefined,
): string {
  if (!entries?.length) return "";

  return entries
    .map((entry) =>
      [
        formatCallLogDate(entry.calledAt),
        entry.agentName ?? entry.userName,
        entry.resultCode,
      ]
        .filter(Boolean)
        .join(" - "),
    )
    .join("\n");
}

function formatBrandNotesHistory(
  entries: CallHistoryEntry[] | undefined,
): string {
  if (!entries?.length) return "";

  return entries
    .filter((entry) => entry.notes)
    .map((entry) =>
      [
        formatCallLogDate(entry.calledAt),
        entry.agentName ?? entry.userName,
        entry.notes,
      ]
        .filter(Boolean)
        .join(" - "),
    )
    .join("\n");
}

function splitName(fullName: string) {
  const [firstName = "", ...rest] = fullName.trim().split(/\s+/);
  return {
    firstName,
    lastName: rest.join(" "),
  };
}

function getToBeCalledBy(state: ExtendedBrandState | undefined): string {
  return state?.toBeCalledBy?.trim() || state?.to_be_called_by?.trim() || "";
}

function getCallHistory(
  state: ExtendedBrandState | undefined,
): CallHistoryEntry[] | undefined {
  return state?.callHistory ?? state?.history;
}

export function leadDetailToDirectoryRow(
  detail: LeadDetailPayload,
  fallback?: LeadDirectoryRow | null,
): LeadDirectoryRow {
  const { lead, brandStates } = detail;
  const extended = brandStates as ExtendedBrandStates;
  const timezone =
    resolveLeadTimezone(lead.timezone, lead.companyTimezone) ??
    fallback?.timezone ??
    "";
  const { firstName, lastName } = splitName(lead.fullName ?? fallback?.fullName ?? "");

  return createLeadDirectoryRow(
    {
      leadId: lead.id,
      lead: lead.leadIdExternal ?? lead.id,
      companyName: lead.companyName ?? fallback?.companyName ?? "",
      companySymbol: lead.companySymbol ?? fallback?.companySymbol ?? "",
      fullName: lead.fullName ?? fallback?.fullName ?? "",
      phone: lead.phone ?? "",
      role: lead.role ?? "",
      email: lead.email ?? "",
      timezone: timezone ? stripTimezonePrefix(timezone) : "",
      contactType: lead.contactType ?? "",
      svgLeadType: brandStates.svg?.leadType ?? "",
      svgToBeCalledBy: getToBeCalledBy(extended.svg),
      svgLastCallDate: isoToDate(brandStates.svg?.lastCalledDate),
      bentonLeadType: brandStates.benton?.leadType ?? "",
      bentonToBeCalledBy: getToBeCalledBy(extended.benton),
      bentonLastCallDate: isoToDate(brandStates.benton?.lastCalledDate),
      rm95LeadType: brandStates["95rm"]?.leadType ?? "",
      rm95ToBeCalledBy: getToBeCalledBy(extended["95rm"]),
      rm95LastCallDate: isoToDate(brandStates["95rm"]?.lastCalledDate),
      svgDateBecomeHot: "",
      bentonDateBecomeHot: "",
      rm95DateBecomeHot: "",
      lastActionDate: "",
      lastFixedDate: "",
      notWorked: lead.notWorkAnymore ?? false,
    },
    {
      firstName,
      lastName,
      phoneExtension: lead.phoneExtension ?? "",
    },
  );
}

export function leadDetailToFormState(
  detail: LeadDetailPayload,
  related: RelatedLead[] = [],
): LeadDrawerFormState {
  const row = leadDetailToDirectoryRow(detail);
  const extended = detail.brandStates as ExtendedBrandStates;

  return {
    companyName: row.companyName,
    contactType: row.contactType,
    fullName: row.fullName,
    firstName: row.firstName,
    lastName: row.lastName,
    role: row.role ?? "",
    email: row.email,
    phone: row.phone,
    phoneExtension: row.phoneExtension,
    notWorked: row.notWorked ?? false,
    otherContacts: formatRelatedContacts(
      related.map((contact) => ({
        id: contact.id,
        fullName: contact.fullName ?? "",
        role: contact.role ?? "",
        phone: contact.phone ?? "",
        email: contact.email ?? "",
      })),
    ),
    svgLeadType: row.svgLeadType,
    svgToBeCalledBy: row.svgToBeCalledBy,
    svgHistoryCalls: formatBrandCallsHistory(getCallHistory(extended.svg)),
    svgHistoryNotes: formatBrandNotesHistory(getCallHistory(extended.svg)),
    svgToBeCalledOn: isoToDate(detail.brandStates.svg?.followUpDate),
    bentonLeadType: row.bentonLeadType,
    bentonToBeCalledBy: row.bentonToBeCalledBy,
    bentonHistoryCalls: formatBrandCallsHistory(getCallHistory(extended.benton)),
    bentonHistoryNotes: formatBrandNotesHistory(getCallHistory(extended.benton)),
    bentonToBeCalledOn: isoToDate(detail.brandStates.benton?.followUpDate),
    rm95LeadType: row.rm95LeadType,
    rm95ToBeCalledBy: row.rm95ToBeCalledBy,
    rm95HistoryCalls: formatBrandCallsHistory(getCallHistory(extended["95rm"])),
    rm95HistoryNotes: formatBrandNotesHistory(getCallHistory(extended["95rm"])),
    rm95ToBeCalledOn: isoToDate(detail.brandStates["95rm"]?.followUpDate),
  };
}
