type SelectSearchOption = {
  label: string;
  value: string | number;
};

export function normalizeSelectSearchText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function getSelectSearchSegments(text: string): string[] {
  const normalized = normalizeSelectSearchText(text);
  if (!normalized) return [];

  const parts = normalized.split(/[^a-z0-9]+/).filter(Boolean);
  return Array.from(new Set([normalized, ...parts]));
}

export function optionMatchesSelectSearch(
  option: SelectSearchOption,
  query: string,
): boolean {
  const normalizedQuery = normalizeSelectSearchText(query);
  if (!normalizedQuery) return true;

  const segments = [
    ...getSelectSearchSegments(option.label),
    ...getSelectSearchSegments(String(option.value)),
  ];

  return segments.some((segment) => segment.includes(normalizedQuery));
}

export function filterSelectOptions<T extends SelectSearchOption>(
  options: T[],
  query: string,
): T[] {
  const normalizedQuery = normalizeSelectSearchText(query);
  if (!normalizedQuery) return options;

  return options.filter((option) => optionMatchesSelectSearch(option, query));
}
