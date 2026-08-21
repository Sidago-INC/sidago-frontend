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

// The Calls Log sidebar. Counts span the agent's WHOLE row-set, not the loaded
// page — the page used to render "500" for a bucket holding 10,818 leads
// because it counted what had arrived rather than what exists.
export type CallsLogSummaryResponse = {
  ok: boolean;
  agentSlug: string;
  brandCode: string;
  groups: CallsLogGroup[];
  total: number;
};

export type CallsLogGroup = {
  leadType: string;
  total: number;
  /** Ordered EST, CST, MST, PST, then the no-timezone bucket ("") last. */
  timezones: { timezone: string; count: number }[];
};

// One page of one (leadType, timezone) bucket.
export type CallsLogPageResponse = {
  ok: boolean;
  agentSlug: string;
  brandCode: string;
  data: QueueLead[];
  meta: {
    total_count: number;
    per_page: number;
    current_page: number;
    total_pages: number;
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
  // Served by the detail endpoint so the "All Company Contacts" card no longer
  // has to be stitched together from whichever rows the page happens to hold.
  contactType?: string | null;
  leadType?: string | null;
  companyName?: string | null;
  companySymbol?: string | null;
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
  /** Assigned agent display name when provided by brand-state list/detail. */
  toBeCalledBy?: string | null;
  /** Preferred display-name field from lead detail / brand-state APIs. */
  toBeCalledByName?: string | null;
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
    /** The lead's own free-text secondary contacts — NOT the related-lead list. */
    otherContacts: string | null;
    notWorkAnymore: boolean;
    companyId: string;
    counterB: number;
    counterF: number;
    counterFixes: number;
    /** Cross-brand last action timestamp when provided by lead detail. */
    lastActionDate?: string | null;
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
  /** Some detail payloads surface this at the root instead of under lead. */
  lastActionDate?: string | null;
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
