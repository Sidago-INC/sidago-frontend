import { useAuth } from "@/providers/AuthProvider";
import { getDashboardRouteForRole, hasRouteAccess } from "@/lib/auth-routing";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";

export function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const hasAccessToRoute = user ? hasRouteAccess(user.role, pathname) : false;

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/", { replace: true });
      return;
    }

    if (!isLoading && user && !hasAccessToRoute) {
      navigate(getDashboardRouteForRole(user.role), { replace: true });
    }
  }, [user, isLoading, hasAccessToRoute, navigate]);

  if (isLoading) return null;

  if (!user) return null;

  if (!hasAccessToRoute) return null;

  return <>{children}</>;
}
