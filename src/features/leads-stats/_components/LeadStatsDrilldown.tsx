import { useLeadStatsDetail, type LeadStatsFlagType } from "../_lib/hooks";

type Props = {
  flagType: LeadStatsFlagType;
  from: string;
  to: string;
};

export function LeadStatsDrilldown({ flagType, from, to }: Props) {
  const { data, isLoading, isError } = useLeadStatsDetail(flagType, from, to);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <span className="text-sm text-slate-500 dark:text-slate-400">
          Loading…
        </span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4">
        <p className="text-sm text-rose-600 dark:text-rose-400">
          Failed to load leads.
        </p>
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No leads found for this period.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2 p-4">
      {data.map((item, index) => (
        <div
          key={index}
          className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800"
        >
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {item.fullName || "—"}
          </p>
          <div className="mt-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>{item.companySymbol || "—"}</span>
            <span>·</span>
            <span>{item.phone || "—"}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
