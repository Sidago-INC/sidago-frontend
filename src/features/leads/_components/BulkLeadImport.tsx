

import { useCallback, useRef, useState, type ChangeEvent } from "react";
import type { LeadImportResult, LeadImportRow } from "@/types/lead-import.types";
import { Card, CardContent } from "@/components/ui/Card";
import { CheckCircle2, Download, FileSpreadsheet, Upload } from "lucide-react";
import { downloadWorkbook } from "@/lib/excel";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { LeadImportSummary } from "./LeadImportSummary";
import { LeadImportDetailTable } from "./LeadImportDetailTable";
import {
  submitSingleLeadRow,
  uploadLeadImportFile,
} from "../_lib/import";

const FILE_INPUT_ACCEPT =
  ".csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv";
const STORAGE_KEY = "sidago.lead-import-result";

function loadStoredResult(): LeadImportResult | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LeadImportResult;
  } catch {
    return null;
  }
}

function saveResult(result: LeadImportResult) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
}

function clearStoredResult() {
  localStorage.removeItem(STORAGE_KEY);
}

const INFO_CARDS = [
  {
    label: "Required Fields",
    value: "firstName, lastName, phone, email, role, companySymbol",
  },
  {
    label: "Optional Fields",
    value: "phoneExtension, companyName, timezone, country",
  },
  {
    label: "Duplicate Rule",
    value: "Emails must be unique in the system and within the uploaded file.",
  },
] as const;

export function BulkLeadImport() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<LeadImportResult | null>(loadStoredResult);
  const [activeTab, setActiveTab] = useState("all");

  const handleUpdateRow = useCallback(
    async (updatedRow: LeadImportRow, sourceTab: string) => {
      if (!result) return;

      try {
        const response = await submitSingleLeadRow(updatedRow);
        setResult((prev) => {
          if (!prev) return prev;
          const next = { ...prev };

          if (sourceTab === "invalid") {
            next.invalidRows = prev.invalidRows.filter(
              (r) => r.rowNumber !== updatedRow.rowNumber,
            );
            next.invalidCount = next.invalidRows.length;
          } else if (sourceTab === "incomplete") {
            next.incompleteRows = prev.incompleteRows.filter(
              (r) => r.rowNumber !== updatedRow.rowNumber,
            );
            next.incompleteCount = next.incompleteRows.length;
          } else if (sourceTab === "companyNotExist") {
            next.companyNotExistRows = prev.companyNotExistRows.filter(
              (r) => r.rowNumber !== updatedRow.rowNumber,
            );
            next.companyNotExistCount = next.companyNotExistRows.length;
          }

          if (response.status === "imported") {
            next.validRows = [...prev.validRows, updatedRow];
            next.validCount = next.validRows.length;
            next.importedCount = next.validRows.length;
            showSuccessToast(`Row ${updatedRow.rowNumber} imported successfully.`);
          } else if (response.status === "duplicate") {
            next.duplicateRows = [
              ...prev.duplicateRows,
              { ...updatedRow, reason: response.reason ?? "Duplicate email." },
            ];
            next.duplicateCount = next.duplicateRows.length;
            showErrorToast(`Row ${updatedRow.rowNumber}: ${response.reason ?? "Duplicate email."}`);
          } else {
            const errors = response.validationErrors ?? [];
            next.invalidRows = [
              ...next.invalidRows,
              {
                ...updatedRow,
                missingFields: [],
                validationErrors: errors,
              },
            ];
            next.invalidCount = next.invalidRows.length;
            showErrorToast(
              `Row ${updatedRow.rowNumber}: ${errors.map((e) => e.error).join(", ") || response.reason || "Invalid row"}`,
            );
          }

          saveResult(next);
          return next;
        });
      } catch (error) {
        showErrorToast(error);
      }
    },
    [result],
  );

  const handleDoneImport = useCallback(() => {
    clearStoredResult();
    setResult(null);
    setSelectedFileName("");
    setActiveTab("all");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleUploadClick = () => {
    if (isProcessing) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target;
    const file = input.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    setResult(null);
    setActiveTab("all");
    setIsProcessing(true);

    try {
      const importResult = await uploadLeadImportFile(file);
      setResult(importResult);
      saveResult(importResult);

      if (importResult.importedCount > 0) {
        showSuccessToast(
          `${importResult.importedCount} lead${importResult.importedCount === 1 ? "" : "s"} imported successfully.`,
        );
      }

      if (importResult.importedCount === 0 && importResult.totalRows > 0) {
        showErrorToast(
          new Error("No leads were imported. Check the results below for details."),
        );
      }
    } catch (error) {
      showErrorToast(error);
    } finally {
      setIsProcessing(false);
      input.value = "";
    }
  };

  const handleTemplateDownload = async () => {
    await downloadWorkbook("sidago-bulk-lead-import-template.xlsx", [
      {
        kind: "object",
        name: "Lead Template",
        columns: [
          "firstName",
          "lastName",
          "fullName",
          "phone",
          "phoneExtension",
          "email",
          "role",
          "companySymbol",
          "companyName",
          "timezone",
          "country",
        ],
        rows: [
          {
            firstName: "Jamie",
            lastName: "Carter",
            fullName: "Jamie Lee Carter",
            phone: "(617) 555-0148",
            phoneExtension: "204",
            email: "jamie.carter@example.com",
            role: "Operations Manager",
            companySymbol: "NASDAQ:EXAMPLE",
            companyName: "Example Corp",
            timezone: "EST",
            country: "United States",
          },
        ],
      },
    ]);
  };

  return (
    <div className="mx-auto flex h-full min-h-0 w-full flex-col px-4 py-6 lg:px-6">
      <Card className="flex min-h-0 flex-1 flex-col rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden p-0">
          <div className="shrink-0 border-b border-slate-200 px-5 py-4 dark:border-slate-700 sm:px-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-2xl">
                <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                  Bulk Lead Import
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Upload a CSV or XLSX file to create multiple leads at once.
                </p>
              </div>
              <button
                type="button"
                onClick={handleTemplateDownload}
                disabled={isProcessing}
                className="cursor-pointer inline-flex h-10 items-center gap-2 rounded border border-slate-200 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <Download size={16} />
                Download Template
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="grid min-w-0 gap-5 px-5 py-5 sm:px-6 sm:py-6">
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-950/40">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">
                    <FileSpreadsheet size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Upload Lead File
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Accepts `.csv` or `.xlsx` files.
                    </p>
                  </div>
                  {selectedFileName && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Selected file: {selectedFileName}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleUploadClick}
                  disabled={isProcessing}
                  className="cursor-pointer inline-flex h-10 items-center gap-2 rounded bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
                >
                  <Upload size={16} />
                  {isProcessing ? "Processing..." : "Choose File"}
                </button>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {INFO_CARDS.map((card) => (
                <div
                  key={card.label}
                  className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"
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

            {result && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-200">
                  <CheckCircle2 size={16} />
                  Processed {result.totalRows} rows — {result.importedCount} imported.
                </div>
                <LeadImportSummary
                  result={result}
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                />
                <LeadImportDetailTable
                  result={result}
                  activeTab={activeTab}
                  onUpdateRow={handleUpdateRow}
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleDoneImport}
                    className="cursor-pointer inline-flex h-10 items-center justify-center rounded bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
            </div>
          </div>
        </CardContent>
      </Card>

      <input
        ref={fileInputRef}
        type="file"
        accept={FILE_INPUT_ACCEPT}
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
