import { useCallback, useRef, useState, type ChangeEvent } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { CheckCircle2, Download, FileSpreadsheet, Upload } from "lucide-react";
import { downloadWorkbook } from "@/lib/excel";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { tokenService } from "@/lib/token";
import type { LeadImportResult, LeadImportRow } from "@/types/lead-import.types";
import { LeadImportSummary } from "./LeadImportSummary";
import { LeadImportDetailTable } from "./LeadImportDetailTable";

const FILE_INPUT_ACCEPT =
  ".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const BASE_URL = import.meta.env.VITE_API_URL;
const STORAGE_KEY = "sidago.lead-import-result";

function loadStoredResult(): LeadImportResult | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LeadImportResult;
  } catch { return null; }
}
function saveResult(r: LeadImportResult) { localStorage.setItem(STORAGE_KEY, JSON.stringify(r)); }
function clearStoredResult() { localStorage.removeItem(STORAGE_KEY); }

const INFO_CARDS = [
  { label: "Compulsory Fields", value: "firstName, lastName, phone, email, role" },
  { label: "Optional Field", value: "phoneExtension (can be empty)" },
  { label: "Company Fields", value: "companyName and companySymbol are required. Timezone & country are optional (auto-filled from company if empty)." },
] as const;

async function uploadFile(file: File): Promise<LeadImportResult> {
  await tokenService.waitForInit();
  const token = tokenService.getAccessToken();
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${BASE_URL}/imports/leads`, {
    method: "POST",
    headers: { ...(token && { Authorization: `Bearer ${token}` }) },
    body: formData,
    credentials: "include",
  });
  const text = await res.text();
  let data: LeadImportResult | null = null;
  if (text) { try { data = JSON.parse(text); } catch { data = null; } }
  if (!res.ok) {
    const errMsg = (data as Record<string, unknown>)?.error ?? (data as Record<string, unknown>)?.message ?? `Upload failed ${res.status}`;
    throw new Error(Array.isArray(errMsg) ? errMsg.join("; ") : String(errMsg));
  }
  return data as LeadImportResult;
}

type SingleResponse = { ok: boolean; status: string; validationErrors?: { field: string; error: string }[]; reason?: string };

async function submitSingleRow(row: LeadImportRow): Promise<SingleResponse> {
  await tokenService.waitForInit();
  const token = tokenService.getAccessToken();
  const res = await fetch(`${BASE_URL}/imports/leads/single`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token && { Authorization: `Bearer ${token}` }) },
    body: JSON.stringify(row),
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? data?.message ?? `Request failed ${res.status}`);
  return data as SingleResponse;
}

async function forceImportRow(row: LeadImportRow): Promise<SingleResponse> {
  await tokenService.waitForInit();
  const token = tokenService.getAccessToken();
  const res = await fetch(`${BASE_URL}/imports/leads/force`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token && { Authorization: `Bearer ${token}` }) },
    body: JSON.stringify(row),
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? data?.message ?? `Request failed ${res.status}`);
  return data as SingleResponse;
}

function removeFromSource(prev: LeadImportResult, rowNumber: number, sourceTab: string): LeadImportResult {
  const next = { ...prev };
  if (sourceTab === "invalid") {
    next.invalidRows = prev.invalidRows.filter((r) => r.rowNumber !== rowNumber);
    next.invalidCount = next.invalidRows.length;
  } else if (sourceTab === "incomplete") {
    next.incompleteRows = prev.incompleteRows.filter((r) => r.rowNumber !== rowNumber);
    next.incompleteCount = next.incompleteRows.length;
  } else if (sourceTab === "companyNotExist") {
    next.companyNotExistRows = prev.companyNotExistRows.filter((r) => r.rowNumber !== rowNumber);
    next.companyNotExistCount = next.companyNotExistRows.length;
  }
  return next;
}

export function BulkLeadImport() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<LeadImportResult | null>(loadStoredResult);
  const [activeTab, setActiveTab] = useState("all");

  const handleUpdateRow = useCallback(async (updatedRow: LeadImportRow, sourceTab: string) => {
    if (!result) return;
    try {
      const response = await submitSingleRow(updatedRow);
      setResult((prev) => {
        if (!prev) return prev;
        let next = removeFromSource(prev, updatedRow.rowNumber, sourceTab);
        if (response.status === "imported") {
          next.validRows = [...next.validRows, updatedRow];
          next.validCount = next.validRows.length;
          next.importedCount = next.validRows.length;
          showSuccessToast(`Row ${updatedRow.rowNumber} imported.`);
        } else if (response.status === "duplicate") {
          next.duplicateRows = [...next.duplicateRows, { ...updatedRow, reason: response.reason ?? "Duplicate." }];
          next.duplicateCount = next.duplicateRows.length;
          showErrorToast(`Row ${updatedRow.rowNumber}: ${response.reason}`);
        } else if (response.status === "company_not_exist") {
          next.companyNotExistRows = [...next.companyNotExistRows, { ...updatedRow, reason: response.reason ?? "Company not found." }];
          next.companyNotExistCount = next.companyNotExistRows.length;
          showErrorToast(`Row ${updatedRow.rowNumber}: ${response.reason}`);
        } else {
          next.invalidRows = [...next.invalidRows, { ...updatedRow, missingFields: [], validationErrors: response.validationErrors ?? [] }];
          next.invalidCount = next.invalidRows.length;
          showErrorToast(`Row ${updatedRow.rowNumber}: ${(response.validationErrors ?? []).map((e) => e.error).join(", ")}`);
        }
        saveResult(next);
        return next;
      });
    } catch (error) { showErrorToast(error); }
  }, [result]);

  const handleForceImport = useCallback(async (row: LeadImportRow, sourceTab: string) => {
    if (!result) return;
    try {
      const response = await forceImportRow(row);
      setResult((prev) => {
        if (!prev) return prev;
        let next = removeFromSource(prev, row.rowNumber, sourceTab);
        if (response.status === "imported") {
          next.validRows = [...next.validRows, row];
          next.validCount = next.validRows.length;
          next.importedCount = next.validRows.length;
          showSuccessToast(`Row ${row.rowNumber} force-imported.`);
        } else if (response.status === "duplicate") {
          next.duplicateRows = [...next.duplicateRows, { ...row, reason: response.reason ?? "Duplicate." }];
          next.duplicateCount = next.duplicateRows.length;
          showErrorToast(`Row ${row.rowNumber}: ${response.reason}`);
        } else if (response.status === "company_not_exist") {
          next.companyNotExistRows = [...next.companyNotExistRows, { ...row, reason: response.reason ?? "Company not found." }];
          next.companyNotExistCount = next.companyNotExistRows.length;
          showErrorToast(`Row ${row.rowNumber}: ${response.reason}`);
        } else {
          next.invalidRows = [...next.invalidRows, { ...row, missingFields: [], validationErrors: [{ field: "general", error: response.reason ?? "Failed" }] }];
          next.invalidCount = next.invalidRows.length;
          showErrorToast(`Row ${row.rowNumber}: ${response.reason}`);
        }
        saveResult(next);
        return next;
      });
    } catch (error) { showErrorToast(error); }
  }, [result]);

  const handleForceImportAll = useCallback(async () => {
    if (!result || result.invalidRows.length === 0) return;
    let imported = 0, duplicates = 0, failed = 0;
    for (const row of [...result.invalidRows]) {
      try {
        const response = await forceImportRow(row);
        setResult((prev) => {
          if (!prev) return prev;
          let next = removeFromSource(prev, row.rowNumber, "invalid");
          if (response.status === "imported") { next.validRows = [...next.validRows, row]; next.validCount = next.validRows.length; next.importedCount = next.validRows.length; }
          else if (response.status === "duplicate") { next.duplicateRows = [...next.duplicateRows, { ...row, reason: response.reason ?? "Duplicate." }]; next.duplicateCount = next.duplicateRows.length; }
          else if (response.status === "company_not_exist") { next.companyNotExistRows = [...next.companyNotExistRows, { ...row, reason: response.reason ?? "Company not found." }]; next.companyNotExistCount = next.companyNotExistRows.length; }
          else { next.invalidRows = [...next.invalidRows, { ...row, missingFields: [], validationErrors: [{ field: "general", error: response.reason ?? "Failed" }] }]; next.invalidCount = next.invalidRows.length; }
          saveResult(next);
          return next;
        });
        if (response.status === "imported") imported++; else if (response.status === "duplicate") duplicates++; else failed++;
      } catch { failed++; }
    }
    const parts: string[] = [];
    if (imported > 0) parts.push(`${imported} imported`);
    if (duplicates > 0) parts.push(`${duplicates} duplicate`);
    if (failed > 0) parts.push(`${failed} failed`);
    if (imported > 0) showSuccessToast(`Force import: ${parts.join(", ")}`);
    else showErrorToast(`Force import: ${parts.join(", ")}`);
  }, [result]);

  const handleDoneImport = useCallback(() => {
    clearStoredResult();
    setResult(null);
    setSelectedFileName("");
    setActiveTab("all");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleUploadClick = () => { if (!isProcessing) fileInputRef.current?.click(); };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target;
    const file = input.files?.[0];
    if (!file) return;
    setSelectedFileName(file.name);
    setResult(null);
    setActiveTab("all");
    if (!file.name.toLowerCase().endsWith(".xlsx")) { showErrorToast("Please upload an .xlsx file."); input.value = ""; return; }
    setIsProcessing(true);
    try {
      const importResult = await uploadFile(file);
      setResult(importResult);
      saveResult(importResult);
      if (importResult.importedCount > 0) showSuccessToast(`${importResult.importedCount} lead${importResult.importedCount === 1 ? "" : "s"} imported.`);
      if (importResult.importedCount === 0 && importResult.totalRows > 0) showErrorToast(new Error("No leads imported. Check results below."));
    } catch (error) { showErrorToast(error); }
    finally { setIsProcessing(false); input.value = ""; }
  };

  const handleTemplateDownload = async () => {
    await downloadWorkbook("sidago-bulk-lead-import-template.xlsx", [
      {
        kind: "object",
        name: "Lead Template",
        columns: ["firstName", "lastName", "phone", "phoneExtension", "email", "role", "companySymbol", "companyName", "timezone", "country"],
        rows: [{
          firstName: "Jamie",
          lastName: "Carter",
          phone: "(617) 555-0148",
          phoneExtension: "204",
          email: "jamie.carter@example.com",
          role: "Operations Manager",
          companySymbol: "ALP",
          companyName: "Alpha Ridge Partners",
          timezone: "",
          country: "",
        }],
      },
      {
        kind: "matrix",
        name: "Instructions",
        rows: [
          ["Field", "Required", "Notes"],
          ["firstName", "Yes", "Lead first name"],
          ["lastName", "Yes", "Lead last name"],
          ["phone", "Yes", "Primary phone number"],
          ["phoneExtension", "No", "Phone extension"],
          ["email", "Yes", "Must be valid email"],
          ["role", "Yes", "Job title or role"],
          ["companySymbol", "Yes", "Must match existing company in CRM"],
          ["companyName", "Yes", "Must match existing company in CRM"],
          ["timezone", "No", "Optional. Auto-filled from matched company if empty."],
          ["country", "No", "Optional. Auto-filled from matched company if empty."],
        ],
      },
    ]);
  };

  const handleErrorReportDownload = async () => {
    if (!result) return;
    const allIssueRows = [
      ...result.invalidRows.map((r) => ({ ...r, category: "Invalid" as const, reason: r.validationErrors.map((e) => e.error).join(", ") || `Missing: ${r.missingFields.join(", ")}` })),
      ...result.incompleteRows.map((r) => ({ ...r, category: "Incomplete" as const, reason: `Missing: ${r.missingFields.join(", ")}` })),
      ...result.companyNotExistRows.map((r) => ({ ...r, category: "Company Not Exist" as const, reason: r.reason })),
      ...result.duplicateRows.map((r) => ({ ...r, category: "Duplicate" as const, reason: r.reason })),
    ];
    if (allIssueRows.length === 0) return;
    await downloadWorkbook("sidago-bulk-lead-import-report.xlsx", [{
      kind: "object",
      name: "Import Issues",
      columns: ["rowNumber", "category", "firstName", "lastName", "phone", "email", "role", "companySymbol", "companyName", "reason"],
      rows: allIssueRows,
    }]);
  };

  const hasIssues = result && (result.invalidCount > 0 || result.incompleteCount > 0 || result.companyNotExistCount > 0 || result.duplicateCount > 0);

  return (
    <div className="mx-auto flex min-h-full w-full flex-col gap-5 px-4 py-6 lg:px-6">
      <Card className="flex-1 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <CardContent className="p-0">
          <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-700 sm:px-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-2xl">
                <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Bulk Lead Import</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">Upload an XLSX file to create multiple leads. Each lead must be linked to an existing company.</p>
              </div>
              <button type="button" onClick={handleTemplateDownload} disabled={isProcessing} className="cursor-pointer inline-flex h-10 items-center gap-2 rounded border border-slate-200 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                <Download size={16} /> Download Template
              </button>
            </div>
          </div>

          <div className="grid gap-5 px-5 py-5 sm:px-6 sm:py-6">
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-950/40">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"><FileSpreadsheet size={18} /></div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Upload Lead Workbook</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Accepts `.xlsx` files only.</p>
                  </div>
                  {selectedFileName && <p className="text-xs text-slate-500 dark:text-slate-400">Selected: {selectedFileName}</p>}
                </div>
                <button type="button" onClick={handleUploadClick} disabled={isProcessing} className="cursor-pointer inline-flex h-10 items-center gap-2 rounded bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300">
                  <Upload size={16} /> {isProcessing ? "Processing..." : "Choose XLSX File"}
                </button>
                <input ref={fileInputRef} type="file" accept={FILE_INPUT_ACCEPT} onChange={handleFileChange} className="hidden" />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {INFO_CARDS.map((card) => (
                <div key={card.label} className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/40">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{card.label}</p>
                  <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">{card.value}</p>
                </div>
              ))}
            </div>

            {result && (
              <>
                <LeadImportSummary result={result} activeTab={activeTab} onTabChange={setActiveTab} />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  {hasIssues ? (
                    <button type="button" onClick={handleErrorReportDownload} className="cursor-pointer inline-flex h-9 items-center gap-2 rounded border border-slate-200 px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                      <Download size={14} /> Download Full Report
                    </button>
                  ) : <div />}
                  <button type="button" onClick={handleDoneImport} className="cursor-pointer inline-flex h-9 items-center gap-2 rounded bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700">
                    <CheckCircle2 size={14} /> Done Import
                  </button>
                </div>
                <LeadImportDetailTable
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
