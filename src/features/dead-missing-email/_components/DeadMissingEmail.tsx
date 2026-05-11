

import {
  BooleanCheckBadge,
  EmailLink,
  Table,
  TypeBadge,
} from "@/components/ui";
import type { Column } from "@/components/ui/Table";
import { showSuccessToast } from "@/lib/toast";
import { useSearchParams } from "react-router-dom";
import { useMemo, useState } from "react";
import { deadMissingEmailRows, type DeadMissingEmailRow } from "../_lib/data";
import { DeadMissingEmailDrawer } from "./DeadMissingEmailDrawer";

type DrawerState = {
  originalId: string | null;
  initialRow: DeadMissingEmailRow | null;
  draft: DeadMissingEmailRow | null;
};

function normalizeRow(row: DeadMissingEmailRow): DeadMissingEmailRow {
  return {
    ...row,
    email: row.email.trim(),
    leadType: row.leadType.trim(),
    bentonLeadType: row.bentonLeadType.trim(),
    rm95LeadType: row.rm95LeadType.trim(),
    status: row.missingDeadEmail || !row.email.trim() ? row.status : "Updated",
  };
}

export function DeadMissingEmail() {
  const [searchParams] = useSearchParams();
  const [rows, setRows] = useState<DeadMissingEmailRow[]>(deadMissingEmailRows);
  const [drawerState, setDrawerState] = useState<DrawerState>(() => {
    const leadParam = searchParams.get("lead");
    const row = deadMissingEmailRows.find(
      (item) => item.leadId.toLowerCase() === leadParam?.toLowerCase(),
    );

    return {
      originalId: row?.id ?? null,
      initialRow: row ? { ...row } : null,
      draft: row ? { ...row } : null,
    };
  });

  const activeRows = useMemo(
    () =>
      rows.filter(
        (row) =>
          row.missingDeadEmail ||
          !row.email.trim() ||
          row.status === "Unresolvable",
      ),
    [rows],
  );

  const currentIndex = drawerState.originalId
    ? activeRows.findIndex((row) => row.id === drawerState.originalId)
    : -1;

  const columns = useMemo<Column<DeadMissingEmailRow>[]>(
    () => [
      { title: "Lead ID", key: "leadId" },
      {
        title: "Email",
        key: "email",
        render: (row) =>
          row.email ? (
            <EmailLink value={row.email} />
          ) : (
            <span className="text-slate-400"></span>
          ),
      },
      { title: "Additional Contact Emails", key: "additionalContactEmails" },
      {
        title: "Lead Type",
        key: "leadType",
        render: (row) => <TypeBadge value={row.leadType} kind="lead" />,
      },
      {
        title: "Lead Type Benton",
        key: "bentonLeadType",
        render: (row) => <TypeBadge value={row.bentonLeadType} kind="lead" />,
      },
      {
        title: "Lead Type 95RM",
        key: "rm95LeadType",
        render: (row) => <TypeBadge value={row.rm95LeadType} kind="lead" />,
      },
      {
        title: "Missing/Dead Email",
        key: "missingDeadEmail",
        getValue: (row) => (row.missingDeadEmail ? "Yes" : "No"),
        render: (row) => <BooleanCheckBadge checked={row.missingDeadEmail} />,
      },
    ],
    [],
  );

  const openDrawer = (row: DeadMissingEmailRow) => {
    setDrawerState({
      originalId: row.id,
      initialRow: { ...row },
      draft: { ...row },
    });
  };

  const navigateDrawer = (index: number) => {
    const row = activeRows[index];
    if (!row) return;
    openDrawer(row);
  };

  const closeDrawer = () => {
    setDrawerState({ originalId: null, initialRow: null, draft: null });
  };

  const updateDraft = <Key extends keyof DeadMissingEmailRow>(
    field: Key,
    value: DeadMissingEmailRow[Key],
  ) => {
    setDrawerState((current) =>
      current.draft
        ? {
            ...current,
            draft: {
              ...current.draft,
              [field]: value,
              status:
                field === "missingDeadEmail" || field === "email"
                  ? "Needs Review"
                  : current.draft.status,
            },
          }
        : current,
    );
  };

  const resetDraft = () => {
    setDrawerState((current) => ({
      ...current,
      draft: current.initialRow ? { ...current.initialRow } : null,
    }));
  };

  const saveDraft = () => {
    if (!drawerState.draft) return;

    const nextRow = normalizeRow(drawerState.draft);

    setRows((current) =>
      current.map((row) => (row.id === nextRow.id ? nextRow : row)),
    );
    setDrawerState({
      originalId: nextRow.id,
      initialRow: nextRow,
      draft: nextRow,
    });
    showSuccessToast("Lead email review updated successfully.");
  };

  return (
    <div className="min-h-full">
      <Table
        data={activeRows}
        columns={columns}
        title="Dead/Missing Email"
        description="Review leads with dead or missing primary emails"
        emptyText="No leads with dead or missing emails found."
        onRowClick={openDrawer}
      />

      <DeadMissingEmailDrawer
        row={drawerState.draft}
        currentIndex={currentIndex}
        rowCount={activeRows.length}
        onCancel={closeDrawer}
        onChange={updateDraft}
        onNavigate={navigateDrawer}
        onReset={resetDraft}
        onSave={saveDraft}
      />
    </div>
  );
}
