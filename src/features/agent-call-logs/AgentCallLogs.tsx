import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Ban,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock3,
  Loader2,
  MessageCircleWarning,
  MessageSquareText,
  PhoneCall,
  PhoneOff,
  Search,
  ThumbsDown,
  ThumbsUp,
  X,
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
import {
  getAgentKeyFromCookie,
  getCallBackDateError,
  getMinCallBackDate,
} from "@/features/agent-calls/_lib/utils";
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
  getCallLogLeadLabel,
  getCallLogPathKey,
  getTimezoneBucketLabel,
} from "./_lib/grouping";
import {
  flattenBucketPages,
  useCallLogDetail,
  useCallLogFollowUp,
  useCallLogMarkVoid,
  useCallsLogBucket,
  useCallsLogSummary,
  useLogCallResult,
  usePatchCallLogLead,
} from "./_lib/hooks";
import { useDebouncedValue } from "@/lib/use-debounced-value";

// A co-worker at the same company, as served by the detail endpoint. Only the
// fields the "All Company Contacts" card renders — clicking one loads its own
// detail payload, so nothing more needs carrying here.
type CompanyContact = {
  leadId: string;
  fullName: string;
  companyName: string;
  companySymbol: string | null;
  contactType: string;
  leadType: string;
};

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
    historyCalls: formatCallsHistory(
      detail.history,
      detail.brandState.brandCode,
    ),
    historyNotes: formatNotesHistory(
      detail.history,
      detail.brandState.brandCode,
    ),
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

// Builds the QueueLead-shaped object the detail panel renders its header from.
// The nested company-contact drawer has no row to point at — related contacts
// come from the detail endpoint, not from the sidebar's loaded page — so it is
// derived from the contact's own detail payload instead.
function leadFromDetail(detail: LeadDetailResponse): QueueLead {
  return {
    leadId: detail.lead.id,
    leadIdExternal: detail.lead.leadIdExternal,
    fullName: detail.lead.fullName,
    phone: detail.lead.phone,
    phoneExtension: detail.lead.phoneExtension,
    email: detail.lead.email,
    role: detail.lead.role,
    // Company-first, matching how every server-side read now resolves it.
    timezone: detail.company?.timezone?.trim() || detail.lead.timezone || "",
    contactType: detail.lead.contactType,
    leadType: detail.brandState?.leadType ?? "",
    lastCalledDate: detail.brandState?.lastCalledDate ?? null,
    followUpDate: detail.brandState?.followUpDate ?? null,
    companyId: detail.lead.companyId,
    companyName: detail.company?.companyName ?? "",
    companySymbol: detail.company?.companySymbol ?? null,
    notWorkAnymore: detail.lead.notWorkAnymore,
    matchedBlock: 0,
    timezonePriority: "",
  };
}

