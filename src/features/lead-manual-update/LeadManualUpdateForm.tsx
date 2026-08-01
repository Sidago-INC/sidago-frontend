

import { useMemo, useState } from "react";
import {
  Button,
  Card,
  CardContent,
  CheckboxInput,
  DatePickerField,
  Select,
  TextInput,
  Textarea,
} from "@/components/ui";
import { useAuth } from "@/providers/AuthProvider";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { useLeadSelectSource } from "@/features/level-2-update/_lib/hooks";
import { useUsers } from "@/features/backoffice-shared/use-users";
import {
  getCallBackDateError,
  getMinCallBackDate,
} from "@/features/agent-calls/_lib/utils";
import {
  campaignLabelToBrandCode,
  useCreateManualUpdate,
} from "./_lib/hooks";

type FormValues = {
  lead: string;
  resultUpdate: string;
  toBeCalledOn: string;
  notes: string;
  agent: string;
  campaignType: string;
  toBeLogged: boolean;
};

const CAMPAIGN_TYPE_OPTIONS = [
  { label: "SVG", value: "SVG" },
  { label: "Benton", value: "Benton" },
  { label: "95RM", value: "95RM" },
];

const CALL_RESULT_OPTIONS = [
  "No Answer",
  "Left Message",
  "Bad Number",
  "Interested",
  "Interested Again",
  "Call Lead Back",
  "Not Interested",
  "DNC",
  "Contract Closed",
].map((value) => ({ label: value, value }));

const FIXED_RESULT_OPTION = { label: "Fixed", value: "Fixed" };

function getResultUpdateOptions(role: string | undefined) {
  const canSelectFixed = role === "admin" || role === "backoffice";
  return canSelectFixed
    ? [...CALL_RESULT_OPTIONS, FIXED_RESULT_OPTION]
    : CALL_RESULT_OPTIONS;
}

const selectClassName =
  "h-10 rounded border-slate-200 text-sm shadow-none dark:border-slate-700";

const readonlyInputClassName =
  "h-10 rounded text-sm bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300";

function createInitialValues(agentName: string): FormValues {
  return {
    lead: "",
    resultUpdate: "",
    toBeCalledOn: "",
    notes: "",
    agent: agentName,
    campaignType: "SVG",
    toBeLogged: true,
  };
}

