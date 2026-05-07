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
      className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition-all ${className}`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
