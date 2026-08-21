import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { agentCallsApi } from "@/features/agent-calls/_lib/agentCallsApi";
import type {
  CallsLogSummaryResponse,
  LeadDetailResponse,
  LogResultBody,
  QueueLead,
} from "@/features/agent-calls/_lib/apiTypes";
import type { LeadPatchBody } from "@/features/backoffice-shared/use-update-lead";
import { api } from "@/lib/api";

export const CALL_LOG_PAGE_SIZE = 500;

export const HOT_LEAD_TYPE = "Hot";
export const GENERAL_LEAD_TYPE = "General";

/**
 * Sidebar bucket counts, over the agent's whole row-set.
 *
 * Loaded before any rows, so the tree can render real totals — the page used
 * to say "500" for a bucket holding 10,818 leads because it counted the rows
 * that had arrived rather than the rows that exist.
 */
export function useCallsLogSummary(agentSlug: string, search: string) {
  return useQuery({
    queryKey: ["calls-log", agentSlug, "summary", search],
    queryFn: () =>
      agentCallsApi.callsLogSummary(agentSlug, search) as Promise<
        CallsLogSummaryResponse
      >,
    // `search` is part of the key, so every debounced keystroke is a brand new
    // query. Without this the hook drops to isLoading/undefined between them,
    // which unmounted the entire page — including the search box the user was
    // typing into. Holding the previous counts keeps the tree on screen and the
    // input focused while the new ones land.
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

/**
 * Rows for one (leadType, timezone) bucket, paged.
 *
 * Hot is fetched whole — 27 Hot rows exist across the entire system, so paging
 * it would be ceremony. General pages 500 at a time behind an
 * IntersectionObserver, because a single agent can hold 10,000+ in one
 * timezone.
 *
 * `timezone: ""` is a real bucket (leads with no timezone anywhere), so it is
 * passed through rather than treated as absent. `enabled` keeps a collapsed
 * group from fetching.
 */
export function useCallsLogBucket(args: {
  agentSlug: string;
  leadType: string;
  timezone: string;
  search: string;
  enabled: boolean;
}) {
  const { agentSlug, leadType, timezone, search, enabled } = args;
  const fetchAll = leadType === HOT_LEAD_TYPE;

  return useInfiniteQuery({
    queryKey: ["calls-log", agentSlug, "bucket", leadType, timezone, search],
    enabled,
    initialPageParam: 1,
    queryFn: ({ pageParam = 1 }) =>
      agentCallsApi.callsLogPage({
        agentSlug,
        leadType,
        timezone,
        search,
        page: pageParam,
        limit: CALL_LOG_PAGE_SIZE,
      }),
    getNextPageParam: (lastPage) => {
      if (fetchAll) return undefined;
      const { current_page, total_pages } = lastPage.meta;
      return current_page < total_pages ? current_page + 1 : undefined;
    },
    // Same reason as the summary: keep the current rows visible while a new
    // search or a bucket switch resolves, rather than blanking the list.
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

/** Flattens the loaded pages of a bucket into a single row list. */
export function flattenBucketPages(
  pages: { data: QueueLead[] }[] | undefined,
): QueueLead[] {
  return pages?.flatMap((page) => page.data) ?? [];
}

export function useCallLogDetail(
  leadId: string | null | undefined,
  agentSlug: string,
) {
  return useQuery({
    queryKey: ["call-log-detail", leadId, agentSlug],
    enabled: Boolean(leadId),
    queryFn: () =>
      agentCallsApi.detail(leadId!, agentSlug) as Promise<LeadDetailResponse>,
    staleTime: 15_000,
  });
}

// Logging a call can move a lead between buckets and change every count in the
// sidebar, so both the summary and every loaded bucket have to go. They share
// the ["calls-log", agentSlug] key prefix precisely so one invalidation covers
// them; invalidating only the old flat key would leave stale counts on screen.
function invalidateCallLogQueries(
  qc: ReturnType<typeof useQueryClient>,
  agentSlug: string,
) {
  qc.invalidateQueries({ queryKey: ["calls-log", agentSlug] });
  qc.invalidateQueries({ queryKey: ["call-log-detail"] });
}

export function useLogCallResult(agentSlug: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (body: LogResultBody) => agentCallsApi.logResult(body),
    onSuccess: () => invalidateCallLogQueries(qc, agentSlug),
  });
}

export function useCallLogFollowUp(agentSlug: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      leadId,
      followUpDate,
    }: {
      leadId: string;
      followUpDate: string;
    }) => agentCallsApi.followUp(agentSlug, leadId, followUpDate),
    onSuccess: () => invalidateCallLogQueries(qc, agentSlug),
  });
}

export function useCallLogMarkVoid(agentSlug: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      leadId,
      notWorkAnymore,
    }: {
      leadId: string;
      notWorkAnymore: boolean;
    }) => agentCallsApi.markVoid(agentSlug, leadId, notWorkAnymore),
    onSuccess: () => invalidateCallLogQueries(qc, agentSlug),
  });
}

export function usePatchCallLogLead(agentSlug: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      leadId,
      body,
    }: {
      leadId: string;
      body: LeadPatchBody;
    }) => api.patch(`/leads/${leadId}`, body),
    onSuccess: () => invalidateCallLogQueries(qc, agentSlug),
  });
}
