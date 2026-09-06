import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  buildPaginationParams,
  DEFAULT_PAGE_SIZE,
  parsePaginatedResponse,
} from "@/lib/pagination";
import { usePaginatedSelectSource } from "@/lib/use-paginated-select-source";
import { formatLeadDisplayTitle } from "@/features/agent-calls/_lib/utils";

export type LeadPickerRow = {
  id: string;
  leadIdExternal: string | null;
  fullName: string | null;
  companySymbol: string | null;
  label: string;
};

export type AgentUser = {
  id: string;
  name: string;
  email: string;
};

export type BrandStatesResponse = {
  ok: true;
  leadId: string;
  brandStates: {
    svg: { leadType: string | null };
    benton: { leadType: string | null };
    "95rm": { leadType: string | null };
  };
};

type LeadsResponse = {
  ok: true;
  data: LeadPickerRow[];
  meta: {
    total_count: number;
    per_page: number;
    current_page: number;
    total_pages: number;
  };
};
type AgentsResponse = { ok: true; count: number; data: AgentUser[] };

const LEAD_PAGE_SIZE = DEFAULT_PAGE_SIZE;

export async function fetchLeadsPage({
  limit = LEAD_PAGE_SIZE,
  page = 1,
  search,
}: {
  limit?: number;
  page?: number;
  search?: string;
}) {
  const params = buildPaginationParams(page, limit);

  if (search?.trim()) {
    params.set("search", search.trim());
  }

  const json = (await api.get(`/leads?${params}`)) as LeadsResponse;
  const parsed = parsePaginatedResponse<LeadPickerRow>(json);
  return { data: parsed.data, meta: parsed.meta };
}

function buildLeadSelectOptions(leads: LeadPickerRow[]) {
  return leads.map((lead) => ({
    value: lead.id,
    label:
      formatLeadDisplayTitle({
        companySymbol: lead.companySymbol,
        fullName: lead.fullName ?? "",
      }) || lead.label || lead.fullName || lead.leadIdExternal || lead.id,
  }));
}

export function useLeadSelectSource(
  extraOptions: Array<{ label: string; value: string }> = [],
) {
  return usePaginatedSelectSource({
    queryKeyPrefix: "leads",
    pageSize: LEAD_PAGE_SIZE,
    fetchPage: fetchLeadsPage,
    buildOptions: buildLeadSelectOptions,
    extraOptions,
  });
}

// Loads the lead picker list. 5-min stale time matches the agents hook — the
// pool of pickable leads doesn't churn second-to-second.
export function useLeadOptions() {
  return useQuery({
    queryKey: ["leads", "picker"],
    queryFn: async () => {
      const params = buildPaginationParams(1, DEFAULT_PAGE_SIZE);
      const json = (await api.get(`/leads?${params}`)) as LeadsResponse;
      return parsePaginatedResponse<LeadPickerRow>(json).data;
    },
    staleTime: 5 * 60_000,
  });
}

// Same hook as useUsers in backoffice-shared, except we call /users with no
// brand filter so the dropdown shows the full agent roster.
export function useAllAgents() {
  return useQuery({
    queryKey: ["agents", "all"],
    queryFn: async () => {
      const json = (await api.get("/users")) as AgentsResponse;
      return json.data;
    },
    staleTime: 5 * 60_000,
  });
}

// Fires when the user picks a lead in the row. Caches per leadId so reopening
// the same row is instant.
export function useLeadBrandStates(leadId: string | null | undefined) {
  return useQuery({
    queryKey: ["lead-brand-states", leadId],
    enabled: Boolean(leadId),
    queryFn: async () => {
      const json = (await api.get(
        `/leads/${leadId}/brand-states`,
      )) as BrandStatesResponse;
      return json.brandStates;
    },
    staleTime: 60_000,
  });
}

type Level2PostBody = {
  leadId: string;
  brand: "svg" | "95rm" | "benton";
  level2AgentName: string | null;
  resultUpdate: string;
  updatedNotes: string;
  callBackDate: string;
};

type Level2PostResponse = {
  ok: true;
  id: string;
  /** Authoritative timestamp — the grid shows this, not a client-side guess. */
  createdAt: string;
  /** Per-brand lead types as they stood immediately after the update landed. */
  leadTypes: {
    svg: string | null;
    benton: string | null;
    "95rm": string | null;
  };
};

// Logs a single Level 2 row to the DB. On success it invalidates the history
// query so the History page reflects the new row without a manual refresh.
export function useLogLevel2Result() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Level2PostBody) =>
      (await api.post("/level-2-requests", body)) as Level2PostResponse,
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["level-2-history"] });
      qc.invalidateQueries({
        queryKey: ["lead-brand-states", variables.leadId],
      });
    },
  });
}

type Level2StatusResponse = {
  ok: true;
  status: string;
  processed: boolean;
  leadTypes: { svg: string | null; benton: string | null; "95rm": string | null };
};

/**
 * Waits for a submitted Level 2 request to be interpreted, then returns the
 * lead types it produced.
 *
 * The submit response cannot carry them: the endpoint records the request and a
 * worker applies it moments later, so at submit time the three per-brand lead
 * types are genuinely not decided yet. Without this the row would show blank
 * columns until the page was reloaded.
 *
 * Polls every 1.5s for up to ~30s. Returns null on timeout rather than
 * throwing - a slow cascade is not an error the agent should see, and the
 * columns simply stay as they are until the next refresh.
 */
export async function waitForLevel2Result(
  requestId: string,
  { attempts = 20, intervalMs = 1500 } = {},
): Promise<Level2StatusResponse["leadTypes"] | null> {
  for (let i = 0; i < attempts; i++) {
    await new Promise((r) => setTimeout(r, intervalMs));
    try {
      const res = (await api.get(
        `/level-2-requests/${requestId}/status`,
      )) as Level2StatusResponse;
      if (res.processed) return res.leadTypes;
    } catch {
      // Transient failure - keep polling; the worker is unaffected either way.
    }
  }
  return null;
}

// Reverting lives in features/level-2-shared/revert.ts — both this page and
// Level 2 History need it.
export {
  buildRevertMessage,
  useRevertLevel2Result,
  type Level2RevertResponse,
} from "@/features/level-2-shared/revert";
