

import { EmailPriorityBadge, Table } from "@/components/ui";
import type { Column } from "@/components/ui/Table";
import { getLeadGridLabel } from "@/features/backoffice-shared/constants";
import { getCallBackDateError } from "@/features/agent-calls/_lib/utils";
import { toggleMarkVoid } from "@/features/agent-calls/_lib/markVoid";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { useSearchParams } from "react-router-dom";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { useGridUrlState } from "@/lib/use-grid-url-state";
import { useServerPagination } from "@/lib/use-server-pagination";
import { AgentEmailDrawer } from "./AgentEmailDrawer";
import {
  AgentEmailBooleanRead,
  AgentEmailEditableTrigger,
  AgentEmailInlineTextCell,
  AgentEmailReadText,
} from "./AgentEmailInlineEditors";
import {
  type AgentEmailRow,
  mapEmailQueueItem,
} from "../_lib/data";
import {
  useEmailHistory,
  useLogEmail,
  useEmailQueue,
  useUpdateEmailState,
  useLogCallResult,
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
  const { page, perPage, setPage, setPerPage } = useServerPagination();

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

  const { data: queueData, isLoading } = useEmailQueue(
    agentSlug,
    page,
    perPage,
    url.grid,
  );
  const serverPagination = queueData?.meta
    ? {
        meta: queueData.meta,
        onPageChange: setPage,
        onPerPageChange: setPerPage,
      }
    : undefined;
  const updateEmailState = useUpdateEmailState();
  const logEmail = useLogEmail();
  const logCallResult = useLogCallResult(agentSlug);
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

  // Toggle the dead/missing-email flag straight from the table row. Persists
  // via PATCH /email/state (the same endpoint the drawer Save uses) so the
  // lead actually appears on / leaves the Dead/Missing Email page. Optimistic:
  // flips the cell immediately, rolls back if the request fails.
  const toggleMissingDead = async (row: AgentEmailRow) => {
    const next = !row.missingDeadEmail;
    updateRow(row.id, (currentRow) => ({
      ...currentRow,
      missingDeadEmail: next,
    }));
    try {
      await updateEmailState.mutateAsync({
        leadId: row.leadId,
        brandCode: row.brandCode,
        body: { isMissingDeadEmail: next },
      });
      showSuccessToast(
        next
          ? "Lead flagged as dead/missing email."
          : "Dead/missing email flag cleared.",
      );
    } catch (error) {
      updateRow(row.id, (currentRow) => ({
        ...currentRow,
        missingDeadEmail: !next,
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
        key: "lead",
        getValue: (row) => getLeadGridLabel(row),
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
        key: "emailStatus",
        getValue: (row) => row.emailToBeSent,
        render: (row) => (
          <div className="px-2.5 py-1.5">
            <EmailPriorityBadge value={row.emailToBeSent} />
          </div>
        ),
      },
      {
        // Local free-text log, not a backend grid field.
        title: "History",
        key: "history",
        filterable: false,
        sortable: false,
        groupable: false,
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
        filterable: false,
        sortable: false,
        groupable: false,
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
        filterable: false,
        sortable: false,
        groupable: false,
        render: (row) => (
          <AgentEmailEditableTrigger
            onClick={() => {
              void toggleMissingDead(row);
            }}
          >
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

  const handleNotWorkedChange = async (checked: boolean) => {
    const row = drawerState.draft;
    if (!row) return;

    updateDraft("notWorked", checked);
    if (!checked) return;

    const ok = await toggleMarkVoid(agentSlug, row.leadId, checked, {
      successMessage: "Lead marked as no longer working at the company.",
    });
    if (!ok) {
      updateDraft("notWorked", false);
    }
  };

  const resetDraft = () => {
    setDrawerState((current) => ({
      ...current,
      draft: current.original ? { ...current.original } : null,
    }));
  };

  const handleOutcome = async (resultCode: string) => {
    if (!drawerState.draft || logCallResult.isPending) {
      return;
    }

    const row = drawerState.draft;
    const callbackError = getCallBackDateError(
      row.callBackDate,
      row.lastActionDate ?? "",
    );
    if (callbackError) {
      showErrorToast(callbackError);
      return;
    }

    try {
      await logCallResult.mutateAsync({
        agentSlug,
        leadId: row.leadId,
        resultCode,
        notes: row.notes || undefined,
        followUpDate: row.callBackDate || undefined,
        source: "manual",
      });

      showSuccessToast("Call outcome logged successfully.");

      const rowIndex = rows.findIndex((item) => item.id === row.id);
      const nextRows = rows.filter((item) => item.id !== row.id);
      setRows(nextRows);

      if (nextRows.length === 0) {
        closeDrawer();
        return;
      }

      openDrawerAtIndex(Math.min(rowIndex, nextRows.length - 1));
    } catch (error) {
      showErrorToast(error);
    }
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
        serverPagination={serverPagination}
        serverSearch={{
          value: searchInput,
          onChange: setSearchInput,
          placeholder: "Search name, symbol, or lead ID",
        }}
        serverGrid={{
          filters: url.filterItems,
          rootGate: url.rootGate,
          sort: url.sortRules,
          groupBy: url.groupBy,
          onFiltersChange: url.setFilters,
          onSortChange: url.setSort,
          onGroupByChange: url.setGroupBy,
          groupCounts: queueData?.meta?.groups,
        }}
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
        onNotWorkedChange={handleNotWorkedChange}
        onNavigate={openDrawerAtIndex}
        onReset={resetDraft}
        onSave={saveDraft}
        onOutcomeSelect={handleOutcome}
        outcomeLoading={logCallResult.isPending}
      />
    </div>
  );
}
