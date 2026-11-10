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
      className={`flex min-h-13 w-full items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-center text-xs sm:gap-2 sm:px-3 sm:py-3 sm:text-sm font-semibold leading-snug whitespace-normal transition-all disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{label}</span>
    </button>
  );
}
