import { Mail } from "lucide-react";
import { useAdditionalContactsByCompany } from "@/features/additional-contacts/_lib/hooks";

/**
 * The company's additional contacts — the `additional_contacts` table, written
 * by the Add Additional Contacts form.
 *
 * These are NOT leads. They are extra people on file at a company: a
 * receptionist, an assistant, a second email. 1,179 of them came across from
 * Airtable and, until this component existed, nothing in the app ever read
 * them back. Several drawers had an "Additional Contacts" box that was bound
 * to a field hard-coded to the empty string, so it showed "No additional
 * contacts." on every lead regardless.
 *
 * Requires `contacts.read`, which agents, managers and admins all hold.
 */
export function AdditionalContactsList({
  companyId,
  emptyText = "No additional contacts on file for this company.",
}: {
  companyId: string | null | undefined;
  emptyText?: string;
}) {
  const { data, isLoading, isError } = useAdditionalContactsByCompany(
    companyId ?? null,
  );

  if (!companyId) {
    return <EmptyLine>No company linked, so there are no contacts.</EmptyLine>;
  }

  if (isLoading) return <EmptyLine>Loading contacts…</EmptyLine>;
  if (isError) return <EmptyLine>Could not load additional contacts.</EmptyLine>;
  if (!data?.length) return <EmptyLine>{emptyText}</EmptyLine>;

  return (
    <ul className="space-y-1.5">
      {data.map((contact) => {
        const name =
          contact.name?.trim() ||
          [contact.firstName, contact.lastName]
            .filter((part) => part?.trim())
            .join(" ")
            .trim() ||
          contact.email?.trim() ||
          "Unnamed contact";

        return (
          <li
            key={contact.id}
            className="rounded border border-slate-200 px-2.5 py-1.5 dark:border-slate-700"
          >
            <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-100">
              {name}
            </p>
            {contact.role?.trim() && (
              <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                {contact.role}
              </p>
            )}
            {contact.email?.trim() && (
              <a
                href={`mailto:${contact.email}`}
                className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-sky-600 hover:underline dark:text-sky-400"
              >
                <Mail size={11} />
                <span className="truncate">{contact.email}</span>
              </a>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function EmptyLine({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs text-slate-400 dark:text-slate-500">{children}</p>
  );
}
