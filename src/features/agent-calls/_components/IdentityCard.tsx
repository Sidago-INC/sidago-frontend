import { SectionLabel } from "@/components/ui/SectionLabel";
import { LeadEmailsCard } from "@/features/lead-emails/_components/LeadEmailsCard";
import { UserRound } from "lucide-react";
import type { CallsFormState } from "@/types";

type Props = {
  form: CallsFormState;
  leadName: string;
  /** Needed for the per-address email records; the card falls back to the
   *  legacy comma-joined value when it is missing or the feature is off. */
  leadId?: string | null;
};

export function IdentityCard({ form, leadName, leadId }: Props) {
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
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Email
          </label>
          {/* The Calls page is where a phone call verifies an address, so each
              email is its own record here: confirm it, mark it invalid, add
              the one the contact just gave you. */}
          <div className="w-full rounded-lg border border-slate-300 bg-slate-50 p-2 text-sm leading-5 break-words text-slate-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200">
            <LeadEmailsCard
              leadId={leadId}
              fallbackEmail={form.email}
              confirmMethod="phone"
            />
          </div>
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
