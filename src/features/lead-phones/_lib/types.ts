// One phone number on a lead, as the backend's lead_phones row returns it.
// A lead can hold several; exactly one live number at most is preferred.
// Numbers are never deleted - a removed number is retired (retiredAt set).

export const LEAD_PHONE_STATUSES = [
  "active",
  "unknown",
  "wrong_person",
  "invalid_number",
  "disconnected_number",
] as const;

export type LeadPhoneStatus = (typeof LEAD_PHONE_STATUSES)[number];

/**
 * What Numverify said about a number. 'unverified' = never checked (or
 * verification is off); 'pending' = queued, the answer is not in yet.
 */
export type VerificationStatus = "unverified" | "pending" | "valid" | "invalid";

/** What the backend reports about one number it just saved. */
export type NumberCheck = {
  phoneE164: string;
  verification: VerificationStatus;
  /** Why it could not be checked right now; absent when it was answered. */
  reason?: "disabled" | "quota" | "unavailable";
  lineType?: string | null;
  carrier?: string | null;
};

export type LeadPhone = {
  id: string;
  leadId: string;
  /** E.164, e.g. +16046020001. */
  phoneE164: string;
  extension: string | null;
  source: "research" | "agent" | "import" | "migration";
  status: LeadPhoneStatus;
  isPreferred: boolean;
  /** Validation is per number: Validated numbers get more attempts before Fix. */
  contactType: "Validated" | "Prospecting";
  /** No Answer count for this number. */
  counterF: number;
  /** Bad / Wrong Number count for this number. */
  counterB: number;
  firstSeenAt: string;
  lastAttemptedAt: string | null;
  lastSuccessAt: string | null;
  attemptCount: number;
  retiredAt: string | null;
  /** Numverify's verdict on the number; 'invalid' also sets status invalid_number. */
  verificationStatus: VerificationStatus;
  verifiedAt: string | null;
  /** mobile, landline, ... - as reported by Numverify. */
  lineType: string | null;
  carrier: string | null;
};

/** Statuses that keep a number in rotation. */
export const DIALABLE_STATUSES: readonly LeadPhoneStatus[] = ["active", "unknown"];

export function isDialable(phone: Pick<LeadPhone, "status" | "retiredAt">): boolean {
  return phone.retiredAt === null && DIALABLE_STATUSES.includes(phone.status);
}
