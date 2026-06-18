
import {
  Badge,
  CompanySymbolBadge,
  EmailLink,
  ErrorState,
  Table,
  TypeBadge,
} from "@/components/ui";
import { Column } from "@/components/ui/Table";
import {
  showErrorToast,
  showInfoToast,
  showSuccessToast,
} from "@/lib/toast";
import { useMemo, useState } from "react";
import { BlockedEmailDrawer } from "./BlockedEmailDrawer";
import {
  BlockedEmailRow,
  getBlockedBrandLabel,
  useBlockedEmails,
  useUnblockBlockedEmail,
} from "../_lib/data";

const DEFAULT_ROWS_PER_PAGE = 10;

export function BlockedEmail() {
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const { data = [], isLoading, isError, error, refetch } =
    useBlockedEmails(rowsPerPage);
  const unblockMutation = useUnblockBlockedEmail();
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  const selectedRow = useMemo(
    () => data.find((row) => row.leadId === selectedLeadId) ?? null,
    [data, selectedLeadId],
  );

  const unblockRow = async (row: BlockedEmailRow) => {
    try {
      const result = await unblockMutation.mutateAsync(row.leadId);
      setSelectedLeadId(null);

      if (result.updated > 0) {
        showSuccessToast(
          `${row.email ?? row.leadId} has been unblocked.`,
        );
        return;
      }

      showInfoToast(
        `${row.leadId} was already unblocked.`,
      );
    } catch (mutationError) {
      showErrorToast(mutationError);
    }
  };

  const columns = useMemo<Column<BlockedEmailRow>[]>(
    () => [
      {
        title: "Lead ID",
        key: "leadId",
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
          row.email ? (
            <EmailLink value={row.email} />
          ) : (
            <span className="text-slate-400">-</span>
          ),
      },
      {
        title: "SVG Lead Type",
        key: "leadTypeSvg",
        render: (row) =>
          row.leadTypeSvg ? (
            <TypeBadge value={row.leadTypeSvg} kind="lead" />
          ) : (
            <span className="text-slate-400">-</span>
          ),
      },
      {
        title: "Benton Lead Type",
        key: "leadTypeBenton",
        render: (row) =>
          row.leadTypeBenton ? (
            <TypeBadge value={row.leadTypeBenton} kind="lead" />
          ) : (
            <span className="text-slate-400">-</span>
          ),
      },
      {
        title: "95RM Lead Type",
        key: "leadType95rm",
        render: (row) =>
          row.leadType95rm ? (
            <TypeBadge value={row.leadType95rm} kind="lead" />
          ) : (
            <span className="text-slate-400">-</span>
          ),
      },
      {
        title: "Blocked Brands",
        key: "blockedBrands",
        getValue: (row) => row.blockedBrands.map(getBlockedBrandLabel).join(", "),
        render: (row) => (
          <div className="flex flex-wrap gap-1.5">
            {row.blockedBrands.map((brand) => (
              <Badge key={brand}>{getBlockedBrandLabel(brand)}</Badge>
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
        title="Failed to load blocked emails"
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
        title="Blocked Email"
        description="Review blocked email leads across all brands and unblock them when needed"
        emptyText="No blocked emails found."
        onRowClick={(row) => setSelectedLeadId(row.leadId)}
      />
      <BlockedEmailDrawer
        row={selectedRow}
        isUnblocking={unblockMutation.isPending}
        onCancel={() => setSelectedLeadId(null)}
        onUnblock={unblockRow}
      />
    </div>
  );
}
