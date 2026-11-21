import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { BRAND_CATALOG_QUERY_KEY } from "@/hooks/useBrandCatalog";

export type BrandAgent = {
  userId: string;
  name: string;
  email: string;
  slug: string | null;
  percent: number | null;
};

export type ManagedBrand = {
  id: string;
  organizationId: string;
  parentBrandId: string | null;
  code: string;
  displayName: string;
  isActive: boolean;
  isProductBrand: boolean;
  isLegacy: boolean;
  sortOrder: number;
  agents: BrandAgent[];
};

export type Organization = { id: string; code: string; displayName: string };

export type AssignableUser = {
  userId: string;
  name: string;
  email: string;
  slug: string;
  brandCode: string | null;
};

export type BackfillAgentEstimate = {
  userId: string;
  name: string;
  percent: number | null;
  existing: number;
  adding: number;
  total: number;
};

export type BackfillPreview = {
  leadsToAdd: number;
  statuses: { status: string; count: number }[];
  alreadyInBrand: number;
  agentCount: number;
  agents: {
    perAgent: BackfillAgentEstimate[];
    otherAssignees: number;
    unassigned: number;
  };
};

const BRANDS_KEY = ["brands", "managed"];
const ASSIGNABLE_KEY = ["brands", "assignable-users"];

type Envelope<T> = { data: T };

export function useOrganizations() {
  return useQuery({
    queryKey: ["brands", "organizations"],
    queryFn: async () =>
      ((await api.get("/organizations")) as Envelope<Organization[]>).data,
  });
}

export function useManagedBrands() {
  return useQuery({
    queryKey: BRANDS_KEY,
    queryFn: async () =>
      ((await api.get("/brands")) as Envelope<ManagedBrand[]>).data,
  });
}

export function useAssignableUsers(enabled: boolean) {
  return useQuery({
    queryKey: ASSIGNABLE_KEY,
    queryFn: async () =>
      ((await api.get("/brands/assignable-users")) as Envelope<AssignableUser[]>).data,
    enabled,
  });
}

function useRefreshBrands() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: BRANDS_KEY });
    void queryClient.invalidateQueries({ queryKey: BRAND_CATALOG_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: ["nav", "brands-with-agents"] });
    void queryClient.invalidateQueries({ queryKey: ASSIGNABLE_KEY });
    void queryClient.invalidateQueries({ queryKey: ["agents"] });
    // A save can start a background run; show it in the progress bar now.
    void queryClient.invalidateQueries({ queryKey: BACKFILL_JOBS_KEY });
  };
}

export type CreateBrandBody = {
  displayName: string;
  code: string;
  parentBrandId?: string;
  sortOrder?: number;
};

export function useCreateBrand(organizationId: string) {
  const refresh = useRefreshBrands();
  return useMutation({
    mutationFn: (body: CreateBrandBody) =>
      api.post(`/organizations/${organizationId}/brands`, body),
    onSuccess: refresh,
  });
}

export function useUpdateBrand() {
  const refresh = useRefreshBrands();
  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: {
      id: string;
      displayName?: string;
      sortOrder?: number;
      isActive?: boolean;
    }) => api.patch(`/brands/${id}`, body),
    onSuccess: refresh,
  });
}

export type HotLeadAssignment = { stateId: string; userId: string };

export type HotLeadsBrandGroup = {
  brandId: string;
  brandName: string;
  candidates: { userId: string; name: string }[];
  leads: {
    stateId: string;
    leadId: string;
    leadName: string | null;
    leadEmail: string | null;
    companyId: string | null;
    companyName: string | null;
    companySymbol: string | null;
    status: string;
  }[];
};

// A user's Hot and On Hold leads, on one brand or (no brandId) on every brand.
export async function fetchHotLeadsForRemoval(userId: string, brandId?: string) {
  const query = brandId ? `?brandId=${brandId}` : "";
  return (
    (await api.get(`/brands/agents/${userId}/hot-leads${query}`)) as Envelope<
      HotLeadsBrandGroup[]
    >
  ).data;
}

