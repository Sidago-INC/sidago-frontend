
import { useState } from "react";
import { Modal, TextInput } from "@/components/ui";
import { useChangePassword } from "@/hooks/useAuthActions";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export function ChangePasswordModal({ isOpen, onClose }: Props) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [clientError, setClientError] = useState("");
  const { mutate, isPending } = useChangePassword();

  function reset() {
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setClientError("");
  }

  function handleClose() {
    if (isPending) return;
    reset();
    onClose();
  }

  function handleSubmit() {
    setClientError("");

    if (!oldPassword || !newPassword || !confirmPassword) {
      setClientError("All fields are required");
      return;
    }
    if (newPassword.length < 6) {
      setClientError("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setClientError("New password and confirmation do not match");
      return;
    }
    if (newPassword === oldPassword) {
      setClientError("New password must differ from current password");
      return;
    }

    mutate({ oldPassword, newPassword, confirmPassword });
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Change password"
      description="Enter your current password and choose a new one. You'll be signed out on every device after this."
      primaryAction={{
        label: isPending ? "Changing…" : "Change password",
        onClick: handleSubmit,
      }}
      secondaryAction={{
        label: "Cancel",
        onClick: handleClose,
      }}
    >
      <div className="flex flex-col gap-3">
        <TextInput
          label="Current password"
          type="password"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          autoComplete="current-password"
          disabled={isPending}
        />
        <TextInput
          label="New password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          autoComplete="new-password"
          disabled={isPending}
        />
        <TextInput
          label="Confirm new password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          disabled={isPending}
          error={clientError || undefined}
        />
      </div>
    </Modal>
  );
}
