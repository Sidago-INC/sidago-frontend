import { Building2, Mail, Phone, Users } from "lucide-react";
import { CardShell } from "@/components/ui/CardShell";
import { SectionLabel } from "@/components/ui/SectionLabel";
import type { LeadDetailResponse } from "../_lib/apiTypes";

type Props = {
  contacts: LeadDetailResponse["relatedContacts"];
  className?: string;
};

export function OtherContactsCard({ contacts, className }: Props) {
  return (
    <CardShell
      className={`rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900/60 ${className ?? ""}`}
    >
      <SectionLabel icon={Users} className="mb-3">
        Other Contacts
      </SectionLabel>

      {contacts.length === 0 ? (
        <p className="text-sm leading-relaxed text-slate-600 dark:text-gray-300">-</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-gray-700 dark:bg-gray-800/80"
            >
              <p className="text-sm font-semibold text-slate-800 dark:text-gray-100">
                {contact.fullName}
              </p>

              <div className="mt-2 space-y-1.5 text-sm text-slate-600 dark:text-gray-300">
                {contact.role ? (
                  <p className="flex items-start gap-2">
                    <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-400 dark:text-gray-500" />
                    <span>{contact.role}</span>
                  </p>
                ) : null}

                {contact.phone ? (
                  <p className="flex items-start gap-2">
                    <Phone className="mt-0.5 h-4 w-4 shrink-0 text-slate-400 dark:text-gray-500" />
                    <span className="select-all">{contact.phone}</span>
                  </p>
                ) : null}

                {contact.email ? (
                  <a
                    href={`mailto:${contact.email}`}
                    className="flex items-start gap-2 break-all transition-colors hover:text-sky-600 dark:hover:text-sky-400"
                  >
                    <Mail className="mt-0.5 h-4 w-4 shrink-0 text-slate-400 dark:text-gray-500" />
                    <span>{contact.email}</span>
                  </a>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </CardShell>
  );
}