export function LeadManualUpdateForm() {
  const { user } = useAuth();
  const createManualUpdate = useCreateManualUpdate();
  const leadSelectSource = useLeadSelectSource();
  // Brand-scoped agent queries — same pattern as Level 2 Update so the
  // Agent dropdown only lists agents registered to the selected campaign.
  const svgAgents = useUsers("svg");
  const rm95Agents = useUsers("95rm");
  const bentonAgents = useUsers("benton");

  const isAdmin = user?.role === "admin";
  const canSelectFixed =
    user?.role === "admin" || user?.role === "backoffice";
  const currentAgentName = user?.name?.trim() || "Current Agent";

  const [form, setForm] = useState<FormValues>(() => createInitialValues(""));
  const [toBeCalledOnError, setToBeCalledOnError] = useState<string>();

  const agentFieldValue = isAdmin ? form.agent : currentAgentName;
  const campaignTypeValue = isAdmin ? form.campaignType : "SVG";
  const toBeLoggedValue = true;
  const brandCode = campaignLabelToBrandCode(campaignTypeValue);

  const resultUpdateOptions = useMemo(
    () => getResultUpdateOptions(user?.role),
    [user?.role],
  );

  const brandAgents = useMemo(() => {
    if (brandCode === "svg") return svgAgents.data ?? [];
    if (brandCode === "95rm") return rm95Agents.data ?? [];
    if (brandCode === "benton") return bentonAgents.data ?? [];
    return [];
  }, [brandCode, svgAgents.data, rm95Agents.data, bentonAgents.data]);

  const agentsLoading =
    brandCode === "svg"
      ? svgAgents.isLoading
      : brandCode === "95rm"
        ? rm95Agents.isLoading
        : brandCode === "benton"
          ? bentonAgents.isLoading
          : false;

  const agentOptions = useMemo(() => {
    return brandAgents.map((agent) => ({
      label: agent.name,
      value: agent.name,
    }));
  }, [brandAgents]);

  const updateField = <K extends keyof FormValues>(
    field: K,
    value: FormValues[K],
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleCampaignChange = (nextCampaign: string) => {
    // Clear agent so a Benton agent cannot stick around under SVG.
    setForm((current) => ({
      ...current,
      campaignType: nextCampaign,
      agent: "",
    }));
  };

  const handleClear = () => {
    setForm(createInitialValues(isAdmin ? currentAgentName : ""));
    setToBeCalledOnError(undefined);
  };

  const handleToBeCalledOnChange = (value: string) => {
    const error = getCallBackDateError(value, "");
    setToBeCalledOnError(error);
    if (error) return;
    updateField("toBeCalledOn", value);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.lead || !form.resultUpdate) {
      showErrorToast(new Error("Lead and result update are required."));
      return;
    }

    if (form.resultUpdate === "Fixed" && !canSelectFixed) {
      showErrorToast(new Error("Fixed is not available for your role."));
      return;
    }

    const callbackError = getCallBackDateError(form.toBeCalledOn, "");
    if (callbackError) {
      setToBeCalledOnError(callbackError);
      showErrorToast(new Error(callbackError));
      return;
    }

    const selectedAgent = brandAgents.find(
      (agent) => agent.name === (isAdmin ? form.agent : currentAgentName),
    );
    const agentId = selectedAgent?.id ?? user?.id;

    if (!agentId) {
      showErrorToast(new Error("Unable to resolve agent for this update."));
      return;
    }

    try {
      await createManualUpdate.mutateAsync({
        leadId: form.lead,
        agentId,
        brandCode,
        resultCode: form.resultUpdate,
        notes: form.notes.trim() || undefined,
        followUpDate: form.toBeCalledOn || undefined,
      });
      showSuccessToast("Lead manual update submitted successfully.");
      setForm(createInitialValues(isAdmin ? currentAgentName : ""));
      setToBeCalledOnError(undefined);
    } catch (error) {
      showErrorToast(error);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-4 py-6 lg:px-6">
      <Card className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <CardContent className="p-0">
          <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-700 sm:px-6">
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
              Lead Manual Update
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Create a manual update entry for a lead using the existing agent
              workflow fields.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="grid gap-5 px-5 py-5 sm:px-6 sm:py-6"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Select
                label="Lead"
                value={form.lead}
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
                onChange={(value) => updateField("lead", String(value))}
                className={selectClassName}
                disabled={
                  (leadSelectSource.isLoading &&
                    leadSelectSource.options.length === 0) ||
                  createManualUpdate.isPending
                }
              />
              <Select
                label="Result Update"
                value={form.resultUpdate}
                options={resultUpdateOptions}
                placeholder="Select result update"
                onChange={(value) => updateField("resultUpdate", String(value))}
                className={selectClassName}
              />
              <DatePickerField
                label="To be called on"
                value={form.toBeCalledOn}
                onChange={handleToBeCalledOnChange}
                placeholder="Pick a date"
                className={selectClassName}
                minDate={getMinCallBackDate("")}
                error={toBeCalledOnError}
              />
              {isAdmin ? (
                <Select
                  label="Campaign Type"
                  value={campaignTypeValue}
                  options={CAMPAIGN_TYPE_OPTIONS}
                  placeholder="Select campaign type"
                  onChange={(value) => handleCampaignChange(String(value))}
                  className={selectClassName}
                />
              ) : (
                <TextInput
                  label="Campaign Type"
                  value={campaignTypeValue}
                  readOnly
                  className={readonlyInputClassName}
                />
              )}
              {isAdmin ? (
                <Select
                  label="Agent"
                  value={agentFieldValue}
                  options={agentOptions}
                  placeholder={
                    !campaignTypeValue
                      ? "Pick a campaign first"
                      : agentsLoading
                        ? "Loading agents..."
                        : "Select agent"
                  }
                  onChange={(value) => updateField("agent", String(value))}
                  className={selectClassName}
                  disabled={
                    !campaignTypeValue ||
                    agentsLoading ||
                    createManualUpdate.isPending
                  }
                />
              ) : (
                <TextInput
                  label="Agent"
                  value={agentFieldValue}
                  readOnly
                  className={readonlyInputClassName}
                />
              )}
              <CheckboxInput
                label="To be logged"
                checked={toBeLoggedValue}
                disabled
                readOnly
                className="cursor-not-allowed"
                wrapperClassName="h-10 rounded border border-slate-200 px-4 dark:border-slate-700 md:self-end"
                labelClassName="h-full text-sm font-medium text-slate-700 dark:text-slate-300"
              />
              <Textarea
                label="Notes"
                value={form.notes}
                onChange={(event) => updateField("notes", event.target.value)}
                rows={5}
                className="text-sm"
                wrapperClassName="md:col-span-2"
              />
            </div>

            <div className="flex flex-row justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-700">
              <Button
                type="button"
                onClick={handleClear}
                className="inline-flex h-10 cursor-pointer items-center justify-center rounded border border-slate-200 px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Clear
              </Button>
              <Button
                type="submit"
                disabled={createManualUpdate.isPending}
                className="inline-flex h-10 cursor-pointer items-center justify-center rounded bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
              >
                {createManualUpdate.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
