import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Info } from "lucide-react";
import { CardShell, EmptyState, Modal } from "@/components/ui";
import { AutoCallingBanner } from "./_components/AutoCallingBanner";
import { CallNotesCard } from "./_components/CallNotesCard";
import { CallOutcomeCard } from "./_components/CallOutcomeCard";
import { CallsHeader } from "./_components/CallsHeader";
import { DatesCard } from "./_components/DatesCard";
import { HistoryCard } from "./_components/HistoryCard";
import { IdentityCard } from "./_components/IdentityCard";
import { HeroCard } from "./_components/HeroCard";
import { PhoneCard } from "./_components/PhoneCard";
import { WorkToggleRow } from "./_components/WorkToggleRow";
import type { CallsFormState, CallsModalState } from "@/types";
import { getAgentKeyFromCookie, getCallBackDateError } from "./_lib/utils";
import { resolveAgentSlug, agentCallsApi } from "./_lib/agentCallsApi";
import type { QueueLead, LeadDetailResponse } from "./_lib/apiTypes";
import { MessageSquare, NotebookText, Users } from "lucide-react";

const QUEUE_REFETCH_MS = 90_000;

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
  return {
    email: d.lead.email,
    notes: d.history[0]?.notes ?? "",
    callBackDate: d.brandState.followUpDate ?? "",
    leadType: d.brandState.leadType,
    contactType: d.lead.contactType,
    notWorkAnymore: d.lead.notWorkAnymore,
  };
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
}

function formatNotesHistory(history: LeadDetailResponse["history"]): string {
  return history
    .filter((h) => h.notes)
    .map((h) => [formatDate(h.calledAt), h.agentName, h.notes].filter(Boolean).join(" - "))
    .join("\n");
}

function formatCallsHistory(history: LeadDetailResponse["history"]): string {
  return history
    .map((h) => [formatDate(h.calledAt), h.agentName, h.resultCode].filter(Boolean).join(" - "))
    .join("\n");
}

function formatRelatedContacts(
  contacts: LeadDetailResponse["relatedContacts"],
): string {
  return contacts
    .map((c) => {
      return [
        c.role ? `${c.role}: ${c.fullName}` : c.fullName,
        c.phone,
        c.email,
      ]
        .filter(Boolean)
        .join(", ");
    })
    .join("\n");
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
  const [form, setForm] = useState<CallsFormState>(emptyForm());
  const [isAutoCalling, setIsAutoCalling] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const [modal, setModal] = useState<CallsModalState | null>(null);
  const [queueLoading, setQueueLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [outcomeLoading, setOutcomeLoading] = useState(false);
  const [callBackDateError, setCallBackDateError] = useState<string>();
  const stopAutoCallRef = useRef(false);

  // Queue: load on mount + refetch every 90s
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await agentCallsApi.queue(agentSlug);
        if (cancelled) return;
        setLeads(res.data);
        setCurrentIndex((prev) =>
          Math.min(prev, Math.max(res.data.length - 1, 0)),
        );
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
      const newLeads = leads.filter((_, i) => i !== currentIndex);
      setLeads(newLeads);
      setCurrentIndex(Math.min(currentIndex, Math.max(newLeads.length - 1, 0)));
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
      await agentCallsApi.markVoid(
        agentSlug,
        currentLead.leadId,
        form.notWorkAnymore,
      );
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

  const handleDial = async () => {
    if (leads.length === 0) return;
    stopAutoCallRef.current = false;
    setIsAutoCalling(true);

    const snapshot = leads;
    for (let i = currentIndex; i < snapshot.length; i++) {
      if (stopAutoCallRef.current) break;
      // setCurrentIndex(i);
      try {
        const res = await agentCallsApi.dial(agentSlug, snapshot[i].leadId);
        setTestMode(res.testMode);
      } catch (err) {
        const status = (err as { status?: number })?.status;
        const dialErrors: Record<number, string> = {
          404: "Lead not found",
          412: "Dialer not configured for this agent",
          422: "No phone number on file",
          502: "Dialer unavailable, try again",
        };
        setModal({
          title: "Dial Error",
          message:
            (status !== undefined ? dialErrors[status] : undefined) ??
            "Failed to place call",
          direction: "top",
        });
        break;
      }
    }

    stopAutoCallRef.current = false;
    setIsAutoCalling(false);
  };

  const handleStopAutoCalling = () => {
    stopAutoCallRef.current = true;
    setIsAutoCalling(false);
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

      <AutoCallingBanner
        isAutoCalling={isAutoCalling}
        testMode={testMode}
        currentLeadName={currentLead.fullName}
        onStart={handleDial}
        onStop={handleStopAutoCalling}
      />

      <main className="mx-auto max-w-5xl space-y-3 px-3 py-4 sm:space-y-4 sm:px-4 sm:py-6">
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
            <CallOutcomeCard
              onSelect={handleOutcome}
              disabled={outcomeLoading || detailLoading}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <HistoryCard
                title="Notes History"
                value={detail ? formatNotesHistory(detail.history) : ""}
                icon={NotebookText}
              />
              <HistoryCard
                title="Calls History"
                value={detail ? formatCallsHistory(detail.history) : ""}
                icon={MessageSquare}
              />
              <HistoryCard
                title="Other Contacts"
                value={
                  detail ? formatRelatedContacts(detail.relatedContacts) : ""
                }
                icon={Users}
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
