import { useEffect, useState } from "react";
import { EmailLink } from "@/components/ui/EmailLink";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { Mail, Pencil, UserRound } from "lucide-react";
import type { CallsFormState } from "@/types";

type Props = {
  form: CallsFormState;
  leadName: string;
  /** Edit mode is dropped whenever the agent moves to another lead. */
  leadId: string;
  /** Resolves true when saved (or unchanged), so the card can close. */
  onSaveEmail: (email: string) => Promise<boolean>;
  emailSaving?: boolean;
};

export function IdentityCard({
  form,
  leadName,
  leadId,
  onSaveEmail,
  emailSaving = false,
}: Props) {
  const email = String(form.email ?? "");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(email);

  useEffect(() => {
    setEditing(false);
  }, [leadId]);

  const startEdit = () => {
    setDraft(email);
    setEditing(true);
  };

  const save = async () => {
    if (await onSaveEmail(draft)) setEditing(false);
  };

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

        <div className="w-full">
          <div className="mb-1 flex items-center justify-between">
            <label
              htmlFor="calls-lead-email"
              className="text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Email
            </label>
            {!editing && (
              <button
                type="button"
                onClick={startEdit}
                className="inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                <Pencil className="h-3 w-3" />
                Edit
              </button>
            )}
          </div>

          {editing ? (
            <div className="space-y-2">
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400 dark:text-gray-500" />
                {/* Plain text, not type="email": leads can hold several
                    comma-separated addresses. */}
                <input
                  id="calls-lead-email"
                  type="text"
                  autoFocus
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") save();
                    if (event.key === "Escape") setEditing(false);
                  }}
                  disabled={emailSaving}
                  placeholder="name@company.com, other@company.com"
                  className="w-full rounded-lg border border-blue-500 bg-white py-2 pl-9 pr-3 text-sm leading-5 text-slate-700 placeholder:text-slate-400 focus:outline-none disabled:opacity-60 dark:bg-gray-700 dark:text-gray-200 dark:placeholder:text-gray-500"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  disabled={emailSaving}
                  className="cursor-pointer rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-60 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={save}
                  disabled={emailSaving}
                  className="cursor-pointer rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {emailSaving ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          ) : (
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400 dark:text-gray-500" />
              <div className="w-full rounded-lg border border-slate-300 bg-slate-50 py-2 pl-9 pr-3 text-sm leading-5 break-words text-slate-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200">
                {email.trim() ? (
                  <EmailLink value={email} wrap />
                ) : (
                  <span className="text-slate-400 dark:text-gray-500">
                    No email on record
                  </span>
                )}
              </div>
            </div>
          )}
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
