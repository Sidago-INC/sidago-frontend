
import clsx from "clsx";
import { ReactNode } from "react";

interface PanelProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
  bodyClassName?: string;
}

export function Panel({
  children,
  title,
  subtitle,
  action,
  className,
  bodyClassName,
}: PanelProps) {
  return (
    <div
      className={clsx(
        "overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800",
        className,
      )}
    >
      {(title || subtitle || action) && (
        <div className="flex items-center justify-between border-b border-gray-100 px-3 py-3 sm:px-5 sm:py-4 dark:border-gray-700">
          <div>
            {title && (
              <h2 className="text-base font-bold text-gray-800 dark:text-gray-100">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                {subtitle}
              </p>
            )}
          </div>
          {action}
        </div>
      )}

      <div className={clsx(bodyClassName)}>{children}</div>
    </div>
  );
}
