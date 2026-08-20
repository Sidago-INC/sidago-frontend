import { Loader2, ShieldCheck, Database } from "lucide-react";

type Props = {
  /** "analyzing" reads the file; "committing" is the only phase that writes. */
  phase: "analyzing" | "committing";
  processed: number;
  total: number;
  fileName?: string;
};

export function ImportProgressPanel({ phase, processed, total, fileName }: Props) {
  const analyzing = phase === "analyzing";
  const pct = total > 0 ? Math.min(100, Math.round((processed / total) * 100)) : 0;

  // Reading the rows is instant; the wait is the CRM lookup that follows, which
  // reports no row count. Once every row is read the bar would otherwise sit at
  // 100% looking hung, so it switches to an indeterminate state that says what
  // is actually happening.
  const resolving = analyzing && total > 0 && processed >= total;

  return (
    <div className="mx-auto grid w-full max-w-xl gap-5 py-10">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">
          {analyzing ? (
            <Loader2 size={22} className="animate-spin" />
          ) : (
            <Database size={20} />
          )}
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {analyzing ? "Reading your file" : "Importing"}
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {!analyzing
              ? "Creating the companies, then the leads."
              : resolving
                ? "Matching companies and leads against the CRM."
                : "Reading the rows and tidying the values."}
          </p>
          {fileName && (
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{fileName}</p>
          )}
        </div>
      </div>

      <div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          {resolving ? (
            <div className="h-full w-1/3 animate-pulse rounded-full bg-slate-900 dark:bg-slate-100" />
          ) : (
            <div
              className="h-full rounded-full bg-slate-900 transition-all duration-300 dark:bg-slate-100"
              style={{ width: `${total > 0 ? pct : 15}%` }}
            />
          )}
        </div>
        <p className="mt-2 text-center text-xs text-slate-500 dark:text-slate-400">
          {resolving
            ? `All ${total.toLocaleString()} rows read — checking them against the CRM`
            : total > 0
              ? `${processed.toLocaleString()} of ${total.toLocaleString()} ${analyzing ? "rows read" : "records created"}`
              : "Starting..."}
        </p>
      </div>

      {analyzing ? (
        <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-200">
          <ShieldCheck size={16} className="mt-0.5 shrink-0" />
          <p>
            <span className="font-semibold">Nothing has been saved yet.</span> You
            will get a chance to review everything first.
          </p>
        </div>
      ) : (
        <p className="text-center text-sm text-slate-500 dark:text-slate-400">
          This can take a few minutes on a large file. You can leave this page and
          come back — the import keeps running.
        </p>
      )}
    </div>
  );
}
