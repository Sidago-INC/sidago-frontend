import { api } from "@/lib/api";
import type {
  CallsLogResponse,
  QueueResponse,
  LeadDetailResponse,
  LogResultBody,
  DialResponse,
} from "./apiTypes";

export const AGENT_SLUG_MAP: Record<string, string> = {
  mariz: "mariz-cabido",
  tom: "tom-silver",
  chris: "chris-moore",
};

export function resolveAgentSlug(cookieKey: string): string {
  return AGENT_SLUG_MAP[cookieKey] ?? cookieKey;
}

export const agentCallsApi = {
  queue: (agentSlug: string): Promise<QueueResponse> =>
    api.get(`/agent-calls/queue?agentSlug=${agentSlug}&limit=500`),

  callsLog: (agentSlug: string): Promise<CallsLogResponse> =>
    api.get(
      `/agent-calls/calls-log?agentSlug=${encodeURIComponent(agentSlug)}`,
    ),

  detail: (
    leadId: string,
    agentSlug: string,
    historyLimit = 50,
  ): Promise<LeadDetailResponse> =>
    api.get(
      `/agent-calls/lead/${leadId}/detail?agentSlug=${encodeURIComponent(agentSlug)}&historyLimit=${historyLimit}`,
    ),

  skip: (agentSlug: string, leadId: string) =>
    api.post("/agent-calls/skip", { agentSlug, leadId }),

  followUp: (agentSlug: string, leadId: string, followUpDate: string) =>
    api.patch("/agent-calls/follow-up", { agentSlug, leadId, followUpDate }),

  markVoid: (agentSlug: string, leadId: string, notWorkAnymore = false) =>
    api.post("/agent-calls/mark-void", { agentSlug, leadId, notWorkAnymore }),

  logResult: (body: LogResultBody) =>
    api.post("/agent-calls/log-result", body),

  dial: (agentSlug: string, leadId: string): Promise<DialResponse> =>
    api.post("/agent-calls/dial", { agentSlug, leadId }),
};
