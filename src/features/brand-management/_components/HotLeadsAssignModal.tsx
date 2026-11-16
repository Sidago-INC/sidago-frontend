import { useEffect, useMemo, useState } from "react";
import { Modal, Select } from "@/components/ui";
import type { HotLeadsBrandGroup } from "../_lib/hooks";

type Props = {
  isOpen: boolean;
  title: string;
  description: string;
  groups: HotLeadsBrandGroup[];
  confirmLabel: string;
  isBusy: boolean;
  onConfirm: (assignments: { stateId: string; userId: string }[]) => void;
  onCancel: () => void;
};

type CompanyRow = {
  key: string;
  label: string;
  leads: HotLeadsBrandGroup["leads"];
};

// Leads of one company are handed over together, so the Super Owner picks one
// agent per company per brand.
function companyRows(group: HotLeadsBrandGroup): CompanyRow[] {
  const rows = new Map<string, CompanyRow>();
  for (const lead of group.leads) {
    const key = `${group.brandId}:${lead.companyId ?? lead.stateId}`;
    const label = lead.companyName
      ? `${lead.companyName}${lead.companySymbol ? ` (${lead.companySymbol})` : ""}`
      : lead.leadName || lead.leadEmail || "Lead without a company";
    const row = rows.get(key) ?? { key, label, leads: [] };
    row.leads.push(lead);
    rows.set(key, row);
  }
  return [...rows.values()];
}

export function HotLeadsAssignModal({
  isOpen,
  title,
  description,
  groups,
  confirmLabel,
  isBusy,
  onConfirm,
  onCancel,
}: Props) {
  const [picks, setPicks] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) setPicks({});
  }, [isOpen, groups]);

  const sections = useMemo(
    () => groups.map((group) => ({ group, rows: companyRows(group) })),
    [groups],
  );
  const total = groups.reduce((sum, g) => sum + g.leads.length, 0);
  const needed = sections.flatMap(({ group, rows }) =>
    group.candidates.length > 0 ? rows : [],
  );
  const missing = needed.filter((row) => !picks[row.key]).length;

  const handleConfirm = () => {
    if (missing > 0 || isBusy) return;
    const assignments = needed.flatMap((row) =>
      row.leads.map((lead) => ({ stateId: lead.stateId, userId: picks[row.key] })),
    );
    onConfirm(assignments);
  };

  return (
    <Modal
      isOpen={isOpen}
      zIndex={1300}
      title={title}
      description={description}
      onClose={() => {
        if (!isBusy) onCancel();
      }}
      primaryAction={{
        label: isBusy
          ? "Saving..."
          : missing > 0
            ? `Choose an agent (${missing} left)`
            : confirmLabel,
        onClick: handleConfirm,
      }}
      secondaryAction={{
        label: "Cancel",
        onClick: () => {
          if (!isBusy) onCancel();
        },
      }}
    >
      {total > 0 && (
        <div className="grid max-h-[55vh] gap-5 overflow-y-auto pr-1 text-left text-sm text-slate-700 dark:text-slate-200">
          {sections.map(({ group, rows }) => {
            const options = group.candidates.map((c) => ({ label: c.name, value: c.userId }));
            const hot = group.leads.filter((l) => l.status === "Hot").length;
            const onHold = group.leads.length - hot;
            return (
              <section key={group.brandId} className="grid gap-2">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-semibold">{group.brandName}</h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {hot} Hot · {onHold} On Hold
                  </span>
                </div>

                {group.candidates.length === 0 ? (
                  <p className="text-amber-600 dark:text-amber-400">
                    No other agent on this brand. These leads become unassigned.
                  </p>
                ) : (
                  <>
                    <Select
                      label="Give all of them to"
                      placeholder="Pick one agent for every lead below"
                      options={options}
                      value=""
                      onChange={(value) =>
                        setPicks((current) => {
                          const next = { ...current };
                          for (const row of rows) next[row.key] = String(value);
                          return next;
                        })
                      }
                      floatingOptions
                      optionsClassName="z-[1400]!"
                    />
                    {rows.map((row) => (
                      <div
                        key={row.key}
                        className="grid gap-2 rounded border border-slate-200 p-3 dark:border-slate-700"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium" title={row.label}>
                            {row.label}
                          </p>
                          <ul className="mt-1 grid gap-0.5 text-xs text-slate-500 dark:text-slate-400">
                            {row.leads.map((lead) => (
                              <li key={lead.stateId} className="flex justify-between gap-2">
                                <span className="truncate">
                                  {lead.leadName || lead.leadEmail || "Unnamed lead"}
                                </span>
                                <span
                                  className={
                                    lead.status === "Hot"
                                      ? "shrink-0 font-semibold text-red-600 dark:text-red-400"
                                      : "shrink-0 font-semibold text-amber-600 dark:text-amber-400"
                                  }
                                >
                                  {lead.status}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <Select
                          placeholder="Choose agent"
                          options={options}
                          value={picks[row.key] ?? ""}
                          onChange={(value) =>
                            setPicks((current) => ({ ...current, [row.key]: String(value) }))
                          }
                          floatingOptions
                          optionsClassName="z-[1400]!"
                        />
                      </div>
                    ))}
                  </>
                )}
              </section>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
