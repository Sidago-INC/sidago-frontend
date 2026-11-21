import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { agentCallsApi } from "@/features/agent-calls/_lib/agentCallsApi";
import type { LogResultBody } from "@/features/agent-calls/_lib/apiTypes";
import { api } from "@/lib/api";
import {
  buildPaginationParams,
  DEFAULT_PAGE_SIZE,
  parsePaginatedResponse,
} from "@/lib/pagination";
import type {
  EmailHistoryResponse,
  EmailLogBody,
  EmailQueueItem,
  EmailQueueResponse,
  EmailStatePatchBody,
} from "./apiTypes";

export type EmailQueueGridQuery = {
  search?: string;
  filters?: string;
  sort?: string;
  groupBy?: string;
};

export function useEmailQueue(
  agentSlug: string,
  page = 1,
  perPage = DEFAULT_PAGE_SIZE,
  grid: EmailQueueGridQuery = {},
) {
  return useQuery({
    // every param must be in the key, or you'll show cached rows from another query
    queryKey: ["email-queue", agentSlug, page, perPage, grid],
    queryFn: async () => {
      const params = buildPaginationParams(page, perPage, {
        agentSlug,
        ...(grid.search ? { search: grid.search } : {}),
        ...(grid.filters ? { filters: grid.filters } : {}),
        ...(grid.sort ? { sort: grid.sort } : {}),
        ...(grid.groupBy ? { groupBy: grid.groupBy } : {}),
      });
      const json = (await api.get(
        `/email/queue?${params.toString()}`,
      )) as EmailQueueResponse;
      const parsed = parsePaginatedResponse<EmailQueueItem>(json);
      return {
        ...json,
        data: parsed.data,
        meta: { ...parsed.meta, groups: json.meta?.groups },
      };
    },
    // Grid data: hold the previous page on screen while the next one loads.
    // Without this the hook drops to isLoading/undefined between keystrokes and
    // the page unmounts itself, taking the search box with it.
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useEmailHistory(
  leadId: string | null | undefined,
  brandCode: string | null | undefined,
) {
  return useQuery({
    queryKey: ["email-history", leadId, brandCode],
    enabled: Boolean(leadId && brandCode),
    queryFn: async () => {
      const json = (await api.get(
        `/email/lead/${leadId}/brand/${brandCode}/history`,
      )) as EmailHistoryResponse;
      return json.data;
    },
    staleTime: 30_000,
  });
}

export function useUpdateEmailState() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      leadId,
      brandCode,
      body,
    }: {
      leadId: string;
      brandCode: string;
      body: EmailStatePatchBody;
    }) =>
      api.patch(`/email/state/${leadId}/brand/${brandCode}`, body) as Promise<{
        ok: true;
        updated: number;
      }>,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["email-queue"] });
    },
  });
}

export function useLogEmail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: EmailLogBody) =>
      api.post("/email/log", body) as Promise<{ ok: true }>,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["email-queue"] });
      qc.invalidateQueries({ queryKey: ["email-history"] });
    },
  });
}

export function useLogCallResult(agentSlug: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (body: LogResultBody) => agentCallsApi.logResult(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["email-queue", agentSlug] });
    },
  });
}
