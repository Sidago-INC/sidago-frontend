

import { CompanySymbolBadge, Table } from "@/components/ui";
import type { Column } from "@/components/ui/Table";
import { showSuccessToast } from "@/lib/toast";
import { useSearchParams } from "react-router-dom";
import { useMemo, useState } from "react";
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
  getSmsRowsForAgent,
  smsStatusOptions,
} from "../_lib/data";

type AgentSmsProps = {
  agentName: string;
  agentSlug: string;
};

type DrawerState = {
  original: AgentSmsRow | null;
  draft: AgentSmsRow | null;
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

export function AgentSms({ agentName, agentSlug }: AgentSmsProps) {
  const [searchParams] = useSearchParams();
  const [rows, setRows] = useState<AgentSmsRow[]>(() =>
    getSmsRowsForAgent(agentSlug),
  );
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [drawerState, setDrawerState] = useState<DrawerState>(() => {
    const initialRows = getSmsRowsForAgent(agentSlug);
    const leadParam = searchParams.get("lead");
    const row = initialRows.find(
      (item) =>
        item.leadId === leadParam ||
        item.email === leadParam ||
        item.id === leadParam,
    );

    return row
      ? { original: { ...row }, draft: { ...row } }
      : { original: null, draft: null };
  });

  const updateRow = (
    rowId: string,
    updater: (currentRow: AgentSmsRow) => AgentSmsRow,
  ) => {
    setRows((currentRows) =>
      currentRows.map((row) => (row.id === rowId ? updater(row) : row)),
    );
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
            onToggle={() =>
              updateRow(row.id, (currentRow) => ({
                ...currentRow,
                smsLogged: !currentRow.smsLogged,
              }))
            }
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

  const saveDraft = () => {
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

    setRows((current) =>
      current.map((row) => (row.id === nextRow.id ? nextRow : row)),
    );
    showSuccessToast("SMS activity updated successfully.");
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
