import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  BrandWithAgents,
  BrandsWithAgentsResponse,
} from "@/lib/navigation-agents";
import type { UserRole } from "@/lib/navigation";

const NAV_AGENT_ROLES: UserRole[] = ["admin", "backoffice"];

export function canFetchBrandsWithAgents(role: UserRole | undefined) {
  return role ? NAV_AGENT_ROLES.includes(role) : false;
}

export function useBrandsWithAgents(role: UserRole | undefined) {
  const enabled = canFetchBrandsWithAgents(role);

  return useQuery({
    queryKey: ["nav", "brands-with-agents"],
    queryFn: async () => {
      const json = (await api.get(
        "/nav/brands-with-agents",
      )) as BrandsWithAgentsResponse;
      return json.data;
    },
    enabled,
    staleTime: 5 * 60_000,
  });
}

export function useFirstNavAgent(role: UserRole | undefined) {
  const query = useBrandsWithAgents(role);

  const firstAgent = query.data
    ? flattenFirstAgent(query.data)
    : undefined;

  return { ...query, firstAgent };
}

function flattenFirstAgent(brands: BrandWithAgents[]) {
  for (const brand of brands) {
    if (brand.agents[0]) {
      return brand.agents[0];
    }
  }

  return undefined;
}
