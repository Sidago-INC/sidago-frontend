import { ReactNode } from "react";
import { Agent } from "@/types";
import { AgentAvatar } from "./AgentAvatar";

interface AgentIdentityProps {
  agent: Agent;
  index?: number;
  meta?: ReactNode;
  aside?: ReactNode;
  avatarSquare?: boolean;
  nameClassName?: string;
  metaClassName?: string;
  containerClassName?: string;
}

export function AgentIdentity({
  agent,
  index = 0,
  meta,
  aside,
  avatarSquare = false,
  nameClassName = "text-sm font-semibold text-gray-800 dark:text-gray-100",
  metaClassName = "text-xs text-gray-400 dark:text-gray-500",
  containerClassName = "flex items-center gap-3",
}: AgentIdentityProps) {
  return (
    <div className="flex min-w-0 items-start justify-between gap-3">
      <div className={containerClassName}>
        <AgentAvatar
          agent={agent}
          index={index}
          square={avatarSquare}
          sizeClassName={avatarSquare ? "h-8 w-8" : "h-8 w-8"}
          textClassName={avatarSquare ? "text-sm" : "text-xs"}
        />

        <div className="min-w-0">
          <p className={nameClassName}>
            {agent.name} {agent.surname}
          </p>
          {meta && <p className={metaClassName}>{meta}</p>}
        </div>
      </div>

      {aside}
    </div>
  );
}
