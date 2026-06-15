import { Input } from "@/components/ui/Input";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { Mail, UserRound } from "lucide-react";
import type { CallsFormState } from "@/types";

type Props = {
  form: CallsFormState;
  leadName: string;
  onChange: (patch: Partial<CallsFormState>) => void;
};

export function IdentityCard({ form, leadName, onChange }: Props) {
  return (
    <div className="space-y-4">
      <SectionLabel>Identity</SectionLabel>

      <div className="space-y-3">
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
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-gray-500" />
            <Input
              type="email"
              value={form.email}
              onChange={(event) => onChange({ email: event.target.value })}
              readOnly
              placeholder="No email on record"
              className="w-full rounded-lg border-slate-300 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 ring-0 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:placeholder:text-gray-500"
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
