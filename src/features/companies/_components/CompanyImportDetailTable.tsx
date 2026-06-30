import { useEffect, useState } from "react";
import type {
  CompanyImportResult,
  InvalidCompanyRow,
  IncompleteCompanyRow,
  DuplicateCompanyRow,
  CompanyImportRow,
} from "@/types/company-import.types";
import { isCompanyImportRowValid } from "@/lib/validation/company-import";
import { ChevronDown, ChevronUp, Loader2, Save, Zap } from "lucide-react";

type CompanyImportDetailTableProps = {
  result: CompanyImportResult;
  activeTab: string;
  onUpdateRow?: (
    row: CompanyImportRow,
    sourceTab: string,
  ) => Promise<void>;
  onForceImport?: (
    row: CompanyImportRow,
    sourceTab: string,
  ) => Promise<void>;
  onForceImportAll?: (rows: CompanyImportRow[]) => Promise<void>;
};

const FIELDS: { key: keyof CompanyImportRow; label: string }[] = [
  { key: "rowNumber", label: "Row" },
  { key: "symbol", label: "Symbol" },
  { key: "name", label: "Name" },
  { key: "timezone", label: "Timezone" },
  { key: "country", label: "Country" },
  { key: "description", label: "Description" },
  { key: "estimatedMarketCap", label: "Market Cap" },
  { key: "primaryVenue", label: "Venue" },
  { key: "city", label: "City" },
  { key: "state", label: "State" },
  { key: "website", label: "Website" },
  { key: "twitterHandle", label: "Twitter" },
  { key: "zip", label: "Zip" },
];

const EDITABLE_FIELDS = FIELDS.filter((f) => f.key !== "rowNumber");

