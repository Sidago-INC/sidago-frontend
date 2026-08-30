

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
import { useEffect, useMemo, useState } from "react";
import type { BRAND } from "@/types/brand.types";
import type { LEAD_TYPE } from "@/types/lead-type.types";
import { api } from "@/lib/api";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { useUsers } from "@/features/backoffice-shared/use-users";
import {
  getCallBackDateError,
  getMinCallBackDate,
} from "@/features/agent-calls/_lib/utils";
import {
  createEmptyLevel2UpdateRow,
  level2ResultUpdateOptions,
  level2UpdateCampaignOptions,
  type Level2UpdateRow,
} from "../_lib/data";
import {
  useLeadSelectSource,
  useLogLevel2Result,
  type BrandStatesResponse,
} from "../_lib/hooks";
import {
  buildRevertMessage,
  useRevertLevel2Result,
} from "@/features/level-2-shared/revert";

const cellInputClass =
  "h-8 min-w-[8rem] w-full rounded-lg border border-transparent bg-transparent px-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 hover:bg-slate-50 focus:border-slate-200 focus:bg-white focus:text-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:hover:bg-slate-800/70 dark:focus:border-slate-700 dark:focus:bg-slate-900 dark:focus:text-slate-100";

const actionButtonClass =
  "inline-flex h-8 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-medium transition cursor-pointer";

const readTextClass =
  "block min-h-8 px-2.5 py-1.5 text-sm text-slate-700 dark:text-slate-100";

const cellSelectClass =
  "h-8 min-w-[8rem] rounded-lg border-transparent bg-transparent px-2 py-1 text-sm shadow-none hover:bg-slate-50 focus:outline-none focus:ring-0 dark:border-transparent dark:bg-transparent dark:hover:bg-slate-800/70";

// Lead labels are "<EXCHANGE>:<SYMBOL> - <Full Name>" — the default 8rem
// trigger truncates everything past the exchange. Give it room.
const leadSelectClass =
  "h-8 min-w-[18rem] rounded-lg border-transparent bg-transparent px-2 py-1 text-sm shadow-none hover:bg-slate-50 focus:outline-none focus:ring-0 dark:border-transparent dark:bg-transparent dark:hover:bg-slate-800/70";

const cellSelectOptionsClass =
  "z-[300] max-h-72 rounded-xl border-slate-200 p-1 shadow-xl dark:border-slate-700 dark:bg-slate-950";

const cellDatePickerClass =
  "min-w-[9rem] rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm shadow-none dark:border-slate-700 dark:bg-slate-900";

// The Select panel inherits the trigger width via --button-width. Override
// it so the lead dropdown shows the full label even on narrow trigger states.
const leadSelectOptionsClass =
  "z-[300] !w-[26rem] max-w-[90vw] max-h-72 rounded-xl border-slate-200 p-1 shadow-xl dark:border-slate-700 dark:bg-slate-950";

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

// Each result option belongs to one of four buckets — every option in the
// same bucket shares a colour so the History/Update tables read at a glance.
//
//   positive  → green   (sale-side wins)
//   callback  → amber   (will revisit, not closed yet)
//   negative  → rose    (dead-end outcomes)
//   admin     → indigo  (Force / Block — operator overrides, not call results)
const RESULT_CATEGORY: Record<
  string,
  "positive" | "callback" | "negative" | "admin"
> = {
  Intersted: "positive",
  "Contract Closed": "positive",

  "Call back Lead": "callback",
  "needs more time": "callback",
  "no answer": "callback",
  "left message": "callback",

  "bad number": "negative",
  "wrong number": "negative",
  "not interested": "negative",
  DNC: "negative",

  "Force Fix": "admin",
  "Force General": "admin",
  "Force Void": "admin",
  "Block Email to": "admin",
};

const ADMIN_BADGE_CLASS =
  "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800";

function ResultBadge({ value }: { value: string }) {
  if (!value.trim()) {
    return <Badge className="text-slate-400 dark:text-slate-500">Select</Badge>;
  }

  const category = RESULT_CATEGORY[value];

  if (category === "positive") return <Badge variant="success">{value}</Badge>;
  if (category === "callback") return <Badge variant="warning">{value}</Badge>;
  if (category === "negative") return <Badge variant="error">{value}</Badge>;
  if (category === "admin")
    return <Badge className={ADMIN_BADGE_CLASS}>{value}</Badge>;

  return <Badge>{value}</Badge>;
}

