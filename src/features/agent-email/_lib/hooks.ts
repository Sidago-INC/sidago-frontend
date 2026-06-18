import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  EmailHistoryResponse,
  EmailLogBody,
  EmailQueueResponse,
  EmailStatePatchBody,
} from "./apiTypes";

export function useEmailQueue(agentSlug: string, limit = 500) {
  return useQuery({
    queryKey: ["email-queue", agentSlug, limit],
    queryFn: async () => {
      const json = (await api.get(
        `/email/queue?agentSlug=${encodeURIComponent(agentSlug)}&limit=${limit}`,
      )) as EmailQueueResponse;
      return json;
    },
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
