import {
  Clock,
  Flame,
  LayoutDashboard,
  Lock,
  Package,
  Phone,
  RotateCcw,
  type LucideIcon,
} from "lucide-react";

export type UserRole = "agent" | "admin" | "backoffice";

export type NavigationItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const agentNavigation: NavigationItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Calls",
    href: "/calls",
    icon: Phone,
  },
];

export const backofficeNavigation: NavigationItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Currently Hot Leads - SVG",
    href: "/currently-hot-leads-svg",
    icon: Flame,
  },
  {
    label: "Currently Hot Leads - 95RM",
    href: "/currently-hot-leads-95rm",
    icon: Flame,
  },
  {
    label: "Currently Hot Leads - Benton",
    href: "/currently-hot-leads-benton",
    icon: Flame,
  },
  {
    label: "Recent Interest - SVG",
    href: "/recent-interest-svg",
    icon: Clock,
  },
  {
    label: "Recent Interest - 95RM",
    href: "/recent-interest-95rm",
    icon: Clock,
  },
  {
    label: "Recent Interest - Benton",
    href: "/recent-interest-benton",
    icon: Clock,
  },
  {
    label: "Unassigned Hot Leads - SVG",
    href: "/unassigned-hot-leads-svg",
    icon: Package,
  },
  {
    label: "Unassigned Hot Leads - 95RM",
    href: "/unassigned-hot-leads-95rm",
    icon: Package,
  },
  {
    label: "Unassigned Hot Leads - Benton",
    href: "/unassigned-hot-leads-benton",
    icon: Package,
  },
  {
    label: "Ever Been Hot - SVG",
    href: "/ever-been-hot-svg",
    icon: RotateCcw,
  },
  {
    label: "Ever Been Hot - 95RM",
    href: "/ever-been-hot-95rm",
    icon: RotateCcw,
  },
  {
    label: "Ever Been Hot - Benton",
    href: "/ever-been-hot-benton",
    icon: RotateCcw,
  },
  {
    label: "Closed Contacts",
    href: "/closed-contacts",
    icon: Lock,
  },
];

const navigationByRole: Record<UserRole, NavigationItem[]> = {
  agent: agentNavigation,
  admin: [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    ...agentNavigation.filter((item) => item.href !== "/dashboard"),
    ...backofficeNavigation.filter((item) => item.href !== "/dashboard"),
  ],
  backoffice: backofficeNavigation,
};

export const getNavigationsForRole = (role?: string): NavigationItem[] => {
  if (!role) {
    return [];
  }

  return navigationByRole[role as UserRole] ?? [];
};
