import { useEffect, useState } from "react";
import { Modal, TextInput } from "@/components/ui";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { toSlug, useCreateAgent } from "../_lib/hooks";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (userId: string) => void;
};

const inputClassName = "h-10 rounded text-sm";

export function CreateAgentModal({ isOpen, onClose, onCreated }: Props) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const createAgent = useCreateAgent();

  useEffect(() => {
    if (!isOpen) return;
    setFirstName("");
    setLastName("");
    setEmail("");
    setSlug("");
    setSlugEdited(false);
    setPassword("");
    setErrors({});
  }, [isOpen]);

  const handleSave = async () => {
    const nextErrors: Record<string, string> = {};
    if (!firstName.trim()) nextErrors.firstName = "First name is required";
    if (!lastName.trim()) nextErrors.lastName = "Last name is required";
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) nextErrors.email = "Enter a valid email";
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
      nextErrors.slug = "Use lowercase letters, numbers and single hyphens";
    }
    if (password.length < 8) nextErrors.password = "Use at least 8 characters";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      const created = await createAgent.mutateAsync({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        slug,
        temporaryPassword: password,
      });
      showSuccessToast(`${created.name} created`);
      onCreated?.(created.userId);
      onClose();
    } catch (error) {
      showErrorToast(error);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      title="Add Agent"
      description="Share the temporary password with the agent and ask them to change it after signing in."
      onClose={onClose}
      zIndex={1100}
      primaryAction={{
        label: createAgent.isPending ? "Saving..." : "Create Agent",
        onClick: () => void handleSave(),
      }}
      secondaryAction={{ label: "Cancel", onClick: onClose }}
    >
      <div className="grid gap-4 text-left">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput
            label="First name"
            value={firstName}
            onChange={(event) => {
              setFirstName(event.target.value);
              if (!slugEdited) setSlug(toSlug(`${event.target.value} ${lastName}`).slice(0, 64));
            }}
            error={errors.firstName}
            required
            className={inputClassName}
          />
          <TextInput
            label="Last name"
            value={lastName}
            onChange={(event) => {
              setLastName(event.target.value);
              if (!slugEdited) setSlug(toSlug(`${firstName} ${event.target.value}`).slice(0, 64));
            }}
            error={errors.lastName}
            required
            className={inputClassName}
          />
        </div>
        <TextInput
          label="Email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={errors.email}
          required
          className={inputClassName}
        />
        <TextInput
          label="Slug"
          value={slug}
          onChange={(event) => {
            setSlug(event.target.value);
            setSlugEdited(true);
          }}
          error={errors.slug}
          required
          className={inputClassName}
        />
        <TextInput
          label="Temporary password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={errors.password}
          required
          className={inputClassName}
        />
      </div>
    </Modal>
  );
}
