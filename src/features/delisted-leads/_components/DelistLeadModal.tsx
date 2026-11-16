import { useEffect, useState } from "react";
import { Modal, Select, Textarea } from "@/components/ui";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { useLeadSelectSource } from "@/features/level-2-update/_lib/hooks";
import {
  useCreateDelistedLead,
  useUpdateDelistedLeadReason,
  type DelistedLeadRow,
} from "../_lib/data";

// One dialog, two jobs: delist a new company (create) or edit the reason of a
// company that is already delisted (edit). Restore lives on the drawer.
export type DelistModalState =
  | { mode: "create" }
  | { mode: "edit"; row: DelistedLeadRow };

type DelistLeadModalProps = {
  state: DelistModalState | null;
  onClose: () => void;
};

export function DelistLeadModal({ state, onClose }: DelistLeadModalProps) {
  const [leadId, setLeadId] = useState("");
  const [reason, setReason] = useState("");
  const createDelisted = useCreateDelistedLead();
  const updateReason = useUpdateDelistedLeadReason();
  const leadSelectSource = useLeadSelectSource();

  // Reset the form each time the dialog opens for a different job.
  useEffect(() => {
    if (!state) return;
    setLeadId("");
    setReason(state.mode === "edit" ? (state.row.delistedReason ?? "") : "");
  }, [state]);

  if (!state) {
    return null;
  }

  const isEdit = state.mode === "edit";
  const isSaving = createDelisted.isPending || updateReason.isPending;
  const canSave = isEdit ? true : leadId !== "";

  const save = async () => {
    if (isSaving || !canSave) return;
    const trimmed = reason.trim() || null;
    try {
      if (state.mode === "create") {
        const result = await createDelisted.mutateAsync({ leadId, reason: trimmed });
        showSuccessToast(
          `Company delisted: ${result.leadsAffected} lead${
            result.leadsAffected === 1 ? "" : "s"
          } moved to Delisted.`,
        );
      } else {
        await updateReason.mutateAsync({ leadId: state.row.leadId, reason: trimmed });
        showSuccessToast("Delisting reason updated.");
      }
      onClose();
    } catch (error) {
      showErrorToast(error);
    }
  };

  return (
    <Modal
      isOpen
      showAccentBar={false}
      title={isEdit ? "Edit delisting reason" : "Delist a company"}
      description={
        isEdit
          ? `The reason is shared by every lead at ${
              state.row.companyName || state.row.companySymbol || "this company"
            }.`
          : "Every lead at the chosen lead's company moves to Delisted on every campaign and leaves the calling stream. Restore undoes it."
      }
      onClose={onClose}
      secondaryAction={{
        label: "Cancel",
        variant: "secondary",
        onClick: onClose,
      }}
      primaryAction={{
        label: isSaving ? "Saving..." : isEdit ? "Save Reason" : "Delist Company",
        onClick: () => void save(),
      }}
    >
      <div className="grid gap-4">
        {!isEdit && (
          <Select
            label="Lead"
            value={leadId}
            options={leadSelectSource.options}
            placeholder={
              leadSelectSource.isLoading && leadSelectSource.options.length === 0
                ? "Loading leads..."
                : "Select a lead"
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
            onChange={(value) => setLeadId(String(value))}
            disabled={isSaving}
          />
        )}
        <Textarea
          label="Reason"
          rows={4}
          value={reason}
          placeholder="Why is this company delisted? (optional)"
          onChange={(event) => setReason(event.target.value)}
          disabled={isSaving}
        />
      </div>
    </Modal>
  );
}
