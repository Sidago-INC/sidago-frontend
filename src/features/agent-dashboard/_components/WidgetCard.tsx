import { ReactNode } from "react";
import { MetricTile } from "./MetricTile";
import clsx from "clsx";

interface WidgetCardProps {
  label: string;
  value: number | string;
  icon: ReactNode;
  colorClass?: string;
  iconClassName?: string;
}

export function WidgetCard({
  label,
  value,
  icon,
  colorClass,
  iconClassName,
}: WidgetCardProps) {
  return (
    <MetricTile
      label={label}
      value={value}
      icon={
        <div
          className={clsx(
            "flex h-10 w-10 items-center justify-center rounded-xl",
            "bg-linear-to-br from-slate-100 to-white",
            "dark:from-slate-800 dark:to-slate-900",
            "shadow-sm border border-slate-200",
            "dark:border-slate-700",
            "text-slate-700 dark:text-slate-200",
            "transition-transform duration-300 group-hover:scale-105",
            iconClassName,
          )}
        >
          {icon}
        </div>
      }
      className={clsx(
        "flex items-center gap-2 rounded-2xl border p-3 sm:gap-3 sm:p-4",
        "hover:-translate-y-1 hover:shadow-lg",
        "transition-all duration-300",
        colorClass,
      )}
      labelClassName="truncate text-[10px] font-medium opacity-70 sm:text-xs"
      valueClassName="truncate text-base font-bold sm:text-xl"
    />
  );
}
