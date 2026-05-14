export type LeadImportRow = {
  rowNumber: number;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  phoneExtension: string;
  email: string;
  role: string;
  companyName: string;
  companySymbol: string;
  timezone: string;
  country: string;
};

export type InvalidLeadRow = LeadImportRow & {
  missingFields: string[];
  validationErrors: { field: string; error: string }[];
};

export type IncompleteLeadRow = LeadImportRow & {
  missingFields: string[];
};

export type CompanyNotExistLeadRow = LeadImportRow & {
  reason: string;
};

export type DuplicateLeadRow = LeadImportRow & {
  reason: string;
};

export type ValidLeadRow = LeadImportRow;

export type LeadImportResult = {
  ok: boolean;
  totalRows: number;
  invalidCount: number;
  incompleteCount: number;
  companyNotExistCount: number;
  duplicateCount: number;
  validCount: number;
  importedCount: number;
  invalidRows: InvalidLeadRow[];
  incompleteRows: IncompleteLeadRow[];
  companyNotExistRows: CompanyNotExistLeadRow[];
  duplicateRows: DuplicateLeadRow[];
  validRows: ValidLeadRow[];
};
