import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/providers/AuthProvider";
import { getDashboardRouteForRole } from "@/lib/auth-routing";

export function GuestRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;

  if (user) {
    return <Navigate to={getDashboardRouteForRole(user.role)} replace />;
  }

  return <Outlet />;
}
