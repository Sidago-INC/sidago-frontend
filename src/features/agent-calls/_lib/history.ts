import type { HistoryEntry } from "./apiTypes";

export type HistoryByBrand = Record<string, HistoryEntry[]>;

function toNullableString(value: unknown): string | null {
  if (value == null) return null;
  const text = String(value).trim();
  return text || null;
}

function toString(value: unknown, fallback = ""): string {
  return value == null ? fallback : String(value);
}

function toNullableNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeHistoryEntry(entry: unknown): HistoryEntry | null {
  if (!entry || typeof entry !== "object") return null;

  const record = entry as Record<string, unknown>;
  const calledAt = toString(record.calledAt ?? record.called_at).trim();
  if (!calledAt) return null;

  return {
    id: toString(record.id, calledAt),
    calledAt,
    resultCode: toString(record.resultCode ?? record.result_code),
    notes: toNullableString(record.notes),
    agentName: toString(
      record.agentName ?? record.agent_name ?? record.userName ?? record.user_name,
    ),
    durationSeconds: toNullableNumber(
      record.durationSeconds ?? record.duration_seconds,
    ),
    source: toString(record.source),
    mightyCallId: toNullableString(record.mightyCallId ?? record.mighty_call_id),
  };
}

function normalizeEntryList(entries: unknown[]): HistoryEntry[] {
  return entries
    .map(normalizeHistoryEntry)
    .filter((entry): entry is HistoryEntry => entry !== null);
}

function isBrandKeyedHistory(record: Record<string, unknown>): boolean {
  return Object.values(record).some((value) => Array.isArray(value));
}

function findBrandEntries(
  record: Record<string, unknown>,
  brandCode: string,
): HistoryEntry[] {
  const brandKey = brandCode.toLowerCase();
  const match = Object.entries(record).find(
    ([key, value]) => key.toLowerCase() === brandKey && Array.isArray(value),
  );

  return match ? normalizeEntryList(match[1] as unknown[]) : [];
}

function mergeBrandEntries(record: Record<string, unknown>): HistoryEntry[] {
  const entries: HistoryEntry[] = [];

  for (const value of Object.values(record)) {
    if (Array.isArray(value)) {
      entries.push(...normalizeEntryList(value));
    }
  }

  return entries.sort(
    (a, b) => new Date(b.calledAt).getTime() - new Date(a.calledAt).getTime(),
  );
}

export function getHistoryEntries(
  history: unknown,
  brandCode?: string,
): HistoryEntry[] {
  if (!history) return [];

  if (Array.isArray(history)) {
    return normalizeEntryList(history);
  }

  if (typeof history !== "object") return [];

  const record = history as Record<string, unknown>;

  for (const key of ["data", "items", "entries", "history", "calls"]) {
    if (Array.isArray(record[key])) {
      return normalizeEntryList(record[key] as unknown[]);
    }
  }

  if (!isBrandKeyedHistory(record)) return [];

  return brandCode
    ? findBrandEntries(record, brandCode)
    : mergeBrandEntries(record);
}
