import type { QueueLead } from "../_lib/apiTypes";
import { formatLeadDisplayTitle, displayOptionalText } from "../_lib/utils";
import { TypeBadge, TimezoneBadge } from "@/components/ui";
import { Building2, BriefcaseBusiness, Phone } from "lucide-react";
import { LeadStatBox } from "./LeadStatBox";

export function HeroCard({ currentLead }: { currentLead: QueueLead }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/60 shadow-sm dark:border-gray-700 dark:bg-white/10">
      <div className="flex flex-col gap-3 p-4 sm:gap-4 sm:p-6">
        <div className="space-y-2.5 sm:space-y-3">
          <div className="flex items-start justify-between gap-3">
            <h1 className="min-w-0 flex-1 text-xl font-bold leading-tight text-slate-800 sm:text-2xl dark:text-gray-100">
              {formatLeadDisplayTitle(currentLead)}
            </h1>

            <a
              href={`tel:${currentLead.phone}`}
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-500 dark:bg-sky-500 dark:hover:bg-sky-400"
            >
              <Phone className="h-4 w-4 shrink-0" />
              Call
            </a>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <TypeBadge value={currentLead.contactType} kind="contact" />
            <TimezoneBadge timezone={currentLead.timezone} />
          </div>

          <div className="grid w-full grid-cols-2 gap-2 sm:gap-4 lg:w-1/2">
            <LeadStatBox
              icon={Building2}
              label="Company"
              value={currentLead.companyName}
            />
            <LeadStatBox
              icon={BriefcaseBusiness}
              label="Role"
              value={displayOptionalText(currentLead.role)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
