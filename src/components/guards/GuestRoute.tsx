import { useAuth } from "@/providers/AuthProvider";
import { getDashboardRouteForRole } from "@/lib/auth-routing";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

export function GuestRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && user) {
      navigate(getDashboardRouteForRole(user.role), { replace: true });
    }
  }, [user, isLoading, navigate]);

  if (isLoading) return null;

  if (user) return null;

  return <>{children}</>;
}
