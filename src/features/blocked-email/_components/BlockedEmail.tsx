

import { EmailLink, Table, TypeBadge } from "@/components/ui";
import { Column } from "@/components/ui/Table";
import { showSuccessToast } from "@/lib/toast";
import { Check } from "lucide-react";
import { useMemo, useState } from "react";
import { BlockedEmailDrawer } from "./BlockedEmailDrawer";
import { blockedEmailRows, BlockedEmailRow } from "../_lib/data";

export function BlockedEmail() {
  const [rows, setRows] = useState<BlockedEmailRow[]>(blockedEmailRows);
  const [drawerState, setDrawerState] = useState<{
    original: BlockedEmailRow | null;
    draft: BlockedEmailRow | null;
  }>({
    original: null,
    draft: null,
  });

  const unblockRow = (row: BlockedEmailRow) => {
    setRows((current) => current.filter((item) => item.id !== row.id));
    setDrawerState({ original: null, draft: null });
    showSuccessToast(`${row.blockedEmail} has been unblocked.`);
  };

  const saveDraft = () => {
    if (!drawerState.draft) return;

    const nextRow = {
      ...drawerState.draft,
      email: drawerState.draft.email.trim(),
      blockedEmail: drawerState.draft.blockedEmail.trim(),
      reason: drawerState.draft.reason.trim(),
    };

    setRows((current) =>
      current.map((row) => (row.id === nextRow.id ? nextRow : row)),
    );
    showSuccessToast("Blocked email entry updated successfully.");
    setDrawerState({ original: nextRow, draft: nextRow });
  };

  const columns = useMemo<Column<BlockedEmailRow>[]>(
    () => [
      { title: "Lead ID", key: "leadId" },
      {
        title: "Lead Type",
        key: "leadType",
        render: (row) => <TypeBadge value={row.leadType} kind="lead" />,
      },
      {
        title: "Contact Type",
        key: "contactType",
        render: (row) => <TypeBadge value={row.contactType} kind="contact" />,
      },
      {
        title: "Email",
        key: "email",
        render: (row) => <EmailLink value={row.email} />,
      },
      {
        title: "Blocked Email",
        key: "blockedEmail",
        render: () => (
          <span
            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
            aria-label="Blocked"
            title="Blocked"
          >
            <Check size={16} />
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <div className="min-h-full">
      <Table
        data={rows}
        columns={columns}
        title="Blocked Email"
        description="Review and manage blocked email addresses across the system"
        emptyText="No blocked emails found."
        onRowClick={(row) =>
          setDrawerState({ original: { ...row }, draft: { ...row } })
        }
      />
      <BlockedEmailDrawer
        row={drawerState.draft}
        onCancel={() => setDrawerState({ original: null, draft: null })}
        onChange={(field, value) =>
          setDrawerState((current) =>
            current.draft
              ? {
                  ...current,
                  draft: { ...current.draft, [field]: value },
                }
              : current,
          )
        }
        onReset={() =>
          setDrawerState((current) => ({
            ...current,
            draft: current.original ? { ...current.original } : null,
          }))
        }
        onSave={saveDraft}
        onUnblock={unblockRow}
      />
    </div>
  );
}
