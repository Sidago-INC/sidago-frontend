import type { QueueLead } from "../_lib/apiTypes";
import { formatLeadDisplayTitle, displayOptionalText } from "../_lib/utils";
import { TypeBadge, TimezoneBadge } from "@/components/ui";
import { Building2, BriefcaseBusiness } from "lucide-react";
import { LeadStatBox } from "./LeadStatBox";

export function HeroCard({ currentLead }: { currentLead: QueueLead }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/60 shadow-sm dark:border-gray-700 dark:bg-white/10">
      <div className="flex flex-col gap-3 p-4 sm:gap-4 sm:p-6">
        <div className="space-y-2.5 sm:space-y-3">
          <h1 className="min-w-0 text-xl font-bold leading-tight text-slate-800 sm:text-2xl dark:text-gray-100">
            {formatLeadDisplayTitle(currentLead)}
          </h1>

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
