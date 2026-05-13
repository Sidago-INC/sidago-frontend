import {
  adminOnlyNavigation,
  agentNavigation,
  backofficeNavigation,
  flattenNavigationHrefs,
  type UserRole,
} from "./navigation";

export const AUTH_NOTICE_KEY = "sidago_auth_notice";

const agentRoutes = new Set(flattenNavigationHrefs(agentNavigation));

const backofficeRoutes = new Set(flattenNavigationHrefs(backofficeNavigation));

const adminRoutes = new Set(flattenNavigationHrefs(adminOnlyNavigation));

const allProtectedRoutes = new Set([
  ...adminRoutes,
  ...agentRoutes,
  ...backofficeRoutes,
]);

export function getDashboardRouteForRole(role: UserRole): string {
  switch (role) {
    case "agent":
    case "backoffice":
    case "admin":
      return "/dashboard";
    default:
      return "/";
  }
}

function matchesRoute(routes: Set<string>, pathname: string): boolean {
  if (routes.has(pathname)) return true;
  // Allow dynamic sub-paths (e.g. /fix-leads/:leadId under /fix-leads). Match
  // by prefix + "/" so /fix-leadsx doesn't accidentally satisfy /fix-leads.
  for (const route of routes) {
    if (pathname.startsWith(route + "/")) return true;
  }
  return false;
}

export function hasRouteAccess(role: UserRole, pathname: string): boolean {
  if (role === "admin") {
    return matchesRoute(allProtectedRoutes, pathname);
  }

  if (role === "agent") {
    return matchesRoute(agentRoutes, pathname);
  }

  if (role === "backoffice") {
    return matchesRoute(backofficeRoutes, pathname);
  }

  return false;
}

export function setAuthNotice(message: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(AUTH_NOTICE_KEY, message);
}

export function consumeAuthNotice(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const message = window.sessionStorage.getItem(AUTH_NOTICE_KEY);

  if (message) {
    window.sessionStorage.removeItem(AUTH_NOTICE_KEY);
  }

  return message;
}
