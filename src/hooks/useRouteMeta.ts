
import { useLocation } from "react-router-dom";
import { useAuth } from "@/providers/AuthProvider";
import { NavigationItem } from "@/lib/navigation";
import { LucideIcon } from "lucide-react";

type RouteMeta = {
  label: string;
  icon?: LucideIcon | null;
  href: string;
};

function findInNav(
  items: NavigationItem[],
  pathname: string,
): NavigationItem | undefined {
  return items.find((item) => item.href === pathname);
}

export function useRouteMeta() {
  const { pathname } = useLocation();
  const { navigations } = useAuth();

  const match = findInNav(navigations, pathname);

  const meta: RouteMeta = match
    ? {
        label: match.label,
        icon: match.icon,
        href: match.href,
      }
    : {
        label: "Page",
        icon: null,
        href: pathname,
      };

  return {
    pathname,
    meta,
  };
}
