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

const ADMIN_AGENT_NAMES = [
  { label: "Tom Silver", id: "tom-silver" },
  { label: "Mariz Cabido", id: "mariz-cabido" },
  { label: "Bryan Taylor", id: "bryan-taylor" },
  { label: "Chris Moore", id: "chris-moore" },
];

const SMS_AGENT_NAMES = [
  { label: "Mariz", id: "mariz-cabido" },
  { label: "Tom Silver", id: "tom-silver" },
  { label: "Bryan Taylor", id: "bryan-taylor" },
  { label: "Chris Moore", id: "chris-moore" },
];

const EMAIL_AGENT_NAMES = [
  { label: "Mariz", id: "mariz-cabido" },
  { label: "Tom Silver", id: "tom-silver" },
  { label: "Bryan Taylor", id: "bryan-taylor" },
  { label: "Chris Moore", id: "chris-moore" },
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

export const adminOnlyNavigation: NavigationItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Agents",
    icon: Users,
    children: ADMIN_AGENT_NAMES.map((agent) => ({
      label: agent.label,
      icon: UserPlus,
      children: [
        {
          label: "Calls",
          href: `/calls?agent=${agent.id}&agentId=${agent.id}`,
          icon: Phone,
        },
        {
          label: "Call Logs",
          href: `/call-logs?agent=${agent.id}&agentId=${agent.id}`,
          icon: History,
        },
        {
          label: "Lead Manual Update",
          href: `/lead-manual-update?agent=${agent.id}&agentId=${agent.id}`,
          icon: RefreshCw,
        },
      ],
    })),
  },
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
  {
    label: "SMS",
    icon: MessageSquare,
    children: SMS_AGENT_NAMES.map((item) => ({
      label: item.label,
      href: `/sms?agent=${item.id}&agentId=${item.id}`,
      icon: MessageSquare,
    })),
  },
  {
    label: "Email",
    icon: Mail,
    children: [
      ...EMAIL_AGENT_NAMES.map((item) => ({
        label: item.label,
        href: `/email?agent=${item.id}&agentId=${item.id}`,
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
  },
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

export const backofficeNavigation: NavigationItem[] = cloneNavigationItems(
  adminOnlyNavigation.filter((item) => item.label !== "Agents"),
);

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
): NavigationItem[] => {
  if (!roleOrUser) {
    return [];
  }

  if (typeof roleOrUser === "string") {
    return navigationByRole[roleOrUser as UserRole] ?? [];
  }

  if (roleOrUser.role === "agent") {
    return buildAgentNavigation(roleOrUser);
  }

  return navigationByRole[roleOrUser.role] ?? [];
};
