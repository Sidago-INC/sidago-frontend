import { useCallback, useMemo } from "react";
import { useQueries, type UseQueryResult } from "@tanstack/react-query";
import { TypeBadge } from "@/components/ui";
import type { Column } from "@/components/ui/Table";
import type { CatalogBrand } from "@/hooks/useBrandCatalog";
import { mapAgentUsersToSelectOptions } from "@/features/backoffice-shared/use-agent-select-options";
import {
  fetchAgents,
  type AgentUser,
} from "@/features/backoffice-shared/use-users";
import type {
  ExtraBrandState,
  ExtraBrandStates,
  HotLeadRow,
} from "@/features/backoffice-shared/types";
import type { ExtraBrandStatePatch } from "@/features/backoffice-shared/use-update-lead";

type WithExtraBrandStates = { extraBrandStates?: ExtraBrandStates | null };

const DISPLAY_ONLY = {
  filterable: false,
  sortable: false,
  groupable: false,
} as const;

function formatStateDate(value: string | null | undefined): string {
  if (!value) return "";
  return /^\d{4}-\d{2}-\d{2}T/.test(value) ? value.slice(0, 10) : value;
}

export function buildExtraBrandLeadTypeColumns<T extends WithExtraBrandStates>(
  brands: CatalogBrand[],
): Column<T>[] {
  return brands.map((brand) => ({
    ...DISPLAY_ONLY,
    title: `${brand.displayName} Lead Type`,
    key: `extra-${brand.code}-leadType`,
    getValue: (row) => row.extraBrandStates?.[brand.code]?.leadType ?? "",
    render: (row) => (
      <TypeBadge
        value={row.extraBrandStates?.[brand.code]?.leadType ?? ""}
        kind="lead"
      />
    ),
  }));
}

export function buildExtraBrandColumns<T extends WithExtraBrandStates>(
  brands: CatalogBrand[],
): Column<T>[] {
  return brands.flatMap((brand) => [
    ...buildExtraBrandLeadTypeColumns<T>([brand]),
    {
      ...DISPLAY_ONLY,
      title: `${brand.displayName} To Be Called By`,
      key: `extra-${brand.code}-toBeCalledBy`,
      getValue: (row: T) =>
        row.extraBrandStates?.[brand.code]?.toBeCalledBy ?? "",
    },
    {
      ...DISPLAY_ONLY,
      title: `${brand.displayName} Last Call Date`,
      key: `extra-${brand.code}-lastCalledDate`,
      getValue: (row: T) =>
        formatStateDate(row.extraBrandStates?.[brand.code]?.lastCalledDate),
    },
  ]);
}