function ExpandableRow({
  row,
  draft,
  onDraftChange,
  showReason,
  reason,
  editable,
  onUpdate,
  onForce,
  showForce,
  tab,
}: {
  row: CompanyImportRow;
  draft: CompanyImportRow;
  onDraftChange: (row: CompanyImportRow) => void;
  showReason: boolean;
  reason: string;
  editable: boolean;
  onUpdate?: (row: CompanyImportRow, sourceTab: string) => Promise<void>;
  onForce?: (row: CompanyImportRow, sourceTab: string) => Promise<void>;
  showForce: boolean;
  tab: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [forcing, setForcing] = useState(false);
  const canForceImport = isCompanyImportRowValid(draft);

  const handleFieldChange = (key: keyof CompanyImportRow, value: string) => {
    onDraftChange({ ...draft, [key]: value });
  };

  const handleUpdate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onUpdate || saving || forcing) return;
    setSaving(true);
    try {
      await onUpdate(draft, tab);
    } finally {
      setSaving(false);
    }
  };

  const handleForce = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onForce || saving || forcing) return;
    setForcing(true);
    try {
      await onForce(draft, tab);
    } finally {
      setForcing(false);
    }
  };

  return (
    <>
      <tr
        className="cursor-pointer border-b border-slate-100 align-top last:border-0 hover:bg-white/50 dark:border-slate-800 dark:hover:bg-slate-900/30"
        onClick={() => setExpanded(!expanded)}
      >
        {FIELDS.map(({ key }) => (
          <td key={key} className="whitespace-nowrap px-3 py-2">
            {key === "symbol" ? (
              <span className="font-medium text-slate-900 dark:text-slate-100">
                {row[key] || "-"}
              </span>
            ) : key === "description" || key === "website" ? (
              <span className="block max-w-[200px] truncate text-slate-700 dark:text-slate-300">
                {String(row[key]) || "-"}
              </span>
            ) : (
              <span className="text-slate-700 dark:text-slate-300">
                {String(row[key]) || "-"}
              </span>
            )}
          </td>
        ))}
        {showReason && (
          <td className="whitespace-nowrap px-3 py-2">
            <span className="inline-block max-w-[250px] truncate rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              {reason}
            </span>
          </td>
        )}
        <td className="px-3 py-2">
          {expanded ? (
            <ChevronUp size={14} className="text-slate-400" />
          ) : (
            <ChevronDown size={14} className="text-slate-400" />
          )}
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-slate-100 dark:border-slate-800">
          <td colSpan={FIELDS.length + (showReason ? 2 : 1)} className="px-3 py-3">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {FIELDS.map(({ key, label }) => (
                <div key={key} className="rounded-md bg-white/60 p-2 dark:bg-slate-900/40">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {label}
                  </p>
                  {editable && key !== "rowNumber" ? (
                    <input
                      type="text"
                      value={String(draft[key])}
                      onChange={(e) => handleFieldChange(key, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-0.5 w-full rounded border border-slate-300 bg-white px-2 py-1 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                    />
                  ) : (
                    <p className="mt-0.5 break-all text-sm text-slate-800 dark:text-slate-200">
                      {String(row[key]) || "-"}
                    </p>
                  )}
                </div>
              ))}
              {showReason && (
                <div className="rounded-md bg-white/60 p-2 sm:col-span-2 lg:col-span-3 dark:bg-slate-900/40">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Reason
                  </p>
                  <p className="mt-0.5 break-all text-sm text-slate-800 dark:text-slate-200">
                    {reason}
                  </p>
                </div>
              )}
            </div>
            {editable && (
              <div className="mt-3 flex justify-end gap-2">
                {showForce && onForce && (
                  <button
                    type="button"
                    onClick={handleForce}
                    disabled={!canForceImport || saving || forcing}
                    className="cursor-pointer inline-flex h-9 items-center gap-2 rounded bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {forcing ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Zap size={14} />
                    )}
                    {forcing ? "Forcing..." : "Force Import"}
                  </button>
                )}
                {onUpdate && (
                  <button
                    type="button"
                    onClick={handleUpdate}
                    disabled={saving || forcing}
                    className="cursor-pointer inline-flex h-9 items-center gap-2 rounded bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {saving ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Save size={14} />
                    )}
                    {saving ? "Updating..." : "Update & Import"}
                  </button>
                )}
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

const tabConfig: Record<
  string,
  {
    title: string;
    description: string;
    borderColor: string;
    bgColor: string;
    titleColor: string;
    descColor: string;
    reasonHeader: string;
  }
> = {
  invalid: {
    title: "Invalid Companies",
    description:
      "These rows are missing required fields or have validation errors. Edit and click Update to fix.",
    borderColor: "border-red-200 dark:border-red-900/50",
    bgColor: "bg-red-50 dark:bg-red-950/20",
    titleColor: "text-red-900 dark:text-red-200",
    descColor: "text-red-800/80 dark:text-red-300/80",
    reasonHeader: "Errors",
  },
  incomplete: {
    title: "Incomplete Companies",
    description:
      "These rows have all required fields but are missing optional fields. Edit and click Update to complete.",
    borderColor: "border-amber-200 dark:border-amber-900/50",
    bgColor: "bg-amber-50 dark:bg-amber-950/20",
    titleColor: "text-amber-900 dark:text-amber-200",
    descColor: "text-amber-800/80 dark:text-amber-300/80",
    reasonHeader: "Missing Optional Fields",
  },
  duplicate: {
    title: "Duplicate / Existing Companies",
    description:
      "These rows have complete data but their symbol already exists in the CRM database or is duplicated in the file.",
    borderColor: "border-sky-200 dark:border-sky-900/50",
    bgColor: "bg-sky-50 dark:bg-sky-950/20",
    titleColor: "text-sky-900 dark:text-sky-200",
    descColor: "text-sky-800/80 dark:text-sky-300/80",
    reasonHeader: "Reason",
  },
  valid: {
    title: "Successfully Imported Companies",
    description:
      "These companies passed all validation and were inserted into the CRM database.",
    borderColor: "border-emerald-200 dark:border-emerald-900/50",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/20",
    titleColor: "text-emerald-900 dark:text-emerald-200",
    descColor: "text-emerald-800/80 dark:text-emerald-300/80",
    reasonHeader: "",
  },
};

function getReasonForRow(tab: string, row: CompanyImportRow): string {
  if (tab === "invalid") {
    const invalid = row as InvalidCompanyRow;
    const parts: string[] = [];
    if (invalid.missingFields.length > 0) {
      parts.push(`Missing: ${invalid.missingFields.join(", ")}`);
    }
    if (invalid.validationErrors?.length > 0) {
      parts.push(
        ...invalid.validationErrors.map((e) => `${e.field}: ${e.error}`),
      );
    }
    return parts.join(" | ");
  }
  if (tab === "incomplete") {
    return `Missing: ${(row as IncompleteCompanyRow).missingFields.join(", ")}`;
  }
  if (tab === "duplicate") {
    return (row as DuplicateCompanyRow).reason;
  }
  return "";
}

function getRowsForTab(
  result: CompanyImportResult,
  tab: string,
): CompanyImportRow[] {
  switch (tab) {
    case "invalid":
      return result.invalidRows;
    case "incomplete":
      return result.incompleteRows;
    case "duplicate":
      return result.duplicateRows;
    case "valid":
      return result.validRows;
    default:
      return [];
  }
}

export function CompanyImportDetailTable({
  result,
  activeTab,
  onUpdateRow,
  onForceImport,
  onForceImportAll,
}: CompanyImportDetailTableProps) {
  const [forcingAll, setForcingAll] = useState(false);
  const [rowDrafts, setRowDrafts] = useState<Record<number, CompanyImportRow>>(
    {},
  );

  const config = activeTab !== "all" ? tabConfig[activeTab] : null;
  const rows = config ? getRowsForTab(result, activeTab) : [];

  useEffect(() => {
    if (rows.length === 0) {
      setRowDrafts({});
      return;
    }

    setRowDrafts(
      Object.fromEntries(rows.map((row) => [row.rowNumber, { ...row }])),
    );
  }, [rows]);

  if (activeTab === "all" || !config) {
    return null;
  }

  const showReason = activeTab !== "valid";
  const editable = activeTab === "invalid" || activeTab === "incomplete";
  const showForce = activeTab === "invalid";

  const getDraft = (row: CompanyImportRow) => rowDrafts[row.rowNumber] ?? row;
  const allRowsValid =
    rows.length > 0 &&
    rows.every((row) => isCompanyImportRowValid(getDraft(row)));

  if (rows.length === 0) {
    return (
      <div
        className={`rounded-xl border p-5 ${config.borderColor} ${config.bgColor}`}
      >
        <h2 className={`text-lg font-semibold ${config.titleColor}`}>
          {config.title}
        </h2>
        <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
          No rows in this category.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`min-w-0 overflow-x-auto rounded-xl border ${config.borderColor} ${config.bgColor}`}
    >
      <div className="p-5 pb-0">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className={`text-lg font-semibold ${config.titleColor}`}>
              {config.title}{" "}
              <span className="text-sm font-normal">({rows.length})</span>
            </h2>
            <p className={`mt-1 text-sm ${config.descColor}`}>
              {config.description}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Click any row to expand.{editable ? " Edit fields and click Update & Import." : ""}
            </p>
          </div>
          {showForce && onForceImportAll && rows.length > 0 && (
            <button
              type="button"
              disabled={!allRowsValid || forcingAll}
              onClick={async () => {
                setForcingAll(true);
                try {
                  await onForceImportAll(rows.map((row) => getDraft(row)));
                } finally {
                  setForcingAll(false);
                }
              }}
              className="cursor-pointer inline-flex h-9 shrink-0 items-center gap-2 rounded bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {forcingAll ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Zap size={14} />
              )}
              {forcingAll ? "Importing..." : "Force Import All"}
            </button>
          )}
        </div>
      </div>
      <div className="mt-4 px-5 pb-5">
        <table className="w-max min-w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700">
              {FIELDS.map(({ key, label }) => (
                <th
                  key={key}
                  className="whitespace-nowrap px-3 py-2 font-semibold text-slate-700 dark:text-slate-300"
                >
                  {label}
                </th>
              ))}
              {showReason && (
                <th className="whitespace-nowrap px-3 py-2 font-semibold text-slate-700 dark:text-slate-300">
                  {config.reasonHeader}
                </th>
              )}
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <ExpandableRow
                key={row.rowNumber}
                row={row}
                draft={getDraft(row)}
                onDraftChange={(updatedRow) =>
                  setRowDrafts((current) => ({
                    ...current,
                    [row.rowNumber]: updatedRow,
                  }))
                }
                showReason={showReason}
                reason={getReasonForRow(activeTab, row)}
                editable={editable}
                onUpdate={onUpdateRow}
                onForce={onForceImport}
                showForce={showForce}
                tab={activeTab}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
