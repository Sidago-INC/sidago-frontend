import { formatPhone } from "@/features/lead-phones/_lib/format";
import { getHistoryEntries } from "@/features/agent-calls/_lib/history";
import type {
  HistoryEntry,
  LeadDetailResponse,
} from "@/features/agent-calls/_lib/apiTypes";

export function formatCallLogDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
}

// Entry-based formatters take history that is already in the order wanted
// (the Calls page sorts newest first). The history-based ones keep the
// original order, so Call Logs and Lead detail are unchanged.
export function formatNotesEntries(entries: HistoryEntry[]): string {
  return entries
    .filter((entry) => entry.notes)
    .map((entry) =>
      [formatCallLogDate(entry.calledAt), entry.agentName, entry.notes]
        .filter(Boolean)
        .join(" - "),
    )
    .join("\n");
}

export function formatCallsEntries(entries: HistoryEntry[]): string {
  return entries
    .map((entry) =>
      [
        formatCallLogDate(entry.calledAt),
        entry.agentName,
        entry.resultCode,
        // Which number was dialled, once calls start recording it.
        entry.phoneDialled ? formatPhone(entry.phoneDialled) : null,
      ]
        .filter(Boolean)
        .join(" - "),
    )
    .join("\n");
}

export function formatNotesHistory(
  history: LeadDetailResponse["history"],
  brandCode?: string,
): string {
  return formatNotesEntries(getHistoryEntries(history, brandCode));
}

export function formatCallsHistory(
  history: LeadDetailResponse["history"],
  brandCode?: string,
): string {
  return formatCallsEntries(getHistoryEntries(history, brandCode));
}

export function formatRelatedContacts(
  contacts: LeadDetailResponse["relatedContacts"],
): string {
  return contacts
    .map((contact) =>
      [
        contact.role ? `${contact.role}: ${contact.fullName}` : contact.fullName,
        formatPhone(contact.phone),
        contact.email,
      ]
        .filter(Boolean)
        .join(", "),
    )
    .join("\n");
}
