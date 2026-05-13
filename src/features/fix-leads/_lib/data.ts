import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  getCompanySymbol,
  getCompanySymbolOptions,
  getLeadId,
  getLeadIdOptions,
  timezoneOptions,
} from "@/features/backoffice-shared/constants";

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

export function useFixQueue() {
  return useQuery({
    queryKey: ["fix-queue"],
    queryFn: async () => {
      const json = (await api.get("/leads/fix-queue?limit=500")) as FixQueueResponse;
      return json.data;
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
