import { useAuth } from "@/providers/AuthProvider";
import { BackofficeDashboard } from "@/features/backoffice-dashboard/_components/BackofficeDashboard";
import { AgentMonthlyStatsView } from "@/features/agent-dashboard/_components/AgentMonthlyStatsView";

// /monthly-stats-points — one route, role-appropriate view. Agents get their own
// stats only; backoffice and admin keep the all-agents comparison. The data is
// scoped server-side as well, so this switch is presentation, not the guard.
export default function MonthlyStatsPage() {
  const { user, isLoading } = useAuth();

  if (isLoading || !user) return null;

  if (user.role === "agent") {
    return <AgentMonthlyStatsView />;
  }

  return <BackofficeDashboard initialView="monthly" />;
}
