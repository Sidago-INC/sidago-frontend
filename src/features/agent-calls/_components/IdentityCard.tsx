import { EmailListField } from "@/components/ui/EmailListField";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { UserRound } from "lucide-react";
import type { CallsFormState } from "@/types";

type Props = {
  form: CallsFormState;
  leadName: string;
  emailDirty: boolean;
  emailSaving: boolean;
  onEmailChange: (value: string) => void;
  onEmailSave: () => void;
  onEmailCancel: () => void;
};

export function IdentityCard({
  form,
  leadName,
  emailDirty,
  emailSaving,
  onEmailChange,
  onEmailSave,
  onEmailCancel,
}: Props) {
  return (
    <div className="space-y-3">
      <SectionLabel>Identity</SectionLabel>

      <div className="space-y-2.5">
        <div>
          <p className="mb-0.5 text-xs text-slate-400 dark:text-gray-500">
            Full Name
          </p>
          <p className="flex items-center gap-2 font-semibold text-slate-800 dark:text-gray-100">
            <UserRound className="h-4 w-4 text-slate-400 dark:text-gray-500" />
            {leadName}
          </p>
        </div>

        <div className="border-t border-slate-100 dark:border-gray-700" />

        <div>
          <p className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">Lead Type</p>
          <p className="w-full rounded border border-slate-300 bg-slate-50 px-4 py-2 text-sm text-slate-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200">
            {form.leadType || "—"}
          </p>
        </div>

        <div className="border-t border-slate-100 dark:border-gray-700" />

        <div className="w-full space-y-2">
          <EmailListField
            label="Email"
            value={form.email}
            onChange={onEmailChange}
            disabled={emailSaving}
          />
          {emailDirty ? (
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onEmailCancel}
                disabled={emailSaving}
                className="rounded border border-slate-300 px-3 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onEmailSave}
                disabled={emailSaving}
                className="rounded bg-indigo-600 px-3 py-1 text-xs font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {emailSaving ? "Saving…" : "Save email"}
              </button>
            </div>
          ) : null}
        </div>

        <div className="border-t border-slate-100 dark:border-gray-700" />

        <div>
          <p className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">Contact Type</p>
          <p className="w-full rounded border border-slate-300 bg-slate-50 px-4 py-2 text-sm text-slate-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200">
            {form.contactType || "—"}
          </p>
        </div>
      </div>
    </div>
  );
}
