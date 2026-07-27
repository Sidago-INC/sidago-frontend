import { useCallback, useRef, useState, type ChangeEvent } from "react";
import type { CompanyImportRow } from "@/types/company-import.types";
import { Card, CardContent } from "@/components/ui/Card";
import { CheckCircle2, Download, FileSpreadsheet, Upload } from "lucide-react";
import { downloadWorkbook } from "@/lib/excel";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { tokenService } from "@/lib/token";
import { TIMEZONE_OPTIONS } from "@/types/timezone.types";
import { COUNTRY_OPTIONS } from "@/types/country.types";
import type { CompanyImportResult } from "@/types/company-import.types";
import { CompanyImportSummary } from "./CompanyImportSummary";
import { CompanyImportDetailTable } from "./CompanyImportDetailTable";

const FILE_INPUT_ACCEPT =
  ".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const BASE_URL = import.meta.env.VITE_API_URL;
const STORAGE_KEY = "sidago.company-import-result";

function loadStoredResult(): CompanyImportResult | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CompanyImportResult;
  } catch {
    return null;
  }
}

function saveResult(result: CompanyImportResult) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
}

function clearStoredResult() {
  localStorage.removeItem(STORAGE_KEY);
}

const INFO_CARDS = [
  {
    label: "Required Fields",
    value: "symbol, name, timezone, country",
  },
  {
    label: "Optional Fields",
    value:
      "description, estimatedMarketCap, primaryVenue, city, state, website, twitterHandle, zip",
  },
  {
    label: "Validation Rules",
    value:
      "All fields must be filled for import. Symbols must be unique in the file and not already exist in the CRM.",
  },
] as const;

