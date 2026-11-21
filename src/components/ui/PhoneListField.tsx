import clsx from "clsx";
import { Plus, X } from "lucide-react";
import { useMemo, useState, useEffect, useRef } from "react";
import PhoneInput from "react-phone-input-2";
import { useTheme } from "@/providers/ThemeProvider";
import {
  digitsOnly,
  validateExtension,
  validatePhoneNumber,
} from "@/lib/validation/phone";

export type PhoneEntry = {
  phone: string;
  phoneExtension: string;
};

export type PhoneListFieldProps = {
  label?: string;
  values: PhoneEntry[];
  onChange: (values: PhoneEntry[]) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  country?: string;
  className?: string;
  inputClassName?: string;
};

function getPhoneInputStyles(isDark: boolean, hasError?: boolean) {
  const borderColor = hasError ? "#ef4444" : isDark ? "#4b5563" : "#d1d5db";
  const backgroundColor = isDark ? "#1f2937" : "#ffffff";
  const color = isDark ? "#e2e8f0" : "#334155";

  return {
    inputStyle: {
      width: "100%",
      height: "40px",
      borderRadius: "0.375rem",
      borderColor,
      backgroundColor,
      fontSize: "0.875rem",
      color,
      paddingLeft: "48px",
    },
    buttonStyle: {
      borderTopLeftRadius: "0.375rem",
      borderBottomLeftRadius: "0.375rem",
      borderColor,
      backgroundColor,
    },
    dropdownStyle: {
      backgroundColor,
      color,
    },
    searchStyle: {
      width: "90%",
      backgroundColor: isDark ? "#111827" : "#ffffff",
      color,
      borderColor: isDark ? "#4b5563" : "#d1d5db",
    },
  };
}

