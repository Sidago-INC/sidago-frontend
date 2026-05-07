
import { useAuth } from "@/providers/AuthProvider";

export function HasRole({
  name,
  children,
  fallback = null,
}: {
  name: string | string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { user } = useAuth();

  if (!user) return fallback;

  if (user.role === "admin") {
    return <>{children}</>;
  }

  const roles = Array.isArray(name) ? name : [name];
  if (!roles.includes(user.role)) {
    return fallback;
  }

  return <>{children}</>;
}
