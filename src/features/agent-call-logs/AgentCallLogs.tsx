import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Ban,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock3,
  MessageCircleWarning,
  MessageSquareText,
  PhoneCall,
  PhoneOff,
  Search,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import {
  Button,
  CardShell,
  CheckboxInput,
  CompanySymbolBadge,
  DatePickerField,
  Drawer,
  EditableDrawerFooter,
  EmptyState,
  ErrorState,
  Select,
  Wave,
  TextInput,
  Textarea,
  TimezoneBadge,
  TypeBadge,
} from "@/components/ui";
import { OutcomeButton } from "@/features/agent-calls/_components/OutcomeButton";
import type {
  LeadDetailResponse,
  QueueLead,
} from "@/features/agent-calls/_lib/apiTypes";
import {
  resolveAgentSlug,
} from "@/features/agent-calls/_lib/agentCallsApi";
import { getAgentKeyFromCookie } from "@/features/agent-calls/_lib/utils";
import { getCompanySymbol } from "@/features/backoffice-shared/constants";
import type { LeadPatchBody } from "@/features/backoffice-shared/use-update-lead";
import clsx from "clsx";
import { CONTACT_TYPE_VALUES } from "@/types/contact-type.types";
import { LEAD_TYPE_VALUES } from "@/types/lead-type.types";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import {
  formatCallsHistory,
  formatNotesHistory,
  formatRelatedContacts,
} from "./_lib/format";
import {
  buildCallLogGroups,
  flattenCallsLogLeads,
  getCallLogLeadLabel,
  getCallLogPathKey,
  matchesCallLogSearch,
} from "./_lib/grouping";
import {
  useCallLogDetail,
  useCallLogFollowUp,
  useCallLogMarkVoid,
  useCallsLogQueue,
  useLogCallResult,
  usePatchCallLogLead,
} from "./_lib/hooks";

type EditableCallLogState = {
  fullName: string;
  role: string;
  phone: string;
  email: string;
  contactType: string;
  svgLeadType: string;
  notes: string;
  additionalContacts: string;
  doesNotWorkAnymore: boolean;
  callBackDate: string;
  historyCalls: string;
  historyNotes: string;
};

type SavableFormFields = Pick<
  EditableCallLogState,
  | "fullName"
  | "role"
  | "phone"
  | "email"
  | "contactType"
  | "svgLeadType"
  | "doesNotWorkAnymore"
  | "callBackDate"
>;

function pickSavableFields(form: EditableCallLogState): SavableFormFields {
  return {
    fullName: form.fullName,
    role: form.role,
    phone: form.phone,
    email: form.email,
    contactType: form.contactType,
    svgLeadType: form.svgLeadType,
    doesNotWorkAnymore: form.doesNotWorkAnymore,
    callBackDate: form.callBackDate,
  };
}

function hasSavableChanges(
  form: EditableCallLogState,
  baseline: EditableCallLogState,
): boolean {
  return (
    JSON.stringify(pickSavableFields(form)) !==
    JSON.stringify(pickSavableFields(baseline))
  );
}

const callOutcomes = [
  {
    label: "No Answer",
    icon: PhoneOff,
    className:
      "border border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 cursor-pointer",
  },
  {
    label: "Interested",
    icon: ThumbsUp,
    className:
      "bg-emerald-500 text-white shadow-sm shadow-emerald-200 hover:bg-emerald-400 dark:shadow-emerald-900/40 cursor-pointer",
  },
  {
    label: "Bad Number",
    icon: MessageCircleWarning,
    className:
      "bg-blue-500 text-white shadow-sm shadow-blue-200 hover:bg-blue-400 dark:shadow-blue-900/40 cursor-pointer",
  },
  {
    label: "Not Interested",
    icon: ThumbsDown,
    className: "bg-slate-600 text-white hover:bg-slate-500 cursor-pointer",
  },
  {
    label: "Left Message",
    icon: MessageSquareText,
    className:
      "border border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 cursor-pointer",
  },
  {
    label: "Call Lead Back",
    icon: Clock3,
    className:
      "bg-rose-500 text-white shadow-sm shadow-rose-200 hover:bg-rose-400 dark:shadow-rose-900/40 cursor-pointer",
  },
  {
    label: "Interested Again",
    icon: PhoneCall,
    className:
      "bg-cyan-500 text-white shadow-sm shadow-cyan-200 hover:bg-cyan-400 dark:shadow-cyan-900/40 cursor-pointer",
  },
  {
    label: "DNC",
    icon: Ban,
    className: "bg-slate-700 text-white hover:bg-slate-600 cursor-pointer",
  },
] as const;

type BrandKey = "svg" | "95rm" | "benton";

