import {
  getCompanySymbol,
  getCompanySymbolOptions,
  getLeadId,
  getLeadIdOptions,
  timezoneOptions,
} from "@/features/backoffice-shared/constants";

export type FixLeadRow = {
  lead: string;
  companyName: string;
  timezone: string;
  name: string;
  phone: string;
  fixEntryDate: string;
  email: string;
  otherContacts: string;
};

export type FixLeads24HourTabKey =
  | "sent-to-fix"
  | "fixed"
  | "new"
  | "cant-locate";

export type FixLeads24HourTab = {
  key: FixLeads24HourTabKey;
  label: string;
  data: FixLeadRow[];
};

const fixQueueData: FixLeadRow[] = [
  {
    lead: "1001",
    companyName: "Northstar BioLabs",
    timezone: "EST",
    name: "Jordan Ellis",
    phone: "(617) 555-0182",
    fixEntryDate: "2026-04-28",
    email: "jordan.ellis@northstarbio.com",
    otherContacts: "2 contacts",
  },
  {
    lead: "1002",
    companyName: "Silverline Capital",
    timezone: "CST",
    name: "Camila Foster",
    phone: "(312) 555-0104",
    fixEntryDate: "2026-04-28",
    email: "camila.foster@silverlinecap.com",
    otherContacts: "1 contact",
  },
  {
    lead: "1003",
    companyName: "Harbor Peak Systems",
    timezone: "PST",
    name: "Noah Bennett",
    phone: "(415) 555-0129",
    fixEntryDate: "2026-04-27",
    email: "noah.bennett@harborpeak.io",
    otherContacts: "3 contacts",
  },
  {
    lead: "1004",
    companyName: "Blue Arc Health",
    timezone: "MST",
    name: "Avery Coleman",
    phone: "(720) 555-0176",
    fixEntryDate: "2026-04-27",
    email: "avery.coleman@bluearchealth.com",
    otherContacts: "1 contact",
  },
  {
    lead: "1005",
    companyName: "Vantage Ridge Media",
    timezone: "GMT",
    name: "Liam Patel",
    phone: "(646) 555-0151",
    fixEntryDate: "2026-04-26",
    email: "liam.patel@vantageridge.co",
    otherContacts: "4 contacts",
  },
  {
    lead: "1006",
    companyName: "Everfield Logistics",
    timezone: "EST",
    name: "Sofia Kim",
    phone: "(404) 555-0141",
    fixEntryDate: "2026-04-26",
    email: "sofia.kim@everfieldlogistics.com",
    otherContacts: "2 contacts",
  },
];

const sentToFix24HourData: FixLeadRow[] = fixQueueData.slice(0, 4);
const fixed24HourData: FixLeadRow[] = [
  {
    lead: "1012",
    companyName: "Crestwell Foods",
    timezone: "CST",
    name: "Mason Reed",
    phone: "(214) 555-0118",
    fixEntryDate: "2026-04-28",
    email: "mason.reed@crestwellfoods.com",
    otherContacts: "1 contact",
  },
  {
    lead: "1013",
    companyName: "Axis Harbor Tech",
    timezone: "PST",
    name: "Emma Brooks",
    phone: "(510) 555-0108",
    fixEntryDate: "2026-04-28",
    email: "emma.brooks@axisharbor.com",
    otherContacts: "2 contacts",
  },
  {
    lead: "1014",
    companyName: "Brightline Commerce",
    timezone: "EST",
    name: "Henry Young",
    phone: "(212) 555-0135",
    fixEntryDate: "2026-04-28",
    email: "henry.young@brightlinecommerce.com",
    otherContacts: "1 contact",
  },
];

const new24HourData: FixLeadRow[] = [
  {
    lead: "1021",
    companyName: "Redwood Dental Group",
    timezone: "MST",
    name: "Scarlett Hayes",
    phone: "(303) 555-0101",
    fixEntryDate: "2026-04-28",
    email: "scarlett.hayes@redwooddental.com",
    otherContacts: "2 contacts",
  },
  {
    lead: "1022",
    companyName: "Lakefront Advisors",
    timezone: "EST",
    name: "Daniel Ward",
    phone: "(917) 555-0160",
    fixEntryDate: "2026-04-28",
    email: "daniel.ward@lakefrontadvisors.com",
    otherContacts: "3 contacts",
  },
];

const cantLocate24HourData: FixLeadRow[] = [
  {
    lead: "1031",
    companyName: "Meridian Point Labs",
    timezone: "GMT",
    name: "Grace Turner",
    phone: "(332) 555-0121",
    fixEntryDate: "2026-04-28",
    email: "grace.turner@meridianlabs.io",
    otherContacts: "1 contact",
  },
  {
    lead: "1032",
    companyName: "Pioneer Fieldworks",
    timezone: "CST",
    name: "Owen Scott",
    phone: "(281) 555-0198",
    fixEntryDate: "2026-04-28",
    email: "owen.scott@pioneerfieldworks.com",
    otherContacts: "2 contacts",
  },
];

export const fixLeads24HourTabs: FixLeads24HourTab[] = [
  {
    key: "sent-to-fix",
    label: "24hr Sent To Fix",
    data: sentToFix24HourData,
  },
  {
    key: "fixed",
    label: "24hr Fixed",
    data: fixed24HourData,
  },
  {
    key: "new",
    label: "24hr New",
    data: new24HourData,
  },
  {
    key: "cant-locate",
    label: "24hr Can't Locate",
    data: cantLocate24HourData,
  },
];

export {
  fixQueueData,
  getCompanySymbol,
  getCompanySymbolOptions,
  getLeadId,
  getLeadIdOptions,
  timezoneOptions,
};
