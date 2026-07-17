import {
  Card,
  CardContent,
  CheckboxInput,
  Select,
  TextInput,
  TimezoneBadge,
  Wave,
} from "@/components/ui";
import { resolveLeadTimezone } from "@/types/timezone.types";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { CONTACT_TYPE_VALUES } from "@/types/contact-type.types";
import { useUpdateLead } from "@/features/backoffice-shared/use-update-lead";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLeadFull, type FullLead } from "../_lib/data";

const inputClassName = "h-10 rounded text-sm";
const readOnlyInputClassName = `${inputClassName} bg-slate-100 dark:bg-slate-800`;

const CONTACT_TYPE_OPTIONS = CONTACT_TYPE_VALUES.map((value) => ({
  label: value,
  value,
}));

type FormState = {
  fullName: string;
  phone: string;
  email: string;
  role: string;
  contactType: string;
  otherContacts: string;
  notWorkAnymore: boolean;
};

function toFormState(lead: FullLead): FormState {
  return {
    fullName: lead.fullName ?? "",
    phone: lead.phone ?? "",
    email: lead.email ?? "",
    role: lead.role ?? "",
    contactType: lead.contactType ?? "",
    otherContacts: lead.otherContacts ?? "",
    notWorkAnymore: lead.notWorkAnymore,
  };
}

