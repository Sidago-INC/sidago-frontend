import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
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

type LeadsResponse = { ok: true; count: number; data: LeadPickerRow[] };
type AgentsResponse = { ok: true; count: number; data: AgentUser[] };

const LEAD_PAGE_SIZE = 50;

export async function fetchLeadsPage({
  limit = LEAD_PAGE_SIZE,
  page = 1,
  search,
}: {
  limit?: number;
  page?: number;
  search?: string;
}) {
  const params = new URLSearchParams({
    limit: String(limit),
  });

  if (page > 1) {
    params.set("page", String(page));
  }

  if (search?.trim()) {
    params.set("search", search.trim());
  }

  const json = (await api.get(`/leads?${params}`)) as LeadsResponse;
  return { data: json.data, count: json.count };
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
      const json = (await api.get("/leads?limit=500")) as LeadsResponse;
      return json.data;
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

type Level2PostResponse = { ok: true; id: string };

// Logs a single Level 2 row to the DB. On success it invalidates the history
// query so the History page reflects the new row without a manual refresh.
export function useLogLevel2Result() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Level2PostBody) =>
      (await api.post("/level-2-requests", body)) as Level2PostResponse,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["level-2-history"] });
    },
  });
}

// Reverts a logged Level 2 request by its DB id.
export function useRevertLevel2Result() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) =>
      await api.delete(`/level-2-requests/${id}/revert`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["level-2-history"] });
    },
  });
}
