import { Agent } from "@/types";
import { getAgentColor, getInitials } from "../_lib/utils";

interface AgentAvatarProps {
  agent: Agent;
  index?: number;
  sizeClassName?: string;
  textClassName?: string;
  square?: boolean;
}

export function AgentAvatar({
  agent,
  index = 0,
  sizeClassName = "h-10 w-10",
  textClassName = "text-sm",
  square = false,
}: AgentAvatarProps) {
  const color = getAgentColor(index);

  return (
    <div
      className={[
        "flex shrink-0 items-center justify-center font-bold text-white",
        square ? "rounded-xl" : "rounded-full",
        color.avatar,
        sizeClassName,
      ].join(" ")}
    >
      <span className={textClassName}>{getInitials(agent)}</span>
    </div>
  );
}
