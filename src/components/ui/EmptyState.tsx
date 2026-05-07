import { ReactNode } from "react";
import { Inbox } from "lucide-react";
import clsx from "clsx";

interface EmptyStateProps {
  message: string;
  title?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  message,
  title = "Nothing here",
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={clsx(
        "flex items-center justify-center px-6",
        "min-h-100 w-full",
        // 🌤 Light mode
        "bg-linear-to-b from-slate-50 via-white to-slate-100/60",
        // 🌙 Dark mode
        "dark:from-slate-950 dark:via-slate-950 dark:to-slate-900",
        className,
      )}
    >
      <div
        className={clsx(
          "relative w-full max-w-md overflow-hidden rounded-3xl border p-8 text-center",
          "transition-all duration-300",

          // 🌤 Light
          "bg-white/80 backdrop-blur shadow-lg shadow-slate-200/50",
          "border-slate-200",

          // 🌙 Dark
          "dark:bg-slate-900/70 dark:border-slate-800",
          "dark:shadow-black/20",
        )}
      >
        {/* subtle glow */}
        <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-white/40 to-transparent dark:from-white/5 dark:to-transparent" />

        <div className="relative">
          {/* Icon */}
          <div
            className={clsx(
              "mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl",
              "transition-all duration-300",

              // 🌤 Light
              "bg-slate-100 text-slate-600 border border-slate-200",

              // 🌙 Dark
              "dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
            )}
          >
            {icon ?? <Inbox className="h-8 w-8" />}
          </div>

          {/* Title */}
          <h2
            className={clsx(
              "text-xl font-semibold tracking-tight",
              "text-slate-900 dark:text-white",
            )}
          >
            {title}
          </h2>

          {/* Message */}
          <p
            className={clsx(
              "mt-2 text-sm leading-6",
              "text-slate-500 dark:text-slate-400",
            )}
          >
            {message}
          </p>

          {/* Action */}
          {action && <div className="mt-6">{action}</div>}
        </div>
      </div>
    </div>
  );
}
