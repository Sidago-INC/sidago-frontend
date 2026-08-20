import { useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Loader2,
  Pencil,
  RotateCcw,
  Trash2,
  Wand2,
  X,
} from "lucide-react";
import type { PatchPlanLead, PlanLead, PlanLeadStatus } from "@/types/bulk-import.types";

type Props = {
  leads: PlanLead[];
  savingRowId: string | null;
  onSave: (rowId: string, patch: PatchPlanLead) => Promise<void>;
  onToggleExclude: (rowId: string, excluded: boolean) => Promise<void>;
};

const STATUS_STYLES: Record<PlanLeadStatus | "excluded", { label: string; className: string }> = {
  valid: {
    label: "Ready",
    className:
      "border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
  },
  invalid: {
    label: "Needs attention",
    className:
      "border-red-200 bg-red-100 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300",
  },
  duplicate: {
    label: "Duplicate",
    className:
      "border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  },
  excluded: {
    label: "Excluded",
    className:
      "border-slate-300 bg-slate-100 text-slate-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400",
  },
};

// Only the fields the backend accepts on a patch. Company symbol and name are
// the import's identity — a row pointed at the wrong company is excluded and
// fixed in the sheet, not edited here.
const EDITABLE: { key: keyof PatchPlanLead; label: string; wide?: boolean }[] = [
  { key: "fullName", label: "Name" },
  { key: "phone", label: "Phone" },
  { key: "otherContacts", label: "Other Contacts", wide: true },
  { key: "email", label: "Email", wide: true },
  { key: "role", label: "Role" },
  { key: "phoneExtension", label: "Extension" },
  { key: "timezone", label: "Timezone" },
];

function Cell({ value }: { value: string }) {
  return (
    <span className="text-slate-700 dark:text-slate-300">
      {value || <span className="text-slate-300 dark:text-slate-600">—</span>}
    </span>
  );
}

function LeadRow({
  lead,
  saving,
  onSave,
  onToggleExclude,
}: {
  lead: PlanLead;
  saving: boolean;
  onSave: Props["onSave"];
  onToggleExclude: Props["onToggleExclude"];
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<PatchPlanLead>({});

  const status = lead.excluded ? "excluded" : lead.status;
  const style = STATUS_STYLES[status];

  const beginEdit = () => {
    setDraft({
      fullName: lead.fullName,
      phone: lead.phone,
      otherContacts: lead.otherContacts,
      email: lead.email,
      role: lead.role,
      phoneExtension: lead.phoneExtension,
      timezone: lead.timezone,
    });
    setEditing(true);
    setExpanded(true);
  };

  const commit = async () => {
    // The backend re-cleans whatever is typed — a phone list entered here is
    // split and given "+1" just like the file's was — so the row is redrawn
    // from the response rather than from the draft.
    await onSave(lead.rowId, draft);
    setEditing(false);
  };

  return (
    <>
      <tr
        className={`border-b border-slate-100 align-middle last:border-0 dark:border-slate-800 ${
          lead.excluded ? "opacity-50" : ""
        }`}
      >
        <td className="px-3 py-2.5">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="cursor-pointer flex items-center gap-1 text-slate-500 transition hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          >
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <span className="tabular-nums">{lead.rowNumber}</span>
          </button>
        </td>
        <td className="whitespace-nowrap px-3 py-2.5">
          <Cell value={lead.companySymbol} />
        </td>
        <td className="px-3 py-2.5">
          <Cell value={lead.fullName} />
        </td>
        <td className="whitespace-nowrap px-3 py-2.5">
          <Cell value={lead.phone} />
        </td>
        <td className="max-w-[220px] px-3 py-2.5">
          <span className="block truncate text-slate-500 dark:text-slate-400">
            {lead.otherContacts || "—"}
          </span>
        </td>
        <td className="max-w-[220px] px-3 py-2.5">
          <span className="block truncate text-slate-500 dark:text-slate-400">
            {lead.email || "—"}
          </span>
        </td>
        <td className="px-3 py-2.5">
          <span
            className={`inline-flex whitespace-nowrap rounded border px-2 py-0.5 text-xs font-medium ${style.className}`}
          >
            {style.label}
          </span>
        </td>
        <td className="px-3 py-2.5 text-right">
          {saving ? (
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
                onClick={() => onToggleExclude(lead.rowId, !lead.excluded)}
                title={lead.excluded ? "Put back in the import" : "Leave out of the import"}
                className="cursor-pointer rounded p-1.5 text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                {lead.excluded ? <RotateCcw size={15} /> : <Trash2 size={15} />}
              </button>
            </div>
          )}
        </td>
      </tr>

      {expanded && (
        <tr className="border-b border-slate-100 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-950/30">
          <td colSpan={8} className="px-4 py-3">
            {lead.issues.length > 0 && (
              <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-200">
                {lead.issues.map((issue, i) => (
                  <p key={`${issue.field}-${i}`}>
                    <span className="font-medium">{issue.field}:</span> {issue.error}
                  </p>
                ))}
              </div>
            )}

            {editing ? (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {EDITABLE.map(({ key, label, wide }) => (
                  <div key={key} className={wide ? "sm:col-span-2 lg:col-span-1" : ""}>
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {label}
                    </label>
                    <input
                      value={(draft[key] as string) ?? ""}
                      onChange={(e) =>
                        setDraft((prev) => ({ ...prev, [key]: e.target.value }))
                      }
                      className="mt-0.5 w-full rounded border border-slate-300 bg-white px-2 py-1 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                    />
                  </div>
                ))}
                <p className="text-[11px] text-slate-500 sm:col-span-2 lg:col-span-3 dark:text-slate-400">
                  Phone and email are tidied on save — several numbers in one box
                  are split, and <code>+1</code> is added where missing.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-1.5 text-sm">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Details
                  </p>
                  <p className="text-slate-600 dark:text-slate-300">
                    <span className="text-slate-400 dark:text-slate-500">Company: </span>
                    {lead.companyName || "—"}
                  </p>
                  <p className="text-slate-600 dark:text-slate-300">
                    <span className="text-slate-400 dark:text-slate-500">Role: </span>
                    {lead.role || "—"}
                  </p>
                  <p className="text-slate-600 dark:text-slate-300">
                    <span className="text-slate-400 dark:text-slate-500">Extension: </span>
                    {lead.phoneExtension || "—"}
                  </p>
                  <p className="text-slate-600 dark:text-slate-300">
                    <span className="text-slate-400 dark:text-slate-500">Timezone: </span>
                    {lead.timezone || "—"}
                  </p>
                  <p className="break-all text-slate-600 dark:text-slate-300">
                    <span className="text-slate-400 dark:text-slate-500">Email: </span>
                    {lead.email || "—"}
                  </p>
                  <p className="break-all text-slate-600 dark:text-slate-300">
                    <span className="text-slate-400 dark:text-slate-500">
                      Other contacts:{" "}
                    </span>
                    {lead.otherContacts || "—"}
                  </p>
                </div>

                {/* The backend writes these sentences; showing them verbatim is
                    the answer to "what did you change about my data?". */}
                <div className="grid gap-1.5 text-sm">
                  <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <Wand2 size={12} />
                    What changed
                  </p>
                  {lead.transforms.length === 0 ? (
                    <p className="text-slate-500 dark:text-slate-400">
                      Taken from your file unchanged.
                    </p>
                  ) : (
                    <ul className="grid gap-1">
                      {lead.transforms.map((t, i) => (
                        <li
                          key={`${t}-${i}`}
                          className="rounded bg-white px-2 py-1 text-slate-600 dark:bg-slate-900 dark:text-slate-300"
                        >
                          {t}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

export function ImportLeadTable({ leads, savingRowId, onSave, onToggleExclude }: Props) {
  if (leads.length === 0) {
    return (
      <p className="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
        No leads match this filter.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-400">
          <tr>
            <th className="px-3 py-2 font-semibold">Row</th>
            <th className="px-3 py-2 font-semibold">Company</th>
            <th className="px-3 py-2 font-semibold">Name</th>
            <th className="px-3 py-2 font-semibold">Phone</th>
            <th className="px-3 py-2 font-semibold">Other Contacts</th>
            <th className="px-3 py-2 font-semibold">Email</th>
            <th className="px-3 py-2 font-semibold">Status</th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <LeadRow
              key={lead.rowId}
              lead={lead}
              saving={savingRowId === lead.rowId}
              onSave={onSave}
              onToggleExclude={onToggleExclude}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
