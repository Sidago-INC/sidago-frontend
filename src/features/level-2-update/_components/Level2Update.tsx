

import {
  Badge,
  Button,
  CampaignBadge,
  DatePickerField,
  Select,
  Table,
  TypeBadge,
} from "@/components/ui";
import { type Column } from "@/components/ui/Table";
import clsx from "clsx";
import { FileText, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import type { BRAND } from "@/types/brand.types";
import type { LEAD_TYPE } from "@/types/lead-type.types";
import {
  createEmptyLevel2UpdateRow,
  level2AgentOptions,
  level2LeadOptions,
  level2ResultUpdateOptions,
  level2UpdateCampaignOptions,
  level2UpdateLeadTypeOptions,
  level2UpdateRows,
  type Level2UpdateRow,
} from "../_lib/data";

const cellInputClass =
  "h-8 min-w-[8rem] w-full rounded-lg border border-transparent bg-transparent px-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 hover:bg-slate-50 focus:border-slate-200 focus:bg-white focus:text-slate-900 dark:text-slate-200 dark:placeholder:text-slate-500 dark:hover:bg-slate-800/70 dark:focus:border-slate-700 dark:focus:bg-slate-900";

const actionButtonClass =
  "inline-flex h-8 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-medium transition cursor-pointer";

const readTextClass =
  "block min-h-8 px-2.5 py-1.5 text-sm text-slate-700 dark:text-slate-200";

const cellSelectClass =
  "h-8 min-w-[8rem] rounded-lg border-transparent bg-transparent px-2 py-1 text-sm shadow-none hover:bg-slate-50 focus:border-slate-200 dark:border-transparent dark:bg-transparent dark:hover:bg-slate-800/70 dark:focus:border-slate-700 dark:focus:bg-slate-900";

const cellSelectOptionsClass =
  "z-[300] max-h-72 rounded-xl border-slate-200 p-1 shadow-xl dark:border-slate-700 dark:bg-slate-950";

function ReadText({
  value,
  placeholder = "-",
}: {
  value: string;
  placeholder?: string;
}) {
  if (!value.trim()) {
    return (
      <span
        className={clsx(readTextClass, "text-slate-400 dark:text-slate-500")}
      >
        {placeholder}
      </span>
    );
  }

  return <span className={readTextClass}>{value}</span>;
}

function ResultBadge({ value }: { value: string }) {
  if (!value.trim()) {
    return <Badge className="text-slate-400 dark:text-slate-500">Select</Badge>;
  }

  if (value === "Fixed") {
    return <Badge variant="success">{value}</Badge>;
  }

  if (value === "Sent To Fix" || value === "On Hold") {
    return <Badge variant="warning">{value}</Badge>;
  }

  if (value === "Can't Locate") {
    return <Badge variant="error">{value}</Badge>;
  }

  return <Badge>{value}</Badge>;
}

function LeadEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Select
      value={value}
      options={level2LeadOptions}
      placeholder="Select lead"
      searchable
      searchPlaceholder="Search lead"
      onChange={(nextValue) => onChange(String(nextValue))}
      className={cellSelectClass}
      optionsClassName={cellSelectOptionsClass}
    />
  );
}

function CampaignEditor({
  value,
  onChange,
}: {
  value: BRAND | "";
  onChange: (value: BRAND | "") => void;
}) {
  return (
    <Select
      value={value}
      options={level2UpdateCampaignOptions}
      placeholder="Select campaign"
      searchable
      searchPlaceholder="Search campaign"
      onChange={(nextValue) => onChange(String(nextValue) as BRAND | "")}
      className={cellSelectClass}
      optionsClassName={cellSelectOptionsClass}
    />
  );
}

function LeadTypeEditor({
  value,
  onChange,
}: {
  value: LEAD_TYPE | "";
  onChange: (value: LEAD_TYPE | "") => void;
}) {
  return (
    <Select
      value={value}
      options={level2UpdateLeadTypeOptions}
      placeholder="Select type"
      searchable
      searchPlaceholder="Search type"
      onChange={(nextValue) => onChange(String(nextValue) as LEAD_TYPE | "")}
      className={cellSelectClass}
      optionsClassName={cellSelectOptionsClass}
    />
  );
}

function ResultEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Select
      value={value}
      options={level2ResultUpdateOptions}
      placeholder="Select result"
      searchable
      searchPlaceholder="Search result"
      onChange={(nextValue) => onChange(String(nextValue))}
      className={cellSelectClass}
      optionsClassName={cellSelectOptionsClass}
    />
  );
}

function AgentEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Select
      value={value}
      options={level2AgentOptions}
      placeholder="Select agent"
      searchable
      searchPlaceholder="Search agent"
      onChange={(nextValue) => onChange(String(nextValue))}
      className={cellSelectClass}
      optionsClassName={cellSelectOptionsClass}
    />
  );
}

export function Level2Update() {
  const [rows, setRows] = useState(level2UpdateRows);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);

  const updateRow = <K extends keyof Level2UpdateRow>(
    rowId: string,
    key: K,
    value: Level2UpdateRow[K],
  ) => {
    setRows((current) =>
      current.map((row) => (row.id === rowId ? { ...row, [key]: value } : row)),
    );
  };

  const handleAddLead = () => {
    const newRow = createEmptyLevel2UpdateRow(rows.length + 1);
    setRows((current) => [...current, newRow]);
    setEditingRowId(newRow.id);
  };

  const handleDelete = (rowId: string) => {
    setRows((current) => current.filter((row) => row.id !== rowId));
    setEditingRowId((current) => (current === rowId ? null : current));
  };

  const handleLogResult = (rowId: string) => {
    const today = new Date().toISOString().slice(0, 10);

    setRows((current) =>
      current.map((row) => {
        if (row.id !== rowId) {
          return row;
        }

        const resultLabel = row.level_2_result_update.trim() || "No result";
        const noteEntry = `[${today}] ${resultLabel}`;

        return {
          ...row,
          updated_notes: row.updated_notes
            ? `${row.updated_notes} | ${noteEntry}`
            : noteEntry,
        };
      }),
    );
  };

  const isEditingRow = (rowId: string) => editingRowId === rowId;

  const columns: Column<Level2UpdateRow>[] = [
    {
      title: "Lead",
      key: "lead",
      render: (row) =>
        isEditingRow(row.id) ? (
          <div onClick={(event) => event.stopPropagation()}>
            <LeadEditor
              value={row.lead}
              onChange={(value) => updateRow(row.id, "lead", value)}
            />
          </div>
        ) : (
          <ReadText value={row.lead} />
        ),
    },
    {
      title: "Campaign",
      key: "campaign",
      render: (row) =>
        isEditingRow(row.id) ? (
          <div onClick={(event) => event.stopPropagation()}>
            <CampaignEditor
              value={row.campaign}
              onChange={(value) => updateRow(row.id, "campaign", value)}
            />
          </div>
        ) : (
          <CampaignBadge value={row.campaign} />
        ),
    },
    {
      title: "level 2 agent",
      key: "level_2_agent",
      render: (row) =>
        isEditingRow(row.id) ? (
          <div onClick={(event) => event.stopPropagation()}>
            <AgentEditor
              value={row.level_2_agent}
              onChange={(value) => updateRow(row.id, "level_2_agent", value)}
            />
          </div>
        ) : (
          <ReadText value={row.level_2_agent} />
        ),
    },
    {
      title: "Level 2 result update",
      key: "level_2_result_update",
      render: (row) =>
        isEditingRow(row.id) ? (
          <div onClick={(event) => event.stopPropagation()}>
            <ResultEditor
              value={row.level_2_result_update}
              onChange={(value) =>
                updateRow(row.id, "level_2_result_update", value)
              }
            />
          </div>
        ) : (
          <ResultBadge value={row.level_2_result_update} />
        ),
    },
    {
      title: "Updated Notes",
      key: "updated_notes",
      render: (row) =>
        isEditingRow(row.id) ? (
          <input
            type="text"
            value={row.updated_notes}
            onClick={(event) => event.stopPropagation()}
            onChange={(event) =>
              updateRow(row.id, "updated_notes", event.target.value)
            }
            className={cellInputClass}
            placeholder="Updated notes"
          />
        ) : (
          <ReadText value={row.updated_notes} />
        ),
    },
    {
      title: "Call back Date",
      key: "call_back_date",
      type: "date",
      render: (row) =>
        isEditingRow(row.id) ? (
          <div onClick={(event) => event.stopPropagation()}>
            <DatePickerField
              value={row.call_back_date}
              onChange={(value) => updateRow(row.id, "call_back_date", value)}
              className={cellInputClass}
              placeholder="Pick a date"
            />
          </div>
        ) : (
          <ReadText value={row.call_back_date} />
        ),
    },
    {
      title: "Created date",
      key: "created_date",
      type: "date",
      render: (row) =>
        isEditingRow(row.id) ? (
          <div onClick={(event) => event.stopPropagation()}>
            <DatePickerField
              value={row.created_date}
              onChange={(value) => updateRow(row.id, "created_date", value)}
              className={cellInputClass}
              placeholder="Pick a date"
            />
          </div>
        ) : (
          <ReadText value={row.created_date} />
        ),
    },
    {
      title: "Lead Type Sidago",
      key: "lead_type_sidago",
      render: (row) =>
        isEditingRow(row.id) ? (
          <div onClick={(event) => event.stopPropagation()}>
            <LeadTypeEditor
              value={row.lead_type_sidago}
              onChange={(value) => updateRow(row.id, "lead_type_sidago", value)}
            />
          </div>
        ) : (
          <TypeBadge value={row.lead_type_sidago} kind="lead" />
        ),
    },
    {
      title: "Lead Type Benton",
      key: "lead_type_benton",
      render: (row) =>
        isEditingRow(row.id) ? (
          <div onClick={(event) => event.stopPropagation()}>
            <LeadTypeEditor
              value={row.lead_type_benton}
              onChange={(value) => updateRow(row.id, "lead_type_benton", value)}
            />
          </div>
        ) : (
          <TypeBadge value={row.lead_type_benton} kind="lead" />
        ),
    },
    {
      title: "Lead Type 95 RM",
      key: "lead_type_95rm",
      render: (row) =>
        isEditingRow(row.id) ? (
          <div onClick={(event) => event.stopPropagation()}>
            <LeadTypeEditor
              value={row.lead_type_95rm}
              onChange={(value) => updateRow(row.id, "lead_type_95rm", value)}
            />
          </div>
        ) : (
          <TypeBadge value={row.lead_type_95rm} kind="lead" />
        ),
    },
    {
      title: "Log Result",
      key: "log_result",
      render: (row) => (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            handleLogResult(row.id);
          }}
          className={clsx(
            actionButtonClass,
            "border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300",
          )}
        >
          <FileText size={16} />
          Log Result
        </button>
      ),
    },
    {
      title: "Delete",
      key: "delete",
      render: (row) => (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            handleDelete(row.id);
          }}
          className={clsx(
            actionButtonClass,
            "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300",
          )}
          aria-label={`Delete ${row.lead || "row"}`}
        >
          <Trash2 size={16} />
          Delete
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 px-4 pt-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            Level 2 Update
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Update level 2 results, notes, callbacks, and lead types inline.
          </p>
        </div>

        <Button
          onClick={handleAddLead}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 cursor-pointer"
        >
          <Plus size={16} />
          Add Lead
        </Button>
      </div>

      <Table
        data={rows}
        columns={columns}
        title="Level 2 Update"
        description="Update level 2 results, notes, callbacks, and lead types inline."
        showToolbarTitle={false}
        onRowClick={(row) => setEditingRowId(row.id)}
      />
    </div>
  );
}
