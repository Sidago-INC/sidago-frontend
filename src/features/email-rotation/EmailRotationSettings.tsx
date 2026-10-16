import { useState } from "react";
import clsx from "clsx";
import { Repeat } from "lucide-react";
import { ErrorState } from "@/components/ui";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import {
  useRotationPolicies,
  useUpdateRotationPolicy,
  type BrandRotationPolicy,
  type RotationStage,
  type StagePolicy,
} from "./_lib/data";

// Admin page for the per-brand email rotation policy (multiple email Phase 4).
// Rotation only matters for a lead with two or more confirmed addresses: with
// it on, each email at that stage goes to ONE of them (the least recently
// emailed) instead of all of them. 1st and contract emails always go to all.

const STAGE_LABELS: Record<RotationStage, { title: string; hint: string }> = {
  "2nd": { title: "2nd email", hint: "First follow-up" },
  "3rd": { title: "3rd email", hint: "Second follow-up" },
  finished: { title: "Finished / resurfacing", hint: "Re-contact after the sequence" },
};

type Choice = "default" | "on" | "off";

const choiceOf = (p: StagePolicy): Choice =>
  p.source === "default" ? "default" : p.enabled ? "on" : "off";

function StageRow({
  brand,
  policy,
  defaultOn,
  saving,
  onChange,
}: {
  brand: BrandRotationPolicy;
  policy: StagePolicy;
  defaultOn: boolean;
  saving: boolean;
  onChange: (choice: Choice) => void;
}) {
  const current = choiceOf(policy);
  const options: { value: Choice; label: string }[] = [
    { value: "default", label: `Default (${defaultOn ? "On" : "Off"})` },
    { value: "on", label: "Rotate" },
    { value: "off", label: "Send to all" },
  ];
  const label = STAGE_LABELS[policy.stage];

  return (
    <div className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
          {label.title}
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400">
          {label.hint} ·{" "}
          {policy.enabled ? (
            <span className="font-medium text-indigo-700 dark:text-indigo-400">
              one address per email
            </span>
          ) : (
            <span>all confirmed addresses</span>
          )}
        </div>
      </div>
      <div
        role="radiogroup"
        aria-label={`${brand.displayName} ${label.title} rotation`}
        className="inline-flex overflow-hidden rounded-md border border-slate-200 dark:border-slate-700"
      >
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={current === o.value}
            disabled={saving}
            onClick={() => current !== o.value && onChange(o.value)}
            className={clsx(
              "px-3 py-1.5 text-xs font-medium transition disabled:opacity-50",
              "border-l border-slate-200 first:border-l-0 dark:border-slate-700",
              current === o.value
                ? "bg-indigo-600 text-white"
                : "bg-white text-slate-700 hover:bg-slate-50 dark:bg-gray-900 dark:text-slate-300 dark:hover:bg-gray-800",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function EmailRotationSettings() {
  const { data, isLoading, isError, error, refetch } = useRotationPolicies();
  const update = useUpdateRotationPolicy();
  const [savingKey, setSavingKey] = useState<string | null>(null);

  if (isError) {
    return (
      <ErrorState
        title="Could not load rotation settings"
        error={error}
        onRetry={refetch}
      />
    );
  }

  const defaults = new Set(data?.defaultStages ?? []);
  const brands = data?.data ?? [];

  const handleChange = async (
    brand: BrandRotationPolicy,
    stage: RotationStage,
    choice: Choice,
  ) => {
    const key = `${brand.code}:${stage}`;
    setSavingKey(key);
    try {
      await update.mutateAsync({
        brandCode: brand.code,
        changes: { [stage]: choice === "default" ? null : choice === "on" },
      });
      showSuccessToast(`${brand.displayName}: ${STAGE_LABELS[stage].title} updated.`);
    } catch (e) {
      showErrorToast(e);
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="min-h-full bg-slate-50 px-4 py-6 dark:bg-gray-950 sm:px-6">
      <div className="mb-4 max-w-3xl">
        <h1 className="flex items-center gap-2 text-xl font-semibold text-slate-900 dark:text-slate-100">
          <Repeat className="h-5 w-5" /> Email Rotation
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          When a lead has two or more confirmed email addresses, follow-up
          emails normally go to all of them. Turn on rotation for a stage to
          send each email to just one address instead, taking turns: the
          address emailed longest ago goes next. The 1st email and contract
          emails always go to every confirmed address.
        </p>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          "Default" follows the server setting (currently{" "}
          {defaults.size ? `on for ${[...defaults].join(", ")}` : "off everywhere"}
          ). Changes apply to the email queue within a minute.
        </p>
      </div>

      {isLoading ? (
        <div className="text-sm text-slate-500">Loading…</div>
      ) : brands.length === 0 ? (
        <div className="text-sm text-slate-500">No brands available.</div>
      ) : (
        <div className="grid max-w-3xl gap-4">
          {brands.map((brand) => (
            <section
              key={brand.id}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 dark:border-slate-800 dark:bg-gray-900"
            >
              <h2 className="flex items-center gap-2 pt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                {brand.displayName}
                <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {brand.code}
                </span>
              </h2>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {brand.stages.map((policy) => (
                  <StageRow
                    key={policy.stage}
                    brand={brand}
                    policy={policy}
                    defaultOn={defaults.has(policy.stage)}
                    saving={savingKey === `${brand.code}:${policy.stage}`}
                    onChange={(choice) =>
                      void handleChange(brand, policy.stage, choice)
                    }
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
