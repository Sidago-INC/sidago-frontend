import type { CompanyImportResult } from "@/types/company-import.types";
import {
  AlertTriangle,
  CheckCircle,
  Copy,
  FileWarning,
  XCircle,
} from "lucide-react";

type SummaryCardProps = {
  label: string;
  count: number;
  color: "red" | "amber" | "sky" | "emerald" | "slate";
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
};

const colorMap = {
  red: {
    border: "border-red-200 dark:border-red-900/50",
    bg: "bg-red-50 dark:bg-red-950/20",
    activeBg: "bg-red-100 dark:bg-red-950/40 ring-2 ring-red-400",
    text: "text-red-900 dark:text-red-200",
    count: "text-red-950 dark:text-red-100",
    label: "text-red-800/70 dark:text-red-300/70",
  },
  amber: {
    border: "border-amber-200 dark:border-amber-900/50",
    bg: "bg-amber-50 dark:bg-amber-950/20",
    activeBg: "bg-amber-100 dark:bg-amber-950/40 ring-2 ring-amber-400",
    text: "text-amber-900 dark:text-amber-200",
    count: "text-amber-950 dark:text-amber-100",
    label: "text-amber-800/70 dark:text-amber-300/70",
  },
  sky: {
    border: "border-sky-200 dark:border-sky-900/50",
    bg: "bg-sky-50 dark:bg-sky-950/20",
    activeBg: "bg-sky-100 dark:bg-sky-950/40 ring-2 ring-sky-400",
    text: "text-sky-900 dark:text-sky-200",
    count: "text-sky-950 dark:text-sky-100",
    label: "text-sky-800/70 dark:text-sky-300/70",
  },
  emerald: {
    border: "border-emerald-200 dark:border-emerald-900/50",
    bg: "bg-emerald-50 dark:bg-emerald-950/20",
    activeBg: "bg-emerald-100 dark:bg-emerald-950/40 ring-2 ring-emerald-400",
    text: "text-emerald-900 dark:text-emerald-200",
    count: "text-emerald-950 dark:text-emerald-100",
    label: "text-emerald-800/70 dark:text-emerald-300/70",
  },
  slate: {
    border: "border-slate-200 dark:border-slate-700",
    bg: "bg-slate-50 dark:bg-slate-950/40",
    activeBg: "bg-slate-100 dark:bg-slate-900 ring-2 ring-slate-400",
    text: "text-slate-900 dark:text-slate-200",
    count: "text-slate-950 dark:text-slate-100",
    label: "text-slate-500 dark:text-slate-400",
  },
};

function SummaryCard({
  label,
  count,
  color,
  icon,
  active,
  onClick,
}: SummaryCardProps) {
  const c = colorMap[color];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-w-[180px] shrink-0 cursor-pointer rounded-lg border p-4 text-left transition ${c.border} ${active ? c.activeBg : c.bg}`}
    >
      <div className="flex items-center gap-2">
        {icon}
        <p className={`text-xs font-semibold uppercase tracking-wide ${c.label}`}>
          {label}
        </p>
      </div>
      <p className={`mt-2 text-2xl font-semibold ${c.count}`}>{count}</p>
    </button>
  );
}

type CompanyImportSummaryProps = {
  result: CompanyImportResult;
  activeTab: string;
  onTabChange: (tab: string) => void;
};

export function CompanyImportSummary({
  result,
  activeTab,
  onTabChange,
}: CompanyImportSummaryProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Import Results
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {result.totalRows} total rows uploaded &middot;{" "}
            {result.importedCount} successfully imported
          </p>
        </div>
      </div>

      <div className="min-w-0 overflow-x-auto pb-2">
        <div className="flex w-max gap-3">
        <SummaryCard
          label="Total Rows"
          count={result.totalRows}
          color="slate"
          icon={<Copy size={14} className="text-slate-500" />}
          active={activeTab === "all"}
          onClick={() => onTabChange("all")}
        />
        <SummaryCard
          label="Invalid"
          count={result.invalidCount}
          color="red"
          icon={<XCircle size={14} className="text-red-500" />}
          active={activeTab === "invalid"}
          onClick={() => onTabChange("invalid")}
        />
        <SummaryCard
          label="Incomplete"
          count={result.incompleteCount}
          color="amber"
          icon={<FileWarning size={14} className="text-amber-500" />}
          active={activeTab === "incomplete"}
          onClick={() => onTabChange("incomplete")}
        />
        <SummaryCard
          label="Duplicate / Existing"
          count={result.duplicateCount}
          color="sky"
          icon={<AlertTriangle size={14} className="text-sky-500" />}
          active={activeTab === "duplicate"}
          onClick={() => onTabChange("duplicate")}
        />
        <SummaryCard
          label="Imported"
          count={result.importedCount}
          color="emerald"
          icon={<CheckCircle size={14} className="text-emerald-500" />}
          active={activeTab === "valid"}
          onClick={() => onTabChange("valid")}
        />
        </div>
      </div>
    </div>
  );
}
