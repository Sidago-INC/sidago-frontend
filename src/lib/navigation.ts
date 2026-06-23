import {
  BarChart2,
  Building2,
  Clock,
  Flame,
  History,
  LayoutDashboard,
  List,
  Lock,
  Mail,
  MailWarning,
  MailX,
  MessageSquare,
  Package,
  Phone,
  RefreshCw,
  RotateCcw,
  Target,
  Upload,
  UserPlus,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import {
  buildAgentPageNavItems,
  flattenUniqueAgents,
  type BrandWithAgents,
} from "./navigation-agents";

export type UserRole = "agent" | "admin" | "backoffice";

export type NavigationItem = {
  label: string;
  icon: LucideIcon;
  href?: string;
  children?: NavigationItem[];
};

export type NavigationUserContext = {
  id?: string;
  name?: string;
  role: UserRole;
};

const AGENT_CHILDREN: NavigationItem[] = [
  {
    label: "Calls",
    href: "/calls",
    icon: Phone,
  },
  {
    label: "Call Logs",
    href: "/call-logs",
    icon: History,
  },
  {
    label: "Lead Manual Update",
    href: "/lead-manual-update",
    icon: RefreshCw,
  },
];

function slugifyAgentName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "-");
}

function cloneNavigationItems(items: NavigationItem[]): NavigationItem[] {
  return items.map((item) => ({
    ...item,
    children: item.children ? cloneNavigationItems(item.children) : undefined,
  }));
}

function withAgentParams(href: string, agent: { id?: string; name?: string }) {
  const agentSlug = slugifyAgentName(agent.name || agent.id || "agent");
  const agentId = agent.id || agentSlug;
  return `${href}?agent=${agentSlug}&agentId=${agentId}`;
}

function buildAgentNavigation(user?: NavigationUserContext): NavigationItem[] {
  if (!user) {
    return agentNavigation;
  }

  return [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Calls",
      href: withAgentParams("/calls", user),
      icon: Phone,
    },
    {
      label: "Call Logs",
      href: withAgentParams("/call-logs", user),
      icon: History,
    },
    {
      label: "Lead Manual Update",
      href: withAgentParams("/lead-manual-update", user),
      icon: RefreshCw,
    },
  ];
}

export const agentNavigation: NavigationItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  ...cloneNavigationItems(AGENT_CHILDREN),
];

function buildAgentsNavSection(brands: BrandWithAgents[]): NavigationItem {
  return {
    label: "Agents",
    icon: Users,
    children: brands
      .filter((brand) => brand.agents.length > 0)
      .map((brand) => ({
        label: brand.brandName,
        icon: Building2,
        children: brand.agents.map((agent) => ({
          label: agent.name,
          icon: UserPlus,
          children: buildAgentPageNavItems(agent),
        })),
      })),
  };
}

function buildSmsNavSection(agents: BrandWithAgents["agents"]): NavigationItem {
  return {
    label: "SMS",
    icon: MessageSquare,
    children: agents.map((agent) => ({
      label: agent.name,
      href: `/sms?agent=${encodeURIComponent(agent.slug)}&agentId=${encodeURIComponent(agent.agentId)}`,
      icon: MessageSquare,
    })),
  };
}

function buildEmailNavSection(agents: BrandWithAgents["agents"]): NavigationItem {
  return {
    label: "Email",
    icon: Mail,
    children: [
      ...agents.map((agent) => ({
        label: agent.name,
        href: `/email?agent=${encodeURIComponent(agent.slug)}&agentId=${encodeURIComponent(agent.agentId)}`,
        icon: Mail,
      })),
      {
        label: "Blocked",
        href: "/blocked-email",
        icon: MailX,
      },
      {
        label: "Blocklist Directory",
        href: "/email-blocklist-directory",
        icon: List,
      },
      {
        label: "Dead/Missing",
        href: "/dead-missing-email",
        icon: MailWarning,
      },
    ],
  };
}

