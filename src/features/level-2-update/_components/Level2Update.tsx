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
import { useEffect, useMemo, useRef, useState } from "react";
import type { BRAND } from "@/types/brand.types";
import type { LEAD_TYPE } from "@/types/lead-type.types";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { useUsers } from "@/features/backoffice-shared/use-users";
import {
  getCallBackDateError,
  getMinCallBackDate,
} from "@/features/agent-calls/_lib/utils";
import {
  boardRowToUpdateRow,
  brandCodeFor,
  createEmptyLevel2UpdateRow,
  isLoggedRow,
  isPendingRow,
  level2ResultUpdateOptions,
  level2UpdateCampaignOptions,
  type Level2UpdateRow,
} from "../_lib/data";
import {
  useCreateLevel2Draft,
  useDeleteLevel2Draft,
  usePatchLevel2Draft,
  useLevel2Board,
  type Level2DraftPatch,
} from "../_lib/board";
import {
  useLeadSelectSource,
  useLogLevel2Result,
  waitForLevel2Result,
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

// Typing shouldn't cost a Tokyo round-trip per character. Long enough to
// coalesce a burst, short enough that a colleague sees the note within a
// poll or two.
const TEXT_SAVE_DEBOUNCE_MS = 500;

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
  Interested: "positive",
  "Contract Closed": "positive",

  "Call Lead Back": "callback",
  "Needs More Time": "callback",
  "No Answer": "callback",
  "Left Message": "callback",

  "Bad Number": "negative",
  "Wrong Number": "negative",
  "Not Interested": "negative",
  DNC: "negative",

  "Force Fix": "admin",
  "Force General": "admin",
  "Force Void": "admin",
  "Block Email To": "admin",
};

// Pre-unification spellings, so a stored value still resolves to its colour.
// Keyed on the lower-cased form, so plain casing differences need no entry.
const LEGACY_RESULT_LABELS: Record<string, string> = {
  "call back lead": "Call Lead Back",
  "needs more time": "Needs More Time",
  "no answer": "No Answer",
  "left message": "Left Message",
  "bad number": "Bad Number",
  "wrong number": "Wrong Number",
  "not interested": "Not Interested",
  "block email to": "Block Email To",
  interested: "Interested",
  "contract closed": "Contract Closed",
  "force fix": "Force Fix",
  "force general": "Force General",
  "force void": "Force Void",
  dnc: "DNC",
};

const ADMIN_BADGE_CLASS =
  "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800";

function ResultBadge({ value }: { value: string }) {
  if (!value.trim()) {
    return <Badge className="text-slate-400 dark:text-slate-500">Select</Badge>;
  }

  // Looked up case-insensitively so rows logged before the vocabularies were
  // unified ("no answer", "Call back Lead") still get their colour instead of
  // falling through to grey.
  const category =
    RESULT_CATEGORY[value] ?? RESULT_CATEGORY[LEGACY_RESULT_LABELS[value.trim().toLowerCase()] ?? ""];

  if (category === "positive") return <Badge variant="success">{value}</Badge>;
  if (category === "callback") return <Badge variant="warning">{value}</Badge>;
  if (category === "negative") return <Badge variant="error">{value}</Badge>;
  if (category === "admin")
    return <Badge className={ADMIN_BADGE_CLASS}>{value}</Badge>;

  return <Badge>{value}</Badge>;
}

// A logged row is still being applied by the worker, so its lead types are
// genuinely not decided yet. Say so rather than showing three blanks.
function LeadTypeCell({
  value,
  pending,
}: {
  value: string;
  pending: boolean;
}) {
  if (pending && !value.trim()) {
    return (
      <span className="px-2.5 text-sm text-slate-400 dark:text-slate-500">
        Applying…
      </span>
    );
  }
  if (!value.trim()) {
    return (
      <span className="px-2.5 text-sm text-slate-400 dark:text-slate-500">
        —
      </span>
    );
  }
  return <TypeBadge value={value} kind="lead" />;
}

