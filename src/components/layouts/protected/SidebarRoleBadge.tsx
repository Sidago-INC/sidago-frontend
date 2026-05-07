import clsx from "clsx";
import { UserCog } from "lucide-react";

interface SidebarRoleBadgeProps {
  role?: string;
  compact?: boolean;
}

export function SidebarRoleBadge({
  role,
  compact = false,
}: SidebarRoleBadgeProps) {
  const roleLabel = role
    ? role.charAt(0).toUpperCase() + role.slice(1)
    : "Unknown";

  return (
    <div
      className={clsx(
        "flex rounded-2xl border border-indigo-100 bg-indigo-50/80 text-indigo-700 dark:border-indigo-900/60 dark:bg-indigo-950/50 dark:text-indigo-300",
        compact
          ? "flex-col items-center justify-center gap-2 px-2 py-3 text-center"
          : "items-center gap-3 px-3 py-2.5",
      )}
      title={`Role: ${roleLabel}`}
    >
      <div
        className={clsx(
          "flex shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white",
          compact ? "h-6 w-6" : "h-9 w-9",
        )}
      >
        <UserCog size={18} />
      </div>
      <div className={clsx("min-w-0", compact && "w-full")}>
        {!compact && (
          <p className="text-[11px] font-semibold uppercase tracking-widest text-indigo-500 dark:text-indigo-400">
            User Role
          </p>
        )}
        <p
          className={clsx(
            "font-bold overflow-hidden text-ellipsis whitespace-nowrap",
            compact ? "w-10 text-[11px] leading-tight" : "truncate text-sm",
          )}
        >
          {roleLabel}
        </p>
      </div>
    </div>
  );
}
