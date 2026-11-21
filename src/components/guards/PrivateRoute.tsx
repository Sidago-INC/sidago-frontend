import { useAuth } from "@/providers/AuthProvider";
import { getDashboardRouteForRole, hasRouteAccess } from "@/lib/auth-routing";
import { tokenService } from "@/lib/token";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";

export function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // Checked BEFORE anything asynchronous. `useAuth` only knows the answer once
  // /auth/me has resolved, and until then this component fell through to its
  // `isLoading` branch — but a `user` left over from a restored page made even
  // that unnecessary, so the CRM rendered and its widgets started firing
  // requests that all came back 401.
  //
  // localStorage is the one thing `logout()` empties, and reading it is
  // synchronous, so "is anyone signed in at all" can be answered on the very
  // first render. No token means no protected UI — no exceptions, whatever the
  // query cache happens to be holding.
  const hasSession = tokenService.hasPersistedSession();

  const hasAccessToRoute = user ? hasRouteAccess(user.role, pathname) : false;

  useEffect(() => {
    if (!hasSession) {
      navigate("/", { replace: true });
      return;
    }

    if (!isLoading && !user) {
      navigate("/", { replace: true });
      return;
    }

    if (!isLoading && user && !hasAccessToRoute) {
      navigate(getDashboardRouteForRole(user.role), { replace: true });
    }
  }, [hasSession, user, isLoading, hasAccessToRoute, navigate]);

  // Nothing protected renders without a session, so no child mounts and no
  // child fires a request that is destined to 401.
  if (!hasSession) return null;

  if (isLoading) return null;

  if (!user) return null;

  if (!hasAccessToRoute) return null;

  return <>{children}</>;
}
