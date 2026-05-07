import { Lead } from "@/types";
import { TypeBadge, TimezoneBadge } from "@/components/ui";
import { Building2, BriefcaseBusiness } from "lucide-react";
import { LeadStatBox } from "./LeadStatBox";

export function HeroCard({ currentLead }: { currentLead: Lead }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm bg-white/60 dark:bg-white/10 dark:border-gray-700">
      <div className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold leading-tight text-slate-800 dark:text-gray-100">
            {currentLead.lead_id}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <TypeBadge value={currentLead.contact_type} kind="contact" />
            <TimezoneBadge timezone={currentLead.timezone} />
          </div>
        </div>

        <div className="flex gap-4 text-center">
          <LeadStatBox
            icon={Building2}
            label="Company"
            value={currentLead.company_name}
          />
          <LeadStatBox
            icon={BriefcaseBusiness}
            label="Role"
            value={currentLead.role}
          />
        </div>
      </div>
    </div>
  );
}