export function FixLeadEditForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { leadId } = useParams<{ leadId: string }>();
  const { data, isLoading, isError, error } = useLeadFull(leadId);
  const updateLead = useUpdateLead();

  const [form, setForm] = useState<FormState | null>(null);
  const initialForm = useMemo(
    () => (data ? toFormState(data.lead) : null),
    [data],
  );

  useEffect(() => {
    if (initialForm) setForm(initialForm);
  }, [initialForm]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Wave />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-6 lg:px-6">
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Lead not found
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {(error as unknown as { message?: string[] })?.message?.join(", ") ??
              `The lead "${leadId}" could not be loaded.`}
          </p>
          <button
            type="button"
            onClick={() => navigate("/fix-leads")}
            className="mt-4 inline-flex h-9 cursor-pointer items-center justify-center rounded bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
          >
            Back to Fix Queue
          </button>
        </div>
      </div>
    );
  }

  if (!form) return null;

  const updateField = <K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ) => {
    setForm((current) => (current ? { ...current, [field]: value } : current));
  };

  const handleReset = () => {
    if (initialForm) setForm(initialForm);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!leadId) return;

    // Only send keys that actually changed. Server-side, an unchanged field
    // would still be a no-op write but it inflates the audit log.
    const baseline = initialForm!;
    const leadPatch: Record<string, string | boolean> = {};
    if (form.fullName !== baseline.fullName) leadPatch.full_name = form.fullName;
    if (form.phone !== baseline.phone) leadPatch.phone = form.phone;
    if (form.email !== baseline.email) leadPatch.email = form.email;
    if (form.role !== baseline.role) leadPatch.role = form.role;
    if (form.contactType !== baseline.contactType)
      leadPatch.contact_type = form.contactType;
    if (form.otherContacts !== baseline.otherContacts)
      leadPatch.other_contacts = form.otherContacts;
    if (form.notWorkAnymore !== baseline.notWorkAnymore)
      leadPatch.not_work_anymore = form.notWorkAnymore;

    const body: Parameters<typeof updateLead.mutateAsync>[0]["body"] = {
      fix_submit: true,
    };
    if (Object.keys(leadPatch).length > 0) body.lead = leadPatch;

    try {
      await updateLead.mutateAsync({ leadId, body });
      // Invalidate fix-queue + this lead's detail so the queue reflects state
      // changes (a lead leaving "Fix" should disappear from the queue).
      queryClient.invalidateQueries({ queryKey: ["fix-queue"] });
      queryClient.invalidateQueries({ queryKey: ["lead-full", leadId] });
      showSuccessToast(
        `Lead "${form.fullName || data.lead.fullName || leadId}" updated.`,
      );
      navigate("/fix-leads");
    } catch (err) {
      showErrorToast(err);
    }
  };

  const lead = data.lead;
  const leadTimezone = resolveLeadTimezone(lead.timezone, lead.companyTimezone);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-4 py-6 lg:px-6">
      <button
        type="button"
        onClick={() => navigate("/fix-leads")}
        className="inline-flex w-fit cursor-pointer items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
      >
        <ArrowLeft size={16} />
        Back to Fix Queue
      </button>

      <Card className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <CardContent className="p-0">
          <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-700 sm:px-6">
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
              Fix Lead — {lead.fullName ?? "Unnamed"}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Edit lead details. Common fixes include phone number, email, and
              contact information.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="grid gap-5 px-5 py-5 sm:px-6 sm:py-6"
          >
            <section className="grid gap-4 md:grid-cols-2">
              <TextInput
                label="Company"
                value={
                  lead.companyName
                    ? `${lead.companyName} (${lead.companySymbol ?? ""})`
                    : ""
                }
                readOnly
                className={`${inputClassName} bg-slate-100 dark:bg-slate-800`}
                wrapperClassName="md:col-span-2"
              />
              <TextInput
                label="Full Name"
                value={form.fullName}
                onChange={(event) => updateField("fullName", event.target.value)}
                className={inputClassName}
              />
              <TextInput
                label="Role"
                value={form.role}
                onChange={(event) => updateField("role", event.target.value)}
                className={inputClassName}
              />
              <TextInput
                label="Email"
                type="email"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                className={inputClassName}
              />
              <TextInput
                label="Phone"
                value={form.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                className={inputClassName}
              />
              <Select
                label="Contact Type"
                value={form.contactType}
                options={CONTACT_TYPE_OPTIONS}
                onChange={(value) => updateField("contactType", String(value))}
                placeholder="Select contact type"
                className="h-10 rounded text-sm"
              />
              <TextInput
                label="Other Contacts"
                value={form.otherContacts}
                onChange={(event) =>
                  updateField("otherContacts", event.target.value)
                }
                placeholder="Extra phone numbers, addresses, etc."
                className={inputClassName}
                wrapperClassName="md:col-span-2"
              />
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Lead Timezone
                </span>
                <div className="flex h-10 items-center">
                  {leadTimezone ? (
                    <TimezoneBadge timezone={leadTimezone} />
                  ) : (
                    <span className="text-sm text-slate-400">—</span>
                  )}
                </div>
              </div>
              <CheckboxInput
                label="Not Work Anymore"
                checked={form.notWorkAnymore}
                onChange={(event) =>
                  updateField("notWorkAnymore", event.target.checked)
                }
                wrapperClassName="h-10 justify-center rounded border border-slate-200 px-4 dark:border-slate-700 md:self-end"
              />
            </section>

            <section className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/40">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Per-Brand Lead Type
              </p>
              <div className="grid gap-4 md:grid-cols-3">
                <TextInput
                  label="SVG Lead Type"
                  value={data.brandStates.svg.leadType ?? ""}
                  readOnly
                  className={readOnlyInputClassName}
                />
                <TextInput
                  label="Benton Lead Type"
                  value={data.brandStates.benton.leadType ?? ""}
                  readOnly
                  className={readOnlyInputClassName}
                />
                <TextInput
                  label="95RM Lead Type"
                  value={data.brandStates["95rm"].leadType ?? ""}
                  readOnly
                  className={readOnlyInputClassName}
                />
              </div>
            </section>

            <div className="flex flex-row justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-700">
              <button
                type="button"
                onClick={handleReset}
                disabled={updateLead.isPending}
                className="inline-flex h-10 cursor-pointer items-center justify-center rounded border border-slate-200 px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={updateLead.isPending}
                className="inline-flex h-10 cursor-pointer items-center justify-center rounded bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
              >
                {updateLead.isPending ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
