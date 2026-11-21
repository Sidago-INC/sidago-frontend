

import { Workbook, type CellValue } from "exceljs";

type ObjectSheet = {
  kind: "object";
  name: string;
  columns: string[];
  rows: Array<Record<string, unknown>>;
};

type MatrixSheet = {
  kind: "matrix";
  name: string;
  rows: string[][];
};

type WorkbookSheet = ObjectSheet | MatrixSheet;

type WorksheetRow = Record<string, string>;

type CellValueWithText = Extract<CellValue, { text: string }>;
type CellValueWithHyperlink = Extract<CellValue, { hyperlink: string }>;
type CellValueWithFormula = Extract<
  CellValue,
  { formula: unknown; result?: unknown }
>;
type CellValueWithRichText = Extract<
  CellValue,
  { richText: Array<{ text: string }> }
>;

function hasRichText(value: CellValue): value is CellValueWithRichText {
  return typeof value === "object" && value !== null && "richText" in value;
}

function hasText(value: CellValue): value is CellValueWithText {
  return typeof value === "object" && value !== null && "text" in value;
}

function hasHyperlink(value: CellValue): value is CellValueWithHyperlink {
  return typeof value === "object" && value !== null && "hyperlink" in value;
}

function hasFormula(value: CellValue): value is CellValueWithFormula {
  return typeof value === "object" && value !== null && "formula" in value;
}

function cellValueToString(value: CellValue | undefined | null): string {
  if (value == null) {
    return "";
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value).trim();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (hasRichText(value) && Array.isArray(value.richText)) {
    return value.richText
      .map((part) => part.text)
      .join("")
      .trim();
  }

  if (hasText(value) && typeof value.text === "string") {
    return value.text.trim();
  }

  if (hasHyperlink(value) && typeof value.hyperlink === "string") {
    return value.hyperlink.trim();
  }

  if (hasFormula(value)) {
    if (value.result == null) {
      return "";
    }

    return String(value.result).trim();
  }

  return "";
}

function triggerDownload(buffer: ArrayBuffer, filename: string) {
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}

export async function downloadWorkbook(
  filename: string,
  sheets: WorkbookSheet[],
) {
  const workbook = new Workbook();

  sheets.forEach((sheet) => {
    const worksheet = workbook.addWorksheet(sheet.name);

    if (sheet.kind === "object") {
      worksheet.columns = sheet.columns.map((column) => ({
        header: column,
        key: column,
      }));

      sheet.rows.forEach((row) => {
        worksheet.addRow(
          Object.fromEntries(
            sheet.columns.map((column) => [column, row[column] ?? ""]),
          ),
        );
      });

      return;
    }

    sheet.rows.forEach((row) => {
      worksheet.addRow(row);
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  triggerDownload(buffer, filename);
}

export async function readFirstWorksheet(file: File) {
  const workbook = new Workbook();
  const buffer = await file.arrayBuffer();

  await workbook.xlsx.load(buffer);

  const worksheet = workbook.worksheets[0];

  if (!worksheet) {
    throw new Error("The uploaded workbook does not contain any sheets.");
  }

  const headerSourceRow = worksheet.getRow(1);
  const lastColumnIndex = Math.max(
    headerSourceRow.cellCount,
    headerSourceRow.actualCellCount,
  );
  const headerColumns = Array.from({ length: lastColumnIndex }, (_, index) =>
    cellValueToString(headerSourceRow.getCell(index + 1).value).trim(),
  );
  const rows: WorksheetRow[] = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      return;
    }

    const values = headerColumns.map((_, index) =>
      cellValueToString(row.getCell(index + 1).value),
    );
    const hasContent = values.some((value) => value !== "");

    if (!hasContent) {
      return;
    }

    rows.push(
      Object.fromEntries(
        headerColumns
          .map((header, index) => [header, values[index] ?? ""] as const)
          .filter(([header]) => header !== ""),
      ),
    );
  });

  return { headerRow: headerColumns.filter(Boolean), rows };
}
