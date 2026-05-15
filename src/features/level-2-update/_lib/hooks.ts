import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

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
