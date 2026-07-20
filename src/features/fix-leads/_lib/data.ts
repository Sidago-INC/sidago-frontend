import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  buildPaginationParams,
  DEFAULT_PAGE_SIZE,
  parsePaginatedResponse,
} from "@/lib/pagination";
import {
  getCompanySymbol,
  getCompanySymbolOptions,
  getLeadId,
  getLeadIdOptions,
  timezoneOptions,
} from "@/features/backoffice-shared/constants";
import {
  resolveLeadTimezone,
  stripTimezonePrefix,
  TIMEZONE_VALUES,
} from "@/types/timezone.types";

// Timezone shortlist options for the Fix Queue (the queue excludes INTL, so
// only the four US zones are offered). Values are the bare abbreviations the
// backend matches on.
export const fixTimezoneOptions = TIMEZONE_VALUES.map(stripTimezonePrefix)
  .filter((abbr) => abbr !== "INTL")
  .map((abbr) => ({ label: abbr, value: abbr }));

// API response shapes — match the NestJS controllers in sidago-backend.
//
// A lead surfaces in the fix queue when ANY brand state has lead_type='Fix'
// (case-insensitive). The backend dedupes via GROUP BY so each lead is one
// row regardless of how many brands flagged it.

// Contacts filter — the four derived buckets (NASDAQ/General × Company/Direct
// Contacts), mirroring the backend lead-classification module. Value strings
// must match the backend exactly; they are sent as the `contactsFilter` param.
export const CONTACTS_FILTER_VALUES = [
  "NASDAQ Company",
  "General Company",
  "NASDAQ Direct Contacts",
  "General Direct Contacts",
] as const;

export type ContactsFilter = (typeof CONTACTS_FILTER_VALUES)[number];

export const contactsFilterOptions: { label: string; value: ContactsFilter }[] =
  CONTACTS_FILTER_VALUES.map((value) => ({ label: value, value }));

export type FixQueueRow = {
  leadId: string;
  fullName: string | null;
  phone: string | null;
  email: string | null;
  timezone: string | null;
  companyTimezone: string | null;
  companyId: string | null;
  companyName: string | null;
  companySymbol: string | null;
  svgLeadType: string | null;
  bentonLeadType: string | null;
  rm95LeadType: string | null;
  fixEntryDate: string | null;
  otherContactsCount: number;
  otherContacts: string | null;
  contactsFilter: ContactsFilter;
  hasOtherContacts: boolean;
};

export type FullLead = {
  id: string;
  leadIdExternal: string | null;
  fullName: string | null;
  phone: string | null;
  phoneExtension: string | null;
  email: string | null;
  role: string | null;
  timezone: string | null;
  contactType: string | null;
  otherContacts: string | null;
  notWorkAnymore: boolean;
  companyId: string | null;
  companyName: string | null;
  companySymbol: string | null;
  companyTimezone: string | null;
  lastActionDate?: string | null;
};

export type BrandStates = {
  svg: {
    leadType: string | null;
    followUpDate: string | null;
    lastCalledDate: string | null;
    toBeCalledBy?: string | null;
  };
  benton: {
    leadType: string | null;
    followUpDate: string | null;
    lastCalledDate: string | null;
    toBeCalledBy?: string | null;
  };
  "95rm": {
    leadType: string | null;
    followUpDate: string | null;
    lastCalledDate: string | null;
    toBeCalledBy?: string | null;
  };
};

export type RelatedLeadBrandState = {
  leadType: string | null;
  followUpDate: string | null;
  lastCalledDate: string | null;
  toBeCalledBy: string | null;
};

export type RelatedLead = {
  id: string;
  leadIdExternal?: string | null;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  phoneExtension?: string | null;
  role: string | null;
  timezone?: string | null;
  contactType?: string | null;
  notWorkAnymore?: boolean;
  companyId?: string | null;
  companyName?: string | null;
  companySymbol?: string | null;
  companyTimezone?: string | null;
  brandStates?: {
    svg: RelatedLeadBrandState;
    benton: RelatedLeadBrandState;
    "95rm": RelatedLeadBrandState;
  };
};

type FixQueueResponse = {
  ok: true;
  data: FixQueueRow[];
  meta: {
    total_count: number;
    per_page: number;
    current_page: number;
    total_pages: number;
  };
};
type FullLeadResponse = { ok: true; lead: FullLead; brandStates: BrandStates };
type RelatedResponse = { ok: true; count: number; data: RelatedLead[] };

type FixQueueApiRow = FixQueueRow & {
  company_timezone?: string | null;
};

function normalizeFixQueueRow(row: FixQueueApiRow): FixQueueRow {
  const companyTimezone = row.companyTimezone ?? row.company_timezone ?? null;
  const timezone = row.timezone ?? companyTimezone;

  return {
    ...row,
    timezone,
    companyTimezone,
  };
}

export function getFixQueueTimezone(row: FixQueueRow): string | null {
  return resolveLeadTimezone(row.timezone, row.companyTimezone);
}

export function getFixQueueTimezoneLabel(row: FixQueueRow): string {
  const timezone = getFixQueueTimezone(row);
  return timezone ? stripTimezonePrefix(timezone) : "";
}

export function useFixQueue(
  page: number,
  perPage = DEFAULT_PAGE_SIZE,
  contactsFilter?: ContactsFilter,
  hasOtherContacts?: boolean,
  timezone?: string,
) {
  return useQuery({
    queryKey: [
      "fix-queue",
      page,
      perPage,
      contactsFilter ?? null,
      hasOtherContacts ?? null,
      timezone ?? null,
    ],
    queryFn: async () => {
      const params = buildPaginationParams(page, perPage);
      if (contactsFilter) params.set("contactsFilter", contactsFilter);
      if (hasOtherContacts) params.set("hasOtherContacts", "true");
      if (timezone) params.set("timezone", timezone);
      const json = (await api.get(
        `/leads/fix-queue?${params.toString()}`,
      )) as FixQueueResponse;
      const parsed = parsePaginatedResponse<FixQueueApiRow>(json);
      return {
        data: parsed.data.map(normalizeFixQueueRow),
        meta: parsed.meta,
      };
    },
    staleTime: 60_000,
  });
}

export function useLeadFull(leadId: string | undefined) {
  return useQuery({
    queryKey: ["lead-full", leadId],
    enabled: Boolean(leadId),
    queryFn: async () => {
      const json = (await api.get(`/leads/${leadId}`)) as FullLeadResponse;
      return json;
    },
    staleTime: 60_000,
  });
}

export function useRelatedLeads(leadId: string | null | undefined) {
  return useQuery({
    queryKey: ["lead-related", leadId],
    enabled: Boolean(leadId),
    queryFn: async () => {
      const json = (await api.get(`/leads/${leadId}/related`)) as RelatedResponse;
      return json.data;
    },
    staleTime: 60_000,
  });
}

export {
  getCompanySymbol,
  getCompanySymbolOptions,
  getLeadId,
  getLeadIdOptions,
  timezoneOptions,
};
