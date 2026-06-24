import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  getCompanySymbol,
  getCompanySymbolOptions,
  getLeadId,
  getLeadIdOptions,
  timezoneOptions,
} from "@/features/backoffice-shared/constants";
import { resolveLeadTimezone, stripTimezonePrefix } from "@/types/timezone.types";

// API response shapes — match the NestJS controllers in sidago-backend.
//
// A lead surfaces in the fix queue when ANY brand state has lead_type='Fix'
// (case-insensitive). The backend dedupes via GROUP BY so each lead is one
// row regardless of how many brands flagged it.

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
  notWorkAnymore: boolean;
  companyId: string | null;
  companyName: string | null;
  companySymbol: string | null;
  companyTimezone: string | null;
};

export type BrandStates = {
  svg: {
    leadType: string | null;
    followUpDate: string | null;
    lastCalledDate: string | null;
  };
  benton: {
    leadType: string | null;
    followUpDate: string | null;
    lastCalledDate: string | null;
  };
  "95rm": {
    leadType: string | null;
    followUpDate: string | null;
    lastCalledDate: string | null;
  };
};

export type RelatedLead = {
  id: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
};

type FixQueueResponse = { ok: true; count: number; data: FixQueueRow[] };
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

export function useFixQueue(limit: number) {
  return useQuery({
    queryKey: ["fix-queue", limit],
    queryFn: async () => {
      const json = (await api.get(
        `/leads/fix-queue?limit=${limit}`,
      )) as FixQueueResponse;
      return json.data.map(normalizeFixQueueRow);
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
