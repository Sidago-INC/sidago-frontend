import { useSearchParams, Navigate } from "react-router-dom";
import { AgentSms } from "@/features/agent-sms/_components/AgentSms";

const AGENT_MAP = {
  "mariz-cabido": "Mariz Cabido",
  "tom-silver": "Tom Silver",
  "chris-moore": "Chris Moore",
} as const;

export default function SmsPage() {
  const [searchParams] = useSearchParams();
  const agentSlug = searchParams.get("agent") ?? searchParams.get("agentId");

  if (!agentSlug || !(agentSlug in AGENT_MAP)) {
    return <Navigate to="/sms?agent=mariz-cabido&agentId=mariz-cabido" replace />;
  }

  return (
    <AgentSms
      agentName={AGENT_MAP[agentSlug as keyof typeof AGENT_MAP]}
      agentSlug={agentSlug}
    />
  );
}
