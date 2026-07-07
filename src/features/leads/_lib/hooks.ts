import { useQuery } from "@tanstack/react-query";
import { parseCompanySymbolFromLabel } from "@/features/companies/_lib/hooks";
import type { LeadDirectoryRow } from "@/features/leads/_lib/data";
import { createLeadDirectoryRow } from "@/features/leads/_lib/data";
import { api } from "@/lib/api";
import {
  buildPaginationParams,
  DEFAULT_PAGE_SIZE,
  parsePaginatedResponse,
} from "@/lib/pagination";

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

type LeadsResponse = {
  ok: true;
  data: LeadPickerRow[];
  meta: {
    total_count: number;
    per_page: number;
    current_page: number;
    total_pages: number;
  };
};

function pickerToDirectoryRow(row: LeadPickerRow): LeadDirectoryRow {
  const companyName = row.label.includes(" - ")
    ? row.label.split(" - ").slice(1).join(" - ")
    : row.label.trim();
  const companySymbol =
    row.companySymbol?.trim() ||
    parseCompanySymbolFromLabel(row.label) ||
    "";

  return createLeadDirectoryRow(
    {
      leadId: row.id,
      lead: row.leadIdExternal ?? row.id,
      companyName,
      companySymbol,
      fullName: row.fullName ?? "",
      phone: row.phone ?? "",
      role: "",
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
    },
    {
      firstName: "",
      lastName: "",
      phoneExtension: "",
    },
  );
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
      const parsed = parsePaginatedResponse<LeadPickerRow>(json);
      return {
        data: parsed.data.map(pickerToDirectoryRow),
        meta: parsed.meta,
      };
    },
    staleTime: 60_000,
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
