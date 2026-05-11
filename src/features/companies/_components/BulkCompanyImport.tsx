

import { BulkImportPage } from "@/components/ui";
import { downloadWorkbook } from "@/lib/excel";
import { validateForm } from "@/lib/validation";
import { companyValidationSchema } from "@/lib/validation/company";
import { useBulkWorkbookImport } from "@/hooks/useBulkWorkbookImport";
import { COUNTRY_OPTIONS } from "@/types/country.types";
import { TIMEZONE_OPTIONS } from "@/types/timezone.types";
import { type COMPANY } from "@/types/company.types";
import { getStoredCompanies, saveStoredCompanies } from "../_lib/storage";

const FILE_INPUT_ACCEPT =
  ".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const TEMPLATE_COLUMNS: Array<keyof COMPANY> = [
  "symbol",
  "name",
  "timezone",
  "country",
  "description",
  "estimatedMarketCap",
  "primaryVenue",
  "city",
  "state",
  "website",
  "twitterHandle",
  "zip",
];

const REQUIRED_COLUMNS = TEMPLATE_COLUMNS;

const templateExampleRow: COMPANY = {
  symbol: "ALP",
  name: "Alpha Ridge Partners",
  timezone: "1-EST",
  country: "United States",
  description: "Workflow intelligence software for distributed finance teams.",
  estimatedMarketCap: "$1.4B",
  primaryVenue: "NASDAQ",
  city: "Chicago",
  state: "IL",
  website: "https://alpharidge.example",
  twitterHandle: "@alpharidge",
  zip: "60601",
};

const INFO_CARDS = [
  {
    label: "Required Fields",
    value: "All template columns are required.",
  },
  {
    label: "Symbol Rule",
    value:
      "Company symbols must be unique in the system and within the uploaded file.",
  },
  {
    label: "Format Rules",
    value:
      "Website, market cap, timezone, country, and X handle values must match the company validation rules.",
  },
] as const;

function normalizeSymbol(value: string) {
  return value.trim().toUpperCase();
}

function normalizeCompany(values: Record<string, string>): COMPANY {
  return {
    symbol: normalizeSymbol(values.symbol ?? ""),
    name: values.name?.trim() ?? "",
    timezone: (values.timezone?.trim() ?? "") as COMPANY["timezone"],
    country: (values.country?.trim() ?? "") as COMPANY["country"],
    description: values.description?.trim() ?? "",
    estimatedMarketCap: values.estimatedMarketCap?.trim() ?? "",
    primaryVenue: values.primaryVenue?.trim() ?? "",
    city: values.city?.trim() ?? "",
    state: values.state?.trim() ?? "",
    website: values.website?.trim() ?? "",
    twitterHandle: values.twitterHandle?.trim() ?? "",
    zip: values.zip?.trim() ?? "",
  };
}

function getCompanyImportSuccessMessage(
  importedCount: number,
  skippedCount: number,
) {
  return `${importedCount} compan${importedCount === 1 ? "y" : "ies"} imported successfully, ${skippedCount} skipped due to errors.`;
}

export function BulkCompanyImport() {
  const {
    fileInputRef,
    selectedFileName,
    isProcessing,
    summary,
    failedRows,
    handleUploadClick,
    handleFileChange,
  } = useBulkWorkbookImport<COMPANY, COMPANY, keyof COMPANY>({
    columns: TEMPLATE_COLUMNS,
    requiredColumns: REQUIRED_COLUMNS,
    normalizeRow: normalizeCompany,
    getStoredRows: getStoredCompanies,
    saveStoredRows: saveStoredCompanies,
    getExistingKeys: (rows) =>
      new Set(rows.map((company) => normalizeSymbol(company.symbol))),
    getRowKey: (row) => normalizeSymbol(row.symbol),
    validateRow: (row) =>
      Object.values(validateForm(row, companyValidationSchema)).filter(
        (error): error is string => Boolean(error),
      ),
    buildStoredRow: (row) => row,
    getExistingKeyError: () => "Company symbol already exists in the system.",
    getDuplicateKeyError: () =>
      "Company symbol is duplicated in the uploaded file.",
    getSuccessMessage: getCompanyImportSuccessMessage,
  });

  const handleTemplateDownload = async () => {
    await downloadWorkbook("sidago-bulk-company-import-template.xlsx", [
      {
        kind: "object",
        name: "Company Template",
        columns: TEMPLATE_COLUMNS,
        rows: [templateExampleRow],
      },
      {
        kind: "matrix",
        name: "Instructions",
        rows: [
          ["Field", "Required", "Notes"],
          ["symbol", "Yes", "Unique company symbol, max 10 chars"],
          ["name", "Yes", "Company name"],
          [
            "timezone",
            "Yes",
            `Use one of: ${TIMEZONE_OPTIONS.map((item) => item.value).join(", ")}`,
          ],
          [
            "country",
            "Yes",
            `Use one of: ${COUNTRY_OPTIONS.map((item) => item.value).join(", ")}`,
          ],
          ["description", "Yes", "Company description"],
          ["estimatedMarketCap", "Yes", "Examples: $4.2B, 920M"],
          ["primaryVenue", "Yes", "Examples: NASDAQ, NYSE, TSX"],
          ["city", "Yes", "Company city"],
          ["state", "Yes", "State, province, or region"],
          ["website", "Yes", "Must start with http:// or https://"],
          ["twitterHandle", "Yes", "Valid X/Twitter handle"],
          ["zip", "Yes", "Postal or zip code"],
        ],
      },
    ]);
  };

  const handleErrorReportDownload = async () => {
    if (failedRows.length === 0) {
      return;
    }

    await downloadWorkbook("sidago-bulk-company-import-errors.xlsx", [
      {
        kind: "object",
        name: "Import Errors",
        columns: ["rowNumber", ...TEMPLATE_COLUMNS, "errors"],
        rows: failedRows,
      },
    ]);
  };

  return (
    <BulkImportPage
      title="Bulk Company Import"
      description="Upload a single XLSX file to create multiple companies at once. The file must include all required company fields from the provided template."
      uploadTitle="Upload Company Workbook"
      requiredColumnsText={REQUIRED_COLUMNS.join(", ")}
      selectedFileName={selectedFileName}
      isProcessing={isProcessing}
      summary={summary}
      failedRows={failedRows}
      fileInputRef={fileInputRef}
      fileInputAccept={FILE_INPUT_ACCEPT}
      infoCards={[...INFO_CARDS]}
      failedRowValueKey="symbol"
      failedRowValueHeader="Symbol"
      getSummaryText={(currentSummary) =>
        getCompanyImportSuccessMessage(
          currentSummary.importedCount,
          currentSummary.skippedCount,
        )
      }
      onTemplateDownload={handleTemplateDownload}
      onErrorReportDownload={handleErrorReportDownload}
      onUploadClick={handleUploadClick}
      onFileChange={handleFileChange}
    />
  );
}
