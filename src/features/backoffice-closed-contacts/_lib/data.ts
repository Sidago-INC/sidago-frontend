export type ClosedContactRow = {
  // UUID from leads.id — populated by server-side report API. Optional only
  // because the type may also be used in dev contexts without DB data.
  leadId?: string;
  lead: string;
  companyName: string;
  fullName: string;
  phone: string;
  email: string;
  timezone: string;
  contactType: string;
  leadType: string;
  svgLeadType: string;
  bentonLeadType: string;
  rm95LeadType: string;
  svgToBeCalledBy: string;
  bentonToBeCalledBy: string;
  rm95ToBeCalledBy: string;
  callBackDate: string;
  lastActionDate: string;
  brand: string;
};

export type ClosedContactsTabKey =
  | "svg-current"
  | "svg-historical"
  | "rm95-current"
  | "rm95-historical"
  | "benton-current"
  | "benton-historical"
  | "all-closed-contracts";

export type ClosedContactsBrand = "svg" | "95rm" | "benton";
export type ClosedContactsCategory = "current" | "historical" | "all";

export type ClosedContactsTab = {
  key: ClosedContactsTabKey;
  label: string;
  title: string;
  brand?: ClosedContactsBrand;
  category: ClosedContactsCategory;
};

export const closedContactsTabs: ClosedContactsTab[] = [
  {
    key: "svg-current",
    label: "SVG Current",
    title: "Closed Contacts - SVG Current",
    brand: "svg",
    category: "current",
  },
  {
    key: "svg-historical",
    label: "SVG Historical",
    title: "Closed Contacts - SVG Historical",
    brand: "svg",
    category: "historical",
  },
  {
    key: "rm95-current",
    label: "95RM Current",
    title: "Closed Contacts - 95RM Current",
    brand: "95rm",
    category: "current",
  },
  {
    key: "rm95-historical",
    label: "95RM Historical",
    title: "Closed Contacts - 95RM Historical",
    brand: "95rm",
    category: "historical",
  },
  {
    key: "benton-current",
    label: "Benton Current",
    title: "Closed Contacts - Benton Current",
    brand: "benton",
    category: "current",
  },
  {
    key: "benton-historical",
    label: "Benton Historical",
    title: "Closed Contacts - Benton Historical",
    brand: "benton",
    category: "historical",
  },
  {
    key: "all-closed-contracts",
    label: "All Closed Contracts",
    title: "All Closed Contracts",
    category: "all",
  },
];

export {
  leadOptions,
  contactTypeOptions,
  leadTypeOptions,
  assigneeOptions,
  timezoneOptions,
  getCompanySymbol,
  getCompanySymbolOptions,
  getLeadId,
  getLeadIdOptions,
} from "@/features/backoffice-shared/constants";
