// Mirrors Sidago-backend src/lead-emails (LeadEmailView, resolver output).
// Verification and deliverability are independent: a confirmed address that
// later bounces stays "confirmed" and is flagged for re-verification.

export type Verification = "unverified" | "confirmed";

export type Deliverability =
  | "unknown"
  | "valid"
  | "soft_bounced"
  | "hard_bounced"
  | "invalid"
  | "complained";

export type LeadEmail = {
  id: string;
  address: string;
  position: number;
  source: string;
  verification: Verification;
  confirmationMethod: string | null;
  confirmedByUserId: string | null;
  confirmedAt: string | null;
  deliverability: Deliverability;
  softBounceCount: number;
  sendCount: number;
  lastSentAt: string | null;
  lastOpenedAt: string | null;
  lastRepliedAt: string | null;
  /** Latest of sent / opened / replied. */
  lastActivityAt: string | null;
  /** Deliverability allows sending to this address. */
  eligible: boolean;
  /** Confirmed, but delivery says it no longer works. */
  needsReverification: boolean;
  isArchived: boolean;
  createdAt: string;
};

export type LeadEmailsResponse = {
  ok: true;
  leadId: string;
  count: number;
  data: LeadEmail[];
};

export type LeadEmailEvent = {
  id: string;
  eventType: string;
  occurredAt: string;
  actor: string;
  userId: string | null;
  rawPayload: unknown;
};

export type AddLeadEmailBody = {
  address: string;
  /** The agent verified this address with the contact (recorded as "phone"). */
  confirm?: boolean;
  note?: string;
};

export type RecipientMode =
  | "all_confirmed"
  | "all_researched"
  | "rotation"
  | "manual";

export type RecipientBlockReason =
  | "suppressed"
  | "email_blocked"
  | "no_eligible_address";

export type EmailRecipientsResponse = {
  ok: true;
  mode: RecipientMode | null;
  blockedReason: RecipientBlockReason | null;
  warnings: string[];
  /** What the resolver would send to. */
  recipients: LeadEmail[];
  /** Every other active address, so an agent can add one deliberately. */
  others: LeadEmail[];
};

/** Error code the backend returns while LEAD_EMAILS_* flags are off. */
export const LEAD_EMAILS_DISABLED = "LEAD_EMAILS_DISABLED";
