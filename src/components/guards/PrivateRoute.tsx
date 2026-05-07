import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/providers/AuthProvider";
import { getDashboardRouteForRole, hasRouteAccess } from "@/lib/auth-routing";

export function PrivateRoute() {
  const { user, isLoading } = useAuth();
  const { pathname } = useLocation();

  if (isLoading) return null;

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (!hasRouteAccess(user.role, pathname)) {
    return <Navigate to={getDashboardRouteForRole(user.role)} replace />;
  }

  return <Outlet />;
}
