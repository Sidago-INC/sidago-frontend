import { getCompanySymbol, getLeadId } from "./constants";

type DrawerRouteRow = {
  email?: string;
  lead?: string;
  leadType?: string;
  svgLeadType?: string;
  bentonLeadType?: string;
  rm95LeadType?: string;
  companyName?: string;
};

function decodeLeadParam(value: string) {
  try {
    return decodeURIComponent(value.replaceAll("+", " "));
  } catch {
    return value.replaceAll("+", " ");
  }
}

export function normalizeDrawerRouteValue(value: string | null | undefined) {
  return decodeLeadParam(value ?? "")
    .trim()
    .replace(/[’‘`]/g, "'")
    .replace(/\s*-\s*/g, "-")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function getRouteCandidates(row: DrawerRouteRow) {
  const companySymbol = getCompanySymbol(row.companyName ?? "");
  const leadValues = [
    row.lead,
    row.leadType,
    row.svgLeadType,
    row.bentonLeadType,
    row.rm95LeadType,
  ].filter((value): value is string => Boolean(value));

  return [
    row.email,
    getLeadId({
      companyName: row.companyName ?? "",
      lead: row.lead ?? "",
    }),
    ...leadValues,
    ...leadValues.map((lead) => `${companySymbol}-${lead}`),
  ].filter((value): value is string => Boolean(value));
}

export function findDrawerRouteIndex<Row extends DrawerRouteRow>(
  rows: Row[],
  selectedLead: string | null,
) {
  const normalizedSelectedLead = normalizeDrawerRouteValue(selectedLead);

  if (!normalizedSelectedLead) {
    return null;
  }

  const index = rows.findIndex((row) =>
    getRouteCandidates(row).some(
      (candidate) =>
        normalizeDrawerRouteValue(candidate) === normalizedSelectedLead,
    ),
  );

  return index >= 0 ? index : null;
}

export function getDrawerRouteLead(row: DrawerRouteRow) {
  return getLeadId({
    companyName: row.companyName ?? "",
    lead: row.lead ?? row.leadType ?? "",
  });
}
