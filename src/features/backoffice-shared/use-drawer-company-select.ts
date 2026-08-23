import { getRowCompanySymbol } from "@/features/backoffice-shared/constants";
import { useCompanyBySymbol } from "@/features/companies/_lib/hooks";
import { resolveLeadTimezone } from "@/types/timezone.types";

/**
 * Resolves the company identity a lead drawer needs to display, and the
 * company id it needs to PATCH.
 *
 * This replaced a 370-line hook that also drove a searchable company picker.
 * That picker held its own pinned copy of the selected company, written by
 * four `useEffect`s and three queries that could resolve in any order, and it
 * was the direct cause of four QA findings: the panel lagged a lead behind the
 * Next button, arrow keys misbehaved inside the dropdown, changing the company
 * left the previous lead's name and phone on screen, and every drawer open
 * fired three extra requests.
 *
 * The picker was removed on the customer's instruction ("remove that section
 * altogether… let the manual arrow keys remain"). Re-pointing a lead at a
 * different company is not something the detail panel does any more.
 * Correcting a company's own symbol, name or timezone still is — see
 * `DrawerCompanyField`'s `companyEdit` prop — and that is what `companyId`
 * below is for.
 */
type UseDrawerCompanyIdentityOptions = {
  /** Skip the lookup while the drawer is closed. */
  drawerOpen: boolean;
  /** The row's company symbol, as rendered in the grid. */
  rowCompanySymbol?: string | null;
  /** The row's company name. */
  rowCompanyName?: string | null;
  /** The lead's own denormalized timezone, used only as a fallback. */
  rowTimezone?: string | null;
};

export function useDrawerCompanyIdentity({
  drawerOpen,
  rowCompanySymbol,
  rowCompanyName,
  rowTimezone,
}: UseDrawerCompanyIdentityOptions) {
  const displayCompanySymbol = getRowCompanySymbol({
    companySymbol: rowCompanySymbol,
    companyName: rowCompanyName,
  });

  // One lookup, by symbol. The company owns the timezone; the lead's own copy
  // is a flattened Airtable lookup that can be stale, so it only fills in when
  // the company has none.
  const { data: company } = useCompanyBySymbol(
    displayCompanySymbol,
    drawerOpen && Boolean(displayCompanySymbol.trim()),
  );

  const displayTimezone =
    resolveLeadTimezone(rowTimezone, company?.timezone) ?? "";

  return {
    displayCompanySymbol,
    displayTimezone,
    /** For `PATCH /companies/:id` when the drawer edits company fields. */
    selectedCompanyId: company?.id || null,
    selectedCompanyName: company?.name?.trim() || rowCompanyName?.trim() || "",
  };
}
