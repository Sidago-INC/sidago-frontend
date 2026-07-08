export type QueueLead = {
  leadId: string;
  leadIdExternal: string;
  fullName: string;
  phone: string;
  phoneExtension: string | null;
  email: string;
  role: string;
  timezone: string;
  contactType: string;
  leadType: string;
  lastCalledDate: string | null;
  followUpDate: string | null;
  companyId: string;
  companyName: string;
  companySymbol: string | null;
  notWorkAnymore: boolean;
  matchedBlock: number;
  timezonePriority: string;
};

export type QueueResponse = {
  ok: boolean;
  agentSlug: string;
  brandCode: string;
  count: number;
  counts: { hot: number; general: number };
  data: QueueLead[];
};

export type CallsLogResponse = {
  ok: boolean;
  agentSlug: string;
  brandCode: string;
  counts: { hot: number; general: number };
  data: {
    hot: QueueLead[];
    general: QueueLead[];
  };
};

export type HistoryByBrand = Record<string, HistoryEntry[]>;

export type HistoryEntry = {
  id: string;
  calledAt: string;
  resultCode: string;
  notes: string | null;
  agentName: string;
  durationSeconds: number | null;
  source: string;
  mightyCallId: string | null;
};

export type RelatedContact = {
  id: string;
  fullName: string;
  role: string;
  phone: string;
  email: string;
};

export type BrandState = {
  brandId: string;
  brandCode: string;
  leadType: string;
  lastCalledDate: string | null;
  followUpDate: string | null;
  nextFollowUpDate: string | null;
  dateBecameHot: string | null;
  dateBecameIgnore: string | null;
  callResultCode: string | null;
  toBeCalledByUserId: string | null;
  lastFixedDate: string | null;
};

export type LeadDetailResponse = {
  ok: boolean;
  lead: {
    id: string;
    leadIdExternal: string;
    fullName: string;
    phone: string;
    phoneExtension: string | null;
    email: string;
    role: string;
    timezone: string;
    contactType: string;
    notWorkAnymore: boolean;
    companyId: string;
    counterB: number;
    counterF: number;
    counterFixes: number;
  };
  company: {
    id: string;
    companyName: string;
    companySymbol: string | null;
    timezone: string;
  };
  brandState: BrandState;
  peerBrandStates: BrandState[];
  history: HistoryEntry[] | HistoryByBrand;
  relatedContacts: RelatedContact[];
};

export type LogResultBody = {
  agentSlug: string;
  leadId: string;
  callId?: string;
  resultCode: string;
  notes?: string;
  followUpDate?: string;
  durationSeconds?: number;
  mightyCallId?: string;
  source?: string;
};

export type DialResponse = {
  ok: boolean;
  callId: string;
  mightyCallId: string | null;
  to: string;
  from: string;
  testMode: boolean;
  upstreamStatus: string;
};
