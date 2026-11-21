import { useSearchParams, Navigate } from "react-router-dom";
import { AgentEmail } from "@/features/agent-email/_components/AgentEmail";
import { useAuth } from "@/providers/AuthProvider";
import { useFirstNavAgent } from "@/hooks/useBrandsWithAgents";
import { findNavAgent } from "@/lib/navigation-agents";

export default function EmailPage() {
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
        to={`/email?agent=${encodeURIComponent(firstAgent.slug)}&agentId=${encodeURIComponent(firstAgent.agentId)}`}
        replace
      />
    );
  }

  return (
    <AgentEmail
      agentName={matchedAgent.name}
      agentSlug={matchedAgent.slug}
    />
  );
}
