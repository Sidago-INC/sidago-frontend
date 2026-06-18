import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  SmsHistoryResponse,
  SmsLogBody,
  SmsQueueResponse,
  SmsStatePatchBody,
} from "./apiTypes";

export function useSmsQueue(agentSlug: string, limit = 500) {
  return useQuery({
    queryKey: ["sms-queue", agentSlug, limit],
    queryFn: async () => {
      const json = (await api.get(
        `/sms/queue?agentSlug=${encodeURIComponent(agentSlug)}&limit=${limit}`,
      )) as SmsQueueResponse;
      return json;
    },
    staleTime: 30_000,
  });
}

export function useSmsHistory(
  leadId: string | null | undefined,
  brandCode: string | null | undefined,
) {
  return useQuery({
    queryKey: ["sms-history", leadId, brandCode],
    enabled: Boolean(leadId && brandCode),
    queryFn: async () => {
      const json = (await api.get(
        `/sms/lead/${leadId}/brand/${brandCode}/history`,
      )) as SmsHistoryResponse;
      return json.data;
    },
    staleTime: 30_000,
  });
}

export function useUpdateSmsState() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      leadId,
      brandCode,
      body,
    }: {
      leadId: string;
      brandCode: string;
      body: SmsStatePatchBody;
    }) =>
      api.patch(`/sms/state/${leadId}/brand/${brandCode}`, body) as Promise<{
        ok: true;
        updated: number;
      }>,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sms-queue"] });
    },
  });
}

export function useLogSms() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: SmsLogBody) =>
      api.post("/sms/log", body) as Promise<{ ok: true }>,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sms-queue"] });
      qc.invalidateQueries({ queryKey: ["sms-history"] });
    },
  });
}
