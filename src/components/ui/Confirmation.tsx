

type ConfirmModalProps = {
  open: boolean;
  title?: string;
  description?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  /** Verb on the confirm button. Not every destructive action is a delete. */
  confirmLabel?: string;
  loadingLabel?: string;
};

export function Confirmation({
  open,
  title = "Confirm Action",
  description = "Are you sure?",
  onConfirm,
  onCancel,
  loading = false,
  confirmLabel = "Delete",
  loadingLabel = "Deleting...",
}: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />

      {/* Modal */}
      <div className="relative bg-white w-full max-w-sm rounded-xl shadow-lg p-4 z-10">
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="text-xs text-gray-500 mt-1">{description}</p>

        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onCancel}
            className="px-2 py-1 text-xs rounded-md border text-gray-600 hover:bg-gray-100 cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-2 py-1 text-xs rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? loadingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