export function PhoneListField({
  label = "Phone",
  values,
  onChange,
  error,
  required = false,
  disabled = false,
  country = "us",
  className,
  inputClassName,
}: PhoneListFieldProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const initialRows = useMemo(() => {
    return values && values.length > 0
      ? values
      : [{ phone: "", phoneExtension: "" }];
  }, [values]);

  const [rows, setRows] = useState<PhoneEntry[]>(initialRows);
  const [touched, setTouched] = useState<boolean[]>(() =>
    initialRows.map(() => false),
  );

  const emittedRef = useRef(values);

  useEffect(() => {
    // Only re-sync if the parent passes a different list than what was emitted
    const currentJson = JSON.stringify(rows);
    const incomingJson = JSON.stringify(
      values?.length ? values : [{ phone: "", phoneExtension: "" }],
    );
    if (incomingJson !== JSON.stringify(emittedRef.current) && incomingJson !== currentJson) {
      const next = values?.length ? values : [{ phone: "", phoneExtension: "" }];
      emittedRef.current = values;
      setRows(next);
      setTouched(next.map(() => false));
    }
  }, [values, rows]);

  const push = (next: PhoneEntry[]) => {
    setRows(next);
    emittedRef.current = next;
    onChange(next);
  };

  const setPhoneAt = (index: number, phone: string) => {
    const next = rows.map((r, i) => (i === index ? { ...r, phone } : r));
    push(next);
  };

  const setExtensionAt = (index: number, phoneExtension: string) => {
    const next = rows.map((r, i) =>
      i === index ? { ...r, phoneExtension } : r,
    );
    push(next);
  };

  const addRow = () => {
    setTouched((t) => [...t, false]);
    const next = [...rows, { phone: "", phoneExtension: "" }];
    push(next);
  };

  const removeRow = (index: number) => {
    const next = rows.filter((_, i) => i !== index);
    setTouched((t) => t.filter((_, i) => i !== index));
    push(next.length > 0 ? next : [{ phone: "", phoneExtension: "" }]);
  };

  const validateRow = (
    row: PhoneEntry,
    index: number,
  ): { phoneError: string | null; extError: string | null } => {
    if (!touched[index]) return { phoneError: null, extError: null };

    let phoneError: string | null = null;
    let extError: string | null = null;

    const trimmedPhone = row.phone.trim();
    if (index === 0 && required && !trimmedPhone) {
      phoneError = "Phone is required.";
    } else if (trimmedPhone) {
      phoneError = validatePhoneNumber(trimmedPhone);

      // Check for duplicate digits across other rows
      const thisDigits = digitsOnly(trimmedPhone);
      if (thisDigits.length >= 7) {
        const isDup = rows.some((other, i) => {
          if (i === index) return false;
          const otherDigits = digitsOnly(other.phone);
          return otherDigits && otherDigits === thisDigits;
        });
        if (isDup) {
          phoneError = "Duplicate phone number entered.";
        }
      }
    }

    extError = validateExtension(row.phoneExtension, "Extension");

    return { phoneError, extError };
  };

  const filledCount = rows.filter((r) => r.phone.trim() !== "").length;

  return (
    <div className={clsx("flex w-full flex-col gap-1.5", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-800 dark:text-slate-200">
            {label}
            {required ? <span className="text-red-500"> *</span> : null}
          </label>
          {rows.length > 1 && (
            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
              (First number is preferred)
            </span>
          )}
        </div>
        {filledCount > 1 ? (
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {filledCount} numbers
          </span>
        ) : null}
      </div>

      <div className="flex flex-col gap-2.5">
        {rows.map((row, index) => {
          const { phoneError, extError } = validateRow(row, index);
          const hasError = Boolean(
            phoneError || (index === 0 && error && !row.phone.trim()),
          );
          const styles = getPhoneInputStyles(isDark, hasError);

          return (
            <div key={index} className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <div className="relative flex-1 min-w-0">
                  <PhoneInput
                    country={country}
                    enableSearch
                    value={row.phone}
                    disabled={disabled}
                    onChange={(rawValue, _country, _event, formattedValue) =>
                      setPhoneAt(
                        index,
                        formattedValue?.trim() ||
                          (rawValue ? `+${rawValue}` : ""),
                      )
                    }
                    onBlur={() =>
                      setTouched((t) =>
                        t.map((was, i) => (i === index ? true : was)),
                      )
                    }
                    containerClass={clsx(
                      "phone-input-field w-full",
                      hasError && "phone-input-field--error",
                    )}
                    inputProps={{
                      "aria-label":
                        rows.length > 1 ? `${label} ${index + 1}` : label,
                      "aria-required":
                        required && index === 0 ? true : undefined,
                    }}
                    {...styles}
                  />
                </div>

                <div className="w-24 shrink-0">
                  <input
                    type="text"
                    value={row.phoneExtension}
                    disabled={disabled}
                    placeholder="Ext."
                    maxLength={12}
                    aria-label={`Extension ${index + 1}`}
                    onChange={(event) =>
                      setExtensionAt(index, event.target.value)
                    }
                    onBlur={() =>
                      setTouched((t) =>
                        t.map((was, i) => (i === index ? true : was)),
                      )
                    }
                    className={clsx(
                      "h-10 w-full rounded border bg-white px-2.5 text-sm text-slate-700 transition focus:border-indigo-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:bg-gray-800 dark:text-slate-200 dark:focus:border-indigo-400",
                      extError
                        ? "border-red-500"
                        : "border-slate-200 dark:border-slate-700",
                      inputClassName,
                    )}
                  />
                </div>

                {rows.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removeRow(index)}
                    disabled={disabled}
                    title="Remove this phone number"
                    aria-label={`Remove phone ${index + 1}`}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-slate-200 text-slate-500 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:hover:border-red-500/40 dark:hover:bg-red-500/10 dark:text-slate-400"
                  >
                    <X size={15} />
                  </button>
                ) : null}
              </div>

              {(phoneError || extError) && (
                <div className="flex gap-4 text-xs text-red-500">
                  {phoneError && <span>{phoneError}</span>}
                  {extError && <span>Ext: {extError}</span>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div>
        <button
          type="button"
          onClick={addRow}
          disabled={disabled}
          className="mt-1 inline-flex items-center gap-1.5 rounded px-1.5 py-1 text-xs font-medium text-indigo-600 transition hover:text-indigo-800 disabled:cursor-not-allowed disabled:opacity-60 dark:text-indigo-300 dark:hover:text-indigo-200 cursor-pointer"
        >
          <Plus size={14} />
          Add another phone
        </button>
      </div>

      {error && !rows[0]?.phone.trim() ? (
        <span className="text-xs text-red-500">{error}</span>
      ) : null}
    </div>
  );
}
