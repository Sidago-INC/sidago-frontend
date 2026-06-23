import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/providers/AuthProvider";
import {
  findNavigationTrail,
  getRouteBreadcrumbFallback,
  type NavigationItem,
} from "@/lib/navigation";
import { LucideIcon } from "lucide-react";

export type RouteBreadcrumb = {
  label: string;
  href?: string;
};

type RouteMeta = {
  label: string;
  icon?: LucideIcon | null;
  href: string;
  breadcrumbs: RouteBreadcrumb[];
};

function trailToBreadcrumbs(trail: NavigationItem[]): RouteBreadcrumb[] {
  return trail.map((item) => ({
    label: item.label,
    href: item.href,
  }));
}

export function useRouteMeta() {
  const { pathname, search } = useLocation();
  const { navigations } = useAuth();
  const currentSearch = search.startsWith("?") ? search.slice(1) : search;

  const { breadcrumbs, activeItem } = useMemo(() => {
    const trail = findNavigationTrail(navigations, pathname, currentSearch);
    if (trail.length > 0) {
      return {
        breadcrumbs: trailToBreadcrumbs(trail),
        activeItem: trail[trail.length - 1],
      };
    }

    return {
      breadcrumbs: getRouteBreadcrumbFallback(pathname),
      activeItem: null,
    };
  }, [currentSearch, navigations, pathname]);

  const meta: RouteMeta = {
    label: breadcrumbs[breadcrumbs.length - 1]?.label ?? "Page",
    icon: activeItem?.icon ?? null,
    href: activeItem?.href ?? breadcrumbs[breadcrumbs.length - 1]?.href ?? pathname,
    breadcrumbs,
  };

  return {
    pathname,
    meta,
  };
}
