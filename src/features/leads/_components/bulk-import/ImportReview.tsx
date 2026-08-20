import { useMemo, useState } from "react";
import { AlertTriangle, Building2, Copy, Info, ShieldCheck, Users } from "lucide-react";
import type {
  ImportPlan,
  PatchPlanCompany,
  PatchPlanLead,
  PlanLead,
} from "@/types/bulk-import.types";
import { ImportCompanyTable } from "./ImportCompanyTable";
import { ImportLeadTable } from "./ImportLeadTable";

type LeadFilter = "all" | "valid" | "invalid" | "duplicate" | "excluded";

type Props = {
  plan: ImportPlan;
  savingRowId: string | null;
  isCommitting: boolean;
  onSaveLead: (rowId: string, patch: PatchPlanLead) => Promise<void>;
  onSaveCompany: (rowId: string, patch: PatchPlanCompany) => Promise<void>;
  onCommit: () => void;
  onCancel: () => void;
};

function Stat({
  label,
  value,
  icon,
  tone = "slate",
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone?: "slate" | "emerald" | "amber" | "red";
}) {
  const tones = {
    slate:
      "border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100",
    emerald:
      "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-100",
    amber:
      "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-100",
    red: "border-red-200 bg-red-50 text-red-900 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-100",
  } as const;

  return (
    <div className={`rounded-lg border px-3 py-2.5 ${tones[tone]}`}>
      <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide opacity-70">
        {icon}
        {label}
      </div>
      <p className="mt-1 text-xl font-semibold tabular-nums">{value.toLocaleString()}</p>
    </div>
  );
}

export function ImportReview({
  plan,
  savingRowId,
  isCommitting,
  onSaveLead,
  onSaveCompany,
  onCommit,
  onCancel,
}: Props) {
  const [tab, setTab] = useState<"companies" | "leads">("companies");
  // Land the operator on the problems when there are any — that is the whole
  // reason this screen exists.
  const [leadFilter, setLeadFilter] = useState<LeadFilter>(
    plan.totals.leadsInvalid > 0 ? "invalid" : "all",
  );

  const { totals } = plan;

  const visibleLeads = useMemo<PlanLead[]>(() => {
    switch (leadFilter) {
      case "valid":
        return plan.leads.filter((l) => l.status === "valid" && !l.excluded);
      case "invalid":
        return plan.leads.filter((l) => l.status === "invalid" && !l.excluded);
      case "duplicate":
        return plan.leads.filter((l) => l.status === "duplicate" && !l.excluded);
      case "excluded":
        return plan.leads.filter((l) => l.excluded);
      default:
        return plan.leads;
    }
  }, [plan.leads, leadFilter]);

  const willImportLeads = totals.leadsValid;
  const willImportCompanies = totals.companiesToCreate;
  const nothingToImport = willImportLeads === 0 && willImportCompanies === 0;

  const leadFilters: { key: LeadFilter; label: string; count: number }[] = [
    { key: "all", label: "All", count: plan.leads.length },
    { key: "valid", label: "Ready", count: totals.leadsValid },
    { key: "invalid", label: "Needs attention", count: totals.leadsInvalid },
    { key: "duplicate", label: "Duplicate", count: totals.leadsDuplicate },
    { key: "excluded", label: "Excluded", count: totals.leadsExcluded },
  ];

  return (
    <div className="grid gap-5">
      <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm text-slate-700 dark:text-slate-200">
              <span className="font-semibold">{plan.fileName}</span> — read as a{" "}
              <span className="font-semibold">
                {plan.mode === "company" ? "company-lead" : "simple lead"}
              </span>{" "}
              file, {totals.fileRows.toLocaleString()} rows.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300">
            <ShieldCheck size={13} />
            Nothing saved yet
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat
          label="New companies"
          value={totals.companiesToCreate}
          icon={<Building2 size={12} />}
          tone="emerald"
        />
        <Stat label="Already in CRM" value={totals.companiesExisting} icon={<Building2 size={12} />} />
        <Stat label="Leads ready" value={totals.leadsValid} icon={<Users size={12} />} tone="emerald" />
        <Stat
          label="Need attention"
          value={totals.leadsInvalid}
          icon={<AlertTriangle size={12} />}
          tone={totals.leadsInvalid > 0 ? "red" : "slate"}
        />
        <Stat
          label="Duplicates"
          value={totals.leadsDuplicate}
          icon={<Copy size={12} />}
          tone={totals.leadsDuplicate > 0 ? "amber" : "slate"}
        />
        <Stat label="Excluded" value={totals.leadsExcluded} icon={<Users size={12} />} />
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <div className="flex gap-1 border-b border-slate-200 px-2 pt-2 dark:border-slate-700">
          {(
            [
              { key: "companies", label: `Companies (${plan.companies.length})` },
              { key: "leads", label: `Leads (${plan.leads.length})` },
            ] as const
          ).map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`cursor-pointer rounded-t-md px-4 py-2 text-sm font-medium transition ${
                tab === key
                  ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "companies" ? (
          <>
            <p className="flex items-start gap-2 border-b border-slate-100 bg-slate-50/60 px-4 py-2.5 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-400">
              <Info size={13} className="mt-0.5 shrink-0" />
              Companies already in the CRM are skipped and never changed. Anything
              marked <span className="font-medium">default</span> was filled in for
              you — worth a look before approving.
            </p>
            <ImportCompanyTable
              companies={plan.companies}
              savingRowId={savingRowId}
              onSave={(rowId, patch) => onSaveCompany(rowId, patch)}
              onToggleExclude={(rowId, excluded) => onSaveCompany(rowId, { excluded })}
            />
          </>
        ) : (
          <>
            <div className="flex flex-wrap gap-1.5 border-b border-slate-100 px-3 py-2.5 dark:border-slate-800">
              {leadFilters.map(({ key, label, count }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setLeadFilter(key)}
                  className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition ${
                    leadFilter === key
                      ? "border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  {label} ({count})
                </button>
              ))}
            </div>
            <ImportLeadTable
              leads={visibleLeads}
              savingRowId={savingRowId}
              onSave={onSaveLead}
              onToggleExclude={(rowId, excluded) => onSaveLead(rowId, { excluded })}
            />
          </>
        )}
      </div>

      <div className="sticky bottom-0 -mx-5 flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 bg-white/95 px-5 py-3 backdrop-blur sm:-mx-6 sm:px-6 dark:border-slate-700 dark:bg-slate-900/95">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isCommitting}
            className="cursor-pointer inline-flex h-10 items-center rounded border border-slate-200 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Discard
          </button>
          <button
            type="button"
            onClick={onCommit}
            disabled={isCommitting || nothingToImport}
            title={nothingToImport ? "Nothing left to import" : undefined}
            className="cursor-pointer inline-flex h-10 items-center rounded bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
          >
            {isCommitting
              ? "Importing..."
              : `Import ${willImportCompanies} ${
                  willImportCompanies === 1 ? "company" : "companies"
                } and ${willImportLeads} ${willImportLeads === 1 ? "lead" : "leads"}`}
          </button>
        </div>
      </div>
    </div>
  );
}
