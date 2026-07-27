import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Activity, ActivitySection } from "@/components/ui/ActivityTimeline";

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

type RevisionHistoryResponse = {
  ok?: boolean;
  count?: number;
  data?: RevisionEntry[];
  revisions?: RevisionEntry[];
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

function normalizeRevisionEntries(payload: unknown): RevisionEntry[] {
  if (Array.isArray(payload)) {
    return payload as RevisionEntry[];
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const response = payload as RevisionHistoryResponse;
  if (Array.isArray(response.data)) return response.data;
  if (Array.isArray(response.revisions)) return response.revisions;
  return [];
}

function mapRevisionToActivity(entry: RevisionEntry, index: number): Activity {
  const sections: ActivitySection[] = (entry.groups ?? []).map((group) => ({
    title: group.brandCode
      ? `${group.table} (${group.brandCode.toUpperCase()})`
      : (group.table ?? "UPDATE").toUpperCase(),
    items: (group.changes ?? []).map((change) => ({
      type: "badge" as const,
      label: `${formatFieldLabel(change.field)}: ${String(change.from ?? "-")} → ${String(change.to ?? "-")}`,
    })),
  }));

  return {
    id: index + 1,
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

type RevisionHistoryOptions = {
  enabled?: boolean;
};

export function useLeadRevisionHistory(
  leadId: string | null | undefined,
  options: RevisionHistoryOptions = {},
) {
  const enabled = options.enabled ?? true;

  return useQuery({
    queryKey: ["revision-history", "lead", leadId],
    enabled: Boolean(leadId) && enabled,
    queryFn: async () => {
      const json = await api.get(`/revision-history/lead/${leadId}`);
      return normalizeRevisionEntries(json).map(mapRevisionToActivity);
    },
    staleTime: 60_000,
  });
}

export function useCompanyRevisionHistory(
  companyId: string | null | undefined,
  options: RevisionHistoryOptions = {},
) {
  const enabled = options.enabled ?? true;

  return useQuery({
    queryKey: ["revision-history", "company", companyId],
    enabled: Boolean(companyId) && enabled,
    queryFn: async () => {
      const json = await api.get(`/revision-history/company/${companyId}`);
      return normalizeRevisionEntries(json).map(mapRevisionToActivity);
    },
    staleTime: 60_000,
  });
}
