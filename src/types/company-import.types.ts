export type CompanyImportRow = {
  rowNumber: number;
  symbol: string;
  name: string;
  timezone: string;
  country: string;
  description: string;
  estimatedMarketCap: string;
  primaryVenue: string;
  city: string;
  state: string;
  website: string;
  twitterHandle: string;
  zip: string;
};

export type InvalidCompanyRow = CompanyImportRow & {
  missingFields: string[];
  validationErrors: { field: string; error: string }[];
};

export type IncompleteCompanyRow = CompanyImportRow & {
  missingFields: string[];
};

export type DuplicateCompanyRow = CompanyImportRow & {
  reason: string;
};

export type ValidCompanyRow = CompanyImportRow;

export type CompanyImportResult = {
  ok: boolean;
  totalRows: number;
  invalidCount: number;
  incompleteCount: number;
  duplicateCount: number;
  validCount: number;
  importedCount: number;
  invalidRows: InvalidCompanyRow[];
  incompleteRows: IncompleteCompanyRow[];
  duplicateRows: DuplicateCompanyRow[];
  validRows: ValidCompanyRow[];
};
