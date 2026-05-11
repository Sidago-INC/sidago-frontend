import { Card, CardContent } from "@/components/ui/Card";
import { Download, FileSpreadsheet, Upload } from "lucide-react";
import type { ChangeEvent, RefObject } from "react";
import { BulkImportFailedRows } from "./BulkImportFailedRows";
import { BulkImportSummary } from "./BulkImportSummary";

type BulkImportInfoCard = {
  label: string;
  value: string;
};

type BulkImportSummaryData = {
  fileName: string;
  totalRows: number;
  importedCount: number;
  skippedCount: number;
};

type BulkImportPageProps<TRow extends { rowNumber: string; errors: string }> = {
  title: string;
  description: string;
  uploadTitle: string;
  requiredColumnsText: string;
  selectedFileName: string;
  isProcessing: boolean;
  summary: BulkImportSummaryData | null;
  failedRows: TRow[];
  fileInputRef: RefObject<HTMLInputElement | null>;
  fileInputAccept: string;
  infoCards: BulkImportInfoCard[];
  failedRowValueKey: keyof TRow;
  failedRowValueHeader: string;
  getSummaryText: (summary: BulkImportSummaryData) => string;
  onTemplateDownload: () => Promise<void>;
  onErrorReportDownload: () => Promise<void>;
  onUploadClick: () => void;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
};

export function BulkImportPage<
  TRow extends { rowNumber: string; errors: string },
>({
  title,
  description,
  uploadTitle,
  requiredColumnsText,
  selectedFileName,
  isProcessing,
  summary,
  failedRows,
  fileInputRef,
  fileInputAccept,
  infoCards,
  failedRowValueKey,
  failedRowValueHeader,
  getSummaryText,
  onTemplateDownload,
  onErrorReportDownload,
  onUploadClick,
  onFileChange,
}: BulkImportPageProps<TRow>) {
  return (
    <div className="mx-auto flex w-full flex-col gap-5 px-4 py-6 lg:px-6">
      <Card className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <CardContent className="p-0">
          <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-700 sm:px-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-2xl">
                <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                  {title}
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {description}
                </p>
              </div>
              <button
                type="button"
                onClick={onTemplateDownload}
                disabled={isProcessing}
                className="cursor-pointer inline-flex h-10 items-center gap-2 rounded border border-slate-200 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <Download size={16} />
                Download Template
              </button>
            </div>
          </div>

          <div className="grid gap-5 px-5 py-5 sm:px-6 sm:py-6">
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-950/40">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">
                    <FileSpreadsheet size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {uploadTitle}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Accepts `.xlsx` files only. Required columns:{" "}
                      {requiredColumnsText}
                    </p>
                  </div>
                  {selectedFileName ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Selected file: {selectedFileName}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={onUploadClick}
                    disabled={isProcessing}
                    className="cursor-pointer inline-flex h-10 items-center gap-2 rounded bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
                  >
                    <Upload size={16} />
                    {isProcessing ? "Processing..." : "Choose XLSX File"}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={fileInputAccept}
                    onChange={onFileChange}
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {infoCards.map((card) => (
                <div
                  key={card.label}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/40"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {card.label}
                  </p>
                  <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
                    {card.value}
                  </p>
                </div>
              ))}
            </div>

            {summary ? (
              <BulkImportSummary
                fileName={summary.fileName}
                totalRows={summary.totalRows}
                importedCount={summary.importedCount}
                skippedCount={summary.skippedCount}
                summaryText={getSummaryText(summary)}
                onDownloadErrorReport={onErrorReportDownload}
                hasFailedRows={failedRows.length > 0}
                isProcessing={isProcessing}
              />
            ) : null}

            <BulkImportFailedRows
              failedRows={failedRows}
              valueKey={failedRowValueKey}
              valueHeader={failedRowValueHeader}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