function toBrandKey(brandCode: string): BrandKey {
  const code = brandCode.toLowerCase();
  if (code === "95rm") return "95rm";
  if (code === "benton") return "benton";
  return "svg";
}

function formFromDetail(detail: LeadDetailResponse): EditableCallLogState {
  return {
    fullName: detail.lead.fullName,
    role: detail.lead.role ?? "",
    phone: detail.lead.phone ?? "",
    email: detail.lead.email,
    contactType: detail.lead.contactType,
    svgLeadType: detail.brandState.leadType,
    notes: "",
    additionalContacts: formatRelatedContacts(detail.relatedContacts),
    doesNotWorkAnymore: detail.lead.notWorkAnymore,
    callBackDate: detail.brandState.followUpDate ?? "",
    historyCalls: formatCallsHistory(detail.history),
    historyNotes: formatNotesHistory(detail.history),
  };
}

function buildLeadPatchBody(
  form: EditableCallLogState,
  detail: LeadDetailResponse,
  brandKey: BrandKey,
): LeadPatchBody | null {
  const body: LeadPatchBody = {};
  const leadPatch: NonNullable<LeadPatchBody["lead"]> = {};

  if (form.fullName !== detail.lead.fullName) {
    leadPatch.full_name = form.fullName;
  }
  if (form.role !== (detail.lead.role ?? "")) {
    leadPatch.role = form.role;
  }
  if (form.phone !== (detail.lead.phone ?? "")) {
    leadPatch.phone = form.phone;
  }
  if (form.email !== detail.lead.email) {
    leadPatch.email = form.email;
  }
  if (form.contactType !== detail.lead.contactType) {
    leadPatch.contact_type = form.contactType;
  }
  if (form.doesNotWorkAnymore !== detail.lead.notWorkAnymore) {
    leadPatch.not_work_anymore = form.doesNotWorkAnymore;
  }

  const brandPatch: NonNullable<LeadPatchBody["brandStates"]> = {};
  if (form.svgLeadType !== detail.brandState.leadType) {
    brandPatch[brandKey] = { lead_type: form.svgLeadType };
  }

  if (Object.keys(leadPatch).length > 0) {
    body.lead = leadPatch;
  }
  if (Object.keys(brandPatch).length > 0) {
    body.brandStates = brandPatch;
  }

  return Object.keys(body).length > 0 ? body : null;
}

