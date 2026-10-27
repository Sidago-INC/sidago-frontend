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

/**
 * Automated (NeverBounce) result — a separate fact from the agent's
 * `verification`. An agent-verified address is not thereby "valid" here.
 */
export type AutoVerification =
  | "unchecked"
  | "valid"
  | "invalid"
  | "disposable"
  | "catchall"
  | "unknown";

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
  autoVerification: AutoVerification;
  autoVerifiedAt: string | null;
  /** Agent-verified OR NeverBounce-valid: takes part in the rotation. */
  verified: boolean;
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
  /**
   * Set when this send is a resend of `stage`'s email to the next verified
   * address (no reply after 3 days); null for a new stage email.
   */
  rotation?: { id: string; stage: string; step: number } | null;
};

/** Error code the backend returns while LEAD_EMAILS_* flags are off. */
export const LEAD_EMAILS_DISABLED = "LEAD_EMAILS_DISABLED";

/**
 * A verified-address rotation (backend email_rotations). Agents send by hand;
 * with no reply after 3 days the lead comes back in the queue with the next
 * verified address pre-selected.
 */
export type EmailRotation = {
  id: string;
  brandId: string;
  workflow: "general" | "hot";
  /** The stage email being resent to each verified address in turn. */
  stage: string;
  status: "active" | "replied" | "exhausted" | "cancelled" | "superseded";
  /** Verified addresses emailed so far. */
  step: number;
  /** When the next address is due (null while the resend is in the queue). */
  nextDueAt: string | null;
  /** Set while the lead is back in the queue for the next address. */
  requeuedAt: string | null;
  lastSentAt: string | null;
  stopReason: string | null;
  stoppedAt: string | null;
  createdAt: string;
  sends: { toAddress: string | null; leadEmailId: string | null; sentAt: string | null }[];
};

export type EmailRotationsResponse = {
  ok: true;
  /** EMAIL_ROTATION_ENABLED on the server. */
  enabled: boolean;
  data: EmailRotation[];
};
