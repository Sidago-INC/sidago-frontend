import { getHistoryEntries } from "@/features/agent-calls/_lib/history";
import type { LeadDetailResponse } from "@/features/agent-calls/_lib/apiTypes";

export function formatCallLogDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
}

export function formatNotesHistory(
  history: LeadDetailResponse["history"],
  brandCode?: string,
): string {
  return getHistoryEntries(history, brandCode)
    .filter((entry) => entry.notes)
    .map((entry) =>
      [formatCallLogDate(entry.calledAt), entry.agentName, entry.notes]
        .filter(Boolean)
        .join(" - "),
    )
    .join("\n");
}

export function formatCallsHistory(
  history: LeadDetailResponse["history"],
  brandCode?: string,
): string {
  return getHistoryEntries(history, brandCode)
    .map((entry) =>
      [formatCallLogDate(entry.calledAt), entry.agentName, entry.resultCode]
        .filter(Boolean)
        .join(" - "),
    )
    .join("\n");
}

export function formatRelatedContacts(
  contacts: LeadDetailResponse["relatedContacts"],
): string {
  return contacts
    .map((contact) =>
      [
        contact.role ? `${contact.role}: ${contact.fullName}` : contact.fullName,
        contact.phone,
        contact.email,
      ]
        .filter(Boolean)
        .join(", "),
    )
    .join("\n");
}
