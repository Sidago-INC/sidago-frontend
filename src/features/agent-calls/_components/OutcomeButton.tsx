import { LucideIcon } from "lucide-react";

type OutcomeButtonProps = {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  className: string;
};

export function OutcomeButton({
  label,
  icon: Icon,
  onClick,
  className,
}: OutcomeButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex min-h-[52px] w-full min-w-0 items-center justify-center gap-2 overflow-hidden rounded-xl px-3 py-3 text-center text-sm font-semibold leading-tight whitespace-nowrap transition-all ${className}`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="min-w-0 truncate">{label}</span>
    </button>
  );
}
