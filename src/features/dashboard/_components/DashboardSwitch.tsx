

import { useAuth } from "@/providers/AuthProvider";
import AgentDashboard from "@/features/agent-dashboard/AgentDashboard";
import AdminDashboard from "@/features/admin-dashboard/AdminDashboard";
import { BackofficeDashboard } from "@/features/backoffice-dashboard/_components/BackofficeDashboard";

export default function DashboardSwitch() {
  const { user, isLoading } = useAuth();

  if (isLoading || !user) {
    return null;
  }

  if (user.role === "agent") {
    return <AgentDashboard />;
  }

  if (user.role === "backoffice") {
    return <BackofficeDashboard />;
  }

  if (user.role === "admin") {
    return <AdminDashboard />;
  }

  return null;
}
