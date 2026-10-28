import { useState } from "react";
import { getErrorMessage, showErrorToast, showSuccessToast } from "@/lib/toast";
import { validateExtension } from "@/lib/validation/phone";
import { leadPhonesApi } from "../_lib/api";
import { formatPhone } from "../_lib/format";
import type { LeadPhone } from "../_lib/types";

type Props = {
  leadId: string;
  onCancel: () => void;
  onAdded: (phone: LeadPhone) => void | Promise<unknown>;
};

/**
 * Inline "add a number" form. The backend normalises whatever is typed, so
 * "(604) 602-0001" and "604-602-0001" are the same number; adding one the lead
 * already has comes back as 409 and is shown under the field, not as a crash.
 */
export function AddPhoneForm({ leadId, onCancel, onAdded }: Props) {
  const [value, setValue] = useState("");
  const [extension, setExtension] = useState("");
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!value.trim()) {
      setError("Enter a phone number.");
      return;
    }
    // The number itself is checked by the server, which accepts any common
    // format ("(604) 602-0001"); the extension rule is the same one Add Lead uses.
    const extensionError = validateExtension(extension, "Extension");
    if (extensionError) {
      setError(extensionError);
      return;
    }
    setSaving(true);
    setError(undefined);
    try {
      const res = await leadPhonesApi.add(leadId, {
        value: value.trim(),
        extension: extension.trim() || undefined,
      });
      showSuccessToast(
        res.revived
          ? `${formatPhone(res.item.phoneE164)} was retired before - it is back in rotation.`
          : `${formatPhone(res.item.phoneE164)} added.`,
      );
      await onAdded(res.item);
    } catch (err) {
      const status = (err as { status?: number })?.status;
      // 409 has two causes - this lead already has the number, or another lead
      // holds it live - and the server's message says which (and names the lead).
      if (status === 409 || status === 400) setError(getErrorMessage(err));
      else showErrorToast(err);
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800 outline-none focus:border-sky-400 dark:border-slate-700 dark:bg-gray-900 dark:text-slate-100";

  return (
    <div className="rounded border border-dashed border-slate-300 p-2 dark:border-slate-600">
      <div className="flex flex-wrap items-center gap-2">
        <input
          autoFocus
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") void submit();
            if (event.key === "Escape") onCancel();
          }}
          placeholder="Phone number"
          className={`${inputClass} min-w-0 flex-1`}
          aria-label="New phone number"
        />
        <input
          value={extension}
          onChange={(event) => setExtension(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") void submit();
          }}
          placeholder="Ext."
          className={`${inputClass} w-16`}
          aria-label="Extension"
        />
        <button
          type="button"
          onClick={() => void submit()}
          disabled={saving}
          className="cursor-pointer rounded bg-sky-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
        >
          {saving ? "Adding…" : "Add"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="cursor-pointer text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400"
        >
          Cancel
        </button>
      </div>
      {error ? <p className="mt-1 text-[11px] text-red-600 dark:text-red-400">{error}</p> : null}
    </div>
  );
}
