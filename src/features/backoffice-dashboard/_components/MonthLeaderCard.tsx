import { StatusCard } from "@/components/ui";
import clsx from "clsx";

interface MonthLeaderCardProps {
  title: string;
  name: string;
  value: number;
  tone?: string;
}

export function MonthLeaderCard({
  title,
  name,
  value,
  tone = "bg-indigo-50 dark:bg-indigo-950/30",
}: MonthLeaderCardProps) {
  return (
    <StatusCard
      className="border-slate-200 dark:border-slate-800 dark:bg-slate-900"
      header={
        <p className="truncate text-lg font-bold text-slate-900 dark:text-slate-100">
          {title}
        </p>
      }
      metrics={[
        {
          id: "leader-value",
          label: name,
          value,
          className: clsx("rounded-xl px-4 py-3", tone),
          valueClassName:
            "text-xl font-bold text-slate-900 dark:text-slate-100",
        },
      ]}
    />
  );
}
