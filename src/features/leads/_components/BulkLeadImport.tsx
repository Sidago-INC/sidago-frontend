

import { BulkImportPage } from "@/components/ui";
import { downloadWorkbook } from "@/lib/excel";
import { validateForm } from "@/lib/validation";
import {
  leadCreateValidationSchema,
  type LeadCreateFormValues,
} from "@/lib/validation/lead-create";
import { useBulkWorkbookImport } from "@/hooks/useBulkWorkbookImport";
import { createLeadDirectoryRow } from "../_lib/data";
import { getStoredLeads, saveStoredLeads } from "../_lib/storage";

const FILE_INPUT_ACCEPT =
  ".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const TEMPLATE_COLUMNS: Array<keyof LeadCreateFormValues> = [
  "fullName",
  "firstName",
  "lastName",
  "phone",
  "phoneExtension",
  "email",
  "role",
];

const REQUIRED_COLUMNS: Array<keyof LeadCreateFormValues> = [
  "fullName",
  "firstName",
  "lastName",
  "phone",
  "email",
  "role",
];

const templateExampleRow: LeadCreateFormValues = {
  fullName: "Jamie Lee Carter",
  firstName: "Jamie",
  lastName: "Carter",
  phone: "(617) 555-0148",
  phoneExtension: "204",
  email: "jamie.carter@example.com",
  role: "Operations Manager",
};

const INFO_CARDS = [
  {
    label: "Required Fields",
    value: REQUIRED_COLUMNS.join(", "),
  },
  {
    label: "Optional Field",
    value: "phoneExtension",
  },
  {
    label: "Duplicate Rule",
    value: "Emails must be unique in the system and within the uploaded file.",
  },
] as const;

function normalizeLeadForm(
  values: Record<string, string>,
): LeadCreateFormValues {
  return {
    fullName: values.fullName?.trim() ?? "",
    firstName: values.firstName?.trim() ?? "",
    lastName: values.lastName?.trim() ?? "",
    phone: values.phone?.trim() ?? "",
    phoneExtension: values.phoneExtension?.trim() ?? "",
    email: values.email?.trim() ?? "",
    role: values.role?.trim() ?? "",
  };
}

function buildLeadFromForm(values: LeadCreateFormValues) {
  return createLeadDirectoryRow(
    {
      lead: "General",
      companyName: "Pending Assignment",
      fullName: values.fullName,
      phone: values.phone,
      role: values.role,
      email: values.email,
      timezone: "",
      contactType: "Prospecting",
      svgLeadType: "General",
      svgToBeCalledBy: "",
      svgLastCallDate: "",
      bentonLeadType: "General",
      bentonToBeCalledBy: "",
      bentonLastCallDate: "",
      rm95LeadType: "General",
      rm95ToBeCalledBy: "",
      rm95LastCallDate: "",
      svgDateBecomeHot: "",
      bentonDateBecomeHot: "",
      rm95DateBecomeHot: "",
      lastActionDate: "",
      lastFixedDate: "",
      notWorked: false,
    },
    {
      firstName: values.firstName,
      lastName: values.lastName,
      phoneExtension: values.phoneExtension,
    },
  );
}

function getLeadImportSuccessMessage(
  importedCount: number,
  skippedCount: number,
) {
  return `${importedCount} lead${importedCount === 1 ? "" : "s"} imported successfully, ${skippedCount} skipped due to errors.`;
}

export function BulkLeadImport() {
  const {
    fileInputRef,
    selectedFileName,
    isProcessing,
    summary,
    failedRows,
    handleUploadClick,
    handleFileChange,
  } = useBulkWorkbookImport<
    LeadCreateFormValues,
    ReturnType<typeof buildLeadFromForm>,
    keyof LeadCreateFormValues
  >({
    columns: TEMPLATE_COLUMNS,
    requiredColumns: REQUIRED_COLUMNS,
    normalizeRow: normalizeLeadForm,
    getStoredRows: getStoredLeads,
    saveStoredRows: saveStoredLeads,
    getExistingKeys: (rows) =>
      new Set(rows.map((row) => row.email.trim().toLowerCase())),
    getRowKey: (row) => row.email.toLowerCase(),
    validateRow: (row) =>
      Object.values(validateForm(row, leadCreateValidationSchema)).filter(
        (error): error is string => Boolean(error),
      ),
    buildStoredRow: buildLeadFromForm,
    getExistingKeyError: () => "Email already exists in the system.",
    getDuplicateKeyError: () => "Email is duplicated in the uploaded file.",
    getSuccessMessage: getLeadImportSuccessMessage,
  });

  const handleTemplateDownload = async () => {
    await downloadWorkbook("sidago-bulk-lead-import-template.xlsx", [
      {
        kind: "object",
        name: "Lead Template",
        columns: TEMPLATE_COLUMNS,
        rows: [templateExampleRow],
      },
      {
        kind: "matrix",
        name: "Instructions",
        rows: [
          ["Field", "Required", "Notes"],
          ["fullName", "Yes", "Full contact name"],
          ["firstName", "Yes", "Lead first name"],
          ["lastName", "Yes", "Lead last name"],
          ["phone", "Yes", "Primary phone number"],
          ["phoneExtension", "No", "Phone extension if available"],
          ["email", "Yes", "Must be unique across leads"],
          ["role", "Yes", "Job title or role"],
        ],
      },
    ]);
  };

  const handleErrorReportDownload = async () => {
    if (failedRows.length === 0) {
      return;
    }

    await downloadWorkbook("sidago-bulk-lead-import-errors.xlsx", [
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
      title="Bulk Lead Import"
      description="Upload a single XLSX file to create multiple leads at once. The file must include all required lead fields from the provided template."
      uploadTitle="Upload Lead Workbook"
      requiredColumnsText={REQUIRED_COLUMNS.join(", ")}
      selectedFileName={selectedFileName}
      isProcessing={isProcessing}
      summary={summary}
      failedRows={failedRows}
      fileInputRef={fileInputRef}
      fileInputAccept={FILE_INPUT_ACCEPT}
      infoCards={[...INFO_CARDS]}
      failedRowValueKey="email"
      failedRowValueHeader="Email"
      getSummaryText={(currentSummary) =>
        getLeadImportSuccessMessage(
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
