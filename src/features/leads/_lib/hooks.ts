import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { agentCallsApi } from "@/features/agent-calls/_lib/agentCallsApi";
import type { LeadDirectoryRow } from "@/features/leads/_lib/data";
import { createLeadDirectoryRow } from "@/features/leads/_lib/data";
import type { HotLeadRow } from "@/features/backoffice-shared/types";
import { normalizeHotLeadRow } from "@/features/backoffice-shared/normalize-hot-lead-row";
import { api } from "@/lib/api";
import {
  buildPaginationParams,
  DEFAULT_PAGE_SIZE,
  parsePaginatedResponse,
} from "@/lib/pagination";

/** Narrow picker shape still used by lead-select UIs that hit `/leads`. */
export type LeadPickerRow = {
  id: string;
  leadIdExternal: string | null;
  fullName: string | null;
  companySymbol: string | null;
  label: string;
  email?: string | null;
  phone?: string | null;
  contactType?: string | null;
};

type LeadsDirectoryApiRow = HotLeadRow & {
  id?: string;
  leadIdExternal?: string | null;
  label?: string;
  company_symbol?: string | null;
  company_timezone?: string | null;
  // Enriched /leads list uses *LastCalledDate; report rows use *LastCallDate.
  svgLastCalledDate?: string | null;
  bentonLastCalledDate?: string | null;
  rm95LastCalledDate?: string | null;
  company?: {
    name?: string | null;
    symbol?: string | null;
    timezone?: string | null;
  } | null;
};

type LeadsResponse = {
  ok: true;
  data: LeadsDirectoryApiRow[];
  meta: {
    total_count: number;
    per_page: number;
    current_page: number;
    total_pages: number;
  };
};

function asDateString(value: string | null | undefined): string {
  return value?.trim() || "";
}

function apiRowToDirectoryRow(row: LeadsDirectoryApiRow): LeadDirectoryRow {
  const normalized = normalizeHotLeadRow({
    ...row,
    svgLastCallDate:
      asDateString(row.svgLastCallDate) ||
      asDateString(row.svgLastCalledDate),
    bentonLastCallDate:
      asDateString(row.bentonLastCallDate) ||
      asDateString(row.bentonLastCalledDate),
    rm95LastCallDate:
      asDateString(row.rm95LastCallDate) ||
      asDateString(row.rm95LastCalledDate),
  });
  const leadId = normalized.leadId ?? row.id ?? "";
  const lead =
    normalized.lead ||
    row.leadIdExternal ||
    leadId ||
    "";

  // Fallback when API still returns picker-style label without companyName.
  const companyName =
    normalized.companyName ||
    (row.label?.includes(" - ")
      ? row.label.split(" - ").slice(1).join(" - ")
      : row.label?.trim() || "");

  return createLeadDirectoryRow(
    {
      ...normalized,
      leadId,
      lead,
      companyName,
      phone: normalized.phone || row.phone || "",
      email: normalized.email || row.email || "",
      contactType: normalized.contactType || row.contactType || "",
      fullName: normalized.fullName || row.fullName || "",
      companySymbol: normalized.companySymbol || row.companySymbol || "",
      svgToBeCalledBy: normalized.svgToBeCalledBy || "",
      bentonToBeCalledBy: normalized.bentonToBeCalledBy || "",
      rm95ToBeCalledBy: normalized.rm95ToBeCalledBy || "",
      lastActionDate: asDateString(normalized.lastActionDate),
    },
    {
      firstName: "",
      lastName: "",
      phoneExtension: "",
    },
  );
}

/** @deprecated Prefer apiRowToDirectoryRow; kept for callers expecting picker mapping. */
function pickerToDirectoryRow(row: LeadPickerRow): LeadDirectoryRow {
  return apiRowToDirectoryRow({
    id: row.id,
    leadId: row.id,
    lead: row.leadIdExternal ?? row.id,
    leadIdExternal: row.leadIdExternal,
    label: row.label,
    fullName: row.fullName ?? "",
    companyName: "",
    companySymbol: row.companySymbol ?? "",
    phone: row.phone ?? "",
    email: row.email ?? "",
    timezone: "",
    contactType: row.contactType ?? "",
    svgLeadType: "",
    svgToBeCalledBy: "",
    svgLastCallDate: "",
    bentonLeadType: "",
    bentonToBeCalledBy: "",
    bentonLastCallDate: "",
    rm95LeadType: "",
    rm95ToBeCalledBy: "",
    rm95LastCallDate: "",
    svgDateBecomeHot: "",
    bentonDateBecomeHot: "",
    rm95DateBecomeHot: "",
    lastActionDate: "",
    lastFixedDate: "",
    notWorked: false,
  });
}

export function useLeadsDirectory(
  page: number,
  perPage = DEFAULT_PAGE_SIZE,
  search?: string,
) {
  return useQuery({
    queryKey: ["leads", "directory", page, perPage, search ?? ""],
    queryFn: async () => {
      const params = buildPaginationParams(page, perPage);
      if (search?.trim()) {
        params.set("search", search.trim());
      }
      const json = (await api.get(
        `/leads?${params.toString()}`,
      )) as LeadsResponse;
      const parsed = parsePaginatedResponse<LeadsDirectoryApiRow>(json);
      return {
        data: parsed.data.map(apiRowToDirectoryRow),
        meta: parsed.meta,
      };
    },
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}

export const LEAD_DETAIL_HISTORY_LIMIT = 50;

export function useLeadCallDetail(
  leadId: string | null | undefined,
  agentSlug: string | null | undefined,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ["lead-call-detail", leadId, agentSlug],
    enabled: enabled && Boolean(leadId && agentSlug),
    queryFn: () =>
      agentCallsApi.detail(leadId!, agentSlug!, LEAD_DETAIL_HISTORY_LIMIT),
    staleTime: 15_000,
  });
}

type CreateLeadBody = {
  companyId: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  phone: string;
  phoneExtension?: string;
  email: string;
  role: string;
  timezone?: string;
};

type CreateLeadResponse = {
  ok: true;
  id: string;
  fullName: string;
  email: string;
};

export async function createLead(body: CreateLeadBody) {
  return (await api.post("/leads/add-new", body)) as CreateLeadResponse;
}

export { pickerToDirectoryRow };