// Maps the frontend BRAND value to the lowercase brand code the API expects.
function brandCodeFor(brand: BRAND | ""): "svg" | "95rm" | "benton" | null {
  if (brand === "SVG") return "svg";
  if (brand === "BENTON") return "benton";
  if (brand === "95RM") return "95rm";
  return null;
}

const DRAFT_KEY = "level2_update_draft_rows";

export function Level2Update() {
  const [rows, setRows] = useState<Level2UpdateRow[]>(() => {
    try {
      const saved = sessionStorage.getItem(DRAFT_KEY);
      return saved ? (JSON.parse(saved) as Level2UpdateRow[]) : [];
    } catch {
      return [];
    }
  });
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [deletingRowId, setDeletingRowId] = useState<string | null>(null);

  useEffect(() => {
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(rows));
    } catch {
      // ignore quota/private-mode errors
    }
  }, [rows]);

  const extraLeadOptions = useMemo(
    () =>
      rows
        .filter((row) => row.lead && row.lead_label)
        .map((row) => ({ value: row.lead, label: row.lead_label }))
        .filter(
          (option, index, all) =>
            all.findIndex((item) => item.value === option.value) === index,
        ),
    [rows],
  );
  const leadSelectSource = useLeadSelectSource(extraLeadOptions);
  // One agents query per brand — each result is cached for 5 minutes, so even
  // with three hooks the network footprint is tiny. Per-row agent options are
  // derived from whichever brand the row's campaign points at, so picking
  // Benton can never surface an SVG-only agent.
  const svgAgents = useUsers("svg");
  const rm95Agents = useUsers("95rm");
  const bentonAgents = useUsers("benton");
  const logResult = useLogLevel2Result();
  const revertResult = useRevertLevel2Result();

  const getLeadLabel = (leadId: string) =>
    leadSelectSource.options.find((option) => String(option.value) === leadId)
      ?.label ??
    rows.find((row) => row.lead === leadId)?.lead_label ??
    "";

  const getAgentOptions = (campaign: BRAND | "") => {
    if (campaign === "SVG") {
      return (svgAgents.data ?? []).map((a) => ({ value: a.name, label: a.name }));
    }
    if (campaign === "95RM") {
      return (rm95Agents.data ?? []).map((a) => ({ value: a.name, label: a.name }));
    }
    if (campaign === "BENTON") {
      return (bentonAgents.data ?? []).map((a) => ({
        value: a.name,
        label: a.name,
      }));
    }
    return [];
  };

  const isAgentsLoadingFor = (campaign: BRAND | "") => {
    if (campaign === "SVG") return svgAgents.isLoading;
    if (campaign === "95RM") return rm95Agents.isLoading;
    if (campaign === "BENTON") return bentonAgents.isLoading;
    return false;
  };

  const updateRow = <K extends keyof Level2UpdateRow>(
    rowId: string,
    key: K,
    value: Level2UpdateRow[K],
  ) => {
    setRows((current) =>
      current.map((row) => (row.id === rowId ? { ...row, [key]: value } : row)),
    );
  };

  const patchRow = (rowId: string, patch: Partial<Level2UpdateRow>) => {
    setRows((current) =>
      current.map((row) => (row.id === rowId ? { ...row, ...patch } : row)),
    );
  };

  const handleAddLead = () => {
    const newRow = createEmptyLevel2UpdateRow(rows.length + 1);
    setRows((current) => [...current, newRow]);
    setEditingRowId(newRow.id);
  };

  const handleDelete = async (rowId: string) => {
    const row = rows.find((r) => r.id === rowId);
    if (!row) return;

    // A row that was logged but has lost its server id must not be dropped
    // from the grid — that is how deletes used to look like they worked while
    // the request, the call log and the lead's new type all stayed behind.
    if (row.logged_at && !row.api_id) {
      showErrorToast({
        message:
          "This row was logged in an earlier session, so it can't be reverted from here. Use Level 2 History instead.",
      });
      return;
    }

    if (row.api_id) {
      setDeletingRowId(rowId);
      try {
        const result = await revertResult.mutateAsync(row.api_id);
        setRows((current) => current.filter((r) => r.id !== rowId));
        setEditingRowId((current) => (current === rowId ? null : current));
        showSuccessToast(buildRevertMessage(result));
      } catch (err) {
        showErrorToast(err);
      } finally {
        setDeletingRowId(null);
      }
    } else {
      // Never logged — a draft that only ever existed in the browser.
      setRows((current) => current.filter((r) => r.id !== rowId));
      setEditingRowId((current) => (current === rowId ? null : current));
    }
  };

  const handleCampaignChange = (rowId: string, nextCampaign: BRAND | "") => {
    // Resetting level_2_agent prevents a stale SVG agent name from sticking
    // around when the user switches the row to Benton — that would fail at
    // log time with "User not found" because the resolver only matches the
    // agent name, not the brand. Better to clear it and force a re-pick.
    patchRow(rowId, { campaign: nextCampaign, level_2_agent: "" });
  };

  const handleLeadChange = async (rowId: string, leadId: string) => {
    const label = getLeadLabel(leadId);
    // Reset the brand lead types until the fetch resolves so the user never
    // sees stale data from the previously selected lead.
    patchRow(rowId, {
      lead: leadId,
      lead_label: label,
      lead_type_sidago: "",
      lead_type_benton: "",
      lead_type_95rm: "",
    });

    if (!leadId) return;

    try {
      const json = (await api.get(
        `/leads/${leadId}/brand-states`,
      )) as BrandStatesResponse;
      patchRow(rowId, {
        lead_type_sidago: (json.brandStates.svg.leadType ?? "") as LEAD_TYPE | "",
        lead_type_benton: (json.brandStates.benton.leadType ?? "") as
          | LEAD_TYPE
          | "",
        lead_type_95rm: (json.brandStates["95rm"].leadType ?? "") as
          | LEAD_TYPE
          | "",
      });
    } catch (err) {
      showErrorToast(err);
    }
  };

  const handleLogResult = async (rowId: string) => {
    const row = rows.find((r) => r.id === rowId);
    if (!row) return;

    if (!row.lead) {
      showErrorToast({ message: "Pick a lead before logging the result." });
      return;
    }
    const brand = brandCodeFor(row.campaign);
    if (!brand) {
      showErrorToast({ message: "Pick a campaign before logging the result." });
      return;
    }
    if (!row.level_2_result_update) {
      showErrorToast({ message: "Pick a Level 2 result before logging." });
      return;
    }

    const callbackError = getCallBackDateError(row.call_back_date, "");
    if (callbackError) {
      showErrorToast({ message: callbackError });
      return;
    }

    try {
      const result = await logResult.mutateAsync({
        leadId: row.lead,
        brand,
        level2AgentName: row.level_2_agent || null,
        resultUpdate: row.level_2_result_update,
        updatedNotes: row.updated_notes,
        callBackDate: row.call_back_date,
      });
      showSuccessToast("Level 2 result logged.");
      // The response carries the lead types the update produced and the row's
      // real created_at. Both are frozen onto the row: this is a record of what
      // happened, so it must not drift when the lead moves again later.
      patchRow(rowId, {
        logged_at: new Date().toISOString(),
        api_id: result.id,
        created_date: result.createdAt
          ? result.createdAt.slice(0, 10)
          : row.created_date,
        lead_type_sidago: (result.leadTypes?.svg ?? "") as LEAD_TYPE | "",
        lead_type_benton: (result.leadTypes?.benton ?? "") as LEAD_TYPE | "",
        lead_type_95rm: (result.leadTypes?.["95rm"] ?? "") as LEAD_TYPE | "",
      });
    } catch (err) {
      showErrorToast(err);
    }
  };

  const isEditingRow = (rowId: string) => editingRowId === rowId;

  const columns: Column<Level2UpdateRow>[] = [
    {
      title: "Lead",
      key: "lead",
      getValue: (row) => row.lead_label || row.lead,
      render: (row) =>
        isEditingRow(row.id) ? (
          <div onClick={(event) => event.stopPropagation()}>
            <Select
              value={row.lead}
              options={leadSelectSource.options}
              placeholder={
                leadSelectSource.isLoading &&
                leadSelectSource.options.length === 0
                  ? "Loading leads..."
                  : "Select lead"
              }
              searchable
              searchPlaceholder="Search lead"
              searchValue={leadSelectSource.searchInput}
              onSearchChange={leadSelectSource.onSearchChange}
              filterOptionsLocally={false}
              onLoadMore={leadSelectSource.onLoadMore}
              hasMore={leadSelectSource.hasMore}
              isLoadingMore={leadSelectSource.isLoadingMore}
              isSearching={leadSelectSource.isSearching}
              onChange={(nextValue) =>
                handleLeadChange(row.id, String(nextValue))
              }
              className={leadSelectClass}
              optionsClassName={leadSelectOptionsClass}
            />
          </div>
        ) : (
          <ReadText value={row.lead_label} />
        ),
    },
    {
      title: "Campaign",
      key: "campaign",
      render: (row) =>
        isEditingRow(row.id) ? (
          <div onClick={(event) => event.stopPropagation()}>
            <Select
              value={row.campaign}
              options={level2UpdateCampaignOptions}
              placeholder="Select campaign"
              searchable
              searchPlaceholder="Search campaign"
              onChange={(nextValue) =>
                handleCampaignChange(row.id, String(nextValue) as BRAND | "")
              }
              className={cellSelectClass}
              optionsClassName={cellSelectOptionsClass}
            />
          </div>
        ) : (
          <CampaignBadge value={row.campaign} />
        ),
    },
    {
      title: "level 2 agent",
      key: "level_2_agent",
      render: (row) => {
        if (!isEditingRow(row.id)) {
          return <ReadText value={row.level_2_agent} />;
        }
        const agentOptions = getAgentOptions(row.campaign);
        const placeholder = !row.campaign
          ? "Pick a campaign first"
          : isAgentsLoadingFor(row.campaign)
            ? "Loading agents..."
            : "Select agent";
        return (
          <div onClick={(event) => event.stopPropagation()}>
            <Select
              value={row.level_2_agent}
              options={agentOptions}
              placeholder={placeholder}
              searchable
              searchPlaceholder="Search agent"
              disabled={!row.campaign}
              onChange={(nextValue) =>
                updateRow(row.id, "level_2_agent", String(nextValue))
              }
              className={cellSelectClass}
              optionsClassName={cellSelectOptionsClass}
            />
          </div>
        );
      },
    },
    {
      title: "Level 2 result update",
      key: "level_2_result_update",
      render: (row) =>
        isEditingRow(row.id) ? (
          <div onClick={(event) => event.stopPropagation()}>
            <Select
              value={row.level_2_result_update}
              options={level2ResultUpdateOptions}
              placeholder="Select result"
              searchable
              searchPlaceholder="Search result"
              onChange={(nextValue) =>
                updateRow(row.id, "level_2_result_update", String(nextValue))
              }
              className={cellSelectClass}
              optionsClassName={cellSelectOptionsClass}
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
              className={cellDatePickerClass}
              placeholder="Pick a date"
              minDate={getMinCallBackDate("")}
            />
          </div>
        ) : (
          <ReadText value={row.call_back_date} />
        ),
    },
    {
      // Read-only. This used to render a date picker, but created_date is not
      // part of the POST body — and could not be, since the API rejects
      // unknown fields — so editing it changed nothing. It shows today while
      // the row is a draft and the row's real created_at once it is logged.
      title: "Created date",
      key: "created_date",
      type: "date",
      render: (row) => <ReadText value={row.created_date} />,
    },
    {
      title: "Lead Type SVG",
      key: "lead_type_sidago",
      render: (row) => <TypeBadge value={row.lead_type_sidago} kind="lead" />,
    },
    {
      title: "Lead Type Benton",
      key: "lead_type_benton",
      render: (row) => <TypeBadge value={row.lead_type_benton} kind="lead" />,
    },
    {
      title: "Lead Type 95 RM",
      key: "lead_type_95rm",
      render: (row) => <TypeBadge value={row.lead_type_95rm} kind="lead" />,
    },
    {
      title: "Log Result",
      key: "log_result",
      render: (row) => (
        <button
          type="button"
          disabled={logResult.isPending}
          onClick={(event) => {
            event.stopPropagation();
            handleLogResult(row.id);
          }}
          className={clsx(
            actionButtonClass,
            "border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300",
            logResult.isPending && "opacity-50 cursor-not-allowed",
          )}
        >
          <FileText size={16} />
          {row.logged_at ? "Logged" : "Log Result"}
        </button>
      ),
    },
    {
      title: "Delete",
      key: "delete",
      render: (row) => {
        const isDeleting = deletingRowId === row.id;
        return (
          <button
            type="button"
            disabled={isDeleting}
            onClick={(event) => {
              event.stopPropagation();
              handleDelete(row.id);
            }}
            className={clsx(
              actionButtonClass,
              "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300",
              isDeleting && "opacity-50 cursor-not-allowed",
            )}
            aria-label={`Delete ${row.lead_label || "row"}`}
          >
            <Trash2 size={16} />
            {isDeleting ? "Reverting..." : "Delete"}
          </button>
        );
      },
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
        emptyText="Click Add Lead to start a new Level 2 update."
        onRowClick={(row) => setEditingRowId(row.id)}
      />
    </div>
  );
}
