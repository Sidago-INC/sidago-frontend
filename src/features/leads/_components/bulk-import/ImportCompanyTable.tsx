import { useState } from "react";
import { Check, Lock, Loader2, Pencil, RotateCcw, Trash2, X } from "lucide-react";
import { TimezoneSelect } from "@/components/ui/TimezoneSelect";
import type { PlanCompany, ValueSource } from "@/types/bulk-import.types";

type Props = {
  companies: PlanCompany[];
  savingRowId: string | null;
  onSave: (rowId: string, patch: Partial<PlanCompany>) => Promise<void>;
  onToggleExclude: (rowId: string, excluded: boolean) => Promise<void>;
};

/**
 * Marks where a value came from. "default" is the one that earns its place: it
 * means the sheet said nothing and the backend supplied EST/USA, which is
 * exactly what the operator is here to check.
 */
function SourceHint({ source }: { source: ValueSource }) {
  if (source === "file") return null;
  const label = source === "default" ? "default" : "from CRM";
  const tone =
    source === "default"
      ? "border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
      : "border-slate-200 bg-slate-100 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400";
  return (
    <span className={`ml-1.5 rounded border px-1.5 py-0.5 text-[10px] font-medium ${tone}`}>
      {label}
    </span>
  );
}

function CompanyRow({
  company,
  saving,
  onSave,
  onToggleExclude,
}: {
  company: PlanCompany;
  saving: boolean;
  onSave: Props["onSave"];
  onToggleExclude: Props["onToggleExclude"];
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(company.name);
  const [timezone, setTimezone] = useState(company.timezone);
  const [country, setCountry] = useState(company.country);

  // A company already in the CRM is never modified by an import, so it offers
  // no controls at all rather than an edit that would be refused.
  const locked = company.action === "exists";

  const beginEdit = () => {
    setName(company.name);
    setTimezone(company.timezone);
    setCountry(company.country);
    setEditing(true);
  };

  const commit = async () => {
    await onSave(company.rowId, { name, timezone, country });
    setEditing(false);
  };

  return (
    <tr
      className={`border-b border-slate-100 align-middle last:border-0 dark:border-slate-800 ${
        company.excluded ? "opacity-50" : ""
      } ${locked ? "bg-slate-50/60 dark:bg-slate-900/40" : ""}`}
    >
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-1.5">
          {locked && <Lock size={12} className="shrink-0 text-slate-400" />}
          <span className="font-medium text-slate-800 dark:text-slate-200">
            {company.symbol}
          </span>
        </div>
        <span className="text-[11px] text-slate-400 dark:text-slate-500">
          {company.sourceRows.length} row{company.sourceRows.length === 1 ? "" : "s"}
        </span>
      </td>

      <td className="px-3 py-2.5">
        {editing ? (
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full min-w-[180px] rounded border border-slate-300 bg-white px-2 py-1 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
          />
        ) : (
          <span className="text-slate-700 dark:text-slate-300">
            {company.name || <span className="text-red-500">— missing —</span>}
          </span>
        )}
      </td>

      <td className="px-3 py-2.5">
        {editing ? (
          <div className="min-w-[130px]">
            <TimezoneSelect value={timezone} onChange={(v) => setTimezone(v)} />
          </div>
        ) : (
          <span className="whitespace-nowrap text-slate-700 dark:text-slate-300">
            {company.timezone || "—"}
            <SourceHint source={company.sources.timezone} />
          </span>
        )}
      </td>

      <td className="px-3 py-2.5">
        {editing ? (
          <input
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full min-w-[110px] rounded border border-slate-300 bg-white px-2 py-1 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
          />
        ) : (
          <span className="whitespace-nowrap text-slate-700 dark:text-slate-300">
            {company.country || "—"}
            <SourceHint source={company.sources.country} />
          </span>
        )}
      </td>

      <td className="px-3 py-2.5">
        {locked ? (
          <span className="inline-flex whitespace-nowrap rounded border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            Already in CRM
          </span>
        ) : company.excluded ? (
          <span className="inline-flex whitespace-nowrap rounded border border-slate-300 bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400">
            Excluded
          </span>
        ) : company.issues.length > 0 ? (
          // Blocked, not pending — a green "will be created" next to a red
          // "cannot be created" is the kind of contradiction that gets an
          // import approved and then half-fails.
          <span className="inline-flex whitespace-nowrap rounded border border-red-200 bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
            Cannot be created
          </span>
        ) : (
          <span className="inline-flex whitespace-nowrap rounded border border-emerald-200 bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
            Will be created
          </span>
        )}
        {company.issues.map((issue) => (
          <p key={issue} className="mt-1 text-[11px] text-red-600 dark:text-red-400">
            {issue}
          </p>
        ))}
      </td>

      <td className="px-3 py-2.5 text-right">
        {locked ? (
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            not modified
          </span>
        ) : saving ? (
          <Loader2 size={15} className="ml-auto animate-spin text-slate-400" />
        ) : editing ? (
          <div className="flex justify-end gap-1">
            <button
              type="button"
              onClick={commit}
              title="Save"
              className="cursor-pointer rounded p-1.5 text-emerald-600 transition hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
            >
              <Check size={15} />
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              title="Cancel"
              className="cursor-pointer rounded p-1.5 text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <X size={15} />
            </button>
          </div>
        ) : (
          <div className="flex justify-end gap-1">
            <button
              type="button"
              onClick={beginEdit}
              title="Edit"
              className="cursor-pointer rounded p-1.5 text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <Pencil size={15} />
            </button>
            <button
              type="button"
              onClick={() => onToggleExclude(company.rowId, !company.excluded)}
              title={
                company.excluded
                  ? "Put back in the import"
                  : "Leave out of the import — this also removes its leads"
              }
              className="cursor-pointer rounded p-1.5 text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              {company.excluded ? <RotateCcw size={15} /> : <Trash2 size={15} />}
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

export function ImportCompanyTable({
  companies,
  savingRowId,
  onSave,
  onToggleExclude,
}: Props) {
  if (companies.length === 0) {
    return (
      <p className="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
        No companies in this file.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-400">
          <tr>
            <th className="px-3 py-2 font-semibold">Symbol</th>
            <th className="px-3 py-2 font-semibold">Company Name</th>
            <th className="px-3 py-2 font-semibold">Timezone</th>
            <th className="px-3 py-2 font-semibold">Country</th>
            <th className="px-3 py-2 font-semibold">Status</th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {companies.map((company) => (
            <CompanyRow
              key={company.rowId}
              company={company}
              saving={savingRowId === company.rowId}
              onSave={onSave}
              onToggleExclude={onToggleExclude}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