export function AgentCallLogs() {
  const [searchParams] = useSearchParams();
  const agentSlug =
    searchParams.get("agent") ??
    searchParams.get("agentId") ??
    resolveAgentSlug(getAgentKeyFromCookie());

  const {
    data: queueData,
    isLoading: queueLoading,
    isError: queueError,
    refetch: refetchQueue,
  } = useCallsLogQueue(agentSlug);

  const brandCode = queueData?.brandCode ?? "svg";
  const brandKey = toBrandKey(brandCode);

  const rows = useMemo(
    () => (queueData ? flattenCallsLogLeads(queueData.data) : []),
    [queueData],
  );

  const [search, setSearch] = useState("");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [expandedLeadTypes, setExpandedLeadTypes] = useState<string[]>([]);
  const [expandedTimezones, setExpandedTimezones] = useState<string[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [formState, setFormState] = useState<{
    key: string;
    value: EditableCallLogState;
  } | null>(null);
  const [companyContactLeadId, setCompanyContactLeadId] = useState<string | null>(
    null,
  );
  const [companyContactFormState, setCompanyContactFormState] = useState<{
    key: string;
    value: EditableCallLogState;
  } | null>(null);

  const filteredRows = useMemo(
    () => rows.filter((row) => matchesCallLogSearch(row, search)),
    [rows, search],
  );
  const groups = useMemo(() => buildCallLogGroups(filteredRows), [filteredRows]);

  const defaultLead = useMemo(
    () => groups[0]?.timezones[0]?.leads[0] ?? filteredRows[0] ?? null,
    [groups, filteredRows],
  );

  useEffect(() => {
    setSelectedLeadId(null);
    setExpandedLeadTypes([]);
    setExpandedTimezones([]);
  }, [agentSlug]);

  useEffect(() => {
    if (!defaultLead) {
      return;
    }

    setSelectedLeadId((current) => current ?? defaultLead.leadId);

    const firstGroup = groups[0];
    const firstTimezone = firstGroup?.timezones[0];
    if (!firstGroup) {
      return;
    }

    setExpandedLeadTypes((current) =>
      current.length > 0 ? current : [firstGroup.leadType],
    );

    if (firstTimezone) {
      setExpandedTimezones((current) =>
        current.length > 0
          ? current
          : [getCallLogPathKey(firstGroup.leadType, firstTimezone.timezone)],
      );
    }
  }, [defaultLead, groups]);

  const selectedLead = useMemo(() => {
    if (selectedLeadId) {
      return (
        filteredRows.find((row) => row.leadId === selectedLeadId) ?? defaultLead
      );
    }
    return defaultLead;
  }, [filteredRows, selectedLeadId, defaultLead]);

  const {
    data: detail,
    isLoading: detailLoading,
    isFetching: detailFetching,
  } = useCallLogDetail(selectedLead?.leadId, agentSlug);

  const logResult = useLogCallResult(agentSlug);
  const followUp = useCallLogFollowUp(agentSlug);
  const markVoid = useCallLogMarkVoid(agentSlug);
  const patchLead = usePatchCallLogLead(agentSlug);

  const {
    data: companyContactDetail,
    isLoading: companyContactDetailLoading,
  } = useCallLogDetail(companyContactLeadId, agentSlug);

  useEffect(() => {
    if (!detail || !selectedLead) {
      return;
    }

    setFormState({
      key: selectedLead.leadId,
      value: formFromDetail(detail),
    });
  }, [detail, selectedLead]);

  useEffect(() => {
    if (!companyContactDetail || !companyContactLeadId) {
      return;
    }

    setCompanyContactFormState({
      key: companyContactLeadId,
      value: formFromDetail(companyContactDetail),
    });
  }, [companyContactDetail, companyContactLeadId]);

  const form =
    selectedLead && formState?.key === selectedLead.leadId
      ? formState.value
      : detail
        ? formFromDetail(detail)
        : null;

  const baselineForm = useMemo(
    () => (detail ? formFromDetail(detail) : null),
    [detail],
  );

  const isDirty = useMemo(() => {
    if (!form || !baselineForm) {
      return false;
    }
    return hasSavableChanges(form, baselineForm);
  }, [form, baselineForm]);

  const allCompanyContacts = useMemo(() => {
    if (!selectedLead) {
      return [];
    }

    return rows
      .filter((row) => row.companyId === selectedLead.companyId)
      .sort((a, b) =>
        getCallLogLeadLabel(a).localeCompare(getCallLogLeadLabel(b)),
      );
  }, [rows, selectedLead]);

  const selectedCompanyContact = useMemo(
    () =>
      companyContactLeadId
        ? rows.find((row) => row.leadId === companyContactLeadId) ?? null
        : null,
    [companyContactLeadId, rows],
  );

  const selectedCompanyContactIndex = selectedCompanyContact
    ? allCompanyContacts.findIndex(
        (row) => row.leadId === selectedCompanyContact.leadId,
      )
    : -1;

  const selectedCompanyContactForm =
    selectedCompanyContact &&
    companyContactFormState?.key === selectedCompanyContact.leadId
      ? companyContactFormState.value
      : companyContactDetail
        ? formFromDetail(companyContactDetail)
        : null;

  const visibleLeadTypes = useMemo(
    () => new Set(groups.map((group) => group.leadType)),
    [groups],
  );
  const visibleTimezoneKeys = useMemo(
    () =>
      new Set(
        groups.flatMap((group) =>
          group.timezones.map((timezoneGroup) =>
            getCallLogPathKey(group.leadType, timezoneGroup.timezone),
          ),
        ),
      ),
    [groups],
  );

  const activeExpandedLeadTypes = expandedLeadTypes.filter((leadType) =>
    visibleLeadTypes.has(leadType),
  );
  const activeExpandedTimezones = expandedTimezones.filter((key) =>
    visibleTimezoneKeys.has(key),
  );

  const contactTypeOptions = useMemo(
    () => CONTACT_TYPE_VALUES.map((value) => ({ label: value, value })),
    [],
  );
  const leadTypeOptions = useMemo(
    () => LEAD_TYPE_VALUES.map((value) => ({ label: value, value })),
    [],
  );

  const actionPending =
    logResult.isPending ||
    followUp.isPending ||
    markVoid.isPending ||
    patchLead.isPending;

  const updateForm = <Key extends keyof EditableCallLogState>(
    key: Key,
    value: EditableCallLogState[Key],
  ) => {
    if (!selectedLead || !form) {
      return;
    }

    setFormState({
      key: selectedLead.leadId,
      value: {
        ...form,
        [key]: value,
      },
    });
  };

  const updateCompanyContactForm = <Key extends keyof EditableCallLogState>(
    key: Key,
    value: EditableCallLogState[Key],
  ) => {
    if (!selectedCompanyContact || !selectedCompanyContactForm) {
      return;
    }

    setCompanyContactFormState({
      key: selectedCompanyContact.leadId,
      value: {
        ...selectedCompanyContactForm,
        [key]: value,
      },
    });
  };

  const persistLeadChanges = async (
    leadId: string,
    formValue: EditableCallLogState,
    detailValue: LeadDetailResponse,
  ) => {
    const body = buildLeadPatchBody(formValue, detailValue, brandKey);
    if (body) {
      await patchLead.mutateAsync({ leadId, body });
    }

    const baselineCallback = detailValue.brandState.followUpDate ?? "";
    if (
      formValue.callBackDate !== baselineCallback &&
      formValue.callBackDate
    ) {
      await followUp.mutateAsync({
        leadId,
        followUpDate: formValue.callBackDate,
      });
    }
  };

  const handleSaveChanges = async () => {
    if (!selectedLead || !form || !detail || !isDirty) {
      return;
    }

    const body = buildLeadPatchBody(form, detail, brandKey);
    const callbackChanged =
      form.callBackDate !== (detail.brandState.followUpDate ?? "");

    if (!body && !callbackChanged) {
      return;
    }

    try {
      await persistLeadChanges(selectedLead.leadId, form, detail);
      showSuccessToast("Changes saved successfully.");
    } catch (error) {
      showErrorToast(error);
    }
  };

  const handleCancelChanges = () => {
    if (!selectedLead || !baselineForm) {
      return;
    }

    setFormState({
      key: selectedLead.leadId,
      value: baselineForm,
    });
  };

  const handleOutcome = async (resultCode: string) => {
    if (!selectedLead || !form || !detail || actionPending) {
      return;
    }

    try {
      await persistLeadChanges(selectedLead.leadId, form, detail);
      await logResult.mutateAsync({
        agentSlug,
        leadId: selectedLead.leadId,
        resultCode,
        notes: form.notes || undefined,
        followUpDate: form.callBackDate || undefined,
        source: "manual",
      });
      showSuccessToast("Call outcome logged successfully.");
    } catch (error) {
      showErrorToast(error);
    }
  };

  const handleMarkVoid = (checked: boolean) => {
    updateForm("doesNotWorkAnymore", checked);
  };

  const handleCallBackDateChange = (date: string) => {
    updateForm("callBackDate", date);
  };

  const saveCompanyContactDrawer = async () => {
    if (
      !selectedCompanyContact ||
      !selectedCompanyContactForm ||
      !companyContactDetail
    ) {
      return;
    }

    try {
      await persistLeadChanges(
        selectedCompanyContact.leadId,
        selectedCompanyContactForm,
        companyContactDetail,
      );
      showSuccessToast("Company contact changes saved successfully.");
    } catch (error) {
      showErrorToast(error);
    }
  };

  const toggleLeadType = (leadType: string) => {
    const isOpen = activeExpandedLeadTypes.includes(leadType);
    setExpandedLeadTypes(isOpen ? [] : [leadType]);

    if (!isOpen) {
      const targetGroup = groups.find((group) => group.leadType === leadType);
      const firstTimezone = targetGroup?.timezones[0];
      setExpandedTimezones(
        firstTimezone
          ? [getCallLogPathKey(leadType, firstTimezone.timezone)]
          : [],
      );

      const firstLead = firstTimezone?.leads[0];
      if (firstLead) {
        setSelectedLeadId(firstLead.leadId);
      }
    }
  };

  const toggleTimezone = (leadType: string, timezone: string) => {
    const key = getCallLogPathKey(leadType, timezone);
    const isOpen = activeExpandedTimezones.includes(key);
    setExpandedTimezones(isOpen ? [] : [key]);

    if (!isOpen) {
      const targetGroup = groups.find((group) => group.leadType === leadType);
      const timezoneGroup = targetGroup?.timezones.find(
        (item) => item.timezone === timezone,
      );
      const firstLead = timezoneGroup?.leads[0];
      if (firstLead) {
        setSelectedLeadId(firstLead.leadId);
      }
    }
  };

  if (queueLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Wave />
      </div>
    );
  }

  if (queueError) {
    return (
      <ErrorState
        title="Failed to load call logs"
        onRetry={() => refetchQueue()}
      />
    );
  }

  if (!rows.length) {
    return <EmptyState message="No leads found for call logs." />;
  }

  return (
    <div className="min-h-full">
      <main className="mx-auto px-4 py-4 sm:px-4 sm:py-6">
        <div className="overflow-hidden rounded bg-white shadow-sm dark:bg-gray-900">
          <div className="grid grid-cols-1 lg:grid-cols-[360px_minmax(0,1fr)]">
            <section className="min-h-0 lg:h-[calc(100vh-8.5rem)] lg:border-r lg:border-slate-200 dark:lg:border-slate-700">
              <div className="flex h-full flex-col p-3 sm:p-4">
                <Button
                  onClick={() => setIsMobileSidebarOpen((prev) => !prev)}
                  className="mb-4 flex w-full items-center justify-between rounded border border-slate-200 bg-slate-50 px-4 py-1 text-left lg:hidden dark:border-slate-700 dark:bg-slate-900/60"
                >
                  <span className="text-sm">Lead Type</span>
                  {isMobileSidebarOpen ? (
                    <ChevronDown className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                  )}
                </Button>

                <div
                  className={clsx(
                    "min-h-0 flex-1 overflow-y-auto pr-1 lg:block",
                    {
                      block: isMobileSidebarOpen,
                      hidden: !isMobileSidebarOpen,
                    },
                  )}
                >
                  <CardShell className="flex flex-col gap-4">
                    <div className="space-y-4">
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                        <TextInput
                          value={search}
                          onChange={(event) => setSearch(event.target.value)}
                          placeholder="Search..."
                          className="pl-9"
                        />
                      </div>

                      <div className="space-y-3">
                        {groups.length ? (
                          <div className="space-y-2">
                            {groups.map((group) => {
                              const isLeadTypeExpanded =
                                activeExpandedLeadTypes.includes(group.leadType);

                              return (
                                <div
                                  key={group.leadType}
                                  className="rounded border border-slate-200 bg-slate-50/70 dark:border-slate-700 dark:bg-slate-900/50"
                                >
                                  <Button
                                    onClick={() => toggleLeadType(group.leadType)}
                                    className="flex w-full items-center justify-between gap-3 rounded p-2 text-left cursor-pointer hover:bg-white dark:hover:bg-slate-800"
                                  >
                                    <div className="flex min-w-0 items-center gap-3">
                                      {isLeadTypeExpanded ? (
                                        <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" />
                                      ) : (
                                        <ChevronRight className="h-4 w-4 shrink-0 text-slate-500" />
                                      )}
                                      <span className="text-xs">Lead Type</span>
                                      <TypeBadge
                                        value={group.leadType}
                                        kind="lead"
                                      />
                                    </div>
                                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                      {group.timezones.reduce(
                                        (count, timezoneGroup) =>
                                          count + timezoneGroup.leads.length,
                                        0,
                                      )}
                                    </span>
                                  </Button>

                                  {isLeadTypeExpanded ? (
                                    <div className="mt-2 space-y-2 px-2 pb-2">
                                      {group.timezones.map(
                                        (timezoneGroup, timezoneIndex) => {
                                          const timezoneKey = getCallLogPathKey(
                                            group.leadType,
                                            timezoneGroup.timezone,
                                          );
                                          const isTimezoneExpanded =
                                            activeExpandedTimezones.includes(
                                              timezoneKey,
                                            );

                                          return (
                                            <div
                                              key={timezoneKey}
                                              className="rounded border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950/60"
                                            >
                                              <Button
                                                onClick={() =>
                                                  toggleTimezone(
                                                    group.leadType,
                                                    timezoneGroup.timezone,
                                                  )
                                                }
                                                className="flex w-full items-center justify-between gap-3 rounded px-2 py-2 text-left cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900"
                                              >
                                                <div className="flex min-w-0 items-center gap-3">
                                                  {isTimezoneExpanded ? (
                                                    <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" />
                                                  ) : (
                                                    <ChevronRight className="h-4 w-4 shrink-0 text-slate-500" />
                                                  )}
                                                  <span className="text-xs">
                                                    Timezone
                                                  </span>
                                                  <TimezoneBadge
                                                    timezone={
                                                      timezoneGroup.timezone
                                                    }
                                                    index={timezoneIndex}
                                                  />
                                                </div>
                                                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                                  {timezoneGroup.leads.length}
                                                </span>
                                              </Button>

                                              {isTimezoneExpanded ? (
                                                <div className="mt-2 flex flex-col gap-1 px-2 pb-2">
                                                  {timezoneGroup.leads.map(
                                                    (lead) => {
                                                      const isSelected =
                                                        selectedLead?.leadId ===
                                                        lead.leadId;

                                                      return (
                                                        <Button
                                                          key={lead.leadId}
                                                          onClick={() => {
                                                            setSelectedLeadId(
                                                              lead.leadId,
                                                            );
                                                            setIsMobileSidebarOpen(
                                                              false,
                                                            );
                                                          }}
                                                          className={clsx(
                                                            "w-full rounded border px-2.5 py-1.5 text-left text-xs leading-snug transition cursor-pointer whitespace-normal break-words",
                                                            isSelected
                                                              ? "border-indigo-300 bg-indigo-50 font-semibold text-indigo-900 dark:border-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-100"
                                                              : "border-slate-200 bg-white font-normal text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800",
                                                          )}
                                                        >
                                                          {getCallLogLeadLabel(
                                                            lead,
                                                          )}
                                                        </Button>
                                                      );
                                                    },
                                                  )}
                                                </div>
                                              ) : null}
                                            </div>
                                          );
                                        },
                                      )}
                                    </div>
                                  ) : null}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="rounded border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                            No leads match the current search.
                          </div>
                        )}
                      </div>
                    </div>
                  </CardShell>
                </div>
              </div>
            </section>

            <section className="flex min-h-0 flex-col border-t border-slate-200 dark:border-slate-700 lg:h-[calc(100vh-8.5rem)] lg:border-t-0">
              <div className="relative min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
                {(detailLoading || detailFetching) && selectedLead ? (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 dark:bg-gray-900/60">
                    <Wave />
                  </div>
                ) : null}

                {selectedLead && form && detail ? (
                  <CallLogDetailContent
                    lead={selectedLead}
                    detail={detail}
                    form={form}
                    onUpdateForm={updateForm}
                    onOutcomeSelect={handleOutcome}
                    onMarkVoid={handleMarkVoid}
                    onCallBackDateChange={handleCallBackDateChange}
                    outcomeDisabled={actionPending}
                    showAllCompanyContacts
                    isDrawer={false}
                    allCompanyContacts={allCompanyContacts}
                    onOpenCompanyContact={(lead) =>
                      setCompanyContactLeadId(lead.leadId)
                    }
                    contactTypeOptions={contactTypeOptions}
                    leadTypeOptions={leadTypeOptions}
                  />
                ) : (
                  <EmptyState message="Select a lead to view call log details." />
                )}
              </div>

              {isDirty ? (
                <div className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-gray-900 sm:px-5">
                  <Button
                    onClick={handleCancelChanges}
                    disabled={patchLead.isPending || followUp.isPending}
                    className="cursor-pointer rounded border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveChanges}
                    disabled={patchLead.isPending || followUp.isPending}
                    className="cursor-pointer rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
                  >
                    {patchLead.isPending || followUp.isPending
                      ? "Saving..."
                      : "Save"}
                  </Button>
                </div>
              ) : null}
            </section>
          </div>
        </div>
      </main>

      <Drawer
        isOpen={Boolean(selectedCompanyContact && selectedCompanyContactForm)}
        onClose={() => setCompanyContactLeadId(null)}
        direction="right"
        size="560px"
        header={
          selectedCompanyContact ? (
            <div className="flex w-full items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const prev =
                    allCompanyContacts[selectedCompanyContactIndex - 1];
                  if (prev) setCompanyContactLeadId(prev.leadId);
                }}
                disabled={selectedCompanyContactIndex <= 0}
                className="group flex h-7 w-7 cursor-pointer items-center justify-center rounded border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <ChevronUp className="h-4 w-4 stroke-2 transition group-hover:-translate-y-0.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  const next =
                    allCompanyContacts[selectedCompanyContactIndex + 1];
                  if (next) setCompanyContactLeadId(next.leadId);
                }}
                disabled={
                  selectedCompanyContactIndex < 0 ||
                  selectedCompanyContactIndex >= allCompanyContacts.length - 1
                }
                className="group flex h-7 w-7 cursor-pointer items-center justify-center rounded border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <ChevronDown className="h-4 w-4 stroke-2 transition group-hover:translate-y-0.5" />
              </button>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {getCallLogLeadLabel(selectedCompanyContact)}
                </p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {selectedCompanyContact.fullName}
                </p>
              </div>
            </div>
          ) : null
        }
        footer={
          <EditableDrawerFooter
            onCancel={() => setCompanyContactLeadId(null)}
            onReset={() => {
              if (!companyContactDetail || !selectedCompanyContact) {
                return;
              }
              setCompanyContactFormState({
                key: selectedCompanyContact.leadId,
                value: formFromDetail(companyContactDetail),
              });
            }}
            onSave={saveCompanyContactDrawer}
          />
        }
      >
        {companyContactDetailLoading ? (
          <div className="flex min-h-[200px] items-center justify-center">
            <Wave />
          </div>
        ) : selectedCompanyContact &&
          selectedCompanyContactForm &&
          companyContactDetail ? (
          <CallLogDetailContent
            lead={selectedCompanyContact}
            detail={companyContactDetail}
            form={selectedCompanyContactForm}
            onUpdateForm={updateCompanyContactForm}
            onOutcomeSelect={async (resultCode) => {
              if (!companyContactDetail) return;
              try {
                await persistLeadChanges(
                  selectedCompanyContact.leadId,
                  selectedCompanyContactForm,
                  companyContactDetail,
                );
                await logResult.mutateAsync({
                  agentSlug,
                  leadId: selectedCompanyContact.leadId,
                  resultCode,
                  notes: selectedCompanyContactForm.notes || undefined,
                  followUpDate:
                    selectedCompanyContactForm.callBackDate || undefined,
                  source: "manual",
                });
                showSuccessToast("Call outcome logged successfully.");
              } catch (error) {
                showErrorToast(error);
              }
            }}
            onMarkVoid={async (checked) => {
              updateCompanyContactForm("doesNotWorkAnymore", checked);
              if (!checked) return;
              try {
                await markVoid.mutateAsync({
                  leadId: selectedCompanyContact.leadId,
                  notWorkAnymore: checked,
                });
                showSuccessToast(
                  "Lead marked as no longer working at the company.",
                );
              } catch (error) {
                updateCompanyContactForm("doesNotWorkAnymore", false);
                showErrorToast(error);
              }
            }}
            onCallBackDateChange={async (date) => {
              updateCompanyContactForm("callBackDate", date);
              if (!date) return;
              try {
                await followUp.mutateAsync({
                  leadId: selectedCompanyContact.leadId,
                  followUpDate: date,
                });
              } catch {
                // Resync on next detail fetch.
              }
            }}
            outcomeDisabled={actionPending}
            historyEditable
            showAllCompanyContacts={false}
            isDrawer
            allCompanyContacts={[]}
            onOpenCompanyContact={() => {}}
            contactTypeOptions={contactTypeOptions}
            leadTypeOptions={leadTypeOptions}
          />
        ) : null}
      </Drawer>
    </div>
  );
}

