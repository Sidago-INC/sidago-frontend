import {
  contactTypeOptions,
  getLeadId,
  leadTypeOptions,
} from "@/features/backoffice-shared/constants";
import { generateHotLeadRows } from "@/features/backoffice-shared/lead-mapper";

export type BlockedEmailRow = {
  id: string;
  leadId: string;
  leadType: string;
  contactType: string;
  email: string;
  blockedEmail: string;
  blockedAt: string;
  reason: string;
};

const reasons = [
  "Manual block after repeated bounce",
  "Marked as do-not-contact",
  "Spam complaint received",
  "Invalid mailbox reported",
  "Suppression list match",
];

export const blockedEmailRows: BlockedEmailRow[] = generateHotLeadRows(12).map(
  (lead, index) => ({
    id: `blocked-email-${index + 1}`,
    leadId: getLeadId(lead),
    leadType: leadTypeOptions[index % leadTypeOptions.length],
    contactType: contactTypeOptions[index % contactTypeOptions.length],
    email: lead.email,
    blockedEmail: lead.email,
    blockedAt: new Date(Date.now() - index * 86400000).toISOString(),
    reason: reasons[index % reasons.length],
  }),
);
