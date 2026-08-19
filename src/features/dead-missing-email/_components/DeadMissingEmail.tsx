
import {
  Badge,
  Button,
  EmailLink,
  ErrorState,
  Table,
  TypeBadge,
} from "@/components/ui";
import type { Column } from "@/components/ui/Table";
import {
  showErrorToast,
  showInfoToast,
  showSuccessToast,
} from "@/lib/toast";
import { getLeadGridLabel } from "@/features/backoffice-shared/constants";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { useGridUrlState } from "@/lib/use-grid-url-state";
import { useServerPagination } from "@/lib/use-server-pagination";
import {
  getDeadEmailBrandLabel,
  getDeadEmailDisplayLeadId,
  type DeadMissingEmailRow,
  useClearDeadMissingEmail,
  useDeadMissingEmails,
} from "../_lib/data";
import { DeadMissingEmailDrawer } from "./DeadMissingEmailDrawer";

const DEFAULT_ROWS_PER_PAGE = 500;

export function DeadMissingEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { page, perPage, setPage, setPerPage } = useServerPagination(
    DEFAULT_ROWS_PER_PAGE,
  );

  const url = useGridUrlState();
  const [searchInput, setSearchInput] = useState(url.search);
  const debouncedSearch = useDebouncedValue(searchInput, 300);

  useEffect(() => {
    url.setSearch(debouncedSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url.grid]);

  const { data: result, isLoading, isError, error, refetch } =
    useDeadMissingEmails(page, perPage, url.grid);
  const data = result?.data ?? [];
  const serverPagination = result?.meta
    ? {
        meta: result.meta,
        onPageChange: setPage,
        onPerPageChange: setPerPage,
      }
    : undefined;
  const clearMutation = useClearDeadMissingEmail();
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  useEffect(() => {
    const leadParam = searchParams.get("lead");
    if (!leadParam) return;
    const row = data.find(
      (item) =>
        getDeadEmailDisplayLeadId(item).toLowerCase() === leadParam.toLowerCase(),
    );
    setSelectedLeadId(row?.leadId ?? null);
  }, [data, searchParams]);

  const selectedRow = useMemo(
    () => data.find((row) => row.leadId === selectedLeadId) ?? null,
    [data, selectedLeadId],
  );

  const currentIndex = selectedRow
    ? data.findIndex((row) => row.leadId === selectedRow.leadId)
    : -1;

  const columns = useMemo<Column<DeadMissingEmailRow>[]>(
    () => [
      {
        title: "Lead ID",
        key: "lead",
        getValue: (row) => getLeadGridLabel(row),
      },
      { title: "Company", key: "companyName" },
      { title: "Full Name", key: "fullName" },
      {
        title: "Email",
        key: "email",
        render: (row) =>
          row.email ? (
            <EmailLink value={row.email} />
          ) : (
            <span className="text-slate-400">Missing</span>
          ),
      },
      {
        title: "Contact Type",
        key: "contactType",
        render: (row) =>
          row.contactType ? (
            <TypeBadge value={row.contactType} kind="contact" />
          ) : (
            <span className="text-slate-400">-</span>
          ),
      },
      {
        title: "Lead Type",
        key: "leadTypeSvg",
        render: (row) =>
          row.leadTypeSvg ? (
            <TypeBadge value={row.leadTypeSvg} kind="lead" />
          ) : (
            <span className="text-slate-400">-</span>
          ),
      },
      {
        title: "Lead Type Benton",
        key: "leadTypeBenton",
        render: (row) =>
          row.leadTypeBenton ? (
            <TypeBadge value={row.leadTypeBenton} kind="lead" />
          ) : (
            <span className="text-slate-400">-</span>
          ),
      },
      {
        title: "Lead Type 95RM",
        key: "leadType95rm",
        render: (row) =>
          row.leadType95rm ? (
            <TypeBadge value={row.leadType95rm} kind="lead" />
          ) : (
            <span className="text-slate-400">-</span>
          ),
      },
      {
        // Not a backend grid field for this report — display only.
        title: "Flagged Brands",
        key: "flaggedBrands",
        getValue: (row) =>
          row.missingDeadBrands.map(getDeadEmailBrandLabel).join(", "),
        filterable: false,
        sortable: false,
        groupable: false,
        render: (row) => (
          <div className="flex flex-wrap gap-1.5">
            {row.missingDeadBrands.map((brand) => (
              <Badge key={brand}>{getDeadEmailBrandLabel(brand)}</Badge>
            ))}
          </div>
        ),
      },
      {
        title: "Fix Lead",
        key: "fixLead",
        filterable: false,
        sortable: false,
        groupable: false,
        render: (row) => (
          <Button
            onClick={(event) => {
              event.stopPropagation();
              navigate(`/fix-leads/${row.leadId}`);
            }}
            className="cursor-pointer inline-flex h-6 items-center justify-center rounded border border-blue-600 bg-blue-500 px-4 text-sm font-semibold text-white transition hover:bg-blue-600 dark:border-blue-400 dark:bg-blue-600 dark:text-white dark:hover:bg-blue-500"
          >
            Fix
          </Button>
        ),
      },
    ],
    [navigate],
  );

  const clearRow = async (row: DeadMissingEmailRow) => {
    try {
      const result = await clearMutation.mutateAsync(row.leadId);
      setSelectedLeadId(null);

      if (result.updated > 0) {
        showSuccessToast(
          `${row.email ?? getDeadEmailDisplayLeadId(row)} has been cleared.`,
        );
        return;
      }

      showInfoToast(
        `${getDeadEmailDisplayLeadId(row)} was already cleared.`,
      );
    } catch (mutationError) {
      showErrorToast(mutationError);
    }
  };

  if (isError) {
    return (
      <ErrorState
        error={error}
        title="Failed to load dead/missing emails"
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  return (
    <div className="min-h-full">
      <Table
        data={data}
        columns={columns}
        isLoading={isLoading}
        serverPagination={serverPagination}
        serverSearch={{
          value: searchInput,
          onChange: setSearchInput,
          placeholder: "Search lead, symbol, name, or email",
        }}
        serverGrid={{
          filters: url.filterItems,
          rootGate: url.rootGate,
          sort: url.sortRules,
          groupBy: url.groupBy,
          onFiltersChange: url.setFilters,
          onSortChange: url.setSort,
          onGroupByChange: url.setGroupBy,
          groupCounts: result?.meta?.groups,
        }}
        title="Dead/Missing Email"
        description="Review leads flagged with missing or dead emails across all brands"
        emptyText="No leads with dead or missing emails found."
        onRowClick={(row) => setSelectedLeadId(row.leadId)}
      />

      <DeadMissingEmailDrawer
        row={selectedRow}
        currentIndex={currentIndex}
        rowCount={data.length}
        isClearing={clearMutation.isPending}
        onCancel={() => setSelectedLeadId(null)}
        onNavigate={(index) => {
          const row = data[index];
          if (!row) return;
          setSelectedLeadId(row.leadId);
        }}
        onClear={clearRow}
      />
    </div>
  );
}
