import { api } from "@/lib/api";
import type {
  CallsLogPageResponse,
  CallsLogSummaryResponse,
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

  // Bucket counts for the sidebar. Cheap enough to refetch on every search
  // keystroke (debounced) — it is a single GROUP BY over the agent's row-set.
  callsLogSummary: (
    agentSlug: string,
    search?: string,
  ): Promise<CallsLogSummaryResponse> => {
    const params = new URLSearchParams({ agentSlug });
    if (search?.trim()) params.set("search", search.trim());
    return api.get(`/agent-calls/calls-log/summary?${params.toString()}`);
  },

  // One page of one bucket. `timezone` is deliberately sent even when empty —
  // "" is the bucket for leads with no timezone at all, so it cannot be
  // treated as "unset". Pass undefined to span every timezone instead.
  callsLogPage: (args: {
    agentSlug: string;
    leadType?: string;
    timezone?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<CallsLogPageResponse> => {
    const params = new URLSearchParams({ agentSlug: args.agentSlug });
    if (args.leadType) params.set("leadType", args.leadType);
    if (args.timezone !== undefined) params.set("timezone", args.timezone);
    if (args.search?.trim()) params.set("search", args.search.trim());
    if (args.page) params.set("page", String(args.page));
    if (args.limit) params.set("limit", String(args.limit));
    return api.get(`/agent-calls/calls-log?${params.toString()}`);
  },

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
