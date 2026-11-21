

import { createContext, useContext } from "react";
import { useMe } from "@/hooks/useMe";
import { useBrandsWithAgents } from "@/hooks/useBrandsWithAgents";
import {
  getNavigationsForRole,
  type NavigationItem,
  type UserRole,
} from "@/lib/navigation";

type AuthUser = {
  id?: string;
  email: string;
  name: string;
  role: UserRole;
  slug?: string | null;
};

type AuthContextType = {
  user: AuthUser | undefined;
  isLoading: boolean;
  isError: boolean;
  hasAccess: boolean;
  navigations: NavigationItem[];
  hasRole: (role: UserRole | UserRole[]) => boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data, isLoading, isError } = useMe();
  const user = data?.user;
  const { data: brandsWithAgents } = useBrandsWithAgents(user?.role);
  const navigations = user ? getNavigationsForRole(user, brandsWithAgents) : [];

  const hasRole = (role: UserRole | UserRole[]) => {
    if (!user) return false;
    if (Array.isArray(role)) return role.includes(user.role);
    return user.role === role;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isError,
        hasAccess: Boolean(user),
        navigations,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
