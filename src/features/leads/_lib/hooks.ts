import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { LeadDirectoryRow } from "@/features/leads/_lib/data";
import { createLeadDirectoryRow } from "@/features/leads/_lib/data";

export type LeadPickerRow = {
  id: string;
  leadIdExternal: string | null;
  fullName: string | null;
  companySymbol: string | null;
  label: string;
};

type LeadsResponse = { ok: true; count: number; data: LeadPickerRow[] };

function pickerToDirectoryRow(row: LeadPickerRow): LeadDirectoryRow {
  const companyName = row.label.includes(" - ")
    ? row.label.split(" - ").slice(1).join(" - ")
    : "";

  return createLeadDirectoryRow(
    {
      leadId: row.id,
      lead: row.leadIdExternal ?? row.id,
      companyName,
      companySymbol: "",
      fullName: row.fullName ?? "",
      phone: "",
      role: "",
      email: "",
      timezone: "",
      contactType: "",
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

export function useLeadsDirectory(limit = 500, search?: string) {
  return useQuery({
    queryKey: ["leads", "directory", limit, search ?? ""],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: String(limit) });
      if (search?.trim()) {
        params.set("search", search.trim());
      }
      const json = (await api.get(
        `/leads?${params.toString()}`,
      )) as LeadsResponse;
      return json.data.map(pickerToDirectoryRow);
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
