export type ExtraBrandState = {
  leadType: string | null;
  toBeCalledBy: string | null;
  lastCalledDate: string | null;
  dateBecomeHot: string | null;
};

// Keyed by brand code. Holds only brands added after svg, 95rm and benton.
export type ExtraBrandStates = Record<string, ExtraBrandState>;

export type HotLeadRow = {
  // UUID from leads.id — populated by server-side report APIs and used as the
  // target for PATCH /api/leads/:leadId. Optional because mock-data generators
  // still produce HotLeadRow objects without UUIDs in dev/storybook contexts.
  leadId?: string;
  lead: string;
  companyName: string;
  companySymbol: string;
  fullName: string;
  phone: string;
  role?: string;
  email: string;
  timezone: string;
  contactType: string;
  svgLeadType: string;
  svgToBeCalledBy: string;
  svgLastCallDate: string;
  bentonLeadType: string;
  bentonToBeCalledBy: string;
  bentonLastCallDate: string;
  rm95LeadType: string;
  rm95ToBeCalledBy: string;
  rm95LastCallDate: string;
  svgDateBecomeHot: string;
  bentonDateBecomeHot: string;
  rm95DateBecomeHot: string;
  lastActionDate: string;
  lastFixedDate?: string;
  notWorked?: boolean;
  extraBrandStates?: ExtraBrandStates;
  // Ever Been Hot rows for an added brand.
  phaseToBeCalledBy?: string | null;
  phaseDateBecomeHot?: string | null;
};