function CallLogDetailContent({
  lead,
  detail,
  form,
  onUpdateForm,
  onOutcomeSelect,
  onMarkVoid,
  onCallBackDateChange,
  outcomeDisabled = false,
  historyEditable = false,
  showAllCompanyContacts,
  isDrawer,
  allCompanyContacts,
  onOpenCompanyContact,
  contactTypeOptions,
  leadTypeOptions,
}: {
  lead: QueueLead;
  detail: LeadDetailResponse;
  form: EditableCallLogState;
  onUpdateForm: <Key extends keyof EditableCallLogState>(
    key: Key,
    value: EditableCallLogState[Key],
  ) => void;
  onOutcomeSelect: (resultCode: string) => void;
  onMarkVoid: (checked: boolean) => void;
  onCallBackDateChange: (date: string) => void;
  outcomeDisabled?: boolean;
  historyEditable?: boolean;
  showAllCompanyContacts: boolean;
  isDrawer: boolean;
  allCompanyContacts: QueueLead[];
  onOpenCompanyContact: (lead: QueueLead) => void;
  contactTypeOptions: Array<{ label: string; value: string }>;
  leadTypeOptions: Array<{ label: string; value: string }>;
}) {
  const companySymbol =
    lead.companySymbol ?? getCompanySymbol(lead.companyName);

  return (
    <div className="space-y-5">
      <DetailCard>
        <div className="flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <CompanySymbolBadge
              symbol={companySymbol}
              index={0}
              className="rounded"
            />
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-widest text-slate-400">
                Company
              </p>
              <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">
                {lead.companyName}
              </p>
            </div>
          </div>
          <TimezoneBadge timezone={lead.timezone} index={0} />
        </div>
      </DetailCard>

      <DetailCard label="Personal Details">
        <EditableField label="Full Name">
          <TextInput
            value={form.fullName}
            onChange={(event) => onUpdateForm("fullName", event.target.value)}
            className="text-xs font-semibold"
          />
        </EditableField>
        <EditableField label="Role">
          <TextInput
            value={form.role}
            onChange={(event) => onUpdateForm("role", event.target.value)}
            className="text-xs font-semibold"
          />
        </EditableField>
        <EditableField label="Phone">
          <TextInput
            value={form.phone}
            onChange={(event) => onUpdateForm("phone", event.target.value)}
            className="text-xs font-semibold"
          />
        </EditableField>
        <EditableField label="Email">
          <TextInput
            type="email"
            value={form.email}
            onChange={(event) => onUpdateForm("email", event.target.value)}
            className="text-xs font-semibold"
          />
        </EditableField>
      </DetailCard>

      <DetailCard label="Lead Details">
        <EditableField label="Contact Type">
          <Select
            value={form.contactType}
            onChange={(value) => onUpdateForm("contactType", String(value))}
            options={contactTypeOptions}
            className="text-xs font-semibold"
          />
        </EditableField>
        <EditableField label="Lead Type">
          <Select
            value={form.svgLeadType}
            onChange={(value) => onUpdateForm("svgLeadType", String(value))}
            options={leadTypeOptions}
            className="text-xs font-semibold"
          />
        </EditableField>
      </DetailCard>

      <DetailCard label="Notes">
        <EditableField label="Notes" align="stack">
          <Textarea
            value={form.notes}
            onChange={(event) => onUpdateForm("notes", event.target.value)}
            className="text-xs font-semibold leading-5"
            placeholder="Add notes"
          />
        </EditableField>
        <EditableField label="Doesn't Work Anymore In The Company">
          <CheckboxInput
            checked={form.doesNotWorkAnymore}
            onChange={(event) => onMarkVoid(event.target.checked)}
            labelClassName="justify-end"
          />
        </EditableField>
        <EditableField label="Call Back Date">
          <DatePickerField
            value={form.callBackDate}
            onChange={onCallBackDateChange}
            className="text-xs font-semibold"
          />
        </EditableField>
        <EditableField label="Last Called Date">
          <TextInput
            value={detail.brandState.lastCalledDate || lead.lastCalledDate || "-"}
            readOnly
            tabIndex={-1}
            className="cursor-default text-xs font-semibold focus:border-gray-300 dark:focus:border-gray-600"
          />
        </EditableField>
        <EditableField label="Last Fixed Date">
          <TextInput
            value={detail.brandState.lastFixedDate || "-"}
            readOnly
            tabIndex={-1}
            className="cursor-default text-xs font-semibold focus:border-gray-300 dark:focus:border-gray-600"
          />
        </EditableField>
      </DetailCard>

      <DetailCard label="History">
        <EditableField label="History Calls" align="stack">
          <Textarea
            value={form.historyCalls}
            readOnly={!historyEditable}
            onChange={
              historyEditable
                ? (event) => onUpdateForm("historyCalls", event.target.value)
                : undefined
            }
            className="text-xs font-semibold leading-5"
          />
        </EditableField>
        <EditableField label="History Notes" align="stack">
          <Textarea
            value={form.historyNotes}
            readOnly={!historyEditable}
            onChange={
              historyEditable
                ? (event) => onUpdateForm("historyNotes", event.target.value)
                : undefined
            }
            className="text-xs font-semibold leading-5"
          />
        </EditableField>
      </DetailCard>

      <DetailCard label="Additional Contacts">
        <Detail
          label="Contacts"
          value={
            <HistoryText
              value={form.additionalContacts || "No additional contacts."}
            />
          }
        />
      </DetailCard>

      <DetailCard label="Call Outcome">
        <div
          className={
            isDrawer
              ? "grid grid-cols-1 gap-2.5 md:grid-cols-2"
              : "grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
          }
        >
          {callOutcomes.map((outcome) => (
            <OutcomeButton
              key={outcome.label}
              label={outcome.label}
              icon={outcome.icon}
              onClick={() => onOutcomeSelect(outcome.label)}
              className={outcome.className}
              disabled={outcomeDisabled}
            />
          ))}
        </div>
      </DetailCard>

      {showAllCompanyContacts ? (
        <DetailCard label="All Company Contacts">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {allCompanyContacts.map((contact) => (
              <button
                key={contact.leadId}
                type="button"
                onClick={() => onOpenCompanyContact(contact)}
                className="w-full text-left cursor-pointer"
              >
                <DetailCard label={contact.companyName}>
                  <AssociationDetail
                    label="Contact Type"
                    value={
                      <TypeBadge value={contact.contactType} kind="contact" />
                    }
                  />
                  <AssociationDetail
                    label="Lead Type"
                    value={
                      <TypeBadge value={contact.leadType} kind="lead" />
                    }
                  />
                </DetailCard>
              </button>
            ))}
          </div>
        </DetailCard>
      ) : null}
    </div>
  );
}

