import { useSearchParams, Navigate } from "react-router-dom";
import { AgentEmail } from "@/features/agent-email/_components/AgentEmail";

const AGENT_MAP = {
  "mariz-cabido": "Mariz Cabido",
  "tom-silver": "Tom Silver",
  "bryan-taylor": "Bryan Taylor",
  "chris-moore": "Chris Moore",
} as const;

export default function EmailPage() {
  const [searchParams] = useSearchParams();
  const agentSlug = searchParams.get("agent") ?? searchParams.get("agentId");

  if (!agentSlug || !(agentSlug in AGENT_MAP)) {
    return <Navigate to="/email?agent=mariz-cabido&agentId=mariz-cabido" replace />;
  }

  return (
    <AgentEmail
      agentName={AGENT_MAP[agentSlug as keyof typeof AGENT_MAP]}
      agentSlug={agentSlug}
    />
  );
}
