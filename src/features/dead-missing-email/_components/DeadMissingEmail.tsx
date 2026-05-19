
import {
  Badge,
  BooleanCheckBadge,
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
import { useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import {
  getDeadEmailBrandLabel,
  getDeadEmailDisplayLeadId,
  type DeadMissingEmailRow,
  useClearDeadMissingEmail,
  useDeadMissingEmails,
} from "../_lib/data";
import { DeadMissingEmailDrawer } from "./DeadMissingEmailDrawer";

const DEFAULT_ROWS_PER_PAGE = 10;

export function DeadMissingEmail() {
  const [searchParams] = useSearchParams();
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const { data = [], isLoading, isError, error, refetch } =
    useDeadMissingEmails(rowsPerPage);
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
        key: "leadId",
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
        title: "Missing/Dead Email",
        key: "missingDeadBrands",
        getValue: (row) =>
          row.missingDeadBrands.length > 0 ? "Yes" : "No",
        render: (row) => (
          <BooleanCheckBadge checked={row.missingDeadBrands.length > 0} />
        ),
      },
      {
        title: "Flagged Brands",
        key: "flaggedBrands",
        getValue: (row) =>
          row.missingDeadBrands.map(getDeadEmailBrandLabel).join(", "),
        render: (row) => (
          <div className="flex flex-wrap gap-1.5">
            {row.missingDeadBrands.map((brand) => (
              <Badge key={brand}>{getDeadEmailBrandLabel(brand)}</Badge>
            ))}
          </div>
        ),
      },
    ],
    [],
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
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={setRowsPerPage}
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