async function uploadFile(file: File): Promise<CompanyImportResult> {
  await tokenService.waitForInit();
  const token = tokenService.getAccessToken();

  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BASE_URL}/imports/companies`, {
    method: "POST",
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: formData,
    credentials: "include",
  });

  const text = await res.text();
  let data: CompanyImportResult | null = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    const errMsg =
      (data as Record<string, unknown>)?.error ??
      (data as Record<string, unknown>)?.message ??
      `Upload failed with status ${res.status}`;
    throw new Error(
      Array.isArray(errMsg) ? errMsg.join("; ") : String(errMsg),
    );
  }

  return data as CompanyImportResult;
}

type SingleImportResponse = {
  ok: boolean;
  status: "imported" | "duplicate" | "invalid";
  validationErrors?: { field: string; error: string }[];
  reason?: string;
};

async function submitSingleRow(row: CompanyImportRow): Promise<SingleImportResponse> {
  await tokenService.waitForInit();
  const token = tokenService.getAccessToken();

  const res = await fetch(`${BASE_URL}/imports/companies/single`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(row),
    credentials: "include",
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error ?? data?.message ?? `Request failed ${res.status}`);
  }
  return data as SingleImportResponse;
}

type ForceImportResponse = {
  ok: boolean;
  status: "imported" | "duplicate" | "failed";
  reason?: string;
};

async function forceImportRow(row: CompanyImportRow): Promise<ForceImportResponse> {
  await tokenService.waitForInit();
  const token = tokenService.getAccessToken();

  const res = await fetch(`${BASE_URL}/imports/companies/force`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(row),
    credentials: "include",
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error ?? data?.message ?? `Request failed ${res.status}`);
  }
  return data as ForceImportResponse;
}

export function BulkCompanyImport() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<CompanyImportResult | null>(loadStoredResult);
  const [activeTab, setActiveTab] = useState("all");

  const handleUpdateRow = useCallback(
    async (updatedRow: CompanyImportRow, sourceTab: string) => {
      if (!result) return;

      try {
        const response = await submitSingleRow(updatedRow);

        setResult((prev) => {
          if (!prev) return prev;
          const next = { ...prev };

          // Remove from source
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
          }

          // Add to destination
          if (response.status === "imported") {
            next.validRows = [...prev.validRows, updatedRow];
            next.validCount = next.validRows.length;
            next.importedCount = next.validRows.length;
            showSuccessToast(
              `Row ${updatedRow.rowNumber} (${updatedRow.symbol}) imported successfully.`,
            );
          } else if (response.status === "duplicate") {
            next.duplicateRows = [
              ...prev.duplicateRows,
              { ...updatedRow, reason: response.reason ?? "Duplicate symbol." },
            ];
            next.duplicateCount = next.duplicateRows.length;
            showErrorToast(
              `Row ${updatedRow.rowNumber}: ${response.reason ?? "Duplicate symbol."}`,
            );
          } else if (response.status === "invalid") {
            const errors = response.validationErrors ?? [];
            next.invalidRows = [
              ...next.invalidRows,
              { ...updatedRow, missingFields: [], validationErrors: errors },
            ];
            next.invalidCount = next.invalidRows.length;
            showErrorToast(
              `Row ${updatedRow.rowNumber}: ${errors.map((e) => e.error).join(", ")}`,
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

  const handleForceImport = useCallback(
    async (row: CompanyImportRow, sourceTab: string) => {
      if (!result) return;

      try {
        const response = await forceImportRow(row);

        setResult((prev) => {
          if (!prev) return prev;
          const next = { ...prev };

          // Remove from source (invalid)
          next.invalidRows = prev.invalidRows.filter(
            (r) => r.rowNumber !== row.rowNumber,
          );
          next.invalidCount = next.invalidRows.length;

          if (response.status === "imported") {
            next.validRows = [...prev.validRows, row];
            next.validCount = next.validRows.length;
            next.importedCount = next.validRows.length;
            showSuccessToast(
              `Row ${row.rowNumber} (${row.symbol}) force-imported successfully.`,
            );
          } else if (response.status === "duplicate") {
            next.duplicateRows = [
              ...prev.duplicateRows,
              { ...row, reason: response.reason ?? "Duplicate symbol." },
            ];
            next.duplicateCount = next.duplicateRows.length;
            showErrorToast(
              `Row ${row.rowNumber}: ${response.reason ?? "Duplicate symbol."}`,
            );
          } else {
            // failed — put back in invalid
            next.invalidRows = [
              ...next.invalidRows,
              { ...row, missingFields: [], validationErrors: [{ field: "general", error: response.reason ?? "Insert failed" }] },
            ];
            next.invalidCount = next.invalidRows.length;
            showErrorToast(`Row ${row.rowNumber}: ${response.reason ?? "Insert failed"}`);
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

  const handleForceImportAll = useCallback(
    async (rowsToImport?: CompanyImportRow[]) => {
      if (!result) return;

      const targets = rowsToImport ?? result.invalidRows;
      if (targets.length === 0) return;

      let imported = 0;
      let duplicates = 0;
      let failed = 0;

      for (const row of [...targets]) {
      try {
        const response = await forceImportRow(row);

        setResult((prev) => {
          if (!prev) return prev;
          const next = { ...prev };

          next.invalidRows = next.invalidRows.filter(
            (r) => r.rowNumber !== row.rowNumber,
          );
          next.invalidCount = next.invalidRows.length;

          if (response.status === "imported") {
            next.validRows = [...next.validRows, row];
            next.validCount = next.validRows.length;
            next.importedCount = next.validRows.length;
          } else if (response.status === "duplicate") {
            next.duplicateRows = [
              ...next.duplicateRows,
              { ...row, reason: response.reason ?? "Duplicate symbol." },
            ];
            next.duplicateCount = next.duplicateRows.length;
          } else {
            next.invalidRows = [
              ...next.invalidRows,
              { ...row, missingFields: [], validationErrors: [{ field: "general", error: response.reason ?? "Insert failed" }] },
            ];
            next.invalidCount = next.invalidRows.length;
          }

          saveResult(next);
          return next;
        });

        if (response.status === "imported") imported++;
        else if (response.status === "duplicate") duplicates++;
        else failed++;
      } catch {
        failed++;
      }
    }

      const parts: string[] = [];
      if (imported > 0) parts.push(`${imported} imported`);
      if (duplicates > 0) parts.push(`${duplicates} duplicate`);
      if (failed > 0) parts.push(`${failed} failed`);

      if (imported > 0) {
        showSuccessToast(`Force import complete: ${parts.join(", ")}`);
      } else {
        showErrorToast(`Force import: ${parts.join(", ")}`);
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

    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      showErrorToast("Please upload an .xlsx file.");
      input.value = "";
      return;
    }

    setIsProcessing(true);

    try {
      const importResult = await uploadFile(file);
      setResult(importResult);
      saveResult(importResult);

      if (importResult.importedCount > 0) {
        showSuccessToast(
          `${importResult.importedCount} compan${importResult.importedCount === 1 ? "y" : "ies"} imported successfully.`,
        );
      }

      if (importResult.importedCount === 0 && importResult.totalRows > 0) {
        showErrorToast(
          new Error("No companies were imported. Check the results below for details."),
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
    await downloadWorkbook("sidago-bulk-company-import-template.xlsx", [
      {
        kind: "object",
        name: "Company Template",
        columns: [
          "symbol",
          "name",
          "timezone",
          "country",
          "description",
          "estimatedMarketCap",
          "primaryVenue",
          "city",
          "state",
          "website",
          "twitterHandle",
          "zip",
        ],
        rows: [
          {
            symbol: "ALP",
            name: "Alpha Ridge Partners",
            timezone: "EST",
            country: "United States",
            description:
              "Workflow intelligence software for distributed finance teams.",
            estimatedMarketCap: "$1.4B",
            primaryVenue: "NASDAQ",
            city: "Chicago",
            state: "IL",
            website: "https://alpharidge.example",
            twitterHandle: "@alpharidge",
            zip: "60601",
          },
        ],
      },
      {
        kind: "matrix",
        name: "Instructions",
        rows: [
          ["Field", "Required", "Notes"],
          ["symbol", "Yes", "Unique company symbol, max 16 chars"],
          ["name", "Yes", "Company name"],
          [
            "timezone",
            "Yes",
            `Use one of: ${TIMEZONE_OPTIONS.map((item) => item.value).join(", ")}`,
          ],
          [
            "country",
            "Yes",
            `Use one of: ${COUNTRY_OPTIONS.map((item) => item.value).join(", ")}`,
          ],
          ["description", "Yes (for import)", "Company description"],
          ["estimatedMarketCap", "Yes (for import)", "Examples: $4.2B, 920M"],
          ["primaryVenue", "Yes (for import)", "Examples: NASDAQ, NYSE, TSX"],
          ["city", "Yes (for import)", "Company city"],
          ["state", "Yes (for import)", "State, province, or region"],
          [
            "website",
            "Yes (for import)",
            "Must start with http:// or https://",
          ],
          ["twitterHandle", "Yes (for import)", "Valid X/Twitter handle"],
          ["zip", "Yes (for import)", "Postal or zip code"],
        ],
      },
    ]);
  };

  const handleErrorReportDownload = async () => {
    if (!result) return;

    const allIssueRows = [
      ...result.invalidRows.map((r) => ({
        ...r,
        category: "Invalid" as const,
        reason: `Missing required: ${r.missingFields.join(", ")}`,
      })),
      ...result.incompleteRows.map((r) => ({
        ...r,
        category: "Incomplete" as const,
        reason: `Missing optional: ${r.missingFields.join(", ")}`,
      })),
      ...result.duplicateRows.map((r) => ({
        ...r,
        category: "Duplicate/Existing" as const,
        reason: r.reason,
      })),
    ];

    if (allIssueRows.length === 0) return;

    await downloadWorkbook("sidago-bulk-company-import-report.xlsx", [
      {
        kind: "object",
        name: "Import Issues",
        columns: [
          "rowNumber",
          "category",
          "symbol",
          "name",
          "timezone",
          "country",
          "description",
          "estimatedMarketCap",
          "primaryVenue",
          "city",
          "state",
          "website",
          "twitterHandle",
          "zip",
          "reason",
        ],
        rows: allIssueRows,
      },
    ]);
  };

  const hasIssues =
    result &&
    (result.invalidCount > 0 ||
      result.incompleteCount > 0 ||
      result.duplicateCount > 0);

  return (
    <div className="mx-auto flex min-h-full w-full flex-col gap-5 px-4 py-6 lg:px-6">
      <Card className="flex-1 rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <CardContent className="min-w-0 p-0">
          {/* Header */}
          <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-700 sm:px-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-2xl">
                <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                  Bulk Company Import
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Upload a single XLSX file to create multiple companies at
                  once. All fields must be filled for a company to be imported.
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

          <div className="grid min-w-0 gap-5 px-5 py-5 sm:px-6 sm:py-6">
            {/* Upload area */}
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-950/40">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">
                    <FileSpreadsheet size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Upload Company Workbook
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Accepts `.xlsx` files only. All 12 columns are required
                      for a complete import.
                    </p>
                  </div>
                  {selectedFileName && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Selected file: {selectedFileName}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleUploadClick}
                    disabled={isProcessing}
                    className="cursor-pointer inline-flex h-10 items-center gap-2 rounded bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
                  >
                    <Upload size={16} />
                    {isProcessing ? "Processing..." : "Choose XLSX File"}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={FILE_INPUT_ACCEPT}
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            {/* Info cards */}
            <div className="grid gap-4 md:grid-cols-3">
              {INFO_CARDS.map((card) => (
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

            {/* Results */}
            {result && (
              <>
                <CompanyImportSummary
                  result={result}
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                />

                <div className="flex flex-wrap items-center justify-between gap-2">
                  {hasIssues ? (
                    <button
                      type="button"
                      onClick={handleErrorReportDownload}
                      className="cursor-pointer inline-flex h-9 items-center gap-2 rounded border border-slate-200 px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <Download size={14} />
                      Download Full Report
                    </button>
                  ) : <div />}
                  <button
                    type="button"
                    onClick={handleDoneImport}
                    className="cursor-pointer inline-flex h-9 items-center gap-2 rounded bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    <CheckCircle2 size={14} />
                    Done Import
                  </button>
                </div>

                <CompanyImportDetailTable
                  result={result}
                  activeTab={activeTab}
                  onUpdateRow={handleUpdateRow}
                  onForceImport={handleForceImport}
                  onForceImportAll={handleForceImportAll}
                />
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
