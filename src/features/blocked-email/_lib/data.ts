import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  buildPaginationParams,
  DEFAULT_PAGE_SIZE,
  parsePaginatedResponse,
} from "@/lib/pagination";

export type BlockedEmailRow = {
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
  blockedBrands: string[];
};

type BlockedEmailResponse = {
  ok: true;
  data: BlockedEmailRow[];
  meta: {
    total_count: number;
    per_page: number;
    current_page: number;
    total_pages: number;
    groups?: { value: string; count: number }[];
  };
};

export type BlockedEmailGridQuery = {
  search?: string;
  filters?: string;
  sort?: string;
  groupBy?: string;
};

type UnblockBlockedEmailResponse = {
  ok: true;
  updated: number;
};

export function getBlockedBrandLabel(brand: string): string {
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

export function useBlockedEmails(
  page: number,
  perPage = DEFAULT_PAGE_SIZE,
  grid: BlockedEmailGridQuery = {},
) {
  return useQuery({
    queryKey: ["blocked-email", page, perPage, grid],
    queryFn: async () => {
      const params = buildPaginationParams(page, perPage, {
        ...(grid.search ? { search: grid.search } : {}),
        ...(grid.filters ? { filters: grid.filters } : {}),
        ...(grid.sort ? { sort: grid.sort } : {}),
        ...(grid.groupBy ? { groupBy: grid.groupBy } : {}),
      });
      const json = (await api.get(
        `/blocked-email?${params.toString()}`,
      )) as BlockedEmailResponse;
      const parsed = parsePaginatedResponse<BlockedEmailRow>(json);
      return { ...parsed, meta: { ...parsed.meta, groups: json.meta.groups } };
    },
    // Grid data: hold the previous page on screen while the next one loads.
    // Without this the hook drops to isLoading/undefined between keystrokes and
    // the page unmounts itself, taking the search box with it.
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}

async function unblockBlockedEmail(leadId: string) {
  return (await api.patch(
    `/blocked-email/lead/${leadId}/unblock`,
    {},
  )) as UnblockBlockedEmailResponse;
}

export function useUnblockBlockedEmail() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (leadId: string) => unblockBlockedEmail(leadId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["blocked-email"] });
    },
  });
}
