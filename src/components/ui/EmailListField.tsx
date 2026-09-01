import clsx from "clsx";
import { Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { splitEmails } from "@/lib/validation";

/**
 * One or more email addresses for a lead.
 *
 * Leads routinely have several addresses — 13,978 of them hold more than one,
 * and one carries twelve. Airtable kept them all in a single comma-separated
 * field and the CRM's bulk importer already stores them the same way
 * (`joinEmails` in the backend's import-normalize), so this field emits ONE
 * comma-joined string rather than an array. The wire format, the column and the
 * importer therefore all agree; only the editing experience changes.
 *
 * Each row validates on its own, so "which address is wrong" is answered where
 * the user can fix it rather than in a single message about the whole list.
 */

const ADDRESS = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const toRows = (joined: string): string[] => {
  const rows = splitEmails(joined);
  return rows.length > 0 ? rows : [""];
};

export type EmailListFieldProps = {
  label?: string;
  /** Comma-joined addresses — the same string the backend stores. */
  value: string;
  onChange: (joined: string) => void;
  /** Form-level error, shown under the whole group. */
  error?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  inputClassName?: string;
};

export function EmailListField({
  label = "Email",
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  placeholder = "name@company.com",
  inputClassName,
}: EmailListFieldProps) {
  const [rows, setRows] = useState<string[]>(() => toRows(value));
  const [touched, setTouched] = useState<boolean[]>(() => rows.map(() => false));

  // The rows are the source of truth while the user types, so an incoming
  // `value` must not overwrite a half-typed address on every keystroke. Only
  // re-seed when the parent sends something this field did not emit — a Clear
  // button, or loading an existing lead.
  const emitted = useRef(value);
  useEffect(() => {
    if (value === emitted.current) return;
    emitted.current = value;
    const next = toRows(value);
    setRows(next);
    setTouched(next.map(() => false));
  }, [value]);

  const push = (next: string[]) => {
    setRows(next);
    const joined = next.map((r) => r.trim()).filter(Boolean).join(", ");
    emitted.current = joined;
    onChange(joined);
  };

  const setAt = (index: number, next: string) =>
    push(rows.map((row, i) => (i === index ? next : row)));

  const addRow = () => {
    setTouched((t) => [...t, false]);
    // Not via push(): a new blank row joins to the same string, so emitting
    // would be a no-op and the row would vanish on the next re-seed.
    setRows((r) => [...r, ""]);
  };

  const removeRow = (index: number) => {
    const next = rows.filter((_, i) => i !== index);
    setTouched((t) => t.filter((_, i) => i !== index));
    push(next.length > 0 ? next : [""]);
  };

  const rowError = (row: string, index: number): string | null => {
    if (!touched[index]) return null;
    const v = row.trim();
    if (!v) return null;
    return ADDRESS.test(v) ? null : "Enter a valid email address.";
  };

  const filled = rows.filter((r) => r.trim() !== "").length;

  return (
    <div className="flex w-full flex-col gap-1">
      <div className="flex items-baseline justify-between gap-2">
        <label className="text-sm font-medium">
          {label}
          {required ? <span className="text-red-500"> *</span> : null}
        </label>
        {filled > 1 ? (
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {filled} addresses
          </span>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        {rows.map((row, index) => {
          const rowMsg = rowError(row, index);
          return (
            <div key={index} className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <input
                  type="email"
                  value={row}
                  disabled={disabled}
                  placeholder={placeholder}
                  aria-label={
                    rows.length > 1 ? `${label} ${index + 1}` : label
                  }
                  aria-invalid={rowMsg ? true : undefined}
                  onChange={(event) => setAt(index, event.target.value)}
                  onBlur={() =>
                    setTouched((t) =>
                      t.map((was, i) => (i === index ? true : was)),
                    )
                  }
                  className={clsx(
                    "w-full rounded border bg-white px-3 py-1.5 text-sm text-slate-700 transition focus:border-indigo-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:bg-gray-800 dark:text-slate-200 dark:focus:border-indigo-400",
                    rowMsg || error
                      ? "border-red-500"
                      : "border-slate-200 dark:border-slate-700",
                    inputClassName,
                  )}
                />
                {rows.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removeRow(index)}
                    disabled={disabled}
                    title="Remove this address"
                    aria-label={`Remove email ${index + 1}`}
                    className="shrink-0 rounded border border-slate-200 p-1.5 text-slate-500 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:hover:border-red-500/40 dark:hover:bg-red-500/10"
                  >
                    <X size={14} />
                  </button>
                ) : null}
              </div>
              {rowMsg ? (
                <span className="text-xs text-red-500">{rowMsg}</span>
              ) : null}
            </div>
          );
        })}
      </div>

      <div>
        <button
          type="button"
          onClick={addRow}
          disabled={disabled}
          className="mt-1 inline-flex items-center gap-1 rounded px-1 py-0.5 text-xs font-medium text-indigo-600 transition hover:text-indigo-800 disabled:cursor-not-allowed disabled:opacity-60 dark:text-indigo-300 dark:hover:text-indigo-200"
        >
          <Plus size={13} />
          Add another email
        </button>
      </div>

      {error ? <span className="text-xs text-red-500">{error}</span> : null}
    </div>
  );
}
