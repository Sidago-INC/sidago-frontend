import { useInfiniteQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Activity, ActivitySection } from "@/components/ui/ActivityTimeline";
import {
  buildPaginationParams,
  parsePaginatedResponse,
  type PaginationMeta,
} from "@/lib/pagination";

const REVISION_PAGE_SIZE = 50;

type RevisionChange = {
  field: string;
  from: string | boolean | number | null;
  to: string | boolean | number | null;
};

type RevisionGroup = {
  table: string;
  brandCode?: string;
  operation?: string;
  changes: RevisionChange[];
};

type RevisionEntry = {
  changeGroupId?: string;
  changedAt: string;
  changedBy: string;
  groups: RevisionGroup[];
};

type RevisionPage = {
  data: Activity[];
  meta: PaginationMeta;
};

function formatFieldLabel(field: string): string {
  return field.replaceAll("_", " ").toUpperCase();
}

function formatRelativeTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "today";
  if (diffDays === 1) return "1d ago";
  if (diffDays < 30) return `${diffDays}d ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths}mo ago`;
  return `${Math.floor(diffMonths / 12)}y ago`;
}

function mapRevisionToActivity(
  entry: RevisionEntry,
  index: number,
  page: number,
): Activity {
  const sections: ActivitySection[] = (entry.groups ?? []).map((group) => ({
    title: group.brandCode
      ? `${group.table} (${group.brandCode.toUpperCase()})`
      : (group.table ?? "UPDATE").toUpperCase(),
    items: (group.changes ?? []).map((change) => ({
      type: "badge" as const,
      label: `${formatFieldLabel(change.field)}: ${String(change.from ?? "-")} → ${String(change.to ?? "-")}`,
    })),
  }));

  const stableId =
    entry.changeGroupId && Number.parseInt(entry.changeGroupId, 10);
  const id =
    Number.isFinite(stableId) && (stableId as number) > 0
      ? (stableId as number)
      : page * 100_000 + index + 1;

  return {
    id,
    actor: {
      type:
        entry.changedBy === "migration" || entry.changedBy === "system"
          ? "system"
          : "user",
      name: entry.changedBy || "Unknown",
    },
    action: "updated this record",
    time: formatRelativeTime(entry.changedAt),
    sections,
  };
}

async function fetchRevisionHistoryPage(
  path: string,
  page: number,
): Promise<RevisionPage> {
  const params = buildPaginationParams(page, REVISION_PAGE_SIZE);
  const json = await api.get(`${path}?${params.toString()}`);
  const parsed = parsePaginatedResponse<RevisionEntry>(json);

  return {
    data: parsed.data.map((entry, index) =>
      mapRevisionToActivity(entry, index, page),
    ),
    meta: parsed.meta,
  };
}

type RevisionHistoryOptions = {
  enabled?: boolean;
};

function useRevisionHistoryInfinite(
  kind: "lead" | "company",
  entityId: string | null | undefined,
  options: RevisionHistoryOptions = {},
) {
  const enabled = (options.enabled ?? true) && Boolean(entityId);

  return useInfiniteQuery({
    queryKey: ["revision-history", kind, entityId, REVISION_PAGE_SIZE],
    enabled,
    initialPageParam: 1,
    queryFn: ({ pageParam = 1 }) =>
      fetchRevisionHistoryPage(
        `/revision-history/${kind}/${entityId}`,
        pageParam,
      ),
    getNextPageParam: (lastPage) => {
      const { current_page, total_pages } = lastPage.meta;
      if (current_page < total_pages) {
        return current_page + 1;
      }
      return undefined;
    },
    staleTime: 60_000,
  });
}

export function useLeadRevisionHistory(
  leadId: string | null | undefined,
  options: RevisionHistoryOptions = {},
) {
  return useRevisionHistoryInfinite("lead", leadId, options);
}

export function useCompanyRevisionHistory(
  companyId: string | null | undefined,
  options: RevisionHistoryOptions = {},
) {
  return useRevisionHistoryInfinite("company", companyId, options);
}
