import { useNavigate } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Download } from "lucide-react";
import { downloadWorkbook } from "@/lib/excel";
import type { CommitResult } from "@/types/bulk-import.types";

type Props = {
  result: CommitResult;
  fileName: string;
  onStartAnother: () => void;
};

export function ImportDonePanel({ result, fileName, onStartAnother }: Props) {
  const navigate = useNavigate();
  const hasFailures = result.failures.length > 0;

  const rows = [
    { label: "Companies created", value: result.companiesCreated },
    { label: "Companies skipped (already in CRM)", value: result.companiesSkipped },
    { label: "Leads created", value: result.leadsCreated },
    { label: "Leads failed", value: result.leadsFailed },
  ];

  const handleFailureDownload = async () => {
    await downloadWorkbook("sidago-import-failures.xlsx", [
      {
        kind: "object",
        name: "Failures",
        columns: ["Row", "Target", "Reason"],
        rows: result.failures.map((f) => ({
          Row: f.rowNumber,
          Target: f.target,
          Reason: f.reason,
        })),
      },
    ]);
  };

  return (
    <div className="mx-auto grid w-full max-w-2xl gap-5 py-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <div
          className={`inline-flex h-12 w-12 items-center justify-center rounded-full ${
            hasFailures
              ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
          }`}
        >
          {hasFailures ? <AlertTriangle size={22} /> : <CheckCircle2 size={22} />}
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {hasFailures ? "Import finished with some problems" : "Import complete"}
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{fileName}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5 text-sm last:border-0 dark:border-slate-800"
          >
            <span className="text-slate-600 dark:text-slate-300">{row.label}</span>
            <span className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">
              {row.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>

      {hasFailures && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm text-amber-900 dark:text-amber-200">
              <span className="font-semibold">
                {result.failures.length} row
                {result.failures.length === 1 ? "" : "s"} could not be saved.
              </span>{" "}
              Fix them in your sheet and upload again — anything already imported
              comes back as a duplicate rather than being created twice.
            </p>
            <button
              type="button"
              onClick={handleFailureDownload}
              className="cursor-pointer inline-flex h-9 shrink-0 items-center gap-1.5 rounded border border-amber-300 px-3 text-xs font-medium text-amber-900 transition hover:bg-amber-100 dark:border-amber-800 dark:text-amber-200 dark:hover:bg-amber-950/40"
            >
              <Download size={14} />
              Download
            </button>
          </div>
          <ul className="mt-3 grid max-h-52 gap-1 overflow-y-auto text-xs text-amber-900 dark:text-amber-200">
            {result.failures.slice(0, 50).map((f, i) => (
              <li
                key={`${f.rowNumber}-${i}`}
                className="rounded bg-white/70 px-2 py-1 dark:bg-slate-900/50"
              >
                <span className="font-medium">Row {f.rowNumber}</span> ({f.target}):{" "}
                {f.reason}
              </li>
            ))}
            {result.failures.length > 50 && (
              <li className="px-2 py-1 italic">
                …and {result.failures.length - 50} more — download the full list.
              </li>
            )}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={onStartAnother}
          className="cursor-pointer inline-flex h-10 items-center rounded border border-slate-200 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Import another file
        </button>
        <button
          type="button"
          onClick={() => navigate("/leads")}
          className="cursor-pointer inline-flex h-10 items-center rounded bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
        >
          View Leads
        </button>
      </div>
    </div>
  );
}
