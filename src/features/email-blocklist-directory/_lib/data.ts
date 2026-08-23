import { getLeadGridLabel } from "@/features/backoffice-shared/constants";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  buildPaginationParams,
  DEFAULT_PAGE_SIZE,
  parsePaginatedResponse,
} from "@/lib/pagination";

export type CallHistoryEntry = {
  id: string;
  calledAt: string;
  userId: string | null;
  userName: string | null;
  resultCode: string | null;
  durationSeconds: number | null;
  notes: string | null;
};

export type CallHistoryByBrand = {
  svg: CallHistoryEntry[];
  "95rm": CallHistoryEntry[];
  benton: CallHistoryEntry[];
};

export type EmailBlocklistDirectoryRow = {
  leadId: string;
  leadIdExternal: string | null;
  companySymbol: string | null;
  companyName: string | null;
  fullName: string | null;
  phone: string | null;
  email: string | null;
  contactType: string | null;
  leadTypeSvg: string | null;
  leadType95rm: string | null;
  leadTypeBenton: string | null;
  blacklistedBrands: string[];
  callHistory: CallHistoryByBrand;
};

type EmailBlacklistResponse = {
  ok: true;
  data: EmailBlocklistDirectoryRow[];
  meta: {
    total_count: number;
    per_page: number;
    current_page: number;
    total_pages: number;
    groups?: { value: string; count: number }[];
  };
};

export type EmailBlacklistGridQuery = {
  search?: string;
  filters?: string;
  sort?: string;
  groupBy?: string;
};

export function getEmailBlacklistDisplayLeadId(
  row: EmailBlocklistDirectoryRow,
): string {
  return getLeadGridLabel(row);
}

export function getBrandLabel(brand: string): string {
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

export function formatCallHistoryDate(calledAt: string): string {
  const date = new Date(calledAt);
  if (Number.isNaN(date.getTime())) return calledAt;

  return date.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
}

export function getCallHistoryLineDetail(entry: CallHistoryEntry): string {
  return [entry.userName, entry.resultCode].filter(Boolean).join(" - ");
}

export function getCallHistoryNoteDetail(entry: CallHistoryEntry): string {
  return [entry.userName, entry.notes].filter(Boolean).join(" - ");
}

export function formatCallHistoryCallsText(entries: CallHistoryEntry[]): string {
  if (!entries.length) return "";

  return entries
    .map((entry) => {
      const parts = [
        formatCallHistoryDate(entry.calledAt),
        ...[entry.userName, entry.resultCode].filter(Boolean),
      ];
      return parts.join(" - ");
    })
    .join("\n");
}

export function formatCallHistoryNotesText(entries: CallHistoryEntry[]): string {
  return entries
    .filter((entry) => entry.notes?.trim())
    .map((entry) => {
      const parts = [
        formatCallHistoryDate(entry.calledAt),
        ...[entry.userName, entry.notes?.trim()].filter(Boolean),
      ];
      return parts.join(" - ");
    })
    .join("\n");
}

export function useEmailBlacklistDirectory(
  page: number,
  perPage = DEFAULT_PAGE_SIZE,
  grid: EmailBlacklistGridQuery = {},
) {
  return useQuery({
    queryKey: ["email-blacklist-directory", page, perPage, grid],
    queryFn: async () => {
      const params = buildPaginationParams(page, perPage, {
        ...(grid.search ? { search: grid.search } : {}),
        ...(grid.filters ? { filters: grid.filters } : {}),
        ...(grid.sort ? { sort: grid.sort } : {}),
        ...(grid.groupBy ? { groupBy: grid.groupBy } : {}),
      });
      const json = (await api.get(
        `/email-blacklist?${params.toString()}`,
      )) as EmailBlacklistResponse;
      const parsed = parsePaginatedResponse<EmailBlocklistDirectoryRow>(json);
      return { ...parsed, meta: { ...parsed.meta, groups: json.meta.groups } };
    },
    // Grid data: hold the previous page on screen while the next one loads.
    // Without this the hook drops to isLoading/undefined between keystrokes and
    // the page unmounts itself, taking the search box with it.
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}
