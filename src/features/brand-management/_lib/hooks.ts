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

export type BackfillPreview = {
  leadsToAdd: number;
  statuses: { status: string; count: number }[];
  alreadyInBrand: number;
  agentCount: number;
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
  };
}

export type CreateBrandBody = {
  displayName: string;
  code: string;
  parentBrandId?: string;
  sortOrder?: number;
  isActive: boolean;
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

export function useSetBrandAgents() {
  const refresh = useRefreshBrands();
  return useMutation({
    mutationFn: async ({
      id,
      agents,
    }: {
      id: string;
      agents: { userId: string; percent: number }[];
    }) =>
      (
        (await api.put(`/brands/${id}/agents`, { agents })) as Envelope<{
          removedAgents: number;
          leadsHeldByRemovedAgents: number;
        }>
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

export async function runBackfillBatch(brandId: string) {
  return (
    (await api.post(`/brands/${brandId}/backfill`, {})) as Envelope<{
      added: number;
      done: boolean;
    }>
  ).data;
}

export function toSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
