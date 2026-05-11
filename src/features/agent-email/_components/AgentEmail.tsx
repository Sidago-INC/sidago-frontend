

import { EmailPriorityBadge, Table } from "@/components/ui";
import type { Column } from "@/components/ui/Table";
import { showSuccessToast } from "@/lib/toast";
import { useSearchParams } from "react-router-dom";
import { useCallback, useMemo, useState } from "react";
import { AgentEmailDrawer } from "./AgentEmailDrawer";
import {
  AgentEmailBooleanEditor,
  AgentEmailBooleanRead,
  AgentEmailEditableTrigger,
  AgentEmailInlineTextCell,
  AgentEmailPriorityEditor,
  AgentEmailReadText,
} from "./AgentEmailInlineEditors";
import {
  type AgentEmailRow,
  emailPriorityOptions,
  getEmailRowsForAgent,
} from "../_lib/data";

type AgentEmailProps = {
  agentName: string;
  agentSlug: string;
};

type DrawerState = {
  original: AgentEmailRow | null;
  draft: AgentEmailRow | null;
};

function LeadButton({
  leadId,
  onOpen,
}: {
  leadId: string;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onOpen();
      }}
      className="cursor-pointer text-left text-sm font-medium text-slate-700 transition hover:text-slate-900 hover:underline dark:text-slate-200 dark:hover:text-white"
    >
      {leadId}
    </button>
  );
}

