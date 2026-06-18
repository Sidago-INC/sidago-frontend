

import { CompanySymbolBadge, Table } from "@/components/ui";
import type { Column } from "@/components/ui/Table";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import {
  AgentSmsEditableTrigger,
  AgentSmsInlineTextCell,
  AgentSmsReadText,
  AgentSmsStatusEditor,
} from "./AgentSmsInlineEditors";
import { AgentSmsDrawer } from "./AgentSmsDrawer";
import { AgentSmsStatusBadge } from "./AgentSmsStatusBadge";
import { SmsLogButton } from "./SmsLogButton";
import {
  type AgentSmsRow,
  mapSmsQueueItem,
  smsAgentProfiles,
  smsStatusOptions,
} from "../_lib/data";
import {
  useSmsHistory,
  useSmsQueue,
  useUpdateSmsState,
} from "../_lib/hooks";

type AgentSmsProps = {
  agentName: string;
  agentSlug: string;
};

type DrawerState = {
  original: AgentSmsRow | null;
  draft: AgentSmsRow | null;
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

function formatSmsHistory(
  history: Array<{
    sentAt: string;
    userName: string | null;
    status: string | null;
    body: string | null;
  }>,
) {
  return history
    .map((entry) =>
      [formatHistoryDate(entry.sentAt), entry.userName, entry.status, entry.body]
        .filter(Boolean)
        .join(" - "),
    )
    .join("\n");
}

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

export function AgentSms({ agentName, agentSlug }: AgentSmsProps) {
  const [searchParams] = useSearchParams();
  const profile = smsAgentProfiles[agentSlug] ?? {
    agentName: agentSlug,
    brand: "Sidago" as const,
  };
  const { data: queueData, isLoading } = useSmsQueue(agentSlug);
  const updateSmsState = useUpdateSmsState();
  const apiRows = useMemo(
    () =>
      (queueData?.data ?? []).map((item) =>
        mapSmsQueueItem(item, queueData?.brandCode ?? "svg", profile.brand),
      ),
    [queueData, profile.brand],
  );
  const [rows, setRows] = useState<AgentSmsRow[]>([]);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [drawerState, setDrawerState] = useState<DrawerState>({
    original: null,
    draft: null,
  });
  const activeHistoryRow = drawerState.draft ?? drawerState.original;
  const { data: smsHistory = [] } = useSmsHistory(
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
    if (!activeHistoryRow || smsHistory.length === 0) {
      return;
    }

    const formattedHistory = formatSmsHistory(smsHistory);
    if (!formattedHistory.trim()) {
      return;
    }

    setRows((currentRows) =>
      currentRows.map((row) =>
        row.id === activeHistoryRow.id && row.smsLog !== formattedHistory
          ? { ...row, smsLog: formattedHistory }
          : row,
      ),
    );

    setDrawerState((current) => {
      if (!current.draft || current.draft.id !== activeHistoryRow.id) {
        return current;
      }

      const nextOriginal = current.original
        ? { ...current.original, smsLog: formattedHistory }
        : current.original;

      const nextDraft =
        current.draft.smsLog.trim().length === 0
          ? { ...current.draft, smsLog: formattedHistory }
          : current.draft;

      if (
        nextOriginal?.smsLog === current.original?.smsLog &&
        nextDraft.smsLog === current.draft.smsLog
      ) {
        return current;
      }

      return {
        original: nextOriginal,
        draft: nextDraft,
      };
    });
  }, [activeHistoryRow, smsHistory]);

  const updateRow = (
    rowId: string,
    updater: (currentRow: AgentSmsRow) => AgentSmsRow,
  ) => {
    setRows((currentRows) =>
      currentRows.map((row) => (row.id === rowId ? updater(row) : row)),
    );
  };

  const toggleSmsLogged = async (row: AgentSmsRow) => {
    const nextValue = !row.smsLogged;
    updateRow(row.id, (currentRow) => ({
      ...currentRow,
      smsLogged: nextValue,
    }));

    try {
      await updateSmsState.mutateAsync({
        leadId: row.leadId,
        brandCode: row.brandCode,
        body: { isSmsLogged: nextValue },
      });
    } catch (error) {
      updateRow(row.id, (currentRow) => ({
        ...currentRow,
        smsLogged: row.smsLogged,
      }));
      showErrorToast(error);
    }
  };

  const openDrawer = (row: AgentSmsRow) => {
    setDrawerState({
      original: { ...row },
      draft: { ...row },
    });
  };

  const openDrawerAtIndex = (index: number) => {
    const row = rows[index];

    if (!row) {
      return;
    }

    openDrawer(row);
  };

  const updateDraft = (field: keyof AgentSmsRow, value: string | boolean) => {
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

  const columns = useMemo<Column<AgentSmsRow>[]>(
    () => [
      {
        title: "Lead ID",
        key: "leadId",
        render: (row) => (
          <LeadButton leadId={row.leadId} onOpen={() => openDrawer(row)} />
        ),
      },
      {
        title: "Company Symbol",
        key: "companySymbol",
        render: (row) => (
          <CompanySymbolBadge
            symbol={row.companySymbol}
            index={rows.findIndex((item) => item.id === row.id)}
          />
        ),
      },
      {
        title: "Full Name",
        key: "fullName",
        render: (row) =>
          editingRowId === row.id ? (
            <AgentSmsInlineTextCell
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
            <AgentSmsEditableTrigger onClick={() => setEditingRowId(row.id)}>
              <AgentSmsReadText value={row.fullName} />
            </AgentSmsEditableTrigger>
          ),
      },
      {
        title: "Phone",
        key: "phone",
        render: (row) =>
          editingRowId === row.id ? (
            <AgentSmsInlineTextCell
              value={row.phone}
              placeholder="Phone"
              onChange={(value) =>
                updateRow(row.id, (currentRow) => ({
                  ...currentRow,
                  phone: value,
                }))
              }
            />
          ) : (
            <AgentSmsEditableTrigger onClick={() => setEditingRowId(row.id)}>
              <AgentSmsReadText value={row.phone} />
            </AgentSmsEditableTrigger>
          ),
      },
      {
        title: "SMS Status",
        key: "smsStatus",
        render: (row) =>
          editingRowId === row.id ? (
            <AgentSmsStatusEditor
              value={row.smsStatus}
              options={smsStatusOptions}
              onChange={(value) =>
                updateRow(row.id, (currentRow) => ({
                  ...currentRow,
                  smsStatus: value,
                }))
              }
            />
          ) : (
            <AgentSmsEditableTrigger onClick={() => setEditingRowId(row.id)}>
              <div className="px-2.5 py-1.5">
                <AgentSmsStatusBadge status={row.smsStatus} />
              </div>
            </AgentSmsEditableTrigger>
          ),
      },
      {
        title: "SMS Log",
        key: "smsLogged",
        render: (row) => (
          <SmsLogButton
            checked={row.smsLogged}
            onToggle={() => toggleSmsLogged(row)}
          />
        ),
      },
    ],
    [editingRowId, rows],
  );

  const closeDrawer = () => {
    setDrawerState({ original: null, draft: null });
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

    const nextRow: AgentSmsRow = {
      ...drawerState.draft,
      fullName: drawerState.draft.fullName.trim(),
      phone: drawerState.draft.phone.trim(),
      email: drawerState.draft.email.trim(),
      notes: drawerState.draft.notes.trim(),
      smsLog: drawerState.draft.smsLog.trim(),
      additionalContacts: drawerState.draft.additionalContacts.trim(),
      selectedOutcome: drawerState.draft.selectedOutcome.trim(),
      smsLogged: drawerState.draft.smsLogged,
    };

    try {
      await updateSmsState.mutateAsync({
        leadId: nextRow.leadId,
        brandCode: nextRow.brandCode,
        body: { isSmsLogged: nextRow.smsLogged },
      });

      setRows((current) =>
        current.map((row) => (row.id === nextRow.id ? nextRow : row)),
      );
      showSuccessToast("SMS activity updated successfully.");
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
        title={`SMS - ${agentName}`}
        description="SMS activity and logs tied to assigned leads"
        emptyText="No SMS activity found for this agent."
        onRowClick={openDrawer}
      />
      <AgentSmsDrawer
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
