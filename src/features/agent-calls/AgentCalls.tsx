

import { useMemo, useState } from "react";
import type { Lead } from "./_lib/data";
import { Info } from "lucide-react";
import { CardShell, Modal } from "@/components/ui";
import { AutoCallingBanner } from "./_components/AutoCallingBanner";
import { CallNotesCard } from "./_components/CallNotesCard";
import { CallOutcomeCard } from "./_components/CallOutcomeCard";
import { CallsHeader } from "./_components/CallsHeader";
import { contactTypeOptions, leadsByAgent, leadTypeOptions } from "./_lib/data";
import { DatesCard } from "./_components/DatesCard";
import { HistoryCard } from "./_components/HistoryCard";
import { IdentityCard } from "./_components/IdentityCard";
import { HeroCard } from "./_components/HeroCard";
import { PhoneCard } from "./_components/PhoneCard";
import { CallsModalState, createFormStateFromLead } from "@/types";
import { getAgentKeyFromCookie } from "./_lib/utils";
import { MessageSquare, NotebookText, Users } from "lucide-react";
import { WorkToggleRow } from "./_components/WorkToggleRow";
import { EmptyState } from "@/components/ui";

export function AgentCalls() {
  const [agentKey] = useState(() => getAgentKeyFromCookie());
  const leads = useMemo<Lead[]>(
    () => leadsByAgent[agentKey] ?? leadsByAgent.mariz,
    [agentKey],
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoCalling, setIsAutoCalling] = useState(false);
  const [modal, setModal] = useState<CallsModalState | null>(null);
  const [form, setForm] = useState(() => createFormStateFromLead(leads[0]));

  const currentLead = leads[currentIndex] ?? null;

  const syncFormToLead = (index: number) => {
    const lead = leads[index];
    if (!lead) {
      return;
    }

    setCurrentIndex(index);
    setForm(createFormStateFromLead(lead));
  };

  const showModal = (
    title: string,
    message: string,
    direction: CallsModalState["direction"] = "center",
  ) => setModal({ title, message, direction });

  const handleSkip = () => {
    if (currentIndex < leads.length - 1) {
      syncFormToLead(currentIndex + 1);
      return;
    }

    showModal(
      "End of List",
      "You have reached the last lead in the list.",
      "right",
    );
  };

  const handleSave = () => {
    showModal(
      "Saved (POC)",
      `Changes for "${currentLead?.full_name}" have been noted locally. No data was sent anywhere.`,
      "bottom",
    );
  };

  const handleOutcome = (action: string) => {
    const messages: Record<string, string> = {
      "No Answer": `Logged "No Answer" for ${currentLead?.full_name}.`,
      Interested: `Logged "Interested" for ${currentLead?.full_name}.`,
      "Bad Number": `Logged "Bad Number" for ${currentLead?.full_name}.`,
      "Not Interested": `Logged "Not Interested" for ${currentLead?.full_name}.`,
      "Left Message": `Logged "Left Message" for ${currentLead?.full_name}.`,
      "Call Lead Back": `Logged "Call Lead Back" for ${currentLead?.full_name}.`,
      "Interested Again": `Logged "Interested Again" for ${currentLead?.full_name}.`,
      DNC: `Logged "Do Not Call" for ${currentLead?.full_name}.`,
    };

    showModal(action, messages[action] ?? `Action "${action}" logged.`, "top");
  };

  if (!currentLead) {
    return <EmptyState message="No leads found in this view." />;
  }

  return (
    <div className="min-h-full bg-slate-50 dark:bg-gray-950">
      <CallsHeader
        leads={leads}
        currentIndex={currentIndex}
        onSelectLead={syncFormToLead}
        onSkip={handleSkip}
      />

      <AutoCallingBanner
        isAutoCalling={isAutoCalling}
        currentLead={currentLead}
        onStart={() => setIsAutoCalling(true)}
        onStop={() => setIsAutoCalling(false)}
      />

      <main className="mx-auto space-y-4 px-4 py-6">
        <HeroCard currentLead={currentLead} />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-1">
            <PhoneCard currentLead={currentLead} />
            <CardShell>
              <IdentityCard
                form={form}
                leadName={currentLead.full_name}
                onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
                leadTypeOptions={leadTypeOptions}
                contactTypeOptions={contactTypeOptions}
              />
              <WorkToggleRow
                value={form.notWorkAnymore}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, notWorkAnymore: value }))
                }
              />
            </CardShell>
            <DatesCard
              callBackDate={form.callBackDate}
              lastCalledDate={currentLead.last_called_date_sidago}
              lastFixedDate={currentLead.last_fixed_date}
              onChangeCallBackDate={(value) =>
                setForm((prev) => ({ ...prev, callBackDate: value }))
              }
            />
          </div>

          <div className="space-y-4 lg:col-span-2">
            <CallNotesCard
              notes={form.notes}
              onChange={(value) =>
                setForm((prev) => ({ ...prev, notes: value }))
              }
              onSave={handleSave}
            />
            <CallOutcomeCard onSelect={handleOutcome} />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <HistoryCard
                title="Notes History"
                value={currentLead.history_call_notes_sidago}
                icon={NotebookText}
              />
              <HistoryCard
                title="Calls History"
                value={currentLead.history_calls_sidago}
                icon={MessageSquare}
              />
              <HistoryCard
                title="Other Contacts"
                value={currentLead.other_contacts}
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