function buildAdminNavigation(brandsWithAgents?: BrandWithAgents[]): NavigationItem[] {
  const uniqueAgents = brandsWithAgents
    ? flattenUniqueAgents(brandsWithAgents)
    : [];

  return [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  ...(brandsWithAgents ? [buildAgentsNavSection(brandsWithAgents)] : []),
  {
    label: "Level 2",
    icon: Package,
    children: [
      {
        label: "Update",
        href: "/level-2-update",
        icon: RefreshCw,
      },
      {
        label: "History",
        href: "/level-2-history",
        icon: History,
      },
    ],
  },
  {
    label: "Fix Leads",
    href: "/fix-leads",
    icon: Wrench,
  },
  {
    label: "Leads Stats",
    href: "/leads-stats",
    icon: BarChart2,
  },
  buildSmsNavSection(uniqueAgents),
  buildEmailNavSection(uniqueAgents),
  {
    label: "Company",
    icon: Building2,
    children: [
      {
        label: "Add New",
        href: "/companies/add",
        icon: UserPlus,
      },
      {
        label: "Bulk Import",
        href: "/companies/bulk-import",
        icon: Upload,
      },
      {
        label: "Update",
        href: "/companies/update",
        icon: Building2,
      },
    ],
  },
  {
    label: "Leads",
    icon: Target,
    children: [
      {
        label: "All",
        href: "/leads",
        icon: Target,
      },
      {
        label: "Add New",
        href: "/leads/add",
        icon: UserPlus,
      },
      {
        label: "Bulk Import",
        href: "/leads/bulk-import",
        icon: Upload,
      },
    ],
  },
  {
    label: "Additional Contacts",
    href: "/additional-contacts",
    icon: UserPlus,
  },
  {
    label: "Reports",
    icon: BarChart2,
    children: [
      {
        label: "Currently Hot",
        icon: Flame,
        children: [
          {
            label: "SVG",
            href: "/currently-hot-leads-svg",
            icon: Flame,
          },
          {
            label: "95RM",
            href: "/currently-hot-leads-95rm",
            icon: Flame,
          },
          {
            label: "Benton",
            href: "/currently-hot-leads-benton",
            icon: Flame,
          },
        ],
      },
      {
        label: "Recent Interest",
        icon: Clock,
        children: [
          {
            label: "SVG",
            href: "/recent-interest-svg",
            icon: Clock,
          },
          {
            label: "95RM",
            href: "/recent-interest-95rm",
            icon: Clock,
          },
          {
            label: "Benton",
            href: "/recent-interest-benton",
            icon: Clock,
          },
        ],
      },
      {
        label: "Ever Been Hot",
        icon: RotateCcw,
        children: [
          {
            label: "SVG",
            href: "/ever-been-hot-svg",
            icon: RotateCcw,
          },
          {
            label: "95RM",
            href: "/ever-been-hot-95rm",
            icon: RotateCcw,
          },
          {
            label: "Benton",
            href: "/ever-been-hot-benton",
            icon: RotateCcw,
          },
        ],
      },
      {
        label: "Unassigned Hot",
        icon: Flame,
        children: [
          {
            label: "SVG",
            href: "/unassigned-hot-leads-svg",
            icon: Flame,
          },
          {
            label: "95RM",
            href: "/unassigned-hot-leads-95rm",
            icon: Flame,
          },
          {
            label: "Benton",
            href: "/unassigned-hot-leads-benton",
            icon: Flame,
          },
        ],
      },
      {
        label: "Closed Contact",
        href: "/closed-contacts",
        icon: Lock,
      },
    ],
  },
];
}

export const adminOnlyNavigation: NavigationItem[] = buildAdminNavigation();

export function buildBackofficeNavigation(
  brandsWithAgents?: BrandWithAgents[],
): NavigationItem[] {
  return cloneNavigationItems(
    buildAdminNavigation(brandsWithAgents).filter((item) => item.label !== "Agents"),
  );
}

export const backofficeNavigation: NavigationItem[] = buildBackofficeNavigation();

const navigationByRole: Record<UserRole, NavigationItem[]> = {
  agent: agentNavigation,
  admin: adminOnlyNavigation,
  backoffice: backofficeNavigation,
};

export function flattenNavigationHrefs(items: NavigationItem[]): string[] {
  return items.flatMap((item) => [
    ...(item.href ? [item.href.split("?")[0]] : []),
    ...(item.children ? flattenNavigationHrefs(item.children) : []),
  ]);
}

export const getNavigationsForRole = (
  roleOrUser?: string | NavigationUserContext,
  brandsWithAgents?: BrandWithAgents[],
): NavigationItem[] => {
  if (!roleOrUser) {
    return [];
  }

  if (typeof roleOrUser === "string") {
    if (roleOrUser === "admin") {
      return buildAdminNavigation(brandsWithAgents);
    }
    if (roleOrUser === "backoffice") {
      return buildBackofficeNavigation(brandsWithAgents);
    }
    return navigationByRole[roleOrUser as UserRole] ?? [];
  }

  if (roleOrUser.role === "agent") {
    return buildAgentNavigation(roleOrUser);
  }

  if (roleOrUser.role === "admin") {
    return buildAdminNavigation(brandsWithAgents);
  }

  if (roleOrUser.role === "backoffice") {
    return buildBackofficeNavigation(brandsWithAgents);
  }

  return navigationByRole[roleOrUser.role] ?? [];
};
