

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

type SimpleStatusCardProps = {
  title: ReactNode;
  value: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  className?: string;
  bodyClassName?: string;
  titleClassName?: string;
  valueClassName?: string;
  descriptionClassName?: string;
  iconWrapperClassName?: string;
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
                      "text-[9px] font-medium uppercase leading-snug opacity-70 sm:text-[10px] whitespace-normal break-words",
                      metricLabelClassName,
                      metric.labelClassName,
                    )}
                  >
                    {metric.label}
                  </p>
                  <p
                    className={clsx(
                      "text-sm font-bold leading-tight sm:text-lg whitespace-normal break-words",
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

export function SimpleStatusCard({
  title,
  value,
  description,
  icon,
  className,
  bodyClassName,
  titleClassName,
  valueClassName,
  descriptionClassName,
  iconWrapperClassName,
}: SimpleStatusCardProps) {
  return (
    <div
      className={clsx(
        "overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800",
        className,
      )}
    >
      <div className={clsx("flex h-full flex-col gap-4 p-6", bodyClassName)}>
        {icon ? (
          <div
            className={clsx(
              "flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-100",
              iconWrapperClassName,
            )}
          >
            {icon}
          </div>
        ) : null}

        <div className="flex w-full flex-col gap-2">
          <p
            className={clsx(
              "w-full text-lg font-bold text-slate-900 dark:text-slate-100",
              titleClassName,
            )}
          >
            {title}
          </p>
          <p
            className={clsx(
              "w-full text-3xl font-bold text-slate-950 dark:text-slate-50",
              valueClassName,
            )}
          >
            {value}
          </p>
          {description ? (
            <p
              className={clsx(
                "w-full text-sm text-slate-600 dark:text-slate-300",
                descriptionClassName,
              )}
            >
              {description}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
