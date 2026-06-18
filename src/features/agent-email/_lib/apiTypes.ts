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
};

export type EmailQueueResponse = {
  ok: true;
  agentSlug: string;
  brandCode: string;
  count: number;
  data: EmailQueueItem[];
};

export type EmailHistoryEntry = {
  id: string;
  sentAt: string;
  subject: string | null;
  body: string | null;
  status: string | null;
  userName: string | null;
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
};
