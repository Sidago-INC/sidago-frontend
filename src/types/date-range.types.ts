export type DateRange = {
  from?: Date;
  to?: Date;
};

function formatYMD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDateRangeLabel(range?: DateRange): string {
  if (!range?.from) {
    return "";
  }

  const from = formatYMD(range.from);
  if (!range.to) {
    return from;
  }

  const to = formatYMD(range.to);
  return from === to ? from : `${from} - ${to}`;
}

export function isDateRangeSelection(range?: DateRange): boolean {
  if (!range?.from || !range?.to) {
    return false;
  }

  return formatYMD(range.from) !== formatYMD(range.to);
}
