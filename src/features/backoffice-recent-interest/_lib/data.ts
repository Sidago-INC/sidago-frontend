import { generateRecentInterestRows } from "@/features/backoffice-shared/lead-mapper";

export type RecentInterestRow = {
  followUpDate: string;
  followUpDateCleaned: string;
  lead: string;
  campaignType: string;
  contactPerson: string;
  companyName: string;
  email: string;
  assignedTo: string;
  callResult: string;
  leadType: string;
  notes: string;
  phone: string;
  timezone: string;
  created?:string;
};

export const recentInterestLeadOptions = [
  "Interested",
  "Qualified",
  "Follow Up",
  "Re-Engaged",
  "Hot Lead",
];

export const recentInterestCampaignOptions = [
  "Current Interest",
  "Reactivation",
  "Inbound",
  "Outbound",
  "Referral",
];

export const recentInterestAssigneeOptions = [
  "Hasib",
  "Nafis",
  "Asha",
  "Rafi",
  "Maliha",
  "Tanvir",
];

export const recentInterestCallResultOptions = [
  "Interested",
  "Call Lead Back",
  "No Answer",
  "Left Message",
  "Meeting Booked",
  "Qualified",
];

export const recentInterestLeadTypeOptions = [
  "Hot",
  "Warm",
  "Cold",
  "General",
  "Referral",
];

export const svgRecentInterestData: RecentInterestRow[] = generateRecentInterestRows(10);
export const rm95RecentInterestData: RecentInterestRow[] = generateRecentInterestRows(10);
export const bentonRecentInterestData: RecentInterestRow[] = generateRecentInterestRows(10);
