import { CardShell } from "@/components/ui/CardShell";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { Phone } from "lucide-react";

// Display only. Deliberately NOT a tel: link — the CRM no longer initiates
// calls, so clicking the number must not hand off to a phone app. `select-all`
// lets one click highlight the whole number for copying into the dialler.
export function PhoneCard({ phone }: { phone: string }) {
  return (
    <CardShell>
      <SectionLabel className="mb-2 sm:mb-3">Phone</SectionLabel>
      <div className="flex min-h-11 items-center gap-2 text-base font-bold text-slate-800 sm:text-lg dark:text-gray-100">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-gray-800">
          <Phone className="h-4 w-4 text-slate-500 dark:text-gray-400" />
        </span>
        <span className="select-all">{phone}</span>
      </div>
    </CardShell>
  );
}