// Report columns for a brand added after svg, 95rm and benton: the brand itself,
// then the legacy brands, then the other added brands.
export function buildBrandReportColumns<T extends HotLeadRow>(
  brandCode: string,
  extraBrands: CatalogBrand[],
): Column<T>[] {
  const displayName =
    extraBrands.find((brand) => brand.code === brandCode)?.displayName ??
    brandCode.toUpperCase();
  const legacy = [
    { name: "SVG", leadType: "svgLeadType", agent: "svgToBeCalledBy", date: "svgLastCallDate" },
    { name: "Benton", leadType: "bentonLeadType", agent: "bentonToBeCalledBy", date: "bentonLastCallDate" },
    { name: "95RM", leadType: "rm95LeadType", agent: "rm95ToBeCalledBy", date: "rm95LastCallDate" },
  ] as const;

  return [
    {
      ...DISPLAY_ONLY,
      title: `${displayName} Lead Type`,
      key: `extra-${brandCode}-leadType`,
      getValue: (row) => row.extraBrandStates?.[brandCode]?.leadType ?? "",
      render: (row) => (
        <TypeBadge
          value={row.extraBrandStates?.[brandCode]?.leadType ?? ""}
          kind="lead"
        />
      ),
    },
    {
      ...DISPLAY_ONLY,
      title: `${displayName} To Be Called By`,
      key: `extra-${brandCode}-toBeCalledBy`,
      getValue: (row) =>
        row.phaseToBeCalledBy ??
        row.extraBrandStates?.[brandCode]?.toBeCalledBy ??
        "",
    },
    {
      ...DISPLAY_ONLY,
      title: `${displayName} Last Call Date`,
      key: `extra-${brandCode}-lastCalledDate`,
      getValue: (row) =>
        formatStateDate(row.extraBrandStates?.[brandCode]?.lastCalledDate),
    },
    {
      ...DISPLAY_ONLY,
      title: `${displayName} Date Become Hot`,
      key: `extra-${brandCode}-dateBecomeHot`,
      getValue: (row) =>
        formatStateDate(
          row.phaseDateBecomeHot ??
            row.extraBrandStates?.[brandCode]?.dateBecomeHot,
        ),
    },
    ...legacy.flatMap(({ name, leadType, agent, date }): Column<T>[] => [
      {
        ...DISPLAY_ONLY,
        title: `${name} Lead Type`,
        key: leadType,
        render: (row) => <TypeBadge value={row[leadType]} kind="lead" />,
      },
      { ...DISPLAY_ONLY, title: `${name} To Be Called By`, key: agent },
      { ...DISPLAY_ONLY, title: `${name} Last Call Date`, key: date },
    ]),
    ...buildExtraBrandColumns<T>(
      extraBrands.filter((brand) => brand.code !== brandCode),
    ),
  ];
}

export function resolveBrandLabel(
  code: string,
  extraBrands: CatalogBrand[],
  legacyLabel: (code: string) => string,
): string {
  return (
    extraBrands.find((brand) => brand.code === code.toLowerCase())
      ?.displayName ?? legacyLabel(code)
  );
}

// Hooks can't be looped, so this is the per-brand agents query for a list of
// brands. Same query key as useUsers, so the cache is shared.
export function useExtraBrandAgents(codes: string[]) {
  const codesKey = codes.join(",");
  const stableCodes = useMemo(
    () => (codesKey ? codesKey.split(",") : []),
    [codesKey],
  );
  const combine = useCallback(
    (results: UseQueryResult<AgentUser[]>[]) =>
      Object.fromEntries(
        results.map((result, index) => [
          stableCodes[index],
          {
            agents: result.data ?? [],
            options: mapAgentUsersToSelectOptions(result.data),
            isLoading: result.isLoading,
          },
        ]),
      ),
    [stableCodes],
  );

  return useQueries({
    queries: stableCodes.map((code) => ({
      queryKey: ["agents", code],
      queryFn: () => fetchAgents(code),
      staleTime: 5 * 60_000,
    })),
    combine,
  });
}

export type ExtraBrandFormState = {
  leadType: string;
  toBeCalledBy: string;
  toBeCalledOn: string;
};

export const EMPTY_EXTRA_BRAND_FORM: ExtraBrandFormState = {
  leadType: "",
  toBeCalledBy: "",
  toBeCalledOn: "",
};

export function extraBrandStateToForm(
  state: ExtraBrandState | null | undefined,
): ExtraBrandFormState {
  return {
    leadType: state?.leadType ?? "",
    toBeCalledBy: state?.toBeCalledBy ?? "",
    toBeCalledOn: "",
  };
}

// "To Be Called On" is the call-back date, so it saves to follow_up_date.
export function getExtraBrandPatch(
  brandCode: string,
  form: ExtraBrandFormState,
  initial: ExtraBrandFormState,
): ExtraBrandStatePatch | null {
  const patch: ExtraBrandStatePatch = { brandCode };
  if (form.leadType !== initial.leadType) patch.lead_type = form.leadType;
  if (form.toBeCalledBy !== initial.toBeCalledBy) {
    patch.to_be_called_by = form.toBeCalledBy || null;
  }
  if (form.toBeCalledOn !== initial.toBeCalledOn) {
    patch.follow_up_date = form.toBeCalledOn || null;
  }
  return Object.keys(patch).length > 1 ? patch : null;
}
