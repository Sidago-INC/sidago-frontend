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
  formatCallsHistory,
  formatNotesHistory,
} from "@/features/agent-call-logs/_lib/format";
import { getHistoryEntries } from "./_lib/history";
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
  const history = getHistoryEntries(d.history, d.brandState.brandCode);
  return {
    email: d.lead.email ?? "",
    notes: history.find((entry) => entry.notes)?.notes ?? "",
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
  const [form, setForm] = useState<CallsFormState>(emptyForm);
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

  useEffect(() => {
    currentLeadIdRef.current = currentLead?.leadId ?? null;
    setSelectedPhoneId(currentLead?.nextPhoneId ?? null);
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
        setForm(nextForm);
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
  const numbersUpdating = detail?.numbersUpdating === true;
  const currentLeadId = currentLead?.leadId;
  useEffect(() => {
    if (!numbersUpdating || !currentLeadId) return;
    const staleNextId = detail?.nextPhone?.id ?? null;
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
  }, [numbersUpdating, currentLeadId, agentSlug, detail]);

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

    const callbackError = getCallBackDateError(
      form.callBackDate,
      detail?.brandState.lastCalledDate ?? "",
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
    outcomeBusyRef.current = true;
    setOutcomeLoading(true);
    setOutcomeStatus({ text: `Saving ${resultCode}…`, busy: true });
    try {
      // 1) Save the result, then refresh this lead (next number, cleared
      //    notes). This is what the buttons wait for.
      await agentCallsApi.logResult({
        agentSlug,
        leadId,
        resultCode,
        notes: form.notes || undefined,
        followUpDate: form.callBackDate || undefined,
        source: "manual",
        leadPhoneId: selectedPhoneId ?? undefined,
      });

      const detailRes = await agentCallsApi.detail(leadId, agentSlug);
      // The agent may have moved to another lead while this was saving; that
      // lead's own detail load owns the screen then.
      if (currentLeadIdRef.current === leadId) {
        setDetail(detailRes);
        // Rotation may have moved on (an unanswered number hands over to the
        // next one), so the next attempt starts from the new pick.
        setSelectedPhoneId(detailRes.nextPhone?.id ?? null);
        const nextForm = formFromDetail(detailRes);
        setForm(nextForm);
        setCallBackDateError(
          getCallBackDateError(
            nextForm.callBackDate,
            detailRes.brandState.lastCalledDate ?? "",
          ),
        );
      }
    } catch (err) {
      setOutcomeStatus(null);
      setModal({ title: "Error", message: errMessage(err), direction: "top" });
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
    setForm((prev) => ({ ...prev, notWorkAnymore: value }));
    if (!value || !currentLead) return;
    try {
      await agentCallsApi.markVoid(agentSlug, currentLead.leadId, value);
      const newLeads = leads.filter((_, i) => i !== currentIndex);
      setLeads(newLeads);
      setCurrentIndex(Math.min(currentIndex, Math.max(newLeads.length - 1, 0)));
    } catch (err) {
      setForm((prev) => ({ ...prev, notWorkAnymore: false }));
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
    if (!currentLead || !detail || emailSaving) return false;
    const email = value.trim();
    if (email === (detail.lead.email ?? "")) return true;
    const leadId = currentLead.leadId;
    setEmailSaving(true);
    try {
      await agentCallsApi.updateEmail(leadId, email);
      if (currentLeadIdRef.current === leadId) {
        setDetail((prev) =>
          prev ? { ...prev, lead: { ...prev.lead, email } } : prev,
        );
        setForm((prev) => ({ ...prev, email }));
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
    const lastCalled = detail?.brandState.lastCalledDate ?? "";
    const error = getCallBackDateError(date, lastCalled);
    setCallBackDateError(error);
    if (error) return;

    setForm((prev) => ({ ...prev, callBackDate: date }));
    if (!currentLead || !date) return;
    try {
      await agentCallsApi.followUp(agentSlug, currentLead.leadId, date);
    } catch {
      // Optimistic update — next detail fetch will resync
    }
  };

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
              phones={
                detail?.lead.id === currentLead.leadId ? (detail.phones ?? []) : []
              }
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
              lastCalledDate={detail?.brandState.lastCalledDate ?? ""}
              lastFixedDate={detail?.brandState.lastFixedDate ?? ""}
              onChangeCallBackDate={handleFollowUpDate}
            />
          </div>

          <div className="space-y-4 lg:col-span-2">
            <CallNotesCard
              notes={form.notes}
              onChange={(value) =>
                setForm((prev) => ({ ...prev, notes: value }))
              }
              onSave={() => {}}
            />
            <CallOutcomeCard
              onSelect={handleOutcome}
              disabled={outcomeLoading}
              status={outcomeStatus}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <HistoryCard
                title="Notes History"
                value={
                  detail
                    ? formatNotesHistory(
                        detail.history,
                        detail.brandState.brandCode,
                      )
                    : ""
                }
                icon={NotebookText}
              />
              <HistoryCard
                title="Calls History"
                value={
                  detail
                    ? formatCallsHistory(
                        detail.history,
                        detail.brandState.brandCode,
                      )
                    : ""
                }
                icon={MessageSquare}
              />
              <OtherContactsCard
                contacts={detail?.relatedContacts ?? []}
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
