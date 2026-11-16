import {
  Building2,
  CornerDownRight,
  ListPlus,
  Pencil,
  Plus,
  Power,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { Modal, Select, Table } from "@/components/ui";
import type { Column } from "@/components/ui/table/types";
import { useSuperOwner } from "@/hooks/useBrandCatalog";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import {
  useManagedBrands,
  useOrganizations,
  useUpdateBrand,
  type BrandAgent,
  type ManagedBrand,
} from "../_lib/hooks";
import { AddExistingLeadsModal } from "./AddExistingLeadsModal";
import { AgentsSplitDrawer } from "./AgentsSplitDrawer";
import { BrandFormModal } from "./BrandFormModal";
import { CreateAgentModal } from "./CreateAgentModal";

const toolbarButtonBase =
  "inline-flex h-9 shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-lg px-2.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 sm:px-3.5 dark:focus-visible:ring-offset-slate-900";
const secondaryButton = `${toolbarButtonBase} border border-indigo-200 bg-indigo-50 text-indigo-700 hover:border-indigo-300 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:border-indigo-700 dark:hover:bg-indigo-900/50`;
const primaryButton = `${toolbarButtonBase} bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600`;

const ACTION_TONES = {
  neutral:
    "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-700",
  primary:
    "border-indigo-200 bg-indigo-50 text-indigo-700 hover:border-indigo-300 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:border-indigo-700 dark:hover:bg-indigo-900/50",
  danger:
    "border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-300 hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:border-rose-700 dark:hover:bg-rose-900/50",
  success:
    "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:border-emerald-700 dark:hover:bg-emerald-900/50",
};

const PILL_TONES = {
  indigo:
    "bg-indigo-50 text-indigo-700 ring-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:ring-indigo-800",
  sky: "bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:ring-sky-800",
  emerald:
    "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-800",
  slate:
    "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700",
};

const MAX_VISIBLE_AGENTS = 2;

// Main brands in display order, each followed by its own sub-brands.
function inTreeOrder(brands: ManagedBrand[]): ManagedBrand[] {
  const byOrder = [...brands].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.displayName.localeCompare(b.displayName),
  );
  const ids = new Set(brands.map((b) => b.id));
  const isRoot = (b: ManagedBrand) => !b.parentBrandId || !ids.has(b.parentBrandId);
  return byOrder
    .filter(isRoot)
    .flatMap((root) => [root, ...byOrder.filter((b) => b.parentBrandId === root.id)]);
}

function brandTypeLabel(brand: ManagedBrand, parentName: string): string {
  return brand.parentBrandId ? `Sub-brand of ${parentName}` : "Main brand";
}

function agentLabel(agent: BrandAgent): string {
  return agent.percent != null ? `${agent.name} ${agent.percent}%` : agent.name;
}

function Pill({ className, children }: { className: string; children: ReactNode }) {
  return (
    <span
      className={`inline-flex h-6 max-w-full items-center gap-1.5 rounded-full px-2.5 text-xs font-medium ring-1 ring-inset ${className}`}
    >
      {children}
    </span>
  );
}

function BrandNameCell({ brand }: { brand: ManagedBrand }) {
  const isSubBrand = Boolean(brand.parentBrandId);
  return (
    <div className={`flex min-w-0 items-center gap-2.5 ${isSubBrand ? "pl-5" : ""}`}>
      {isSubBrand ? (
        <CornerDownRight className="h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500" />
      ) : (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300">
          <Building2 className="h-4 w-4" />
        </span>
      )}
      <div className={`min-w-0 ${brand.isActive ? "" : "opacity-50"}`}>
        <p
          className={`truncate text-[13px] leading-4 text-slate-900 dark:text-slate-100 ${isSubBrand ? "font-medium" : "font-semibold"}`}
        >
          {brand.displayName}
        </p>
        <p className="truncate text-[11px] leading-4 text-slate-500 dark:text-slate-400">
          {brand.code}
        </p>
      </div>
    </div>
  );
}

