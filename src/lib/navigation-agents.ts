import {
  History,
  Phone,
  RefreshCw,
  type LucideIcon,
} from "lucide-react";
import type { NavigationItem } from "./navigation";

export type NavAgent = {
  agentId: string;
  slug: string;
  name: string;
  pages: string[];
};

export type BrandWithAgents = {
  brandId?: string;
  brandCode: string;
  brandName: string;
  agents: NavAgent[];
};

export type BrandsWithAgentsResponse = {
  ok: true;
  data: BrandWithAgents[];
};

export function normalizeBrandCode(
  value: string | null | undefined,
): string | null {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return null;
  if (normalized === "rm95") return "95rm";
  if (normalized === "svg" || normalized === "benton" || normalized === "95rm") {
    return normalized;
  }
  return null;
}

export function resolveAgentSlugForBrand(
  brands: BrandWithAgents[] | undefined,
  brandCode: string | null | undefined,
  assigneeName?: string | null,
): string | null {
  const code = normalizeBrandCode(brandCode);
  if (!code || !brands?.length) return null;

  const brand = brands.find(
    (entry) => normalizeBrandCode(entry.brandCode) === code,
  );
  const agents = brand?.agents ?? [];
  if (!agents.length) return null;

  const trimmedAssignee = assigneeName?.trim();
  if (trimmedAssignee) {
    const lowered = trimmedAssignee.toLowerCase();
    const matched = agents.find(
      (agent) => agent.name.trim().toLowerCase() === lowered,
    );
    if (matched) return matched.slug;
  }

  return agents[0]?.slug ?? null;
}

const AGENT_PAGE_CONFIG: Record<
  string,
  { label: string; path: string; icon: LucideIcon }
> = {
  calls: { label: "Calls", path: "/calls", icon: Phone },
  "call-logs": { label: "Call Logs", path: "/call-logs", icon: History },
  "lead-manual-update": {
    label: "Lead Manual Update",
    path: "/lead-manual-update",
    icon: RefreshCw,
  },
};

function agentHref(path: string, agent: NavAgent) {
  return `${path}?agent=${encodeURIComponent(agent.slug)}&agentId=${encodeURIComponent(agent.agentId)}`;
}

export function buildAgentPageNavItems(agent: NavAgent): NavigationItem[] {
  return agent.pages.flatMap((page) => {
    const config = AGENT_PAGE_CONFIG[page];
    if (!config) return [];

    return [
      {
        label: config.label,
        href: agentHref(config.path, agent),
        icon: config.icon,
      },
    ];
  });
}

export function flattenUniqueAgents(
  brands: BrandWithAgents[],
): NavAgent[] {
  const seen = new Map<string, NavAgent>();

  for (const brand of brands) {
    for (const agent of brand.agents) {
      if (!seen.has(agent.slug)) {
        seen.set(agent.slug, agent);
      }
    }
  }

  return [...seen.values()];
}

export function findAgentBySlug(
  brands: BrandWithAgents[] | undefined,
  slug: string | null | undefined,
): NavAgent | undefined {
  if (!brands || !slug) return undefined;

  for (const brand of brands) {
    const match = brand.agents.find((agent) => agent.slug === slug);
    if (match) return match;
  }

  return undefined;
}

export function findNavAgent(
  brands: BrandWithAgents[] | undefined,
  slug: string | null | undefined,
  agentId: string | null | undefined,
): NavAgent | undefined {
  return findNavAgentWithBrand(brands, slug, agentId)?.agent;
}

/** Resolve both the nav agent and the brand section they belong to. */
export function findNavAgentWithBrand(
  brands: BrandWithAgents[] | undefined,
  slug: string | null | undefined,
  agentId: string | null | undefined,
): { brand: BrandWithAgents; agent: NavAgent } | undefined {
  if (!brands) return undefined;

  for (const brand of brands) {
    for (const agent of brand.agents) {
      if (
        (slug && agent.slug === slug) ||
        (agentId && agent.agentId === agentId)
      ) {
        return { brand, agent };
      }
    }
  }

  return undefined;
}

/** Map API brandCode → Lead Manual Update campaign label. */
export function brandCodeToCampaignLabel(
  brandCode: string | null | undefined,
): string | null {
  const code = normalizeBrandCode(brandCode);
  if (code === "svg") return "SVG";
  if (code === "benton") return "Benton";
  if (code === "95rm") return "95RM";
  return null;
}

export const ADMIN_AGENT_ROUTE_PATHS = [
  "/calls",
  "/call-logs",
  "/lead-manual-update",
  "/sms",
  "/email",
];
