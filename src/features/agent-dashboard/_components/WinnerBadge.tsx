import { Crown } from "lucide-react";

interface WinnerBadgeProps {
  label?: string;
  compact?: boolean;
}

export function WinnerBadge({
  label = "Winner",
  compact = false,
}: WinnerBadgeProps) {
  return (
    <div
      className={[
        "flex items-center rounded-full bg-orange-100 font-bold uppercase tracking-wider text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
        compact
          ? "gap-1 px-2 py-1 text-[10px]"
          : "gap-1.5 px-3 py-1 text-[10px]",
      ].join(" ")}
    >
      <Crown size={compact ? 12 : 14} />
      <span>{label}</span>
    </div>
  );
}