export function useSetBrandAgents() {
  const refresh = useRefreshBrands();
  return useMutation({
    mutationFn: async ({
      id,
      agents,
      hotLeadAssignments,
    }: {
      id: string;
      agents: { userId: string; percent: number }[];
      hotLeadAssignments?: HotLeadAssignment[];
    }) =>
      (
        (await api.put(`/brands/${id}/agents`, { agents, hotLeadAssignments })) as Envelope<{
          removedAgents: number;
          hotLeadsMoved: number;
          leadsQueued: number;
          unassigned: boolean;
        }>
      ).data,
    onSuccess: refresh,
  });
}

export type DeactivateAgentResult = {
  userId: string;
  name: string;
  leadsQueued: number;
  hotLeadsMoved: number;
  brands: {
    brandId: string;
    brandName: string;
    hotLeadsMoved: number;
    leadsQueued: number;
    unassigned: boolean;
    newShares: { userId: string; name: string; percent: number }[];
  }[];
};

export function useDeactivateAgent() {
  const refresh = useRefreshBrands();
  return useMutation({
    mutationFn: async ({
      userId,
      hotLeadAssignments,
    }: {
      userId: string;
      hotLeadAssignments?: HotLeadAssignment[];
    }) =>
      (
        (await api.post(`/brands/agents/${userId}/deactivate`, {
          hotLeadAssignments,
        })) as Envelope<DeactivateAgentResult>
      ).data,
    onSuccess: refresh,
  });
}

export type CreateAgentBody = {
  firstName: string;
  lastName: string;
  email: string;
  slug: string;
  temporaryPassword: string;
};

export function useCreateAgent() {
  const refresh = useRefreshBrands();
  return useMutation({
    mutationFn: async (body: CreateAgentBody) =>
      ((await api.post("/brands/agents", body)) as Envelope<{ userId: string; name: string }>)
        .data,
    onSuccess: refresh,
  });
}

export function useBackfillPreview(brandId: string | null) {
  return useQuery({
    queryKey: ["brands", "backfill-preview", brandId],
    queryFn: async () =>
      ((await api.get(`/brands/${brandId}/backfill/preview`)) as Envelope<BackfillPreview>)
        .data,
    enabled: Boolean(brandId),
    gcTime: 0,
  });
}

// Background brand runs shown in the progress bar.
export type BrandJobKind =
  | "brand-backfill"
  | "brand-agent-handover"
  | "redistribution.agents-changed";

export type BackfillJob = {
  id: string;
  kind: BrandJobKind;
  brandId: string;
  brandName: string;
  status: "queued" | "running" | "done" | "failed" | "cancelled";
  totalEstimate: number;
  processed: number;
  added: number;
  error: string | null;
  createdAt: string;
  startedAt: string | null;
  heartbeatAt: string | null;
  finishedAt: string | null;
};

export const BACKFILL_JOBS_KEY = ["brands", "backfill-jobs"];

export function isJobActive(job: BackfillJob) {
  return job.status === "queued" || job.status === "running";
}

// Running and recently finished add-leads runs. Polls every 2 seconds while a
// run is going, otherwise every 30 seconds, so a run started in another tab or
// by another Super Owner still shows up.
export function useBackfillJobs(enabled: boolean) {
  return useQuery({
    queryKey: BACKFILL_JOBS_KEY,
    queryFn: async () =>
      ((await api.get("/brands/backfill-jobs")) as Envelope<BackfillJob[]>).data,
    enabled,
    refetchInterval: (query) =>
      (query.state.data ?? []).some(isJobActive) ? 2000 : 30_000,
    refetchIntervalInBackground: false,
  });
}

export function useStartBackfill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (brandId: string) =>
      ((await api.post(`/brands/${brandId}/backfill`, {})) as Envelope<BackfillJob>).data,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: BACKFILL_JOBS_KEY }),
  });
}

export function useCancelBackfill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (jobId: string) =>
      (
        (await api.post(`/brands/backfill-jobs/${jobId}/cancel`, {})) as Envelope<BackfillJob>
      ).data,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: BACKFILL_JOBS_KEY }),
  });
}

export function toSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
