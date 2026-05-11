import type { HotLeadRow } from "@/features/backoffice-shared/types";
import { generateRandomLeads } from "@/lib/mocks/leads";
import type { LEAD } from "@/types/lead.types";
import { leadToHotLeadRow } from "@/features/backoffice-shared/lead-mapper";

export type EmailBlocklistDirectoryRow = HotLeadRow & {
  id: string;
  historyCallNotesSvg: string;
  historyCallNotesBenton: string;
  reason: string;
  addedBy: string;
};

const reasons = [
  "Bounce pattern confirmed across multiple sends",
  "Manual blacklist after spam complaint",
  "Compliance request from lead",
  "Mailbox disabled and verified invalid",
  "Suppression sync from external source",
] as const;

function leadToEmailBlocklistDirectoryRow(
  lead: LEAD,
  index: number,
): EmailBlocklistDirectoryRow {
  return {
    ...leadToHotLeadRow(lead),
    id: String(lead.id ?? lead.record_id ?? `email-blocklist-${index + 1}`),
    historyCallNotesSvg:
      lead.history_call_notes_sidago ?? lead.history_calls_sidago ?? "",
    historyCallNotesBenton:
      lead.history_call_notes_benton ?? lead.history_calls_benton ?? "",
    reason: reasons[index % reasons.length],
    addedBy: lead.created_by ?? "System",
  };
}

export const emailBlocklistDirectoryRows: EmailBlocklistDirectoryRow[] =
  generateRandomLeads(18)
    .filter((lead, index) => lead.blocked_email || index % 3 === 0)
    .map(leadToEmailBlocklistDirectoryRow);
