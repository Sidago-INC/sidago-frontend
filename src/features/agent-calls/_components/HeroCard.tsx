import type { Lead } from "../_lib/data";
import { TypeBadge, TimezoneBadge } from "@/components/ui";
import { Building2, BriefcaseBusiness, Phone } from "lucide-react";
import { LeadStatBox } from "./LeadStatBox";

export function HeroCard({ currentLead }: { currentLead: Lead }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm bg-white/60 dark:bg-white/10 dark:border-gray-700">
      <div className="flex flex-col gap-4 p-5 sm:p-6">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3 sm:items-center">
            <h1 className="min-w-0 text-2xl font-bold leading-tight text-slate-800 dark:text-gray-100">
              {currentLead.lead_id}
            </h1>

            <a
              href={`tel:${currentLead.phone}`}
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-sky-500 dark:bg-sky-500 dark:hover:bg-sky-400"
            >
              <Phone className="h-4 w-4 shrink-0" />
              Call
            </a>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <TypeBadge value={currentLead.contact_type} kind="contact" />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <TimezoneBadge timezone={currentLead.timezone} />
          </div>

          <div className="grid w-full grid-cols-1 gap-4 text-center sm:grid-cols-2 lg:w-1/2">
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
    </div>
  );
}