export function Level2Update() {
  const board = useLevel2Board();

  // Rows that have a lead but not yet a campaign (or neither). They cannot be
  // stored: level_2_requests requires both. They live here until the second
  // field is picked, then become a shared draft.
  const [localRows, setLocalRows] = useState<Level2UpdateRow[]>([]);
  const localCounter = useRef(0);

  // Edits typed or picked but not yet confirmed by the server, keyed by row
  // id. Rendered on top of the board so a poll landing mid-edit cannot blank
  // the field being worked on.
  const [pendingEdits, setPendingEdits] = useState<
    Record<string, Partial<Level2UpdateRow>>
  >({});

  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [busyRowId, setBusyRowId] = useState<string | null>(null);

  const createDraft = useCreateLevel2Draft();
  const patchDraft = usePatchLevel2Draft();
  const deleteDraft = useDeleteLevel2Draft();
  const logResult = useLogLevel2Result();
  const revertResult = useRevertLevel2Result();

  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  useEffect(() => {
    const timers = saveTimers.current;
    return () => {
      for (const timer of Object.values(timers)) clearTimeout(timer);
    };
  }, []);

  const serverRows = useMemo(
    () => (board.data ?? []).map(boardRowToUpdateRow),
    [board.data],
  );

  // Local rows first: the board is newest-first and the Add Lead button sits
  // at the top, so a row being started stays under the cursor.
  const rows = useMemo(
    () =>
      [...localRows, ...serverRows].map((row) => {
        const pending = pendingEdits[row.id];
        return pending ? { ...row, ...pending } : row;
      }),
    [localRows, serverRows, pendingEdits],
  );

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

  const findRow = (rowId: string) => rows.find((row) => row.id === rowId);

  const stageEdit = (rowId: string, patch: Partial<Level2UpdateRow>) => {
    setPendingEdits((current) => ({
      ...current,
      [rowId]: { ...current[rowId], ...patch },
    }));
  };

  const clearEdit = (rowId: string, keys: (keyof Level2UpdateRow)[]) => {
    setPendingEdits((current) => {
      const existing = current[rowId];
      if (!existing) return current;
      const next = { ...existing };
      for (const key of keys) delete next[key];
      if (Object.keys(next).length === 0) {
        const { [rowId]: _dropped, ...rest } = current;
        return rest;
      }
      return { ...current, [rowId]: next };
    });
  };

  const patchLocal = (rowId: string, patch: Partial<Level2UpdateRow>) => {
    setLocalRows((current) =>
      current.map((row) => (row.id === rowId ? { ...row, ...patch } : row)),
    );
  };

  /**
   * Promote a local row to a shared draft, once it has both a lead and a
   * campaign. Any values already typed into it are saved straight after, so
   * nothing entered before the promotion is lost.
   */
  const promoteToDraft = async (row: Level2UpdateRow, next: Level2UpdateRow) => {
    const brand = brandCodeFor(next.campaign);
    if (!next.lead || !brand) return;

    try {
      const created = await createDraft.mutateAsync({
        leadId: next.lead,
        brand,
      });

      const carried: Level2DraftPatch = {};
      if (next.level_2_agent) carried.level2AgentName = next.level_2_agent;
      if (next.level_2_result_update)
        carried.resultUpdate = next.level_2_result_update;
      if (next.updated_notes) carried.updatedNotes = next.updated_notes;
      if (next.call_back_date) carried.callBackDate = next.call_back_date;

      if (Object.keys(carried).length > 0) {
        await patchDraft.mutateAsync({ id: created.id, patch: carried });
      }

      // Wait for the board to actually contain the new row before dropping
      // the local one. Removing it first would blank the line the agent is
      // looking at until the next fetch landed.
      await board.refetch();

      setLocalRows((current) => current.filter((item) => item.id !== row.id));
      setEditingRowId((current) => (current === row.id ? created.id : current));
    } catch (err) {
      showErrorToast(err);
    }
  };

  /** Save a field of a shared draft, keeping the typed value on screen. */
  const saveField = (
    rowId: string,
    serverId: string,
    patch: Level2DraftPatch,
    keys: (keyof Level2UpdateRow)[],
  ) => {
    patchDraft
      .mutateAsync({ id: serverId, patch })
      .then(() => clearEdit(rowId, keys))
      .catch((err) => {
        // Put the stored value back on screen; the overlay was a guess that
        // the save would land, and it did not.
        clearEdit(rowId, keys);
        showErrorToast(err);
        void board.refetch();
      });
  };

  const saveFieldDebounced = (
    rowId: string,
    serverId: string,
    field: keyof Level2UpdateRow,
    patch: Level2DraftPatch,
  ) => {
    const timerKey = `${rowId}:${String(field)}`;
    clearTimeout(saveTimers.current[timerKey]);
    saveTimers.current[timerKey] = setTimeout(() => {
      delete saveTimers.current[timerKey];
      saveField(rowId, serverId, patch, [field]);
    }, TEXT_SAVE_DEBOUNCE_MS);
  };

  const handleAddLead = () => {
    localCounter.current += 1;
    const newRow = createEmptyLevel2UpdateRow(localCounter.current);
    setLocalRows((current) => [newRow, ...current]);
    setEditingRowId(newRow.id);
  };

  const handleLeadChange = async (rowId: string, leadId: string) => {
    const row = findRow(rowId);
    if (!row) return;

    const label = getLeadLabel(leadId);

    // A shared draft is pinned to its lead: changing which person the row is
    // about would rewrite a row a colleague may already be filling in. Discard
    // and start again instead.
    if (row.serverId) {
      showErrorToast({
        message:
          "This row is already shared. Delete it and add the lead again to change who it is for.",
      });
      return;
    }

    const next = { ...row, lead: leadId, lead_label: label };
    patchLocal(rowId, { lead: leadId, lead_label: label });
    if (leadId && next.campaign) await promoteToDraft(row, next);
  };

  const handleCampaignChange = async (
    rowId: string,
    nextCampaign: BRAND | "",
  ) => {
    const row = findRow(rowId);
    if (!row) return;

    // Resetting level_2_agent prevents a stale SVG agent name from sticking
    // around when the user switches the row to Benton — that would fail at
    // log time with "User not found" because the resolver only matches the
    // agent name, not the brand. Better to clear it and force a re-pick.
    if (row.serverId) {
      stageEdit(rowId, { campaign: nextCampaign, level_2_agent: "" });
      const brand = brandCodeFor(nextCampaign);
      if (brand) {
        saveField(rowId, row.serverId, { brand }, ["campaign", "level_2_agent"]);
      }
      return;
    }

    const next = { ...row, campaign: nextCampaign, level_2_agent: "" };
    patchLocal(rowId, { campaign: nextCampaign, level_2_agent: "" });
    if (row.lead && nextCampaign) await promoteToDraft(row, next);
  };

  const handleAgentChange = (rowId: string, name: string) => {
    const row = findRow(rowId);
    if (!row) return;
    if (!row.serverId) {
      patchLocal(rowId, { level_2_agent: name });
      return;
    }
    stageEdit(rowId, { level_2_agent: name });
    saveField(rowId, row.serverId, { level2AgentName: name }, ["level_2_agent"]);
  };

  const handleResultChange = (rowId: string, value: string) => {
    const row = findRow(rowId);
    if (!row) return;
    if (!row.serverId) {
      patchLocal(rowId, { level_2_result_update: value });
      return;
    }
    stageEdit(rowId, { level_2_result_update: value });
    saveField(rowId, row.serverId, { resultUpdate: value }, [
      "level_2_result_update",
    ]);
  };

  const handleNotesChange = (rowId: string, value: string) => {
    const row = findRow(rowId);
    if (!row) return;
    if (!row.serverId) {
      patchLocal(rowId, { updated_notes: value });
      return;
    }
    stageEdit(rowId, { updated_notes: value });
    saveFieldDebounced(rowId, row.serverId, "updated_notes", {
      updatedNotes: value,
    });
  };

  const handleCallBackChange = (rowId: string, value: string) => {
    const row = findRow(rowId);
    if (!row) return;
    if (!row.serverId) {
      patchLocal(rowId, { call_back_date: value });
      return;
    }
    stageEdit(rowId, { call_back_date: value });
    saveField(rowId, row.serverId, { callBackDate: value }, ["call_back_date"]);
  };

  const handleDelete = async (rowId: string) => {
    const row = findRow(rowId);
    if (!row) return;

    // Never stored — just drop it.
    if (!row.serverId) {
      setLocalRows((current) => current.filter((item) => item.id !== rowId));
      setEditingRowId((current) => (current === rowId ? null : current));
      return;
    }

    setBusyRowId(rowId);
    try {
      if (isLoggedRow(row)) {
        // Already applied to the lead, so removing it means undoing it.
        const result = await revertResult.mutateAsync(row.serverId);
        showSuccessToast(buildRevertMessage(result));
      } else {
        await deleteDraft.mutateAsync(row.serverId);
      }
      setEditingRowId((current) => (current === rowId ? null : current));
    } catch (err) {
      showErrorToast(err);
    } finally {
      setBusyRowId(null);
      void board.refetch();
    }
  };

  const handleLogResult = async (rowId: string) => {
    const row = findRow(rowId);
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
    if (!row.serverId) {
      showErrorToast({
        message: "This row is still being created. Try again in a moment.",
      });
      return;
    }

    const callbackError = getCallBackDateError(row.call_back_date, "");
    if (callbackError) {
      showErrorToast({ message: callbackError });
      return;
    }

    // A debounced note may still be waiting. Flush it, or the submitted row
    // silently loses the last thing typed into it.
    const notesTimer = saveTimers.current[`${rowId}:updated_notes`];
    if (notesTimer) {
      clearTimeout(notesTimer);
      delete saveTimers.current[`${rowId}:updated_notes`];
    }

    setBusyRowId(rowId);
    try {
      const submitted = await logResult.mutateAsync({
        // The draft row itself becomes the request — promoted in place rather
        // than copied, so the board never shows it twice.
        draftId: row.serverId,
        leadId: row.lead,
        brand,
        level2AgentName: row.level_2_agent || null,
        resultUpdate: row.level_2_result_update,
        updatedNotes: row.updated_notes,
        callBackDate: row.call_back_date,
      });

      // The worker usually finishes in a second or two, and the board's own
      // poll is ten. Watch the cheap status endpoint instead so the lead-type
      // columns fill in as soon as they are decided rather than at the next
      // tick. Not awaited — the row is already logged and the agent should be
      // free to move on.
      void waitForLevel2Result(submitted.id).then(() => board.refetch());
      clearEdit(rowId, [
        "campaign",
        "level_2_agent",
        "level_2_result_update",
        "updated_notes",
        "call_back_date",
      ]);
      setEditingRowId((current) => (current === rowId ? null : current));
      showSuccessToast("Level 2 result logged.");
    } catch (err) {
      showErrorToast(err);
    } finally {
      setBusyRowId(null);
      void board.refetch();
    }
  };

  const isEditingRow = (row: Level2UpdateRow) =>
    editingRowId === row.id && !isLoggedRow(row);

  const columns: Column<Level2UpdateRow>[] = [
    {
      title: "Lead",
      key: "lead",
      getValue: (row) => row.lead_label || row.lead,
      render: (row) =>
        isEditingRow(row) && !row.serverId ? (
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
        isEditingRow(row) ? (
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
        if (!isEditingRow(row)) {
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
                handleAgentChange(row.id, String(nextValue))
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
        isEditingRow(row) ? (
          <div onClick={(event) => event.stopPropagation()}>
            <Select
              value={row.level_2_result_update}
              options={level2ResultUpdateOptions}
              placeholder="Select result"
              searchable
              searchPlaceholder="Search result"
              onChange={(nextValue) =>
                handleResultChange(row.id, String(nextValue))
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
        isEditingRow(row) ? (
          <input
            type="text"
            value={row.updated_notes}
            onClick={(event) => event.stopPropagation()}
            onChange={(event) => handleNotesChange(row.id, event.target.value)}
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
        isEditingRow(row) ? (
          <div onClick={(event) => event.stopPropagation()}>
            <DatePickerField
              value={row.call_back_date}
              onChange={(value) => handleCallBackChange(row.id, value)}
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
      // unknown fields — so editing it changed nothing.
      title: "Created date",
      key: "created_date",
      type: "date",
      render: (row) => <ReadText value={row.created_date} />,
    },
    {
      title: "Added by",
      key: "submitted_by",
      render: (row) => <ReadText value={row.submitted_by} placeholder="You" />,
    },
    {
      title: "Lead Type SVG",
      key: "lead_type_sidago",
      render: (row) => (
        <LeadTypeCell value={row.lead_type_sidago} pending={isPendingRow(row)} />
      ),
    },
    {
      title: "Lead Type Benton",
      key: "lead_type_benton",
      render: (row) => (
        <LeadTypeCell value={row.lead_type_benton} pending={isPendingRow(row)} />
      ),
    },
    {
      title: "Lead Type 95 RM",
      key: "lead_type_95rm",
      render: (row) => (
        <LeadTypeCell value={row.lead_type_95rm} pending={isPendingRow(row)} />
      ),
    },
    {
      title: "Log Result",
      key: "log_result",
      render: (row) => {
        const logged = isLoggedRow(row);
        // Per row, not per grid. A single shared `isPending` disabled every
        // row's button while any one of them was in flight.
        const isBusy = busyRowId === row.id;
        return (
          <button
            type="button"
            disabled={logged || isBusy || !row.serverId}
            onClick={(event) => {
              event.stopPropagation();
              handleLogResult(row.id);
            }}
            className={clsx(
              actionButtonClass,
              "border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300",
              (logged || isBusy || !row.serverId) &&
                "opacity-50 cursor-not-allowed",
            )}
          >
            <FileText size={16} />
            {logged ? "Logged" : isBusy ? "Logging..." : "Log Result"}
          </button>
        );
      },
    },
    {
      title: "Delete",
      key: "delete",
      render: (row) => {
        const isBusy = busyRowId === row.id;
        const logged = isLoggedRow(row);
        return (
          <button
            type="button"
            disabled={isBusy}
            onClick={(event) => {
              event.stopPropagation();
              handleDelete(row.id);
            }}
            className={clsx(
              actionButtonClass,
              "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300",
              isBusy && "opacity-50 cursor-not-allowed",
            )}
            aria-label={`${logged ? "Revert" : "Delete"} ${row.lead_label || "row"}`}
          >
            <Trash2 size={16} />
            {isBusy ? "Working..." : logged ? "Revert" : "Delete"}
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
            Shared across everyone — open rows and today's logged results.
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
        isLoading={board.isLoading}
        title="Level 2 Update"
        description="Shared across everyone — open rows and today's logged results."
        showToolbarTitle={false}
        emptyText="Click Add Lead to start a new Level 2 update."
        onRowClick={(row) => setEditingRowId(row.id)}
      />
    </div>
  );
}
