import { useMemo } from "react";
import { useUsers, type AgentUser } from "@/features/backoffice-shared/use-users";

type Brand = "svg" | "95rm" | "benton";

export function mapAgentUsersToSelectOptions(agents: AgentUser[] = []) {
  return agents.map((agent) => ({
    label: agent.name,
    value: agent.name,
  }));
}

export function useAgentSelectOptions(brand: Brand) {
  const query = useUsers(brand);

  const options = useMemo(
    () => mapAgentUsersToSelectOptions(query.data),
    [query.data],
  );

  return {
    ...query,
    options,
  };
}
