

import { EmailPriorityBadge, Table } from "@/components/ui";
import type { Column } from "@/components/ui/Table";
import { getLeadGridLabel } from "@/features/backoffice-shared/constants";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { useSearchParams } from "react-router-dom";
import { useCallback, useEffect, useMemo, useState } from "react";
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
  mapEmailQueueItem,
} from "../_lib/data";
import {
  useEmailHistory,
  useLogEmail,
  useEmailQueue,
  useUpdateEmailState,
} from "../_lib/hooks";

type AgentEmailProps = {
  agentName: string;
  agentSlug: string;
};

type DrawerState = {
  original: AgentEmailRow | null;
  draft: AgentEmailRow | null;
};

function formatHistoryDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
}

function formatEmailHistory(
  history: Array<{
    sentAt: string;
    userName: string | null;
    status: string | null;
    subject: string | null;
    body: string | null;
  }>,
) {
  return history
    .map((entry) =>
      [
        formatHistoryDate(entry.sentAt),
        entry.userName,
        entry.status,
        entry.subject || entry.body,
      ]
        .filter(Boolean)
        .join(" - "),
    )
    .join("\n");
}

function LeadButton({
  leadId,
  label,
  onOpen,
}: {
  leadId: string;
  label?: string;
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
      {label ?? leadId}
    </button>
  );
}

export function AgentEmail({ agentName, agentSlug }: AgentEmailProps) {
  const [searchParams] = useSearchParams();
  const { data: queueData, isLoading } = useEmailQueue(agentSlug);
  const updateEmailState = useUpdateEmailState();
  const logEmail = useLogEmail();
  const apiRows = useMemo(
    () =>
      (queueData?.data ?? []).map((item) =>
        mapEmailQueueItem(item, queueData?.brandCode ?? "svg"),
      ),
    [queueData],
  );
  const [rows, setRows] = useState<AgentEmailRow[]>([]);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [drawerState, setDrawerState] = useState<DrawerState>({
    original: null,
    draft: null,
  });
  const activeHistoryRow = drawerState.draft ?? drawerState.original;
  const { data: emailHistory = [] } = useEmailHistory(
    activeHistoryRow?.leadId,
    activeHistoryRow?.brandCode,
  );

  useEffect(() => {
    setRows(apiRows);
  }, [apiRows]);

  useEffect(() => {
    const leadParam = searchParams.get("lead");
    if (!leadParam || apiRows.length === 0) {
      return;
    }

    const row = apiRows.find(
      (item) =>
        item.leadId === leadParam ||
        item.email === leadParam ||
        item.id === leadParam,
    );

    if (row) {
      setDrawerState({ original: { ...row }, draft: { ...row } });
    }
  }, [apiRows, searchParams]);

  useEffect(() => {
    if (!activeHistoryRow || emailHistory.length === 0) {
      return;
    }

    const formattedHistory = formatEmailHistory(emailHistory);
    if (!formattedHistory.trim()) {
      return;
    }

    setRows((currentRows) =>
      currentRows.map((row) =>
        row.id === activeHistoryRow.id && row.history !== formattedHistory
          ? { ...row, history: formattedHistory }
          : row,
      ),
    );

    setDrawerState((current) => {
      if (!current.draft || current.draft.id !== activeHistoryRow.id) {
        return current;
      }

      const nextOriginal = current.original
        ? { ...current.original, history: formattedHistory }
        : current.original;

      const nextDraft =
        current.draft.history.trim().length === 0
          ? { ...current.draft, history: formattedHistory }
          : current.draft;

      if (
        nextOriginal?.history === current.original?.history &&
        nextDraft.history === current.draft.history
      ) {
        return current;
      }

      return {
        original: nextOriginal,
        draft: nextDraft,
      };
    });
  }, [activeHistoryRow, emailHistory]);

  const updateRow = (
    rowId: string,
    updater: (currentRow: AgentEmailRow) => AgentEmailRow,
  ) => {
    setRows((currentRows) =>
      currentRows.map((row) => (row.id === rowId ? updater(row) : row)),
    );
  };

  const submitEmailLog = async (row: AgentEmailRow) => {
    if (row.checkToLog) {
      return;
    }

    updateRow(row.id, (currentRow) => ({
      ...currentRow,
      checkToLog: true,
    }));

    try {
      await logEmail.mutateAsync({
        leadId: row.leadId,
        brandCode: row.brandCode,
        subject: `Email log for ${row.fullName || row.companyName || row.leadId}`,
        body:
          row.history.trim() ||
          row.notes.trim() ||
          `Email log recorded for ${row.fullName || row.companyName || row.leadId}`,
        status: row.emailToBeSent,
      });
      showSuccessToast("Email log recorded successfully.");
    } catch (error) {
      updateRow(row.id, (currentRow) => ({
        ...currentRow,
        checkToLog: false,
      }));
      showErrorToast(error);
    }
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
          <LeadButton
            leadId={row.leadId}
            label={getLeadGridLabel(row)}
            onOpen={() => openDrawer(row)}
          />
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
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                void submitEmailLog(row);
              }}
              className="inline-flex cursor-pointer items-center"
            >
              <AgentEmailBooleanRead checked={row.checkToLog} />
            </button>
          ) : (
            <AgentEmailEditableTrigger
              onClick={() => {
                void submitEmailLog(row);
              }}
            >
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

  const saveDraft = async () => {
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

    try {
      await updateEmailState.mutateAsync({
        leadId: nextRow.leadId,
        brandCode: nextRow.brandCode,
        body: {
          isEmailLogged: nextRow.checkToLog,
          isMissingDeadEmail: nextRow.missingDeadEmail,
        },
      });

      setRows((current) =>
        current.map((row) => (row.id === nextRow.id ? nextRow : row)),
      );
      showSuccessToast("Email queue entry updated successfully.");
      setDrawerState({
        original: nextRow,
        draft: nextRow,
      });
    } catch (error) {
      showErrorToast(error);
    }
  };

  return (
    <div className="min-h-full">
      <Table
        data={rows}
        columns={columns}
        isLoading={isLoading}
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
