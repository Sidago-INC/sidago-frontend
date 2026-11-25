import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Info } from "lucide-react";
import { CardShell, EmptyState, Modal } from "@/components/ui";
import { CallNotesCard } from "./_components/CallNotesCard";
import { CallOutcomeCard } from "./_components/CallOutcomeCard";
import { CallsHeader } from "./_components/CallsHeader";
import { DatesCard } from "./_components/DatesCard";
import { HistoryCard } from "./_components/HistoryCard";
import { IdentityCard } from "./_components/IdentityCard";
import { OtherContactsCard } from "./_components/OtherContactsCard";
import { HeroCard } from "./_components/HeroCard";
import { PhoneCard } from "./_components/PhoneCard";
import { WorkToggleRow } from "./_components/WorkToggleRow";
import type { CallsFormState, CallsModalState } from "@/types";
import { getAgentKeyFromCookie, getCallBackDateError } from "./_lib/utils";
import { resolveAgentSlug, agentCallsApi } from "./_lib/agentCallsApi";
import type { QueueLead, LeadDetailResponse } from "./_lib/apiTypes";
import { QueuePriorityNotice } from "./_components/QueuePriorityNotice";
import {
  QueueTimezoneFilter,
  type QueueTimezone,
} from "./_components/QueueTimezoneFilter";
import {
  formatCallsEntries,
  formatNotesEntries,
} from "@/features/agent-call-logs/_lib/format";
import { getHistoryEntries, sortNewestFirst } from "./_lib/history";
import {
  followUpToSubmit,
  notesAfterSave,
  notesToSubmit,
} from "./_lib/outcomePayload";
import { MessageSquare, NotebookText } from "lucide-react";

const QUEUE_REFETCH_MS = 90_000;

// Legacy key from the MightyCall dialer era. The dialer is gone; clear any
// value a mid-session browser is still holding so it cannot linger.
const LEGACY_PENDING_OUTCOME_KEY = "agent-calls:pending-outcome";

function emptyForm(): CallsFormState {
  return {
    email: "",
    notes: "",
    callBackDate: "",
    leadType: "",
    contactType: "",
    notWorkAnymore: false,
  };
}

function formFromDetail(d: LeadDetailResponse): CallsFormState {
  // Notes always start empty. History is shown in the Notes History card; only
  // text the agent types into Call Notes is submitted with an outcome.
  return {
    email: d.lead.email ?? "",
    notes: "",
    callBackDate: d.brandState.followUpDate ?? "",
    leadType: d.brandState.leadType,
    contactType: d.lead.contactType,
    notWorkAnymore: d.lead.notWorkAnymore,
  };
}

function errMessage(err: unknown): string {
  if (err && typeof err === "object" && "message" in err) {
    const m = (err as { message: string | string[] }).message;
    return Array.isArray(m) ? m.join(", ") : m;
  }
  return "An unexpected error occurred.";
}