function DetailCard({
  label,
  children,
}: {
  label?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded border border-slate-200 bg-slate-50 p-4 shadow-sm dark:border-slate-700 dark:bg-gray-800">
      {typeof label === "string" && (
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          {label}
        </p>
      )}
      <div className="space-y-0">{children}</div>
    </div>
  );
}

function EditableField({
  label,
  children,
  align = "row",
}: {
  label: string;
  children: React.ReactNode;
  align?: "row" | "stack";
}) {
  return (
    <div
      className={
        align === "stack"
          ? "space-y-1 py-2"
          : "flex items-center justify-between gap-4 py-1.5"
      }
    >
      <p className="shrink-0 text-[10px] uppercase tracking-widest text-slate-400">
        {label}
      </p>
      <div className={align === "stack" ? "w-full" : "w-64 max-w-[65%]"}>
        {children}
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1">
      <p className="shrink-0 text-[10px] uppercase tracking-widest text-slate-400">
        {label}
      </p>
      <p className="truncate text-right text-xs font-semibold text-slate-600 dark:text-slate-200">
        {value}
      </p>
    </div>
  );
}

function HistoryText({ value }: { value: string }) {
  return (
    <span className="block whitespace-pre-line text-left leading-5">
      {value}
    </span>
  );
}

function AssociationDetail({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-1">
      <p className="shrink-0 text-[10px] uppercase tracking-widest text-slate-400">
        {label}
      </p>
      <div className="min-w-0 text-right text-xs font-semibold text-slate-600 dark:text-slate-200">
        {value}
      </div>
    </div>
  );
}
