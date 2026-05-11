type BulkImportFailedRowBase = {
  rowNumber: string;
  errors: string;
};

type BulkImportFailedRowsProps<TRow extends BulkImportFailedRowBase> = {
  failedRows: TRow[];
  valueKey: keyof TRow;
  valueHeader: string;
};

export function BulkImportFailedRows<TRow extends BulkImportFailedRowBase>({
  failedRows,
  valueKey,
  valueHeader,
}: BulkImportFailedRowsProps<TRow>) {
  if (failedRows.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900/50 dark:bg-amber-950/20">
      <h2 className="text-lg font-semibold text-amber-900 dark:text-amber-200">
        Failed Rows
      </h2>
      <p className="mt-1 text-sm text-amber-800/80 dark:text-amber-300/80">
        Review the first few failed rows below, or download the full error
        report.
      </p>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-amber-200 dark:border-amber-900/50">
              <th className="px-3 py-2 font-semibold text-amber-900 dark:text-amber-200">
                Row
              </th>
              <th className="px-3 py-2 font-semibold text-amber-900 dark:text-amber-200">
                {valueHeader}
              </th>
              <th className="px-3 py-2 font-semibold text-amber-900 dark:text-amber-200">
                Errors
              </th>
            </tr>
          </thead>
          <tbody>
            {failedRows.slice(0, 5).map((row) => {
              const previewValue = row[valueKey];

              return (
                <tr
                  key={`${row.rowNumber}-${String(previewValue)}`}
                  className="border-b border-amber-100 align-top last:border-0 dark:border-amber-900/30"
                >
                  <td className="px-3 py-2 text-amber-900 dark:text-amber-200">
                    {row.rowNumber}
                  </td>
                  <td className="px-3 py-2 text-amber-900 dark:text-amber-200">
                    {String(previewValue || "-")}
                  </td>
                  <td className="px-3 py-2 text-amber-900 dark:text-amber-200">
                    {row.errors}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
