import { Plus, Trash2, UserX } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Drawer, Select, TextInput } from "@/components/ui";
import { showErrorToast, showInfoToast, showSuccessToast } from "@/lib/toast";
import {
  fetchHotLeadsForRemoval,
  type HotLeadAssignment,
  type HotLeadsBrandGroup,
  useAssignableUsers,
  useDeactivateAgent,
  useSetBrandAgents,
  type ManagedBrand,
} from "../_lib/hooks";
import { rescaleShares } from "../_lib/rescale-shares";
import { CreateAgentModal } from "./CreateAgentModal";
import { HotLeadsAssignModal } from "./HotLeadsAssignModal";

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
  const deactivateAgent = useDeactivateAgent();
  const [deactivating, setDeactivating] = useState<{
    userId: string;
    name: string;
    groups: HotLeadsBrandGroup[];
  } | null>(null);
  // Hot and On Hold leads of agents removed in this panel, waiting for the
  // Super Owner to pick who takes them before the save goes through.
  const [pendingSave, setPendingSave] = useState<HotLeadsBrandGroup[] | null>(
    null,
  );
  const [isChecking, setIsChecking] = useState(false);

  // Only agents already saved on this brand can be deactivated from here.
  const savedAgent = (userId: string) =>
    brand?.agents.find((agent) => agent.userId === userId) ?? null;

  const startDeactivate = async (userId: string, name: string) => {
    setIsChecking(true);
    try {
      const groups = await fetchHotLeadsForRemoval(userId);
      setDeactivating({ userId, name, groups });
    } catch (error) {
      showErrorToast(error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleDeactivate = async (hotLeadAssignments: HotLeadAssignment[]) => {
    if (!deactivating) return;
    try {
      const result = await deactivateAgent.mutateAsync({
        userId: deactivating.userId,
        hotLeadAssignments,
      });
      const noAgent = result.brands.filter((b) => b.unassigned).map((b) => b.brandName);
      showSuccessToast(`${result.name} deactivated`);
      if (result.leadsQueued > 0) {
        showInfoToast(
          noAgent.length > 0
            ? `Moving ${result.leadsQueued} of ${result.name}'s leads in the background. On ${noAgent.join(", ")} they become unassigned: no other agent. Progress shows at the top of the page.`
            : `Moving ${result.leadsQueued} of ${result.name}'s leads to the remaining agents in the background. Progress shows at the top of the page.`,
        );
      }
      setDeactivating(null);
      onClose();
    } catch (error) {
      showErrorToast(error);
    }
  };

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

  // Removing an agent hands their share to the others in proportion to what
  // each one has, as whole numbers that add up to 100 again.
  const removeRow = (key: number) =>
    setRows((current) => {
      const removed = current.find((r) => r.key === key);
      const rest = current.filter((r) => r.key !== key);
      if (!removed || !removed.userId || !(Number(removed.percent) > 0))
        return rest;
      const shares = rescaleShares(rest.map((r) => Number(r.percent) || 0));
      return rest.map((r, i) => ({ ...r, percent: String(shares[i]) }));
    });

  const updateRow = (key: number, patch: Partial<Row>) =>
    setRows((current) =>
      current.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    );

  const save = async (hotLeadAssignments: HotLeadAssignment[] = []) => {
    if (!brand) return;
    try {
      const result = await setAgents.mutateAsync({
        id: brand.id,
        agents: rows.map((row) => ({
          userId: row.userId,
          percent: Number(row.percent),
        })),
        hotLeadAssignments,
      });
      setPendingSave(null);
      showSuccessToast("Agents updated");
      if (result.leadsQueued > 0) {
        showInfoToast(
          result.unassigned
            ? `${result.leadsQueued} leads become unassigned in the background: the brand has no agents left.`
            : `Moving ${result.leadsQueued} leads to the remaining agents in the background. Progress shows at the top of the page.`,
        );
      }
      onClose();
    } catch (error) {
      showErrorToast(error);
    }
  };

  // Before saving, finds the removed agents' Hot and On Hold leads on this
  // brand. If there are any, the Super Owner assigns them first.
  const handleSave = async () => {
    if (!brand) return;
    const keptIds = new Set(rows.map((row) => row.userId));
    const removed = brand.agents.filter((agent) => !keptIds.has(agent.userId));
    const remaining = rows
      .filter((row) => row.userId)
      .map((row) => ({
        userId: row.userId,
        name:
          users.find((u) => u.userId === row.userId)?.name ??
          savedAgent(row.userId)?.name ??
          "Agent",
      }));
    if (removed.length === 0) return save();

    setIsChecking(true);
    try {
      const lists = await Promise.all(
        removed.map((agent) => fetchHotLeadsForRemoval(agent.userId, brand.id)),
      );
      const leads = lists.flat().flatMap((group) => group.leads);
      if (leads.length === 0) return save();
      // The panel's unsaved list decides who can take them, not the saved one.
      setPendingSave([
        {
          brandId: brand.id,
          brandName: brand.displayName,
          candidates: remaining,
          leads,
        },
      ]);
    } catch (error) {
      showErrorToast(error);
    } finally {
      setIsChecking(false);
    }
  };

  const removedNames = brand
    ? brand.agents
        .filter((agent) => !rows.some((row) => row.userId === agent.userId))
        .map((agent) => agent.name)
        .join(", ")
    : "";

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
              disabled={!canSave || isChecking}
              onClick={() => void handleSave()}
              className={primaryButton}
            >
              {setAgents.isPending
                ? "Saving..."
                : isChecking
                  ? "Checking..."
                  : "Save"}
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
                  onChange={(value) =>
                    updateRow(row.key, { userId: String(value) })
                  }
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
                  onChange={(event) =>
                    updateRow(row.key, { percent: event.target.value })
                  }
                  className="h-10 rounded text-sm"
                />
              </div>
              {savedAgent(row.userId) && (
                <button
                  type="button"
                  aria-label="Deactivate agent"
                  title="Deactivate agent"
                  disabled={isChecking}
                  onClick={() =>
                    void startDeactivate(
                      row.userId,
                      savedAgent(row.userId)?.name ?? "this agent",
                    )
                  }
                  className={`${secondaryButton} shrink-0 px-3 text-red-600 dark:text-red-400`}
                >
                  <UserX className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                aria-label="Remove agent"
                title="Remove from this brand"
                onClick={() => removeRow(row.key)}
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
            Removing an agent splits their share across the others by ratio. On
            save, you choose who takes their Hot and On Hold leads; the rest of
            their leads move to the remaining agents in the background, then the
            brand rebalances to the new shares within 3%. Progress shows at the
            top of the page. Hot and On Hold leads, and leads without a
            timezone, don't move in the rebalance.
          </p>
        </div>
      </Drawer>

      <HotLeadsAssignModal
        isOpen={Boolean(deactivating)}
        title={`Deactivate ${deactivating?.name ?? ""}?`}
        description={
          (deactivating?.groups.length ?? 0) > 0
            ? "They are signed out and can't log in. Choose who takes each of their Hot and On Hold leads below. Their other leads and their share go to the remaining agents by ratio. Unsaved changes in this panel are discarded."
            : "They are signed out and can't log in. On every brand they work, their share and all their leads go to the remaining agents by ratio. If a brand has no other agent, its leads become unassigned. Unsaved changes in this panel are discarded."
        }
        groups={deactivating?.groups ?? []}
        confirmLabel="Deactivate"
        isBusy={deactivateAgent.isPending}
        onConfirm={(assignments) => void handleDeactivate(assignments)}
        onCancel={() => setDeactivating(null)}
      />

      <HotLeadsAssignModal
        isOpen={Boolean(pendingSave)}
        title={`Hot and On Hold leads of ${removedNames}`}
        description="Choose who takes over each company's Hot and On Hold leads. The removed agents' other leads go to the remaining agents along with their shares."
        groups={pendingSave ?? []}
        confirmLabel="Assign and save"
        isBusy={setAgents.isPending}
        onConfirm={(assignments) => void save(assignments)}
        onCancel={() => setPendingSave(null)}
      />

      <CreateAgentModal
        isOpen={isCreatingAgent}
        onClose={() => setIsCreatingAgent(false)}
        onCreated={(userId) =>
          setRows((current) => [
            ...current,
            {
              key: nextKey++,
              userId,
              percent: current.length === 0 ? "100" : "0",
            },
          ])
        }
      />
    </>
  );
}
