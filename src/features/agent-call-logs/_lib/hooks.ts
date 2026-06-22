import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { agentCallsApi } from "@/features/agent-calls/_lib/agentCallsApi";
import type {
  CallsLogResponse,
  LeadDetailResponse,
  LogResultBody,
} from "@/features/agent-calls/_lib/apiTypes";
import type { LeadPatchBody } from "@/features/backoffice-shared/use-update-lead";
import { api } from "@/lib/api";

export function useCallsLogQueue(agentSlug: string) {
  return useQuery({
    queryKey: ["calls-log", agentSlug],
    queryFn: () => agentCallsApi.callsLog(agentSlug) as Promise<CallsLogResponse>,
    staleTime: 30_000,
  });
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