export function AgentCallLogs() {
  const [searchParams] = useSearchParams();
  const agentSlug =
    searchParams.get("agent") ??
    searchParams.get("agentId") ??
    resolveAgentSlug(getAgentKeyFromCookie());

  // Search runs in the DB, scoped to this agent's row-set, matching company
  // symbol and full name. It used to filter only the rows already in the
  // browser — which meant it could never find a lead outside the loaded page,
  // and the loaded page was one timezone deep.
  const [searchInput, setSearchInput] = useState("");
  const search = useDebouncedValue(searchInput, 300);

  const {
    data: summary,
    isLoading: summaryLoading,
    isFetching: summaryFetching,
    isError: summaryError,
    refetch: refetchSummary,
  } = useCallsLogSummary(agentSlug, search);

  const groups = useMemo(() => summary?.groups ?? [], [summary]);
  const brandCode = summary?.brandCode ?? "svg";
  const brandKey = toBrandKey(brandCode);

  // Two independent things, which used to be one.
  //
  //  * `expandedLeadTypes` — which sections (Hot, General) are open. Several
  //    can be at once; this is pure presentation.
  //  * `openLeadType` / `openTimezone` — the single bucket whose rows are
  //    fetched and listed. Only one, because a bucket is a network request.
  //
  // Collapsing a timezone used to close its parent section too: both levels
  // read `activeBucket`, so clearing it made "General is open" and "EST is
  // open" false in the same breath. Separating them is the fix.
  const [openLeadType, setOpenLeadType] = useState<string | null>(null);
  const [openTimezone, setOpenTimezone] = useState<string | null>(null);
  const [expandedLeadTypes, setExpandedLeadTypes] = useState<Set<string> | null>(
    null,
  );
  // Distinguishes "nothing chosen yet" (fall through to the first bucket) from
  // "the user closed it" (show no rows). Without this the auto-opened first
  // bucket could not be closed — clearing the selection just re-derived it.
  const [collapsed, setCollapsed] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

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
  const [callBackDateError, setCallBackDateError] = useState<string>();
  const [companyContactCallBackDateError, setCompanyContactCallBackDateError] =
    useState<string>();

  // The bucket to show: whatever the user opened, falling back to the first one
  // the summary lists (Hot when the agent has any, else the leading General
  // timezone). Falls back again whenever a search makes the open bucket vanish.
  const activeBucket = useMemo(() => {
    if (collapsed) return null;
    const chosen = groups.find((group) => group.leadType === openLeadType);
    const chosenTimezone = chosen?.timezones.find(
      (item) => item.timezone === openTimezone,
    );
    if (chosen && chosenTimezone) {
      return { leadType: chosen.leadType, timezone: chosenTimezone.timezone };
    }

    const firstGroup = groups[0];
    const firstTimezone = firstGroup?.timezones[0];
    if (!firstGroup || !firstTimezone) return null;
    return { leadType: firstGroup.leadType, timezone: firstTimezone.timezone };
  }, [collapsed, groups, openLeadType, openTimezone]);

  // Which sections are drawn open. Whatever the agent has toggled, plus the
  // section holding the loaded bucket — otherwise rows would be fetched and
  // then hidden behind a closed header.
  const openSections = useMemo(() => {
    const next = new Set(expandedLeadTypes ?? []);
    if (activeBucket) next.add(activeBucket.leadType);
    return next;
  }, [activeBucket, expandedLeadTypes]);

  const bucketQuery = useCallsLogBucket({
    agentSlug,
    leadType: activeBucket?.leadType ?? "",
    timezone: activeBucket?.timezone ?? "",
    search,
    enabled: Boolean(activeBucket),
  });

  const rows = useMemo(
    () => flattenBucketPages(bucketQuery.data?.pages),
    [bucketQuery.data],
  );

  const {
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: bucketLoading,
    isFetching: bucketFetching,
  } = bucketQuery;

  // True only while a *new* search/bucket is in flight and previous results are
  // still on screen. Drives a quiet spinner instead of a layout swap.
  const isRefreshing =
    (summaryFetching && !summaryLoading) ||
    (bucketFetching && !bucketLoading && !isFetchingNextPage);

  // Rows arrive 500 at a time — a General bucket runs to five figures for a
  // single agent, while Hot is returned whole (27 Hot rows exist system-wide).
  //
  // Loading is explicit. This used to auto-fetch from an IntersectionObserver
  // as the list scrolled, which meant scrolling quietly appended thousands of
  // rows and moved the scroll position under the reader. Clicking "Load more"
  // keeps the agent in control of how much is on screen.
  const leadListRef = useRef<HTMLDivElement | null>(null);

  const tryLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  // Switching agents resets the whole view — the previous agent's bucket
  // selection means nothing here.
  useEffect(() => {
    setOpenLeadType(null);
    setOpenTimezone(null);
    setSelectedLeadId(null);
    setLastLead(null);
    setCollapsed(false);
  }, [agentSlug]);

  // Keep a selection on screen: hold the user's pick while it is still in the
  // loaded rows, otherwise fall to the first row of the open bucket. `lastLead`
  // is the final fallback so collapsing the tree — which unloads the bucket —
  // leaves the detail panel showing what the agent was last looking at rather
  // than blanking it. It deliberately ranks below `rows[0]`, so a lead that
  // genuinely left the bucket (logged an outcome, moved Hot -> General) still
  // hands the panel over to the next lead.
  const [lastLead, setLastLead] = useState<QueueLead | null>(null);

  const selectedLead = useMemo(() => {
    if (selectedLeadId) {
      const match = rows.find((row) => row.leadId === selectedLeadId);
      if (match) return match;
    }
    return rows[0] ?? lastLead;
  }, [lastLead, rows, selectedLeadId]);

  useEffect(() => {
    if (selectedLead && selectedLead.leadId !== lastLead?.leadId) {
      setLastLead(selectedLead);
    }
  }, [lastLead?.leadId, selectedLead]);

  const {
    data: detail,
    isLoading: detailLoading,
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
    setCallBackDateError(
      getCallBackDateError(
        detail.brandState.followUpDate ?? "",
        detail.brandState.lastCalledDate ?? "",
      ),
    );
  }, [detail, selectedLead]);

  useEffect(() => {
    if (!companyContactDetail || !companyContactLeadId) {
      return;
    }

    setCompanyContactFormState({
      key: companyContactLeadId,
      value: formFromDetail(companyContactDetail),
    });
    setCompanyContactCallBackDateError(
      getCallBackDateError(
        companyContactDetail.brandState.followUpDate ?? "",
        companyContactDetail.brandState.lastCalledDate ?? "",
      ),
    );
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

  // Co-workers at the same company, straight from the detail endpoint. This was
  // previously assembled from the page's own rows, so it only listed the
  // colleagues that happened to be in the loaded window — and with rows now
  // arriving one timezone at a time, that window never spans a company whose
  // contacts sit in different buckets.
  const allCompanyContacts = useMemo<CompanyContact[]>(() => {
    if (!detail) return [];
    return detail.relatedContacts.map((contact) => ({
      leadId: contact.id,
      fullName: contact.fullName,
      companyName: contact.companyName ?? detail.company?.companyName ?? "",
      companySymbol:
        contact.companySymbol ?? detail.company?.companySymbol ?? null,
      contactType: contact.contactType ?? "",
      leadType: contact.leadType ?? "",
    }));
  }, [detail]);

  const selectedCompanyContactIndex = companyContactLeadId
    ? allCompanyContacts.findIndex(
        (contact) => contact.leadId === companyContactLeadId,
      )
    : -1;

  const selectedCompanyContact = companyContactDetail
    ? leadFromDetail(companyContactDetail)
    : null;

  const selectedCompanyContactForm =
    companyContactLeadId &&
    companyContactFormState?.key === companyContactLeadId
      ? companyContactFormState.value
      : companyContactDetail
        ? formFromDetail(companyContactDetail)
        : null;

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
    if (!companyContactLeadId || !selectedCompanyContactForm) {
      return;
    }

    setCompanyContactFormState({
      key: companyContactLeadId,
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
      const callbackError = getCallBackDateError(
        formValue.callBackDate,
        detailValue.brandState.lastCalledDate ?? "",
      );
      if (callbackError) {
        throw new Error(callbackError);
      }
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

    const callbackError = getCallBackDateError(
      form.callBackDate,
      detail.brandState.lastCalledDate ?? "",
    );
    if (callbackError) {
      setCallBackDateError(callbackError);
      showErrorToast(callbackError);
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
    setCallBackDateError(
      getCallBackDateError(
        baselineForm.callBackDate,
        detail?.brandState.lastCalledDate ?? "",
      ),
    );
  };

  const handleOutcome = async (resultCode: string) => {
    if (!selectedLead || !form || !detail || actionPending) {
      return;
    }

    const callbackError = getCallBackDateError(
      form.callBackDate,
      detail.brandState.lastCalledDate ?? "",
    );
    if (callbackError) {
      setCallBackDateError(callbackError);
      showErrorToast(callbackError);
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

  const handleMarkVoid = async (checked: boolean) => {
    updateForm("doesNotWorkAnymore", checked);
    if (!checked || !selectedLead) return;

    try {
      await markVoid.mutateAsync({
        leadId: selectedLead.leadId,
        notWorkAnymore: checked,
      });
      showSuccessToast("Lead marked as no longer working at the company.");
    } catch (error) {
      updateForm("doesNotWorkAnymore", false);
      showErrorToast(error);
    }
  };

  const handleCallBackDateChange = (date: string) => {
    const lastCalled = detail?.brandState.lastCalledDate ?? "";
    const error = getCallBackDateError(date, lastCalled);
    setCallBackDateError(error);
    if (error) return;
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

    const callbackError = getCallBackDateError(
      selectedCompanyContactForm.callBackDate,
      companyContactDetail.brandState.lastCalledDate ?? "",
    );
    if (callbackError) {
      setCompanyContactCallBackDateError(callbackError);
      showErrorToast(callbackError);
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

  // Opening a lead type opens its leading timezone with it, so a click always
  // lands on rows rather than on a second thing to click. Selection is cleared
  // so the detail panel follows the new bucket's first row.
  const openBucket = (leadType: string, timezone: string) => {
    setCollapsed(false);
    setOpenLeadType(leadType);
    setOpenTimezone(timezone);
    setSelectedLeadId(null);
    setLastLead(null);
    leadListRef.current?.scrollTo({ top: 0 });
  };

  // Opening or closing a section is presentation only — it never touches the
  // loaded bucket, so closing General and reopening it leaves the same rows in
  // place rather than refetching.
  const toggleLeadType = (leadType: string) => {
    const closing = openSections.has(leadType);

    setExpandedLeadTypes(() => {
      const next = new Set(openSections);
      if (closing) next.delete(leadType);
      else next.add(leadType);
      return next;
    });

    // Closing a section that holds the loaded bucket closes its rows too —
    // otherwise `openSections` would immediately re-add it and the header
    // could never be shut.
    if (closing && activeBucket?.leadType === leadType) {
      setCollapsed(true);
      setSelectedLeadId(null);
      setLastLead(null);
    }
  };

  const toggleTimezone = (leadType: string, timezone: string) => {
    const isOpenBucket =
      activeBucket?.leadType === leadType && activeBucket?.timezone === timezone;

    if (isOpenBucket) {
      // Close the rows only. Pin the section open first: until the agent
      // touches a section, `openSections` is DERIVED from the active bucket, so
      // clearing the bucket would collapse the section right along with it —
      // exactly the bug this is fixing.
      setExpandedLeadTypes(() => new Set(openSections).add(leadType));
      setCollapsed(true);
      setSelectedLeadId(null);
      setLastLead(null);
      return;
    }

    // Opening a timezone implies its section is open.
    setExpandedLeadTypes(() => new Set(openSections).add(leadType));
    openBucket(leadType, timezone);
  };


  // Only the summary gates the whole page: it is what the tree is built from.
  // A bucket still loading shows a spinner inside the list, so the sidebar and
  // the search box stay usable while rows arrive.
  if (summaryLoading && !summary) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Wave />
      </div>
    );
  }

  if (summaryError) {
    return (
      <ErrorState
        title="Failed to load call logs"
        onRetry={() => refetchSummary()}
      />
    );
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
                  <CardShell className="flex min-h-0 flex-1 flex-col gap-4">
                    <div className="flex min-h-0 flex-1 flex-col space-y-4">
                      <div className="relative shrink-0">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                        <TextInput
                          value={searchInput}
                          onChange={(event) =>
                            setSearchInput(event.target.value)
                          }
                          placeholder="Search symbol or name..."
                          className="pl-9 pr-9"
                        />
                        {/* Feedback lives inside the field so the page never
                            swaps layout mid-keystroke. */}
                        <div className="absolute right-2.5 top-1/2 flex -translate-y-1/2 items-center">
                          {isRefreshing ? (
                            <Loader2 className="h-4 w-4 animate-spin text-slate-400 dark:text-slate-500" />
                          ) : searchInput ? (
                            <button
                              type="button"
                              onClick={() => setSearchInput("")}
                              aria-label="Clear search"
                              className="flex h-5 w-5 cursor-pointer items-center justify-center rounded text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          ) : null}
                        </div>
                      </div>

                      <div
                        className={clsx(
                          "flex min-h-0 flex-1 flex-col space-y-3 transition-opacity",
                          isRefreshing && "opacity-60",
                        )}
                      >
                        {groups.length ? (
                          <div className="flex min-h-0 flex-1 flex-col space-y-2">
                            {groups.map((group) => {
                              // Section open state, independent of which
                              // bucket happens to be loaded.
                              const isLeadTypeExpanded = openSections.has(
                                group.leadType,
                              );

                              return (
                                <div
                                  key={group.leadType}
                                  className={clsx(
                                    "flex min-h-0 flex-col rounded border border-slate-200 bg-slate-50/70 dark:border-slate-700 dark:bg-slate-900/50",
                                    isLeadTypeExpanded && "flex-1",
                                  )}
                                >
                                  <Button
                                    onClick={() => toggleLeadType(group.leadType)}
                                    className="flex w-full shrink-0 items-center justify-between gap-3 rounded p-2 text-left cursor-pointer hover:bg-white dark:hover:bg-slate-800"
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
                                    {/* Server-side total for the whole bucket,
                                        not the number of rows loaded. */}
                                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                      {group.total.toLocaleString()}
                                    </span>
                                  </Button>

                                  {isLeadTypeExpanded ? (
                                    <div className="mt-2 flex min-h-0 flex-1 flex-col gap-2 px-2 pb-2">
                                      {group.timezones.map((timezoneGroup) => {
                                        const timezoneKey = getCallLogPathKey(
                                          group.leadType,
                                          timezoneGroup.timezone,
                                        );
                                        // Both halves must match. Comparing
                                        // only the timezone meant Hot ▸ EST
                                        // also lit up General ▸ EST.
                                        const isTimezoneExpanded =
                                          activeBucket?.leadType ===
                                            group.leadType &&
                                          activeBucket?.timezone ===
                                            timezoneGroup.timezone;

                                        return (
                                          <div
                                            key={timezoneKey}
                                            className={clsx(
                                              "flex min-h-0 flex-col rounded border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950/60",
                                              isTimezoneExpanded && "flex-1",
                                            )}
                                          >
                                            <Button
                                              onClick={() =>
                                                toggleTimezone(
                                                  group.leadType,
                                                  timezoneGroup.timezone,
                                                )
                                              }
                                              className="flex w-full shrink-0 items-center justify-between gap-3 rounded px-2 py-2 text-left cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900"
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
                                                  timezone={getTimezoneBucketLabel(
                                                    timezoneGroup.timezone,
                                                  )}
                                                />
                                              </div>
                                              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                                {timezoneGroup.count.toLocaleString()}
                                              </span>
                                            </Button>

                                            {isTimezoneExpanded ? (
                                              <div
                                                ref={leadListRef}
                                                className="mt-2 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-2 pb-2"
                                              >
                                                {bucketLoading && !rows.length ? (
                                                  <div className="flex justify-center py-6">
                                                    <Wave />
                                                  </div>
                                                ) : null}

                                                {rows.map((lead) => {
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
                                                        "w-full shrink-0 rounded border px-2.5 py-1.5 text-left text-xs leading-snug transition cursor-pointer whitespace-normal wrap-break-word",
                                                        isSelected
                                                          ? "border-indigo-300 bg-indigo-50 font-semibold text-indigo-900 dark:border-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-100"
                                                          : "border-slate-200 bg-white font-normal text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800",
                                                      )}
                                                    >
                                                      {getCallLogLeadLabel(lead)}
                                                    </Button>
                                                  );
                                                })}

                                                {/* The only way more rows
                                                    arrive — nothing loads on
                                                    scroll any more. */}
                                                {!bucketLoading &&
                                                hasNextPage ? (
                                                  <Button
                                                    onClick={tryLoadMore}
                                                    disabled={isFetchingNextPage}
                                                    className="mt-1 shrink-0 cursor-pointer rounded border border-indigo-200 bg-indigo-50/60 px-2 py-1.5 text-center text-xs font-medium text-indigo-700 transition hover:bg-indigo-100 disabled:cursor-wait disabled:opacity-60 dark:border-indigo-800 dark:bg-indigo-950/30 dark:text-indigo-300 dark:hover:bg-indigo-950/60"
                                                  >
                                                    {isFetchingNextPage
                                                      ? "Loading…"
                                                      : `Load 500 more (${(
                                                          timezoneGroup.count -
                                                          rows.length
                                                        ).toLocaleString()} left)`}
                                                  </Button>
                                                ) : null}
                                              </div>
                                            ) : null}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ) : null}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="rounded border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                            {search
                              ? "No leads match the current search."
                              : "No leads found for call logs."}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardShell>
                </div>
              </div>
            </section>

            <section className="flex min-h-0 min-w-0 flex-col border-t border-slate-200 dark:border-slate-700 lg:h-[calc(100vh-8.5rem)] lg:border-t-0">
              <div className="relative min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-5">
                {/* Only while a *different* lead's detail is loading. Including
                    isFetching here flashed the overlay on every background
                    revalidation, which read as the panel reloading. */}
                {detailLoading && selectedLead ? (
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
                    callBackDateError={callBackDateError}
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

              const callbackError = getCallBackDateError(
                selectedCompanyContactForm.callBackDate,
                companyContactDetail.brandState.lastCalledDate ?? "",
              );
              if (callbackError) {
                setCompanyContactCallBackDateError(callbackError);
                showErrorToast(callbackError);
                return;
              }

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
              const lastCalled =
                companyContactDetail?.brandState.lastCalledDate ?? "";
              const error = getCallBackDateError(date, lastCalled);
              setCompanyContactCallBackDateError(error);
              if (error) return;

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
            callBackDateError={companyContactCallBackDateError}
            outcomeDisabled={actionPending}
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
  callBackDateError,
  outcomeDisabled = false,
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
  callBackDateError?: string;
  outcomeDisabled?: boolean;
  showAllCompanyContacts: boolean;
  isDrawer: boolean;
  allCompanyContacts: CompanyContact[];
  onOpenCompanyContact: (contact: CompanyContact) => void;
  contactTypeOptions: Array<{ label: string; value: string }>;
  leadTypeOptions: Array<{ label: string; value: string }>;
}) {
  const companySymbol =
    lead.companySymbol ?? getCompanySymbol(lead.companyName);

  return (
    <div className="min-w-0 space-y-5">
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
          <TimezoneBadge timezone={lead.timezone} />
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
            placeholder="Pick a date"
            minDate={getMinCallBackDate(
              detail.brandState.lastCalledDate || lead.lastCalledDate || "",
            )}
            error={callBackDateError}
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
          {/* Read-only, deliberately. This panel renders history assembled
              from call_logs rows; free text typed here has no row to belong
              to, so it saved "successfully" and then never appeared. Calls are
              recorded on the Calls page, which writes a real call_logs row. */}
          <Textarea
            value={form.historyCalls}
            readOnly
            className="text-xs font-semibold leading-5"
          />
        </EditableField>
        <EditableField label="History Notes" align="stack">
          <Textarea
            value={form.historyNotes}
            readOnly
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
        <DetailCard label="All Company Contacts" className="min-w-0 overflow-hidden">
          <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {allCompanyContacts.map((contact) => (
              <button
                key={contact.leadId}
                type="button"
                onClick={() => onOpenCompanyContact(contact)}
                className="min-w-0 w-full cursor-pointer overflow-hidden text-left"
              >
                <DetailCard
                  label={contact.companyName}
                  className="@container min-w-0"
                >
                  <div className="space-y-2">
                    <AssociationDetail
                      label="Contact Type"
                      layout="responsive"
                      value={
                        <TypeBadge value={contact.contactType} kind="contact" />
                      }
                    />
                    <AssociationDetail
                      label="Lead Type"
                      layout="responsive"
                      value={
                        <TypeBadge value={contact.leadType} kind="lead" />
                      }
                    />
                  </div>
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
  className,
}: {
  label?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "rounded border border-slate-200 bg-slate-50 p-4 shadow-sm dark:border-slate-700 dark:bg-gray-800",
        className,
      )}
    >
      {typeof label === "string" && (
        <p
          className="mb-3 truncate text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300"
          title={label}
        >
          {label}
        </p>
      )}
      <div className="min-w-0 space-y-0">{children}</div>
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
  layout = "row",
}: {
  label: string;
  value: React.ReactNode;
  layout?: "row" | "stack" | "responsive";
}) {
  if (layout === "stack") {
    return (
      <div className="min-w-0 space-y-1 py-1">
        <p className="text-[10px] uppercase tracking-widest text-slate-400">
          {label}
        </p>
        <div className="min-w-0">{value}</div>
      </div>
    );
  }

  if (layout === "responsive") {
    return (
      <div className="flex min-w-0 flex-col gap-1 py-1 @min-[16rem]:flex-row @min-[16rem]:items-center @min-[16rem]:justify-between @min-[16rem]:gap-3">
        <p className="shrink-0 text-[10px] uppercase tracking-widest text-slate-400">
          {label}
        </p>
        <div className="min-w-0 shrink-0 @min-[16rem]:text-right">{value}</div>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 items-start justify-between gap-2 py-1 sm:gap-4">
      <p className="shrink-0 text-[10px] uppercase tracking-widest text-slate-400">
        {label}
      </p>
      <div className="min-w-0 max-w-[58%] overflow-hidden text-right text-xs font-semibold text-slate-600 sm:max-w-[65%] dark:text-slate-200">
        {value}
      </div>
    </div>
  );
}
