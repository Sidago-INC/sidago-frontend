import { Wave } from "@/components/ui";
import { useFixQueue } from "../_lib/data";
import { FixLeadsTable } from "./FixLeadsTable";

export function FixLeads() {
  const { data, isLoading, isError, error } = useFixQueue();

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 px-4 pt-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          Fix Queue
        </h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Wave />
        </div>
      ) : isError ? (
        <div className="mx-4 rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
          Failed to load fix queue:{" "}
          {(error as unknown as { message?: string[] })?.message?.join(", ") ??
            "Unknown error"}
        </div>
      ) : (
        <FixLeadsTable data={data ?? []} title="Fix Queue" />
      )}
    </div>
  );
}
