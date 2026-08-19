export type SmsQueueItem = {
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
  smsStatus: string | null;
  smsCount: number;
  isSmsLogged: boolean;
  lastSmsSentAt: string | null;
  notWorkAnymore: boolean;
};

export type SmsQueueResponse = {
  ok: true;
  agentSlug: string;
  brandCode: string;
  count: number;
  data: SmsQueueItem[];
  meta?: {
    total_count: number;
    per_page: number;
    current_page: number;
    total_pages: number;
    groups?: { value: string; count: number }[];
  };
};

export type SmsHistoryEntry = {
  id: string;
  sentAt: string;
  body: string | null;
  status: string | null;
  userName: string | null;
};

export type SmsHistoryResponse = {
  ok: true;
  count: number;
  data: SmsHistoryEntry[];
};

export type SmsStatePatchBody = {
  isSmsLogged?: boolean;
};

export type SmsLogBody = {
  leadId: string;
  brandCode: string;
  body: string;
  status: string;
};
