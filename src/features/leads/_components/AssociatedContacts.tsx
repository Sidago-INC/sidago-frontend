import { TypeBadge, Wave } from "@/components/ui";
import type { RelatedLead } from "@/features/fix-leads/_lib/data";
import { type ReactNode } from "react";

export function AssociatedContactsSection({
  isLoading,
  isError,
  contacts,
  onContactClick,
  activeContactId,
}: {
  isLoading: boolean;
  isError: boolean;
  contacts: RelatedLead[];
  onContactClick?: (contact: RelatedLead) => void;
  activeContactId?: string | null;
}) {
  return (
    <DetailCard label="Associated Contacts">
      {isLoading ? (
        <div className="flex justify-center py-4">
          <Wave />
        </div>
      ) : isError ? (
        <p className="py-2 text-sm text-red-600 dark:text-red-400">
          Failed to load related contacts.
        </p>
      ) : contacts.length === 0 ? (
        <p className="py-2 text-sm text-slate-500 dark:text-slate-400">
          No related contacts available.
        </p>
      ) : (
        <div className="space-y-3">
          {contacts.map((contact) => {
            const isActive = activeContactId === contact.id;
            const card = (
              <DetailCard
                label={contact.fullName ?? "Unnamed"}
                className={
                  isActive
                    ? "border-indigo-400 ring-1 ring-indigo-400/50 dark:border-indigo-500"
                    : undefined
                }
              >
                <AssociationDetail
                  label="Contact Type"
                  value={
                    contact.contactType ? (
                      <TypeBadge value={contact.contactType} kind="contact" />
                    ) : (
                      "-"
                    )
                  }
                />
                <AssociationDetail
                  label="SVG Lead Type"
                  value={
                    contact.brandStates?.svg?.leadType ? (
                      <TypeBadge
                        value={contact.brandStates.svg.leadType}
                        kind="lead"
                      />
                    ) : (
                      "-"
                    )
                  }
                />
                <AssociationDetail
                  label="Benton Lead Type"
                  value={
                    contact.brandStates?.benton?.leadType ? (
                      <TypeBadge
                        value={contact.brandStates.benton.leadType}
                        kind="lead"
                      />
                    ) : (
                      "-"
                    )
                  }
                />
                <AssociationDetail
                  label="95RM Lead Type"
                  value={
                    contact.brandStates?.["95rm"]?.leadType ? (
                      <TypeBadge
                        value={contact.brandStates["95rm"].leadType}
                        kind="lead"
                      />
                    ) : (
                      "-"
                    )
                  }
                />
              </DetailCard>
            );

            if (!onContactClick) {
              return <div key={contact.id}>{card}</div>;
            }

            return (
              <button
                key={contact.id}
                type="button"
                onClick={() => onContactClick(contact)}
                className="w-full cursor-pointer text-left transition hover:opacity-90"
              >
                {card}
              </button>
            );
          })}
        </div>
      )}
    </DetailCard>
  );
}

function DetailCard({
  label,
  children,
  className,
}: {
  label?: string | ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded border border-slate-200 bg-slate-50 p-4 shadow-sm dark:border-slate-700 dark:bg-gray-800${className ? ` ${className}` : ""}`}
    >
      {typeof label === "string" ? (
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          {label}
        </p>
      ) : (
        <>{label}</>
      )}
      <div className="space-y-0">{children}</div>
    </div>
  );
}

function AssociationDetail({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-1">
      <p className="shrink-0 text-[10px] uppercase tracking-widest text-slate-400">
        {label}
      </p>
      <div className="min-w-0 text-right text-xs font-semibold text-slate-600 dark:text-slate-200">
        {value}
      </div>
    </div>
  );
}
