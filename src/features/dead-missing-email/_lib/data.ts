import { getLeadGridLabel } from "@/features/backoffice-shared/constants";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  buildPaginationParams,
  DEFAULT_PAGE_SIZE,
  parsePaginatedResponse,
} from "@/lib/pagination";

export type DeadMissingEmailRow = {
  leadId: string;
  leadIdExternal: string | null;
  companySymbol: string | null;
  companyName: string | null;
  fullName: string | null;
  email: string | null;
  contactType: string | null;
  leadTypeSvg: string | null;
  leadType95rm: string | null;
  leadTypeBenton: string | null;
  missingDeadBrands: string[];
};

type DeadEmailResponse = {
  ok: true;
  data: DeadMissingEmailRow[];
  meta: {
    total_count: number;
    per_page: number;
    current_page: number;
    total_pages: number;
    groups?: { value: string; count: number }[];
  };
};

export type DeadMissingEmailGridQuery = {
  search?: string;
  filters?: string;
  sort?: string;
  groupBy?: string;
};

type ClearDeadEmailResponse = {
  ok: true;
  updated: number;
};

export function getDeadEmailDisplayLeadId(row: DeadMissingEmailRow): string {
  return getLeadGridLabel(row);
}

export function getDeadEmailBrandLabel(brand: string): string {
  switch (brand.toLowerCase()) {
    case "svg":
      return "SVG";
    case "95rm":
      return "95RM";
    case "benton":
      return "Benton";
    default:
      return brand;
  }
}

export function useDeadMissingEmails(
  page: number,
  perPage = DEFAULT_PAGE_SIZE,
  grid: DeadMissingEmailGridQuery = {},
) {
  return useQuery({
    queryKey: ["dead-missing-email", page, perPage, grid],
    queryFn: async () => {
      const params = buildPaginationParams(page, perPage, {
        ...(grid.search ? { search: grid.search } : {}),
        ...(grid.filters ? { filters: grid.filters } : {}),
        ...(grid.sort ? { sort: grid.sort } : {}),
        ...(grid.groupBy ? { groupBy: grid.groupBy } : {}),
      });
      const json = (await api.get(
        `/dead-email?${params.toString()}`,
      )) as DeadEmailResponse;
      const parsed = parsePaginatedResponse<DeadMissingEmailRow>(json);
      return { ...parsed, meta: { ...parsed.meta, groups: json.meta.groups } };
    },
    staleTime: 60_000,
  });
}

async function clearDeadMissingEmail(leadId: string) {
  return (await api.patch(
    `/dead-email/lead/${leadId}/clear`,
    {},
  )) as ClearDeadEmailResponse;
}

export function useClearDeadMissingEmail() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (leadId: string) => clearDeadMissingEmail(leadId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dead-missing-email"] });
    },
  });
}
