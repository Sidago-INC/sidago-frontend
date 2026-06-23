export function getAgentKeyFromCookie() {
  if (typeof document === "undefined") {
    return "mariz";
  }

  const match = document.cookie.match(/agent_name=([^;]+)/);
  const agentName = match ? decodeURIComponent(match[1]) : "Mariz";
  return agentName.split(" ")[0].toLowerCase();
}

export function formatLeadDisplayTitle(lead: {
  companySymbol: string | null;
  fullName: string;
}) {
  if (lead.companySymbol) {
    return `${lead.companySymbol}-${lead.fullName}`;
  }

  return lead.fullName;
}

export function displayOptionalText(
  value: string | null | undefined,
  placeholder = "—",
) {
  const trimmed = value?.trim();
  return trimmed || placeholder;
}

export function parseLocalDateString(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(trimmed);
  if (!match) return null;

  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  );
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function getMinCallBackDate(lastCalledDate: string) {
  const today = startOfLocalDay(new Date());
  const lastCalled = parseLocalDateString(lastCalledDate);

  if (!lastCalled) return today;
  return lastCalled > today ? lastCalled : today;
}

export function getCallBackDateError(
  dateStr: string,
  lastCalledDate: string,
): string | undefined {
  if (!dateStr.trim()) return undefined;

  const date = parseLocalDateString(dateStr);
  if (!date) return "Enter a valid date.";

  const minDate = getMinCallBackDate(lastCalledDate);
  if (date < minDate) {
    const lastCalled = parseLocalDateString(lastCalledDate);
    if (lastCalled && date < lastCalled) {
      return "Call back date cannot be earlier than the last called date.";
    }
    return "Call back date cannot be in the past.";
  }

  return undefined;
}
