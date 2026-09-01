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
    email: d.lead.email,
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
  const [callBackDateError, setCallBackDateError] = useState<string>();
  const currentLeadIdRef = useRef<string | null>(null);

  // Queue: load on mount + refetch every 90s
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await agentCallsApi.queue(agentSlug);
        if (cancelled) return;
        setLeads(res.data);
        const currentLeadId = currentLeadIdRef.current;
        setCurrentIndex((prev) => {
          if (currentLeadId) {
            const preservedIndex = res.data.findIndex(
              (lead) => lead.leadId === currentLeadId,
            );
            if (preservedIndex >= 0) return preservedIndex;
          }
          return Math.min(prev, Math.max(res.data.length - 1, 0));
        });
      } catch {
        // Keep existing leads on refetch failure
      } finally {
        if (!cancelled) setQueueLoading(false);
      }
    };
    load();
    const id = setInterval(load, QUEUE_REFETCH_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [agentSlug]);

  const currentLead: QueueLead | null = leads[currentIndex] ?? null;

  useEffect(() => {
    currentLeadIdRef.current = currentLead?.leadId ?? null;
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
    if (!currentLead || outcomeLoading) return;

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

    setOutcomeLoading(true);
    try {
      await agentCallsApi.logResult({
        agentSlug,
        leadId: currentLead.leadId,
        resultCode,
        notes: form.notes || undefined,
        followUpDate: form.callBackDate || undefined,
        source: "manual",
      });

      const [detailRes, queueRes] = await Promise.all([
        agentCallsApi.detail(currentLead.leadId, agentSlug),
        agentCallsApi.queue(agentSlug),
      ]);
      setDetail(detailRes);
      const nextForm = formFromDetail(detailRes);
      setForm(nextForm);
      setCallBackDateError(
        getCallBackDateError(
          nextForm.callBackDate,
          detailRes.brandState.lastCalledDate ?? "",
        ),
      );

      setLeads(queueRes.data);

      const preservedIndex = queueRes.data.findIndex(
        (lead) => lead.leadId === currentLead.leadId,
      );
      if (preservedIndex >= 0) {
        setCurrentIndex(preservedIndex);
      } else if (currentIndex >= queueRes.data.length) {
        setCurrentIndex(Math.max(queueRes.data.length - 1, 0));
      }
    } catch (err) {
      setModal({ title: "Error", message: errMessage(err), direction: "top" });
    } finally {
      setOutcomeLoading(false);
    }
  };

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

  if (!currentLead) {
    return <EmptyState message="No leads in the queue right now." />;
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
        <QueuePriorityNotice leads={leads} />

        <HeroCard currentLead={currentLead} />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-1">
            <PhoneCard phone={currentLead.phone} />
            <CardShell>
              <IdentityCard
                form={form}
                leadName={currentLead.fullName}
                onChange={(patch) =>
                  setForm((prev) => ({ ...prev, ...patch }))
                }
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
            <CallOutcomeCard onSelect={handleOutcome} />

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
