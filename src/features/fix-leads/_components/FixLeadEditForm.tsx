import {
  Card,
  CardContent,
  CheckboxInput,
  EmailListField,
  Select,
  Textarea,
  TextInput,
  TimezoneBadge,
  Wave,
} from "@/components/ui";
import { resolveLeadTimezone } from "@/types/timezone.types";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { CONTACT_TYPE_VALUES } from "@/types/contact-type.types";
import { useUpdateLead } from "@/features/backoffice-shared/use-update-lead";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { NewLeadDrawer } from "@/features/leads/_components/NewLeadDrawer";
import { createLead } from "@/features/leads/_lib/hooks";
import type { LeadCreateFormValues } from "@/lib/validation/lead-create";
import {
  useCantLocateLead,
  useLeadFull,
  useRelatedLeads,
  type FullLead,
} from "../_lib/data";

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
  const location = useLocation();

  // Where "back to the queue" goes. The table hands over the filtered list URL
  // it was showing, so saving a lead returns to that exact view — same
  // contacts bucket, same timezone, same has-other-contacts toggle, same page.
  // Falling back to the bare path keeps a deep-linked or refreshed edit page
  // working, it just cannot restore filters it was never told about.
  const backToQueue =
    (location.state as { from?: string } | null)?.from ?? "/fix-leads";
  const queryClient = useQueryClient();
  const { leadId } = useParams<{ leadId: string }>();
  const { data, isLoading, isError, error } = useLeadFull(leadId);
  // The company's other people. Operations fix one contact and need to see
  // who else is on file there — the old CRM listed them here as chips.
  const { data: relatedLeads = [] } = useRelatedLeads(leadId);
  const [newLeadOpen, setNewLeadOpen] = useState(false);
  const [creatingLead, setCreatingLead] = useState(false);

  // Adding a colleague at this company. Reuses the Add-Lead form and the same
  // endpoint — the only difference is that the company is fixed and the user
  // never leaves the lead they were fixing.
  const handleCreateLead = async (values: LeadCreateFormValues) => {
    setCreatingLead(true);
    try {
      const response = await createLead({
        companyId: values.companyId,
        fullName: values.fullName,
        phone: values.phone,
        phoneExtension: values.phoneExtension || undefined,
        email: values.email,
        role: values.role,
        otherContacts: values.otherContacts || undefined,
      });
      showSuccessToast(`Lead "${response.fullName}" added.`);
      // The new person belongs in Other Contacts straight away.
      queryClient.invalidateQueries({ queryKey: ["lead-related", leadId] });
      setNewLeadOpen(false);
    } catch (requestError) {
      showErrorToast(
        requestError instanceof Error
          ? requestError.message
          : "Could not add the lead.",
      );
      // Rethrow so the drawer stays open and keeps what was typed.
      throw requestError;
    } finally {
      setCreatingLead(false);
    }
  };
  const updateLead = useUpdateLead();
  const cantLocateLead = useCantLocateLead();

  const [form, setForm] = useState<FormState | null>(null);
  const initialForm = useMemo(
    () => (data ? toFormState(data.lead) : null),
    [data],
  );

  // Whether the lead was ALREADY marked before this edit — the cross-brand
  // void warning is about what saving will newly do, so it only shows when the
  // operator is the one turning it on.
  const baselineNotWorkAnymore = initialForm?.notWorkAnymore ?? false;

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
            onClick={() => navigate(backToQueue)}
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

  const handleCantLocate = async () => {
    if (!leadId || cantLocateLead.isPending) return;
    try {
      const result = await cantLocateLead.mutateAsync(leadId);
      const brands =
        result.cantLocateBrands?.length > 0
          ? result.cantLocateBrands.join(", ")
          : "eligible brands";
      showSuccessToast(`Marked Can't Locate for ${brands}.`);
      navigate(backToQueue);
    } catch (err) {
      showErrorToast(err);
    }
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
      queryClient.invalidateQueries({ queryKey: ["lead-stats"] });
      showSuccessToast(
        `Lead "${form.fullName || data.lead.fullName || leadId}" updated.`,
      );
      navigate(backToQueue);
    } catch (err) {
      showErrorToast(err);
    }
  };

  const lead = data.lead;
  const leadTimezone = resolveLeadTimezone(lead.timezone, lead.companyTimezone);
  const actionPending = updateLead.isPending || cantLocateLead.isPending;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-4 py-6 lg:px-6">
      <button
        type="button"
        onClick={() => navigate(backToQueue)}
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
              {/* A lead's email is a comma-joined LIST, so a single
                  `type="email"` input is wrong twice over: the browser rejects
                  a value containing commas, and there was no way to add a
                  second address while fixing a lead. */}
              <EmailListField
                value={form.email}
                onChange={(value) => updateField("email", value)}
                inputClassName={inputClassName}
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
              <div className="flex flex-col gap-1 md:self-end">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Can&apos;t Locate
                </span>
                <button
                  type="button"
                  onClick={handleCantLocate}
                  disabled={actionPending}
                  className="inline-flex h-10 cursor-pointer items-center justify-center rounded border border-amber-300 bg-amber-50 px-4 text-sm font-semibold text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200 dark:hover:bg-amber-950/70"
                >
                  {cantLocateLead.isPending
                    ? "Marking…"
                    : "Mark Can't Locate"}
                </button>
              </div>
              {relatedLeads.length > 0 && (
                <div className="flex flex-col gap-2 md:col-span-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    Other Contacts ({relatedLeads.length})
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {relatedLeads.map((contact) => {
                      const symbol =
                        contact.companySymbol?.trim() ||
                        lead.companySymbol?.trim() ||
                        "";
                      const name = contact.fullName?.trim() || "Unnamed";

                      return (
                        <button
                          key={contact.id}
                          type="button"
                          onClick={() =>
                            // Hop to a colleague without losing the queue we
                            // came from.
                            navigate(`/fix-leads/${contact.id}`, {
                              state: { from: backToQueue },
                            })
                          }
                          title={
                            contact.role?.trim()
                              ? `${name} — ${contact.role}`
                              : name
                          }
                          className="inline-flex max-w-full cursor-pointer items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-indigo-500 dark:hover:bg-slate-700 dark:hover:text-indigo-300"
                        >
                          <span className="truncate">
                            {symbol ? `${symbol} - ${name}` : name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              <Textarea
                label="Add Other Contacts"
                value={form.otherContacts}
                onChange={(event) =>
                  updateField("otherContacts", event.target.value)
                }
                placeholder="Extra phone numbers, addresses, etc."
                rows={4}
                className="text-sm"
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
              <div className="md:self-end">
                <CheckboxInput
                  label="Not Work Anymore"
                  checked={form.notWorkAnymore}
                  onChange={(event) =>
                    updateField("notWorkAnymore", event.target.checked)
                  }
                  wrapperClassName="h-10 justify-center rounded border border-slate-200 px-4 dark:border-slate-700"
                />
                {form.notWorkAnymore && !baselineNotWorkAnymore ? (
                  <p className="mt-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                    On save, this lead is marked VOID across all brands — SVG,
                    Benton and 95RM.
                  </p>
                ) : null}
              </div>
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

            <div className="flex flex-row items-center justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setNewLeadOpen(true)}
                disabled={actionPending || !lead.companyId}
                title={
                  lead.companyId
                    ? "Add another contact at this company"
                    : "This lead has no company"
                }
                className="mr-auto inline-flex h-10 cursor-pointer items-center justify-center gap-1 rounded border border-indigo-200 px-4 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-indigo-800 dark:text-indigo-300 dark:hover:bg-indigo-950/40"
              >
                <Plus size={15} />
                New Lead
              </button>
              <button
                type="button"
                onClick={handleReset}
                disabled={actionPending}
                className="inline-flex h-10 cursor-pointer items-center justify-center rounded border border-slate-200 px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={actionPending}
                className="inline-flex h-10 cursor-pointer items-center justify-center rounded bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
              >
                {updateLead.isPending ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>

      {lead.companyId && (
        <NewLeadDrawer
          isOpen={newLeadOpen}
          onClose={() => setNewLeadOpen(false)}
          onCreate={handleCreateLead}
          isSaving={creatingLead}
          fixedCompany={{
            id: lead.companyId,
            label: lead.companySymbol
              ? `${lead.companySymbol} - ${lead.companyName ?? ""}`.trim()
              : (lead.companyName ?? ""),
          }}
        />
      )}
    </div>
  );
}