export function AgentCalls() {
  const [searchParams] = useSearchParams();
  const agentSlug = searchParams.get("agent") ?? resolveAgentSlug(getAgentKeyFromCookie());
  const [leads, setLeads] = useState<QueueLead[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [detail, setDetail] = useState<LeadDetailResponse | null>(null);
  // The form is stored together with the lead it belongs to, and is only read
  // while that lead is on screen. A previous lead's values can never show or be
  // submitted for the lead that is now selected.
  const [formSlot, setFormSlot] = useState<{
    leadId: string;
    values: CallsFormState;
  } | null>(null);
  const [modal, setModal] = useState<CallsModalState | null>(null);
  const [queueLoading, setQueueLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [outcomeLoading, setOutcomeLoading] = useState(false);
  const [emailSaving, setEmailSaving] = useState(false);
  const [callBackDateError, setCallBackDateError] = useState<string>();
  // null = every timezone, in the normal priority order.
  const [timezone, setTimezone] = useState<QueueTimezone | null>(null);
  // The number the agent is about to dial. Starts as the one rotation picked
  // (detail.nextPhone) and can be switched on the phone card; the call result
  // is recorded against it.
  const [selectedPhoneId, setSelectedPhoneId] = useState<string | null>(null);
  const currentLeadIdRef = useRef<string | null>(null);
  // Set synchronously on click: two fast clicks land before React re-renders,
  // so the outcomeLoading state alone would let both through.
  const outcomeBusyRef = useRef(false);
  // The queue is reloaded from several places (mount, the 90s refetch, after a
  // logged result). Only the newest request may update the screen, so a slow
  // older response can never put back a lead that has already been worked.
  const queueSeqRef = useRef(0);
  const outcomeSeqRef = useRef(0);
  // When the queue was last asked for, by anything. The 90s refetch skips its
  // turn when a logged result reloaded the queue moments ago: the list is
  // already fresh, and the queue is the slowest call on this page.
  const lastQueueFetchAtRef = useRef(0);
  // After a result is saved the queue reloads in the background; the outcome
  // card says so instead of leaving the agent wondering whether it worked.
  const [outcomeStatus, setOutcomeStatus] = useState<
    { text: string; busy: boolean } | null
  >(null);

  /** Fetch the queue and show it, keeping the lead on screen if it is still in it. */
  const reloadQueue = async (isCancelled: () => boolean = () => false) => {
    const seq = ++queueSeqRef.current;
    lastQueueFetchAtRef.current = Date.now();
    const res = await agentCallsApi.queue(agentSlug, timezone ?? undefined);
    if (isCancelled() || seq !== queueSeqRef.current) return;
    setLeads(res.data);
    const currentLeadId = currentLeadIdRef.current;
    setCurrentIndex((prev) => {
      if (currentLeadId) {
        const preservedIndex = res.data.findIndex(
          (lead) => lead.leadId === currentLeadId,
        );
        if (preservedIndex >= 0) return preservedIndex;
      }
      // The lead was worked off the queue: the one after it has moved up into
      // this slot, so staying on the same index shows the next lead.
      return Math.min(prev, Math.max(res.data.length - 1, 0));
    });
  };

  // Queue: load on mount + refetch every 90s, and again when the filter changes
  useEffect(() => {
    let cancelled = false;
    const load = async (periodic: boolean) => {
      if (
        periodic &&
        Date.now() - lastQueueFetchAtRef.current < QUEUE_REFETCH_MS / 2
      ) {
        return;
      }
      try {
        await reloadQueue(() => cancelled);
      } catch {
        // Keep existing leads on refetch failure
      } finally {
        if (!cancelled) setQueueLoading(false);
      }
    };
    void load(false);
    const id = setInterval(() => void load(true), QUEUE_REFETCH_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
    // reloadQueue only reads agentSlug/timezone, which are the deps here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentSlug, timezone]);

  const currentLead: QueueLead | null = leads[currentIndex] ?? null;
  const currentLeadId = currentLead?.leadId;
  // Derived, so the form is empty on the first render after a lead change too.
  const form: CallsFormState =
    formSlot && formSlot.leadId === currentLeadId
      ? formSlot.values
      : emptyForm();
  // Detail for the lead on screen only; the previous lead's detail is ignored
  // until the new one has loaded.
  const activeDetail =
    detail && currentLeadId && detail.lead.id === currentLeadId ? detail : null;
  // Writes for a lead that is no longer on screen are dropped.
  const updateForm = (
    leadId: string,
    patch: (prev: CallsFormState) => CallsFormState,
  ) => {
    if (currentLeadIdRef.current !== leadId) return;
    setFormSlot((slot) => ({
      leadId,
      values: patch(slot && slot.leadId === leadId ? slot.values : emptyForm()),
    }));
  };

  useEffect(() => {
    currentLeadIdRef.current = currentLead?.leadId ?? null;
    setSelectedPhoneId(currentLead?.nextPhoneId ?? null);
    setCallBackDateError(undefined);
    // Only when the lead changes - a queue refetch must not undo the agent's
    // choice of number for the lead on screen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLead?.leadId]);

  // Detail: load whenever the selected lead changes
  useEffect(() => {
    const leadId = currentLead?.leadId;
    if (!leadId) return;
    let cancelled = false;
    setDetailLoading(true);
    agentCallsApi
      .detail(leadId, agentSlug)
      .then((res) => {
        if (cancelled) return;
        setDetail(res);
        setSelectedPhoneId(res.nextPhone?.id ?? null);
        const nextForm = formFromDetail(res);
        // Keep a note the agent typed while this lead's details were loading.
        setFormSlot((slot) => ({
          leadId,
          values: {
            ...nextForm,
            notes: slot && slot.leadId === leadId ? slot.values.notes : "",
          },
        }));
        setCallBackDateError(
          getCallBackDateError(
            nextForm.callBackDate,
            res.brandState.lastCalledDate ?? "",
          ),
        );
      })
      .catch((err) => {
        if (cancelled) return;
        setModal({ title: "Error", message: errMessage(err) });
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [currentLead?.leadId, agentSlug]);

  // A result logged on this lead is applied to its numbers a few seconds later,
  // in the background, so the refetch that follows a log can still show the
  // number that was just used up as "next". While the server says the numbers are
  // updating, ask again, then move the selection to the real next number - unless
  // the agent has already picked a different one themselves.
  const numbersUpdating = activeDetail?.numbersUpdating === true;
  useEffect(() => {
    if (!numbersUpdating || !currentLeadId) return;
    const staleNextId = activeDetail?.nextPhone?.id ?? null;
    const timer = setTimeout(async () => {
      try {
        const res = await agentCallsApi.detail(currentLeadId, agentSlug);
        if (currentLeadIdRef.current !== currentLeadId) return;
        setDetail(res);
        if (!res.numbersUpdating) {
          setSelectedPhoneId((prev) =>
            prev === staleNextId ? (res.nextPhone?.id ?? null) : prev,
          );
        }
      } catch {
        // Keep what is on screen; the next log or refresh resyncs it.
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [numbersUpdating, currentLeadId, agentSlug, activeDetail]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.sessionStorage.removeItem(LEGACY_PENDING_OUTCOME_KEY);
  }, []);

  const handleSelectLead = (index: number) => setCurrentIndex(index);

  const handleSkip = async () => {
    if (!currentLead) return;
    try {
      await agentCallsApi.skip(agentSlug, currentLead.leadId);
      const newLeads = leads.filter((_, i) => i !== currentIndex);
      setLeads(newLeads);
      setCurrentIndex(Math.min(currentIndex, Math.max(newLeads.length - 1, 0)));
    } catch (err) {
      setModal({ title: "Skip Failed", message: errMessage(err), direction: "right" });
    }
  };

  const handleOutcome = async (resultCode: string) => {
    if (!currentLead || outcomeBusyRef.current) return;
    // Without this lead's details the buttons are disabled; this guards a
    // click that gets through anyway. Nothing is logged in that case.
    if (!activeDetail) {
      setModal({
        title: "Lead Not Loaded",
        message:
          "This lead's details have not loaded, so the result was not saved. Select the lead again to retry.",
        direction: "top",
      });
      return;
    }

    const callbackError = getCallBackDateError(
      form.callBackDate,
      activeDetail.brandState.lastCalledDate ?? "",
    );
    if (callbackError) {
      setCallBackDateError(callbackError);
      setModal({
        title: "Invalid Call Back Date",
        message: callbackError,
        direction: "top",
      });
      return;
    }

    const leadId = currentLead.leadId;
    // Only text typed for this call is submitted; prefilled history never is.
    const submittedNotes = notesToSubmit(form.notes);
    // The Call Back Date is sent only when the agent changed it on this screen.
    const followUpDate = followUpToSubmit(
      form.callBackDate,
      activeDetail.brandState.followUpDate,
    );
    outcomeBusyRef.current = true;
    setOutcomeLoading(true);
    setOutcomeStatus({ text: `Saving ${resultCode}…`, busy: true });
    // Tracks whether the result reached the server, so a later failure is
    // reported as "saved, but not refreshed" rather than "not saved".
    let saved = false;
    try {
      // 1) Save the result, then refresh this lead (next number, cleared
      //    notes). This is what the buttons wait for.
      await agentCallsApi.logResult({
        agentSlug,
        leadId,
        resultCode,
        notes: submittedNotes,
        followUpDate,
        source: "manual",
        leadPhoneId: selectedPhoneId ?? undefined,
      });
      saved = true;
      // Saved: clear the note that was just submitted. This happens before the
      // refresh, so a failed refresh cannot leave it in the box to be sent again.
      updateForm(leadId, (prev) => ({
        ...prev,
        notes: notesAfterSave(prev.notes, submittedNotes ?? ""),
      }));

      const detailRes = await agentCallsApi.detail(leadId, agentSlug);
      // The agent may have moved to another lead while this was saving; that
      // lead's own detail load owns the screen then.
      if (currentLeadIdRef.current === leadId) {
        setDetail(detailRes);
        // Rotation may have moved on (an unanswered number hands over to the
        // next one), so the next attempt starts from the new pick.
        setSelectedPhoneId(detailRes.nextPhone?.id ?? null);
        const nextForm = formFromDetail(detailRes);
        updateForm(leadId, (prev) => ({ ...nextForm, notes: prev.notes }));
        setCallBackDateError(
          getCallBackDateError(
            nextForm.callBackDate,
            detailRes.brandState.lastCalledDate ?? "",
          ),
        );
      }
    } catch (err) {
      setOutcomeStatus(null);
      if (saved) {
        setOutcomeStatus({
          text: `${resultCode} saved · lead not refreshed`,
          busy: false,
        });
        setModal({
          title: "Result Saved",
          message:
            "Your result was saved, but this lead could not be refreshed. Reload the page before logging the next call.",
          direction: "top",
        });
      } else {
        setModal({
          title: "Result Not Saved",
          message: errMessage(err),
          direction: "top",
        });
      }
      return;
    } finally {
      outcomeBusyRef.current = false;
      setOutcomeLoading(false);
    }

    // 2) The result is saved. Reload the queue in the background (it is the
    //    slow call); if this lead has left the queue, the next one moves onto
    //    the screen when it arrives.
    const seq = ++outcomeSeqRef.current;
    // A newer click owns the status line; an older save must not overwrite it.
    const report = (text: string, busy: boolean) => {
      if (seq === outcomeSeqRef.current && !outcomeBusyRef.current) {
        setOutcomeStatus({ text, busy });
      }
    };
    report(`${resultCode} saved · updating queue…`, true);
    try {
      await reloadQueue();
      report(
        currentLeadIdRef.current === leadId
          ? `${resultCode} saved`
          : `${resultCode} saved for the previous lead`,
        false,
      );
    } catch {
      // The result itself is saved; the 90s refetch will catch the queue up.
      report(`${resultCode} saved · queue refresh failed`, false);
    }
  };

  // A finished "saved" note fades after a few seconds.
  useEffect(() => {
    if (!outcomeStatus || outcomeStatus.busy) return;
    const timer = setTimeout(() => setOutcomeStatus(null), 5000);
    return () => clearTimeout(timer);
  }, [outcomeStatus]);

  const handleMarkVoid = async (value: boolean) => {
    if (!currentLead) return;
    const leadId = currentLead.leadId;
    updateForm(leadId, (prev) => ({ ...prev, notWorkAnymore: value }));
    if (!value) return;
    try {
      await agentCallsApi.markVoid(agentSlug, leadId, value);
      const newLeads = leads.filter((_, i) => i !== currentIndex);
      setLeads(newLeads);
      setCurrentIndex(Math.min(currentIndex, Math.max(newLeads.length - 1, 0)));
    } catch (err) {
      updateForm(leadId, (prev) => ({ ...prev, notWorkAnymore: false }));
      setModal({ title: "Error", message: errMessage(err), direction: "bottom" });
    }
  };

  // After a number is added on the phone card: reload the detail so the new
  // number is listed, keeping the agent's current selection.
  const refreshPhones = async () => {
    if (!currentLead) return;
    try {
      const res = await agentCallsApi.detail(currentLead.leadId, agentSlug);
      if (currentLeadIdRef.current !== currentLead.leadId) return;
      setDetail(res);
      setSelectedPhoneId((prev) => prev ?? res.nextPhone?.id ?? null);
    } catch (err) {
      setModal({ title: "Error", message: errMessage(err) });
    }
  };

  // Resolves true when the card can leave edit mode.
  const handleEmailSave = async (value: string): Promise<boolean> => {
    if (!currentLead || !activeDetail || emailSaving) return false;
    const email = value.trim();
    if (email === (activeDetail.lead.email ?? "")) return true;
    const leadId = currentLead.leadId;
    setEmailSaving(true);
    try {
      await agentCallsApi.updateEmail(leadId, email);
      if (currentLeadIdRef.current === leadId) {
        setDetail((prev) =>
          prev ? { ...prev, lead: { ...prev.lead, email } } : prev,
        );
        updateForm(leadId, (prev) => ({ ...prev, email }));
      }
      return true;
    } catch (err) {
      setModal({ title: "Email Not Saved", message: errMessage(err) });
      return false;
    } finally {
      setEmailSaving(false);
    }
  };

  const handleFollowUpDate = async (date: string) => {
    const lastCalled = activeDetail?.brandState.lastCalledDate ?? "";
    const error = getCallBackDateError(date, lastCalled);
    setCallBackDateError(error);
    if (error) return;

    if (currentLead) {
      updateForm(currentLead.leadId, (prev) => ({
        ...prev,
        callBackDate: date,
      }));
    }
    if (!currentLead || !date) return;
    const leadId = currentLead.leadId;
    try {
      await agentCallsApi.followUp(agentSlug, leadId, date);
      // Record the saved date on this lead's detail, so the next outcome only
      // resubmits the date if it changes again. Ignored if the lead moved on.
      if (currentLeadIdRef.current === leadId) {
        setDetail((prev) =>
          prev && prev.lead.id === leadId
            ? {
                ...prev,
                brandState: { ...prev.brandState, followUpDate: date },
              }
            : prev,
        );
      }
    } catch (err) {
      setModal({
        title: "Call Back Date Not Saved",
        message: errMessage(err),
        direction: "top",
      });
    }
  };

  // Newest first, for this page only. The shared history helper keeps its
  // original order because Call Logs and the Lead view depend on it.
  const historyEntries = activeDetail
    ? sortNewestFirst(
        getHistoryEntries(
          activeDetail.history,
          activeDetail.brandState.brandCode,
        ),
      )
    : [];

  if (queueLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-slate-500 dark:text-gray-400">
          Loading queue…
        </p>
      </div>
    );
  }

  const timezoneFilter = (
    <QueueTimezoneFilter value={timezone} onChange={setTimezone} />
  );

  if (!currentLead) {
    if (!timezone) {
      return <EmptyState message="No leads in the queue right now." />;
    }
    // Filtered to an empty timezone: keep the filter reachable so the agent
    // can switch back instead of being stranded on a blank page.
    return (
      <div className="min-h-full space-y-3 bg-slate-50 px-4 py-4 sm:py-6 dark:bg-gray-950">
        <QueuePriorityNotice leads={leads} timezone={timezone}>
          {timezoneFilter}
        </QueuePriorityNotice>
        <EmptyState message={`No ${timezone} leads in the queue right now.`} />
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-50 dark:bg-gray-950">
      <CallsHeader
        leads={leads}
        currentIndex={currentIndex}
        onSelectLead={handleSelectLead}
        onSkip={handleSkip}
      />

      <main className="space-y-3 px-4 py-4 sm:space-y-4 sm:px-4 sm:py-6">
        <QueuePriorityNotice leads={leads} timezone={timezone}>
          {timezoneFilter}
        </QueuePriorityNotice>

        <HeroCard currentLead={currentLead} />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-1">
            <PhoneCard
              leadId={currentLead.leadId}
              phones={activeDetail?.phones ?? []}
              selectedId={selectedPhoneId}
              onSelect={setSelectedPhoneId}
              fallbackPhone={currentLead.nextPhoneNumber ?? currentLead.phone}
              fallbackExtension={
                currentLead.nextPhoneNumber
                  ? currentLead.nextPhoneExtension
                  : currentLead.phoneExtension
              }
              onAdded={refreshPhones}
              onPreferredChanged={refreshPhones}
            />
            <CardShell>
              <IdentityCard
                form={form}
                leadName={currentLead.fullName}
                leadId={currentLead.leadId}
                onSaveEmail={handleEmailSave}
                emailSaving={emailSaving}
              />
              <WorkToggleRow
                value={form.notWorkAnymore}
                onChange={handleMarkVoid}
              />
            </CardShell>
            <DatesCard
              callBackDate={form.callBackDate}
              callBackDateError={callBackDateError}
              lastCalledDate={activeDetail?.brandState.lastCalledDate ?? ""}
              lastFixedDate={activeDetail?.brandState.lastFixedDate ?? ""}
              onChangeCallBackDate={handleFollowUpDate}
            />
          </div>

          <div className="space-y-4 lg:col-span-2">
            <CallNotesCard
              notes={form.notes}
              onChange={(value) =>
                updateForm(currentLead.leadId, (prev) => ({
                  ...prev,
                  notes: value,
                }))
              }
              onSave={() => {}}
            />
            <CallOutcomeCard
              onSelect={handleOutcome}
              disabled={outcomeLoading || detailLoading || !activeDetail}
              status={outcomeStatus}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <HistoryCard
                title="Notes History"
                value={formatNotesEntries(historyEntries)}
                icon={NotebookText}
              />
              <HistoryCard
                title="Calls History"
                value={formatCallsEntries(historyEntries)}
                icon={MessageSquare}
              />
              <OtherContactsCard
                contacts={activeDetail?.relatedContacts ?? []}
                className="sm:col-span-2"
              />
            </div>
          </div>
        </div>

        <div className="h-4" />
      </main>

      <Modal
        isOpen={Boolean(modal)}
        title={modal?.title}
        description={modal?.message}
        direction={modal?.direction}
        icon={<Info className="h-5 w-5" />}
        onClose={() => setModal(null)}
        primaryAction={{
          label: "Got it",
          onClick: () => setModal(null),
        }}
      />
    </div>
  );
}
