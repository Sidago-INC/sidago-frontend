import { BRAND_OPTIONS, type BRAND } from "@/types/brand.types";
import type { LEAD_TYPE } from "@/types/lead-type.types";
import type { Level2BoardRow } from "./board";

/**
 * A row of the Level 2 Update grid.
 *
 * Two kinds share this shape:
 *
 *   local  — just added with the Add Lead button and not yet on the server.
 *            `level_2_requests.lead_id` and `.brand_id` are NOT NULL, so a row
 *            cannot be shared until it has both a lead and a campaign. It is
 *            promoted to a draft the moment the second one is picked.
 *
 *   server — a shared draft everyone can see, or a result logged today.
 *            `status` tells them apart, and `serverId` is the row's real id.
 */
export type Level2UpdateRow = {
  /** Grid key. Local rows use "l2u-new-<n>"; server rows use their uuid. */
  id: string;
  /** Set once the row exists in the database. */
  serverId?: string;
  status: "local" | "draft" | "queued" | "processing" | "processed" | string;
  // Lead picker stores the UUID as the value. `lead_label` is
  // "<company_symbol>-<full_name>" for display, sorting, and grouping.
  lead: string;
  lead_label: string;
  campaign: BRAND | "";
  level_2_agent: string;
  level_2_result_update: string;
  updated_notes: string;
  call_back_date: string;
  // Read-only. Today's date while the row is local, then the server's
  // created_at. It is never sent to the API — the column used to render a date
  // picker that wrote to nothing.
  created_date: string;
  // Read-only — the lead's current per-brand types while the row is a draft,
  // and the snapshot the update produced once it has been logged.
  lead_type_sidago: LEAD_TYPE | "";
  lead_type_benton: LEAD_TYPE | "";
  lead_type_95rm: LEAD_TYPE | "";
  /** Who put the row on the board. Blank for local rows. */
  submitted_by: string;
};

/** A row that has been submitted can no longer be edited, only reverted. */
export function isLoggedRow(row: Level2UpdateRow): boolean {
  return row.status !== "local" && row.status !== "draft";
}

/** Still waiting on the worker, so its lead types are not decided yet. */
export function isPendingRow(row: Level2UpdateRow): boolean {
  return row.status === "queued" || row.status === "processing";
}

// The 14 result options the agent can pick from when updating a Level 2 row.
// Matches the spec from the Level 2 Update brief verbatim.
export const level2ResultUpdateOptions = [
  { label: "Interested", value: "Interested" },
  { label: "Call back Lead", value: "Call back Lead" },
  { label: "needs more time", value: "needs more time" },
  { label: "no answer", value: "no answer" },
  { label: "left message", value: "left message" },
  { label: "bad number", value: "bad number" },
  { label: "wrong number", value: "wrong number" },
  { label: "not interested", value: "not interested" },
  { label: "DNC", value: "DNC" },
  { label: "Contract Closed", value: "Contract Closed" },
  { label: "Force Fix", value: "Force Fix" },
  { label: "Force General", value: "Force General" },
  { label: "Force Void", value: "Force Void" },
  { label: "Block Email to", value: "Block Email to" },
];

export const level2UpdateCampaignOptions = BRAND_OPTIONS.map((option) => ({
  ...option,
  label: option.value === "BENTON" ? "Benton" : option.label,
}));

// The user's own date, not UTC. `toISOString()` would stamp a row added after
// ~7pm Eastern with tomorrow's date.
function todayLocal(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function createEmptyLevel2UpdateRow(nextId: number): Level2UpdateRow {
  return {
    id: `l2u-new-${nextId}`,
    status: "local",
    lead: "",
    lead_label: "",
    campaign: "",
    level_2_agent: "",
    level_2_result_update: "",
    updated_notes: "",
    call_back_date: "",
    created_date: todayLocal(),
    lead_type_sidago: "",
    lead_type_benton: "",
    lead_type_95rm: "",
    submitted_by: "",
  };
}

/** Brand code as the API speaks it -> the frontend's BRAND value. */
export function brandFromCode(code: string | null): BRAND | "" {
  if (code === "svg") return "SVG";
  if (code === "benton") return "BENTON";
  if (code === "95rm") return "95RM";
  return "";
}

/** The reverse — what the API expects in a request body. */
export function brandCodeFor(brand: BRAND | ""): "svg" | "95rm" | "benton" | null {
  if (brand === "SVG") return "svg";
  if (brand === "BENTON") return "benton";
  if (brand === "95RM") return "95rm";
  return null;
}

export function boardRowToUpdateRow(row: Level2BoardRow): Level2UpdateRow {
  return {
    id: row.id,
    serverId: row.id,
    status: row.status,
    lead: row.leadId,
    lead_label: row.leadLabel,
    campaign: brandFromCode(row.campaign),
    level_2_agent: row.level2AgentName ?? "",
    level_2_result_update: row.resultUpdate ?? "",
    updated_notes: row.updatedNotes ?? "",
    call_back_date: row.callBackDate ?? "",
    created_date: row.createdAt ? row.createdAt.slice(0, 10) : "",
    lead_type_sidago: (row.leadTypeSvg ?? "") as LEAD_TYPE | "",
    lead_type_benton: (row.leadTypeBenton ?? "") as LEAD_TYPE | "",
    lead_type_95rm: (row.leadType95rm ?? "") as LEAD_TYPE | "",
    submitted_by: row.submittedByName ?? "",
  };
}