export function AgentEmail({ agentName, agentSlug }: AgentEmailProps) {
  const [searchParams] = useSearchParams();
  const [rows, setRows] = useState<AgentEmailRow[]>(() =>
    getEmailRowsForAgent(agentSlug),
  );
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [drawerState, setDrawerState] = useState<DrawerState>(() => {
    const initialRows = getEmailRowsForAgent(agentSlug);
    const leadParam = searchParams.get("lead");
    const row = initialRows.find(
      (item) =>
        item.leadId === leadParam ||
        item.email === leadParam ||
        item.id === leadParam,
    );

    return row
      ? { original: { ...row }, draft: { ...row } }
      : {
          original: null,
          draft: null,
        };
  });

  const updateRow = (
    rowId: string,
    updater: (currentRow: AgentEmailRow) => AgentEmailRow,
  ) => {
    setRows((currentRows) =>
      currentRows.map((row) => (row.id === rowId ? updater(row) : row)),
    );
  };

  const openDrawer = useCallback((row: AgentEmailRow) => {
    setEditingRowId(null);
    setDrawerState({
      original: { ...row },
      draft: { ...row },
    });
  }, []);

  const columns = useMemo<Column<AgentEmailRow>[]>(
    () => [
      {
        title: "Lead ID",
        key: "leadId",
        render: (row) => (
          <LeadButton leadId={row.leadId} onOpen={() => openDrawer(row)} />
        ),
      },
      {
        title: "Full Name",
        key: "fullName",
        render: (row) =>
          editingRowId === row.id ? (
            <AgentEmailInlineTextCell
              value={row.fullName}
              placeholder="Full name"
              onChange={(value) =>
                updateRow(row.id, (currentRow) => ({
                  ...currentRow,
                  fullName: value,
                }))
              }
            />
          ) : (
            <AgentEmailEditableTrigger onClick={() => setEditingRowId(row.id)}>
              <AgentEmailReadText value={row.fullName} />
            </AgentEmailEditableTrigger>
          ),
      },
      {
        title: "Email",
        key: "email",
        render: (row) =>
          editingRowId === row.id ? (
            <AgentEmailInlineTextCell
              value={row.email}
              placeholder="Email"
              onChange={(value) =>
                updateRow(row.id, (currentRow) => ({
                  ...currentRow,
                  email: value,
                }))
              }
            />
          ) : (
            <AgentEmailEditableTrigger onClick={() => setEditingRowId(row.id)}>
              <AgentEmailReadText value={row.email} />
            </AgentEmailEditableTrigger>
          ),
      },
      {
        title: "Email To Be Sent",
        key: "emailToBeSent",
        render: (row) =>
          editingRowId === row.id ? (
            <AgentEmailPriorityEditor
              value={row.emailToBeSent}
              options={emailPriorityOptions}
              onChange={(value) =>
                updateRow(row.id, (currentRow) => ({
                  ...currentRow,
                  emailToBeSent: value,
                }))
              }
            />
          ) : (
            <AgentEmailEditableTrigger onClick={() => setEditingRowId(row.id)}>
              <div className="px-2.5 py-1.5">
                <EmailPriorityBadge value={row.emailToBeSent} />
              </div>
            </AgentEmailEditableTrigger>
          ),
      },
      {
        title: "History",
        key: "history",
        render: (row) =>
          editingRowId === row.id ? (
            <AgentEmailInlineTextCell
              value={row.history}
              placeholder="History"
              onChange={(value) =>
                updateRow(row.id, (currentRow) => ({
                  ...currentRow,
                  history: value,
                }))
              }
            />
          ) : (
            <AgentEmailEditableTrigger onClick={() => setEditingRowId(row.id)}>
              <AgentEmailReadText value={row.history} />
            </AgentEmailEditableTrigger>
          ),
      },
      {
        title: "Check To Log",
        key: "checkToLog",
        render: (row) =>
          editingRowId === row.id ? (
            <AgentEmailBooleanEditor
              checked={row.checkToLog}
              onChange={(checked) =>
                updateRow(row.id, (currentRow) => ({
                  ...currentRow,
                  checkToLog: checked,
                }))
              }
            />
          ) : (
            <AgentEmailEditableTrigger onClick={() => setEditingRowId(row.id)}>
              <AgentEmailBooleanRead checked={row.checkToLog} />
            </AgentEmailEditableTrigger>
          ),
      },
      {
        title: "missing/dead_email",
        key: "missingDeadEmail",
        render: (row) =>
          editingRowId === row.id ? (
            <AgentEmailBooleanEditor
              checked={row.missingDeadEmail}
              onChange={(checked) =>
                updateRow(row.id, (currentRow) => ({
                  ...currentRow,
                  missingDeadEmail: checked,
                }))
              }
            />
          ) : (
            <AgentEmailEditableTrigger onClick={() => setEditingRowId(row.id)}>
              <AgentEmailBooleanRead checked={row.missingDeadEmail} />
            </AgentEmailEditableTrigger>
          ),
      },
    ],
    [editingRowId, openDrawer],
  );

  const openDrawerAtIndex = (index: number) => {
    const row = rows[index];
    if (!row) return;
    openDrawer(row);
  };

  const closeDrawer = () => {
    setDrawerState({ original: null, draft: null });
  };

  const updateDraft = (field: keyof AgentEmailRow, value: string | boolean) => {
    setDrawerState((current) =>
      current.draft
        ? {
            ...current,
            draft: {
              ...current.draft,
              [field]: value,
            },
          }
        : current,
    );
  };

  const resetDraft = () => {
    setDrawerState((current) => ({
      ...current,
      draft: current.original ? { ...current.original } : null,
    }));
  };

  const saveDraft = () => {
    if (!drawerState.draft) {
      return;
    }

    const nextRow = {
      ...drawerState.draft,
      fullName: drawerState.draft.fullName.trim(),
      phone: drawerState.draft.phone.trim(),
      email: drawerState.draft.email.trim(),
      notes: drawerState.draft.notes.trim(),
      history: drawerState.draft.history.trim(),
      additionalContacts: drawerState.draft.additionalContacts.trim(),
      additionalEmails: drawerState.draft.additionalEmails.trim(),
      selectedOutcome: drawerState.draft.selectedOutcome.trim(),
    };

    setRows((current) =>
      current.map((row) => (row.id === nextRow.id ? nextRow : row)),
    );
    showSuccessToast("Email queue entry updated successfully.");
    setDrawerState({
      original: nextRow,
      draft: nextRow,
    });
  };

  return (
    <div className="min-h-full">
      <Table
        data={rows}
        columns={columns}
        title={`Email - ${agentName}`}
        description="Prioritized emails to be sent by agent"
        emptyText="No emails are queued for this agent."
        onRowClick={openDrawer}
      />

      <AgentEmailDrawer
        row={drawerState.draft}
        currentIndex={rows.findIndex((row) => row.id === drawerState.draft?.id)}
        rowCount={rows.length}
        onCancel={closeDrawer}
        onChange={updateDraft}
        onNavigate={openDrawerAtIndex}
        onReset={resetDraft}
        onSave={saveDraft}
      />
    </div>
  );
}
