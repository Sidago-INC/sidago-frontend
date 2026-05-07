import { ReactNode } from "react";

interface MetricTileProps {
  label: string;
  value: number | string;
  icon?: ReactNode;
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
}

export function MetricTile({
  label,
  value,
  icon,
  className,
  labelClassName,
  valueClassName,
}: MetricTileProps) {
  return (
    <div className={className}>
      {icon && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/60 dark:bg-white/10 sm:h-10 sm:w-10 sm:rounded-xl">
          {icon}
        </div>
      )}

      <div className="min-w-0">
        <p
          className={
            labelClassName ??
            "truncate text-[10px] font-medium uppercase opacity-70 sm:text-xs"
          }
        >
          {label}
        </p>
        <p
          className={
            valueClassName ?? "truncate text-base font-bold sm:text-xl"
          }
        >
          {value}
        </p>
      </div>
    </div>
  );
}
