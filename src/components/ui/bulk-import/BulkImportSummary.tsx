type BulkImportSummaryProps = {
  fileName: string;
  importedCount: number;
  skippedCount: number;
  totalRows: number;
  summaryText: string;
  onDownloadErrorReport: () => void;
  hasFailedRows: boolean;
  isProcessing: boolean;
};

type SummaryStatProps = {
  label: string;
  value: number;
};

function SummaryStat({ label, value }: SummaryStatProps) {
  return (
    <div className="rounded-lg border border-emerald-200 bg-white/70 p-4 dark:border-emerald-900/40 dark:bg-slate-900/40">
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800/70 dark:text-emerald-300/70">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-emerald-950 dark:text-emerald-100">
        {value}
      </p>
    </div>
  );
}

export function BulkImportSummary({
  fileName,
  importedCount,
  skippedCount,
  totalRows,
  summaryText,
  onDownloadErrorReport,
  hasFailedRows,
  isProcessing,
}: BulkImportSummaryProps) {
  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900/50 dark:bg-emerald-950/20">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-emerald-900 dark:text-emerald-200">
            Import Summary
          </h2>
          <p className="text-sm text-emerald-800/80 dark:text-emerald-300/80">
            {fileName}
          </p>
        </div>
        {hasFailedRows ? (
          <button
            type="button"
            onClick={onDownloadErrorReport}
            disabled={isProcessing}
            className="cursor-pointer inline-flex h-10 items-center gap-2 rounded border border-emerald-300 px-4 text-sm font-medium text-emerald-900 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-emerald-800 dark:text-emerald-200 dark:hover:bg-emerald-900/30"
          >
            Download Error Report
          </button>
        ) : null}
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <SummaryStat label="Rows in file" value={totalRows} />
        <SummaryStat label="Imported successfully" value={importedCount} />
        <SummaryStat label="Skipped due to errors" value={skippedCount} />
      </div>
      <p className="mt-4 text-sm text-emerald-900 dark:text-emerald-200">
        {summaryText}
      </p>
    </div>
  );
}
