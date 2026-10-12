export type EmailQueueItem = {
  id: string;
  leadId: string;
  leadIdExternal: string | null;
  companySymbol: string | null;
  companyName: string | null;
  fullName: string | null;
  phone: string | null;
  email: string | null;
  timezone: string | null;
  contactType: string | null;
  leadType: string | null;
  callBackDate: string | null;
  lastCalledDate: string | null;
  emailStatus: string | null;
  emailCount: number;
  isEmailLogged: boolean;
  isToBeSentEmail: boolean;
  isEmailBlocked: boolean;
  isMissingDeadEmail: boolean;
  lastEmailSentAt: string | null;
  notWorkAnymore: boolean;
  companyId: string | null;
  // Only present when the backend resolves recipients from lead_emails
  // (LEAD_EMAILS_READS). The page still works from `email` without them.
  recipients?: {
    id: string;
    address: string;
    verification: string;
    deliverability: string;
  }[];
  recipientMode?: string | null;
  recipientBlockedReason?: string | null;
  recipientWarnings?: string[];
};

export type EmailQueueResponse = {
  ok: true;
  agentSlug: string;
  brandCode: string;
  count: number;
  data: EmailQueueItem[];
  meta?: {
    total_count: number;
    per_page: number;
    current_page: number;
    total_pages: number;
    groups?: { value: string; count: number }[];
  };
};

export type EmailHistoryEntry = {
  id: string;
  sentAt: string;
  subject: string | null;
  body: string | null;
  status: string | null;
  userName: string | null;
  // Which address the email went to (null on logs from before per-address
  // tracking) and the send action it belonged to.
  toAddress?: string | null;
  sendGroupId?: string | null;
  recipientMode?: string | null;
};

export type EmailHistoryResponse = {
  ok: true;
  count: number;
  data: EmailHistoryEntry[];
};

export type EmailStatePatchBody = {
  isEmailLogged?: boolean;
  isToBeSentEmail?: boolean;
  isEmailBlocked?: boolean;
  isMissingDeadEmail?: boolean;
};

export type EmailLogBody = {
  leadId: string;
  brandCode: string;
  subject: string;
  body: string;
  status: string;
  /** lead_emails ids the agent sent to. Omit to let the backend resolve them. */
  recipientIds?: string[];
};

export type EmailLogResponse = {
  ok: true;
  id: string;
  emailStatus?: string;
  /** Present when the send was attributed to specific addresses. */
  ids?: string[];
  sendGroupId?: string;
  recipientMode?: string;
  recipients?: { id: string; address: string }[];
  warnings?: string[];
};
