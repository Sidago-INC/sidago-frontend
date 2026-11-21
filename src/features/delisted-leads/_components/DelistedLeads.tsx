import { useMemo, useState } from "react";
import { Pencil, RotateCcw } from "lucide-react";
import {
  Button,
  CompanySymbolBadge,
  EmailLink,
  ErrorState,
  Modal,
  Table,
  TypeBadge,
} from "@/components/ui";
import { Column } from "@/components/ui/Table";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { formatEasternDateTime } from "@/lib/est";
import { getLeadGridLabel } from "@/features/backoffice-shared/constants";
import { useGridPage } from "@/lib/use-grid-page";
import { DelistedLeadDrawer } from "./DelistedLeadDrawer";
import { DelistLeadModal, type DelistModalState } from "./DelistLeadModal";
import {
  getDelistedBrandLabel,
  useDelistedLeads,
  useRestoreDelistedLead,
  type DelistedLeadRow,
} from "../_lib/data";

const DEFAULT_ROWS_PER_PAGE = 500;

function formatDate(value: string | null): string {
  if (!value) return "";
  return Number.isNaN(new Date(value).getTime()) ? value : formatEasternDateTime(value);
}

export function DelistedLeads() {
  const {
    page,
    perPage,
    setPage,
    setPerPage,
    url,
    searchInput,
    setSearchInput,
  } = useGridPage({ initialPerPage: DEFAULT_ROWS_PER_PAGE });

  const { data: result, isLoading, isError, error, refetch } = useDelistedLeads(
    page,
    perPage,
    url.grid,
  );
  const data = result?.data ?? [];
  const serverPagination = result?.meta
    ? {
        meta: result.meta,
        onPageChange: setPage,
        onPerPageChange: setPerPage,
      }
    : undefined;

  const restoreMutation = useRestoreDelistedLead();
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [modalState, setModalState] = useState<DelistModalState | null>(null);
  const [restoreRow, setRestoreRow] = useState<DelistedLeadRow | null>(null);

  const selectedRow = useMemo(
    () => data.find((row) => row.leadId === selectedLeadId) ?? null,
    [data, selectedLeadId],
  );

  const confirmRestore = async () => {
    if (!restoreRow || restoreMutation.isPending) return;
    try {
      const restored = await restoreMutation.mutateAsync(restoreRow.leadId);
      showSuccessToast(
        `Company restored: ${restored.leadsRestored} lead${
          restored.leadsRestored === 1 ? "" : "s"
        } returned to the calling stream.`,
      );
      setRestoreRow(null);
      setSelectedLeadId(null);
    } catch (mutationError) {
      showErrorToast(mutationError);
    }
  };

  const columns = useMemo<Column<DelistedLeadRow>[]>(
    () => [
      {
        title: "Lead ID",
        key: "lead",
        getValue: (row) => getLeadGridLabel(row),
      },
      {
        title: "Company Symbol",
        key: "companySymbol",
        render: (row) =>
          row.companySymbol ? (
            <CompanySymbolBadge symbol={row.companySymbol} index={0} />
          ) : (
            <span className="text-slate-400">-</span>
          ),
      },
      { title: "Company Name", key: "companyName" },
      { title: "Full Name", key: "fullName" },
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
        title: "Email",
        key: "email",
        render: (row) =>
          row.email ? <EmailLink value={row.email} /> : <span className="text-slate-400">-</span>,
      },
      {
        title: "Delisted At",
        key: "delistedAt",
        type: "date",
        getValue: (row) => formatDate(row.delistedAt),
      },
      { title: "Delisted By", key: "delistedByName" },
      { title: "Reason", key: "delistedReason", longText: true },
      {
        // Per-row CRUD: edit the reason or restore, without opening the drawer.
        // Stops propagation so the row's click (open drawer) does not fire too.
        title: "Actions",
        key: "actions",
        width: 96,
        minWidth: 96,
        maxWidth: 96,
        resizable: false,
        filterable: false,
        sortable: false,
        groupable: false,
        render: (row) => (
          <div
            className="flex items-center gap-1.5"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              aria-label={`Edit delisting reason for ${getLeadGridLabel(row)}`}
              title="Edit reason"
              onClick={() => setModalState({ mode: "edit", row })}
              className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Pencil size={14} />
            </button>
            <button
              type="button"
              aria-label={`Restore company of ${getLeadGridLabel(row)}`}
              title="Restore company"
              onClick={() => setRestoreRow(row)}
              className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-emerald-200 text-emerald-700 transition hover:bg-emerald-50 dark:border-emerald-900 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        ),
      },
      {
        // Display only: the brand list is derived server-side, not a grid field.
        title: "Delisted Brands",
        key: "delistedBrands",
        getValue: (row) => row.delistedBrands.map(getDelistedBrandLabel).join(", "),
        filterable: false,
        sortable: false,
        groupable: false,
        render: (row) => (
          <div className="flex flex-wrap gap-1.5">
            {row.delistedBrands.map((brand) => (
              <span
                key={brand}
                className="rounded bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
              >
                {getDelistedBrandLabel(brand)}
              </span>
            ))}
          </div>
        ),
      },
    ],
    [],
  );

  if (isError) {
    return (
      <ErrorState
        error={error}
        title="Failed to load delisted leads"
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
          placeholder: "Search lead, symbol, company, name, email, or reason",
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
        headerContent={
          <Button onClick={() => setModalState({ mode: "create" })}>Delist a Lead</Button>
        }
        title="Delisted Leads"
        description="Leads whose company is delisted. Delisted leads are excluded from the calling stream. Edit the reason or restore the company from here."
        emptyText="No delisted leads found."
        onRowClick={(row) => setSelectedLeadId(row.leadId)}
      />

      <DelistedLeadDrawer
        row={selectedRow}
        onClose={() => setSelectedLeadId(null)}
        onEditReason={(row) => {
          setSelectedLeadId(null);
          setModalState({ mode: "edit", row });
        }}
        onRestore={(row) => setRestoreRow(row)}
        isRestoring={restoreMutation.isPending}
      />

      {/* Mounted only while open, so the lead picker does not load on page visit. */}
      {modalState && (
        <DelistLeadModal state={modalState} onClose={() => setModalState(null)} />
      )}

      {/* Modal, not Confirmation: the drawer above is portaled at z-200, and a
          z-50 confirm rendered under its backdrop (visible, greyed, unclickable). */}
      <Modal
        isOpen={restoreRow !== null}
        onClose={() => setRestoreRow(null)}
        title="Restore this company?"
        showAccentBar={false}
        description={`Every lead at ${
          restoreRow?.companyName || restoreRow?.companySymbol || "this company"
        } goes back to the lead type it had before it was delisted, and returns to the calling stream.`}
        secondaryAction={{
          label: "Cancel",
          variant: "secondary",
          onClick: () => setRestoreRow(null),
        }}
        primaryAction={{
          label: restoreMutation.isPending ? "Restoring..." : "Restore Company",
          onClick: () => void confirmRestore(),
        }}
      />
    </div>
  );
}
