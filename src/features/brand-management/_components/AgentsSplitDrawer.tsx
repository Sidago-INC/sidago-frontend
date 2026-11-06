import { Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Drawer, Select, TextInput } from "@/components/ui";
import { showErrorToast, showInfoToast, showSuccessToast } from "@/lib/toast";
import {
  useAssignableUsers,
  useSetBrandAgents,
  type ManagedBrand,
} from "../_lib/hooks";
import { CreateAgentModal } from "./CreateAgentModal";

type Row = { key: number; userId: string; percent: string };

type Props = {
  brand: ManagedBrand | null;
  onClose: () => void;
};

const secondaryButton =
  "inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded border border-slate-200 px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50";
const primaryButton =
  "inline-flex h-10 cursor-pointer items-center justify-center rounded bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300 disabled:cursor-not-allowed disabled:opacity-50";

let nextKey = 1;

export function AgentsSplitDrawer({ brand, onClose }: Props) {
  const [rows, setRows] = useState<Row[]>([]);
  const [isCreatingAgent, setIsCreatingAgent] = useState(false);
  const { data: users = [], isLoading } = useAssignableUsers(Boolean(brand));
  const setAgents = useSetBrandAgents();

  useEffect(() => {
    if (!brand) return;
    setRows(
      brand.agents.map((agent) => ({
        key: nextKey++,
        userId: agent.userId,
        percent:
          agent.percent != null
            ? String(agent.percent)
            : String(Math.round((100 / brand.agents.length) * 100) / 100),
      })),
    );
  }, [brand]);

  const total = useMemo(
    () => rows.reduce((sum, row) => sum + (Number(row.percent) || 0), 0),
    [rows],
  );
  const roundedTotal = Math.round(total * 100) / 100;
  const hasEmptyAgent = rows.some((row) => !row.userId);
  const totalIsValid = rows.length === 0 || Math.abs(total - 100) <= 0.01;
  const canSave = totalIsValid && !hasEmptyAgent && !setAgents.isPending;

  const optionsFor = (row: Row) =>
    users
      .filter(
        (user) =>
          user.userId === row.userId ||
          !rows.some((other) => other.userId === user.userId),
      )
      // An agent's pages serve one brand, so agents of other brands aren't offered.
      .filter((user) => !user.brandCode || user.brandCode === brand?.code)
      .map((user) => ({ label: user.name, value: user.userId }));

  const updateRow = (key: number, patch: Partial<Row>) =>
    setRows((current) =>
      current.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    );

  const handleSave = async () => {
    if (!brand) return;
    try {
      const result = await setAgents.mutateAsync({
        id: brand.id,
        agents: rows.map((row) => ({
          userId: row.userId,
          percent: Number(row.percent),
        })),
      });
      showSuccessToast("Agents updated");
      if (result.leadsHeldByRemovedAgents > 0) {
        showInfoToast(
          `${result.leadsHeldByRemovedAgents} leads stay with the removed agents.`,
        );
      }
      onClose();
    } catch (error) {
      showErrorToast(error);
    }
  };

  return (
    <>
      <Drawer
        isOpen={Boolean(brand)}
        onClose={onClose}
        size="min(100vw, 480px)"
        header={
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-slate-900 dark:text-slate-100">
              {brand?.displayName}: Agents & Split
            </h2>
          </div>
        }
        footer={
          <div className="flex flex-row justify-end gap-2">
            <button type="button" onClick={onClose} className={secondaryButton}>
              Cancel
            </button>
            <button
              type="button"
              disabled={!canSave}
              onClick={() => void handleSave()}
              className={primaryButton}
            >
              {setAgents.isPending ? "Saving..." : "Save"}
            </button>
          </div>
        }
      >
        <div className="grid gap-4 p-4 text-sm sm:p-5">
          {rows.length === 0 && (
            <p className="text-slate-500 dark:text-slate-400">
              No agents yet. This brand receives no new leads until it has one.
            </p>
          )}

          {rows.map((row) => (
            <div key={row.key} className="flex items-end gap-2">
              <div className="min-w-0 flex-1">
                <Select
                  label="Agent"
                  options={optionsFor(row)}
                  value={row.userId}
                  onChange={(value) => updateRow(row.key, { userId: String(value) })}
                  placeholder={isLoading ? "Loading..." : "Select agent"}
                  floatingOptions
                  searchable
                  filterOptionsLocally
                />
              </div>
              <div className="w-20 shrink-0">
                <TextInput
                  label="Share %"
                  inputMode="decimal"
                  value={row.percent}
                  onChange={(event) => updateRow(row.key, { percent: event.target.value })}
                  className="h-10 rounded text-sm"
                />
              </div>
              <button
                type="button"
                aria-label="Remove agent"
                onClick={() =>
                  setRows((current) => current.filter((r) => r.key !== row.key))
                }
                className={`${secondaryButton} shrink-0 px-3`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                setRows((current) => [
                  ...current,
                  {
                    key: nextKey++,
                    userId: "",
                    percent: current.length === 0 ? "100" : "0",
                  },
                ])
              }
              className={secondaryButton}
            >
              <Plus className="h-4 w-4" />
              Add agent
            </button>
            <button
              type="button"
              onClick={() => setIsCreatingAgent(true)}
              className={secondaryButton}
            >
              Create new agent
            </button>
          </div>

          {rows.length > 0 && (
            <p
              className={
                totalIsValid
                  ? "font-medium text-slate-700 dark:text-slate-200"
                  : "font-medium text-red-500"
              }
            >
              Total: {roundedTotal}%{!totalIsValid && " (must be 100%)"}
            </p>
          )}

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Existing leads rebalance at the daily 2 PM (New York) run, within 3%.
            Hot and On Hold leads don't move.
          </p>
        </div>
      </Drawer>

      <CreateAgentModal
        isOpen={isCreatingAgent}
        onClose={() => setIsCreatingAgent(false)}
        onCreated={(userId) =>
          setRows((current) => [
            ...current,
            { key: nextKey++, userId, percent: current.length === 0 ? "100" : "0" },
          ])
        }
      />
    </>
  );
}