function AgentChips({ agents }: { agents: BrandAgent[] }) {
  if (agents.length === 0) {
    return <span className="text-slate-400 dark:text-slate-500">No agents</span>;
  }
  const hidden = agents.length - MAX_VISIBLE_AGENTS;
  return (
    <div className="flex min-w-0 items-center gap-1">
      {agents.slice(0, MAX_VISIBLE_AGENTS).map((agent) => (
        <span
          key={agent.userId}
          className="inline-flex h-6 min-w-0 items-center gap-1 rounded-full bg-slate-100 px-2 text-[11px] text-slate-700 dark:bg-slate-800 dark:text-slate-200"
        >
          <span className="truncate">{agent.name}</span>
          {agent.percent != null && (
            <span className="shrink-0 font-semibold">{agent.percent}%</span>
          )}
        </span>
      ))}
      {hidden > 0 && (
        <span className="inline-flex h-6 shrink-0 items-center rounded-full px-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
          +{hidden}
        </span>
      )}
    </div>
  );
}

const NON_PRODUCT_REASON = "This brand doesn't take agents or leads";

function ActionButton({
  icon: Icon,
  label,
  tone = "neutral",
  disabledReason,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  tone?: keyof typeof ACTION_TONES;
  disabledReason?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={Boolean(disabledReason)}
      title={disabledReason}
      className={`inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-md border px-2.5 text-xs font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-40 ${ACTION_TONES[tone]}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

export function BrandManagement() {
  const { isSuperOwner, isLoading: isCheckingOwner } = useSuperOwner();
  const { data: organizations = [] } = useOrganizations();
  const { data: brands = [], isLoading } = useManagedBrands();
  const updateBrand = useUpdateBrand();

  const [organizationId, setOrganizationId] = useState("");
  const [formBrand, setFormBrand] = useState<ManagedBrand | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCreatingAgent, setIsCreatingAgent] = useState(false);
  const [agentsBrand, setAgentsBrand] = useState<ManagedBrand | null>(null);
  const [backfillBrand, setBackfillBrand] = useState<ManagedBrand | null>(null);
  const [deactivating, setDeactivating] = useState<ManagedBrand | null>(null);

  const organization =
    organizations.find((o) => o.id === organizationId) ?? organizations[0] ?? null;
  const visibleBrands = useMemo(
    () => brands.filter((b) => b.organizationId === organization?.id),
    [brands, organization],
  );
  const treeBrands = useMemo(() => inTreeOrder(visibleBrands), [visibleBrands]);
  const nameOf = (id: string | null) =>
    brands.find((b) => b.id === id)?.displayName ?? "-";

  const setActive = async (brand: ManagedBrand, isActive: boolean) => {
    try {
      await updateBrand.mutateAsync({ id: brand.id, isActive });
      showSuccessToast(isActive ? "Brand activated" : "Brand deactivated");
      setDeactivating(null);
    } catch (error) {
      showErrorToast(error);
    }
  };

  const columns: Column<ManagedBrand>[] = [
    {
      key: "displayName",
      title: "Brand",
      width: 250,
      getValue: (row) => `${row.displayName} (${row.code})`,
      render: (row) => <BrandNameCell brand={row} />,
    },
    {
      key: "parentBrandId",
      title: "Type",
      width: 190,
      getValue: (row) => brandTypeLabel(row, nameOf(row.parentBrandId)),
      render: (row) => (
        <Pill className={row.parentBrandId ? PILL_TONES.sky : PILL_TONES.indigo}>
          {brandTypeLabel(row, nameOf(row.parentBrandId))}
        </Pill>
      ),
    },
    {
      key: "agents",
      title: "Agents",
      width: 270,
      getValue: (row) =>
        row.agents.length === 0
          ? "No agents"
          : row.agents.map(agentLabel).join(", "),
      render: (row) => <AgentChips agents={row.agents} />,
    },
    {
      key: "isActive",
      title: "Status",
      width: 100,
      getValue: (row) => (row.isActive ? "Active" : "Inactive"),
      render: (row) => (
        <Pill className={row.isActive ? PILL_TONES.emerald : PILL_TONES.slate}>
          <span
            className={`h-1.5 w-1.5 shrink-0 rounded-full ${row.isActive ? "bg-emerald-500" : "bg-slate-400"}`}
          />
          {row.isActive ? "Active" : "Inactive"}
        </Pill>
      ),
    },
    {
      key: "actions",
      title: "Actions",
      width: 450,
      filterable: false,
      sortable: false,
      groupable: false,
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <ActionButton
            icon={Pencil}
            label="Edit"
            onClick={() => {
              setFormBrand(row);
              setIsFormOpen(true);
            }}
          />
          <ActionButton
            icon={Users}
            label="Agents"
            tone="primary"
            disabledReason={row.isProductBrand ? undefined : NON_PRODUCT_REASON}
            onClick={() => setAgentsBrand(row)}
          />
          <ActionButton
            icon={ListPlus}
            label="Add existing leads"
            tone="primary"
            disabledReason={row.isProductBrand ? undefined : NON_PRODUCT_REASON}
            onClick={() => setBackfillBrand(row)}
          />
          {row.isActive ? (
            <ActionButton
              icon={Power}
              label="Deactivate"
              tone="danger"
              onClick={() => setDeactivating(row)}
            />
          ) : (
            <ActionButton
              icon={Power}
              label="Activate"
              tone="success"
              onClick={() => void setActive(row, true)}
            />
          )}
        </div>
      ),
    },
  ];

  if (!isCheckingOwner && !isSuperOwner) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-full">
      <Table
        title="Brand Management"
        description={`Brands and sub-brands under ${organization?.displayName ?? "this company"}`}
        data={treeBrands}
        columns={columns}
        isLoading={isLoading}
        headerContent={
          <div className="flex flex-wrap items-center gap-2">
            {organizations.length > 1 && (
              <div className="w-48">
                <Select
                  options={organizations.map((o) => ({
                    label: o.displayName,
                    value: o.id,
                  }))}
                  value={organization?.id ?? ""}
                  onChange={(value) => setOrganizationId(String(value))}
                  floatingOptions
                />
              </div>
            )}
            <button
              type="button"
              className={secondaryButton}
              aria-label="Add Agent"
              title="Add Agent"
              onClick={() => setIsCreatingAgent(true)}
            >
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Agent</span>
            </button>
            <button
              type="button"
              className={primaryButton}
              aria-label="Add Brand"
              title="Add Brand"
              onClick={() => {
                setFormBrand(null);
                setIsFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Brand</span>
            </button>
          </div>
        }
      />

      <BrandFormModal
        isOpen={isFormOpen}
        organization={organization}
        brand={formBrand}
        brands={visibleBrands}
        onClose={() => setIsFormOpen(false)}
      />
      <CreateAgentModal
        isOpen={isCreatingAgent}
        onClose={() => setIsCreatingAgent(false)}
      />
      <AgentsSplitDrawer brand={agentsBrand} onClose={() => setAgentsBrand(null)} />
      <AddExistingLeadsModal
        brand={backfillBrand}
        onClose={() => setBackfillBrand(null)}
      />
      <Modal
        isOpen={Boolean(deactivating)}
        title={`Deactivate ${deactivating?.displayName ?? ""}?`}
        description="New leads will stop going to this brand and its agents lose access to their queue. Daily automations stop for this brand. Existing leads and history stay as they are."
        onClose={() => setDeactivating(null)}
        primaryAction={{
          label: "Deactivate",
          onClick: () => {
            if (deactivating) void setActive(deactivating, false);
          },
        }}
        secondaryAction={{ label: "Cancel", onClick: () => setDeactivating(null) }}
      />
    </div>
  );
}
