
import clsx from "clsx";
import React, { ReactNode } from "react";

export type StatusCardMetric = {
  id?: string | number;
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
};

type StatusCardProps = {
  header?: ReactNode;
  aside?: ReactNode;
  metrics?: StatusCardMetric[];
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
  bodyClassName?: string;
  headerClassName?: string;
  metricsClassName?: string;
  metricClassName?: string;
  metricLabelClassName?: string;
  metricValueClassName?: string;
};

export function StatusCard({
  header,
  aside,
  metrics = [],
  children,
  footer,
  className,
  bodyClassName,
  headerClassName,
  metricsClassName,
  metricClassName,
  metricLabelClassName,
  metricValueClassName,
}: StatusCardProps) {
  return (
    <div
      className={clsx(
        "overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800",
        className,
      )}
    >
      <div className={clsx("space-y-6 p-6", bodyClassName)}>
        {(header || aside) && (
          <div
            className={clsx(
              "flex items-start justify-between gap-3",
              headerClassName,
            )}
          >
            <div className="min-w-0 flex-1">{header}</div>
            {aside && <div className="shrink-0">{aside}</div>}
          </div>
        )}

        {metrics.length > 0 && (
          <div
            className={clsx(
              "grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3",
              metricsClassName,
            )}
          >
            {metrics.map((metric, index) => (
              <div
                key={metric.id ?? metric.label ?? index}
                className={clsx(metricClassName, metric.className)}
              >
                {metric.icon && (
                  <div className="mb-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/60 dark:bg-white/10 sm:h-10 sm:w-10 sm:rounded-xl">
                    {metric.icon}
                  </div>
                )}

                <div className="min-w-0">
                  <p
                    className={clsx(
                      "truncate text-[10px] font-medium uppercase opacity-70 sm:text-xs",
                      metricLabelClassName,
                      metric.labelClassName,
                    )}
                  >
                    {metric.label}
                  </p>
                  <p
                    className={clsx(
                      "truncate text-base font-bold sm:text-xl",
                      metricValueClassName,
                      metric.valueClassName,
                    )}
                  >
                    {metric.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {children}
        {footer}
      </div>
    </div>
  );
}
