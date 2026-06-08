import { LucideIcon } from "lucide-react";

type OutcomeButtonProps = {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  className: string;
  disabled?: boolean;
};

export function OutcomeButton({
  label,
  icon: Icon,
  onClick,
  className,
  disabled = false,
}: OutcomeButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex min-h-13 w-full min-w-0 items-center justify-center gap-2 overflow-hidden rounded-xl px-3 py-3 text-center text-sm font-semibold leading-tight whitespace-nowrap transition-all disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="min-w-0 truncate">{label}</span>
    </button>
  );
}
