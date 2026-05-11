

import { readFirstWorksheet } from "@/lib/excel";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { useRef, useState, type ChangeEvent, type RefObject } from "react";

type ImportSummary = {
  fileName: string;
  totalRows: number;
  importedCount: number;
  skippedCount: number;
};

export type BulkImportFailedRow<TColumn extends string> = Record<
  TColumn,
  string
> & {
  rowNumber: string;
  errors: string;
};

type BulkWorkbookImportConfig<
  TNormalizedRow extends Record<string, string>,
  TStoredRow,
  TColumn extends keyof TNormalizedRow & string,
> = {
  columns: readonly TColumn[];
  requiredColumns: readonly TColumn[];
  normalizeRow: (row: Record<string, string>) => TNormalizedRow;
  getStoredRows: () => TStoredRow[];
  saveStoredRows: (rows: TStoredRow[]) => void;
  getExistingKeys: (rows: TStoredRow[]) => Set<string>;
  getRowKey: (row: TNormalizedRow) => string;
  validateRow: (row: TNormalizedRow) => string[];
  buildStoredRow: (row: TNormalizedRow) => TStoredRow;
  getExistingKeyError: () => string;
  getDuplicateKeyError: () => string;
  getSuccessMessage: (importedCount: number, skippedCount: number) => string;
};

type BulkWorkbookImportState<TColumn extends string> = {
  fileInputRef: RefObject<HTMLInputElement | null>;
  selectedFileName: string;
  isProcessing: boolean;
  summary: ImportSummary | null;
  failedRows: BulkImportFailedRow<TColumn>[];
  handleUploadClick: () => void;
  handleFileChange: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
};

function getColumnValues<
  TNormalizedRow extends Record<string, string>,
  TColumn extends keyof TNormalizedRow & string,
>(columns: readonly TColumn[], row: TNormalizedRow): Record<TColumn, string> {
  return columns.reduce(
    (values, column) => {
      values[column] = row[column] ?? "";
      return values;
    },
    {} as Record<TColumn, string>,
  );
}

export function useBulkWorkbookImport<
  TNormalizedRow extends Record<string, string>,
  TStoredRow,
  TColumn extends keyof TNormalizedRow & string,
>(
  config: BulkWorkbookImportConfig<TNormalizedRow, TStoredRow, TColumn>,
): BulkWorkbookImportState<TColumn> {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [failedRows, setFailedRows] = useState<BulkImportFailedRow<TColumn>[]>(
    [],
  );

  const handleUploadClick = () => {
    if (isProcessing) {
      return;
    }

    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    setSelectedFileName(file.name);
    setSummary(null);
    setFailedRows([]);

    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      showErrorToast("Please upload an .xlsx file.");
      input.value = "";
      return;
    }

    setIsProcessing(true);

    try {
      const { rows, headerRow } = await readFirstWorksheet(file);
      const missingColumns = config.requiredColumns.filter(
        (column) => !headerRow.includes(column),
      );

      if (missingColumns.length > 0) {
        throw new Error(
          `The XLSX file is missing required columns: ${missingColumns.join(", ")}.`,
        );
      }

      const currentRows = config.getStoredRows();
      const existingKeys = config.getExistingKeys(currentRows);
      const seenInFile = new Set<string>();
      const nextRows = [...currentRows];
      const nextFailedRows: BulkImportFailedRow<TColumn>[] = [];
      let importedCount = 0;

      rows.forEach((rawRow, index) => {
        const normalizedRow = config.normalizeRow(rawRow);
        const normalizedKey = config.getRowKey(normalizedRow);
        const rowErrors = [...config.validateRow(normalizedRow)];

        if (normalizedKey && existingKeys.has(normalizedKey)) {
          rowErrors.push(config.getExistingKeyError());
        }

        if (normalizedKey && seenInFile.has(normalizedKey)) {
          rowErrors.push(config.getDuplicateKeyError());
        }

        if (rowErrors.length > 0) {
          nextFailedRows.push({
            rowNumber: String(index + 2),
            ...getColumnValues(config.columns, normalizedRow),
            errors: rowErrors.join(" | "),
          });
          return;
        }

        nextRows.unshift(config.buildStoredRow(normalizedRow));

        if (normalizedKey) {
          existingKeys.add(normalizedKey);
          seenInFile.add(normalizedKey);
        }

        importedCount += 1;
      });

      config.saveStoredRows(nextRows);
      setFailedRows(nextFailedRows);
      setSummary({
        fileName: file.name,
        totalRows: rows.length,
        importedCount,
        skippedCount: nextFailedRows.length,
      });

      showSuccessToast(
        config.getSuccessMessage(importedCount, nextFailedRows.length),
      );
    } catch (error) {
      showErrorToast(error);
    } finally {
      setIsProcessing(false);
      input.value = "";
    }
  };

  return {
    fileInputRef,
    selectedFileName,
    isProcessing,
    summary,
    failedRows,
    handleUploadClick,
    handleFileChange,
  };
}
