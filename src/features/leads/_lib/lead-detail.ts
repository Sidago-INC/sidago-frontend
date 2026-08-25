import type {
  BrandState,
  HistoryEntry,
  LeadDetailResponse,
  RelatedContact,
} from "@/features/agent-calls/_lib/apiTypes";
import { getHistoryEntries } from "@/features/agent-calls/_lib/history";
import {
  normalizeBrandCode,
} from "@/lib/navigation-agents";
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
  nextFollowUpDate?: string | null;
  lastCalledDate?: string | null;
  toBeCalledBy?: string | null;
  toBeCalledByName?: string | null;
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

function emptyBrandState() {
  return {
    leadType: null,
    followUpDate: null,
    nextFollowUpDate: null,
    lastCalledDate: null,
  };
}

function toBrandStatesKey(
  brandCode: string,
): keyof ExtendedBrandStates | null {
  const normalized = normalizeBrandCode(brandCode);
  if (normalized === "svg" || normalized === "benton" || normalized === "95rm") {
    return normalized;
  }
  return null;
}

function mapHistoryEntry(entry: HistoryEntry): CallHistoryEntry {
  return {
    calledAt: entry.calledAt,
    agentName: entry.agentName,
    resultCode: entry.resultCode,
    notes: entry.notes,
  };
}

function resolveToBeCalledByName(state: BrandState): string | null {
  const name =
    state.toBeCalledByName?.trim() ||
    state.toBeCalledBy?.trim() ||
    "";
  return name || null;
}

function mapBrandState(
  state: BrandState,
  history: LeadDetailResponse["history"],
): ExtendedBrandState {
  return {
    leadType: state.leadType,
    followUpDate: state.followUpDate,
    nextFollowUpDate: state.nextFollowUpDate,
    lastCalledDate: state.lastCalledDate,
    toBeCalledBy: resolveToBeCalledByName(state),
    toBeCalledByName: resolveToBeCalledByName(state),
    callHistory: getHistoryEntries(history, state.brandCode).map(mapHistoryEntry),
  };
}

export function mapLeadDetailResponseToPayload(
  response: LeadDetailResponse,
): LeadDetailPayload {
  const { lead, company, brandState, peerBrandStates, history } = response;
  const brandStates: BrandStates & ExtendedBrandStates = {
    svg: emptyBrandState(),
    benton: emptyBrandState(),
    "95rm": emptyBrandState(),
  };

  for (const state of [brandState, ...peerBrandStates]) {
    const key = toBrandStatesKey(state.brandCode);
    if (!key) continue;
    brandStates[key] = {
      ...brandStates[key],
      ...mapBrandState(state, history),
    };
  }

  return {
    lead: {
      id: lead.id,
      leadIdExternal: lead.leadIdExternal,
      fullName: lead.fullName,
      phone: lead.phone,
      phoneExtension: lead.phoneExtension,
      email: lead.email,
      role: lead.role,
      timezone: lead.timezone,
      contactType: lead.contactType,
      otherContacts: lead.otherContacts ?? null,
      notWorkAnymore: lead.notWorkAnymore,
      // A lead can have no company at all (19 of them do), in which case the
      // detail endpoint returns company: null.
      companyId: company?.id ?? null,
      companyName: company?.companyName ?? null,
      companySymbol: company?.companySymbol ?? null,
      companyTimezone: company?.timezone ?? null,
      companyCountry: company?.country ?? null,
      lastActionDate: response.lastActionDate ?? lead.lastActionDate ?? null,
    },
    brandStates,
  };
}

export function relatedContactToRelatedLead(
  contact: RelatedContact,
): RelatedLead {
  return {
    id: contact.id,
    fullName: contact.fullName,
    email: contact.email,
    phone: contact.phone,
    role: contact.role,
  };
}

function splitName(fullName: string) {
  const [firstName = "", ...rest] = fullName.trim().split(/\s+/);
  return {
    firstName,
    lastName: rest.join(" "),
  };
}

function getToBeCalledBy(state: ExtendedBrandState | undefined): string {
  return (
    state?.toBeCalledByName?.trim() ||
    state?.toBeCalledBy?.trim() ||
    state?.to_be_called_by?.trim() ||
    ""
  );
}

function isoToDateInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function getCallHistory(
  state: ExtendedBrandState | undefined,
): CallHistoryEntry[] | undefined {
  return state?.callHistory ?? state?.history;
}

export function relatedLeadToDirectoryRow(contact: RelatedLead): LeadDirectoryRow {
  const timezone =
    resolveLeadTimezone(contact.timezone, contact.companyTimezone) ?? "";
  const { firstName, lastName } = splitName(contact.fullName ?? "");

  return createLeadDirectoryRow(
    {
      leadId: contact.id,
      lead: contact.leadIdExternal ?? contact.id,
      companyName: contact.companyName ?? "",
      companySymbol: contact.companySymbol ?? "",
      fullName: contact.fullName ?? "",
      phone: contact.phone ?? "",
      role: contact.role ?? "",
      email: contact.email ?? "",
      timezone: timezone ? stripTimezonePrefix(timezone) : "",
      contactType: contact.contactType ?? "",
      svgLeadType: contact.brandStates?.svg?.leadType ?? "",
      svgToBeCalledBy: contact.brandStates?.svg?.toBeCalledBy ?? "",
      svgLastCallDate: isoToDateInput(contact.brandStates?.svg?.lastCalledDate),
      bentonLeadType: contact.brandStates?.benton?.leadType ?? "",
      bentonToBeCalledBy: contact.brandStates?.benton?.toBeCalledBy ?? "",
      bentonLastCallDate: isoToDateInput(
        contact.brandStates?.benton?.lastCalledDate,
      ),
      rm95LeadType: contact.brandStates?.["95rm"]?.leadType ?? "",
      rm95ToBeCalledBy: contact.brandStates?.["95rm"]?.toBeCalledBy ?? "",
      rm95LastCallDate: isoToDateInput(
        contact.brandStates?.["95rm"]?.lastCalledDate,
      ),
      svgDateBecomeHot: "",
      bentonDateBecomeHot: "",
      rm95DateBecomeHot: "",
      lastActionDate: "",
      lastFixedDate: "",
      notWorked: contact.notWorkAnymore ?? false,
    },
    {
      firstName,
      lastName,
      phoneExtension: contact.phoneExtension ?? "",
    },
  );
}

export function directoryRowToFormState(row: LeadDirectoryRow): LeadDrawerFormState {
  return {
    companyName: row.companyName,
    contactType: row.contactType,
    fullName: row.fullName,
    role: row.role ?? "",
    email: row.email,
    phone: row.phone,
    phoneExtension: row.phoneExtension,
    notWorked: row.notWorked ?? false,
    otherContacts: "",
    svgLeadType: row.svgLeadType,
    svgToBeCalledBy: row.svgToBeCalledBy,
    svgHistoryCalls: "",
    svgHistoryNotes: "",
    svgToBeCalledOn: "",
    bentonLeadType: row.bentonLeadType,
    bentonToBeCalledBy: row.bentonToBeCalledBy,
    bentonHistoryCalls: "",
    bentonHistoryNotes: "",
    bentonToBeCalledOn: "",
    rm95LeadType: row.rm95LeadType,
    rm95ToBeCalledBy: row.rm95ToBeCalledBy,
    rm95HistoryCalls: "",
    rm95HistoryNotes: "",
    rm95ToBeCalledOn: "",
  };
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
      lastActionDate:
        isoToDate(lead.lastActionDate) || fallback?.lastActionDate || "",
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

// `*ToBeCalledOn` is the call-back date and maps to
// `lead_brand_state.follow_up_date` on both read and write. It used to be
// seeded from `nextFollowUpDate` — a legacy override column no code has ever
// written — and saved to `last_called_date`, so setting a call-back date wrote
// a future date into the lead's call history and pushed it out of the Hot
// queue's "stale for 7 days" block.
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
    role: row.role ?? "",
    email: row.email,
    phone: row.phone,
    phoneExtension: row.phoneExtension,
    notWorked: row.notWorked ?? false,
    // The lead's own `other_contacts` column. This box used to be seeded with a
    // rendered list of the company's OTHER lead records, which meant the field
    // displayed one thing and the database stored another — and made the field
    // unsafe to save. Related leads have their own section further down the
    // drawer (AssociatedContactsSection).
    otherContacts: detail.lead.otherContacts ?? "",
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
