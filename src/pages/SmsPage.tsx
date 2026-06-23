import { useSearchParams, Navigate } from "react-router-dom";
import { AgentSms } from "@/features/agent-sms/_components/AgentSms";
import { useAuth } from "@/providers/AuthProvider";
import { useFirstNavAgent } from "@/hooks/useBrandsWithAgents";
import { findNavAgent } from "@/lib/navigation-agents";

export default function SmsPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const { data: brandsWithAgents, firstAgent } = useFirstNavAgent(user?.role);

  const agentParam = searchParams.get("agent");
  const agentIdParam = searchParams.get("agentId");
  const matchedAgent = findNavAgent(brandsWithAgents, agentParam, agentIdParam);

  if (!matchedAgent) {
    if (!firstAgent) {
      return null;
    }

    return (
      <Navigate
        to={`/sms?agent=${encodeURIComponent(firstAgent.slug)}&agentId=${encodeURIComponent(firstAgent.agentId)}`}
        replace
      />
    );
  }

  return (
    <AgentSms agentName={matchedAgent.name} agentSlug={matchedAgent.slug} />
  );
}
