// Mirrors the backend's import plan (sidago-backend/src/bulk-import/dto).
//
// The import is three steps, and nothing is written until the last one:
//   1. upload    POST /imports/leads          -> { jobId, mode }
//   2. review    GET  /imports/jobs/:jobId    -> the plan; PATCH/DELETE rows
//   3. approve   POST /imports/jobs/:jobId/commit
//
// Values in the plan are already normalised by the backend — "+1" applied,
// extra phone numbers split off, emails joined, HTML entities decoded. Each row
// carries a `transforms` list saying, in plain words, what was changed, so the
// operator can see why the preview differs from their spreadsheet.

/** Which shape of sheet the backend detected from the column headings. */
export type LeadSheetMode = "person" | "company";

export type ImportJobStatus =
  | "analyzing"
  | "ready"
  | "committing"
  | "completed"
  | "failed"
  // Only produced by the legacy company file import.
  | "running";

export type PlanCompanyAction = "create" | "exists";
export type PlanLeadStatus = "valid" | "invalid" | "duplicate";

/**
 * Where a value came from. "default" is the one that matters on screen — it
 * means the backend supplied EST/USA because the sheet had nothing, and the
 * operator should check it before approving.
 */
export type ValueSource = "file" | "default" | "company";

export type PlanCompany = {
  rowId: string;
  symbol: string;
  name: string;
  timezone: string;
  country: string;
  /** "exists" — already in the CRM, and an import never modifies it. */
  action: PlanCompanyAction;
  existingCompanyId: string | null;
  sources: { timezone: ValueSource; country: ValueSource };
  /** Spreadsheet rows that referenced this company. */
  sourceRows: number[];
  issues: string[];
  excluded: boolean;
};

export type PlanLeadIssue = { field: string; error: string };

export type PlanLead = {
  rowId: string;
  /** 1-indexed row in the operator's own file. */
  rowNumber: number;
  companySymbol: string;
  companyName: string;
  fullName: string;
  phone: string;
  otherContacts: string;
  email: string;
  role: string;
  phoneExtension: string;
  timezone: string;
  status: PlanLeadStatus;
  issues: PlanLeadIssue[];
  transforms: string[];
  excluded: boolean;
};

export type ImportPlanTotals = {
  fileRows: number;
  companiesToCreate: number;
  companiesExisting: number;
  leadsValid: number;
  leadsInvalid: number;
  leadsDuplicate: number;
  leadsExcluded: number;
};

export type ImportPlan = {
  fileName: string;
  mode: LeadSheetMode;
  modeWasOverridden: boolean;
  detectedHeaders: string[];
  totals: ImportPlanTotals;
  companies: PlanCompany[];
  leads: PlanLead[];
};

export type CommitFailure = {
  rowNumber: number;
  target: "company" | "lead";
  reason: string;
};

export type CommitResult = {
  companiesCreated: number;
  companiesSkipped: number;
  leadsCreated: number;
  leadsFailed: number;
  failures: CommitFailure[];
};

export type ImportJob = {
  id: string;
  kind: "leads" | "companies" | "plan";
  status: ImportJobStatus;
  userId: string;
  processed: number;
  total: number;
  plan?: ImportPlan;
  commit?: CommitResult;
  error?: string;
  createdAt: number;
  updatedAt: number;
};

/** Fields the operator may correct on a staged lead. */
export type PatchPlanLead = Partial<
  Pick<
    PlanLead,
    | "fullName"
    | "phone"
    | "otherContacts"
    | "email"
    | "role"
    | "phoneExtension"
    | "timezone"
    | "excluded"
  >
>;

/** Fields the operator may correct on a staged company. */
export type PatchPlanCompany = Partial<
  Pick<PlanCompany, "name" | "timezone" | "country" | "excluded">
>;

/**
 * The job is held in the backend's memory, so a server restart drops it. The
 * API answers 404, and the UI must say "upload again" rather than showing a
 * generic failure — nothing was written, so nothing is broken.
 */
export const IMPORT_JOB_GONE = "IMPORT_JOB_GONE";
