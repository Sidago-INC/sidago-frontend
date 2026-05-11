

import {
  Drawer,
  EditableDrawerFooter,
  Modal,
  TextInput,
} from "@/components/ui";
import { validateForm } from "@/lib/validation";
import {
  leadCreateValidationSchema,
  type LeadCreateFormValues,
} from "@/lib/validation/lead-create";
import { CircleHelp } from "lucide-react";
import { useMemo, useState } from "react";

type NewLeadDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (values: LeadCreateFormValues) => void;
};

const blankForm: LeadCreateFormValues = {
  fullName: "",
  firstName: "",
  lastName: "",
  phone: "",
  phoneExtension: "",
  email: "",
  role: "",
};

const inputClassName =
  "h-10 rounded border bg-white px-3 py-2 text-sm text-slate-700 transition focus:border-indigo-500 focus:outline-none dark:bg-gray-800 dark:text-slate-200 dark:focus:border-indigo-400";

export function NewLeadDrawer({
  isOpen,
  onClose,
  onCreate,
}: NewLeadDrawerProps) {
  const [form, setForm] = useState<LeadCreateFormValues>(blankForm);
  const [errors, setErrors] = useState<
    Partial<Record<keyof LeadCreateFormValues, string>>
  >({});
  const [confirmOpen, setConfirmOpen] = useState(false);

  const normalizedForm = useMemo(
    () => ({
      fullName: form.fullName.trim(),
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      phone: form.phone.trim(),
      phoneExtension: form.phoneExtension.trim(),
      email: form.email.trim(),
      role: form.role.trim(),
    }),
    [form],
  );

  const updateField = (field: keyof LeadCreateFormValues, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleReset = () => {
    setForm(blankForm);
    setErrors({});
    setConfirmOpen(false);
  };

  const handleSave = () => {
    const nextErrors = validateForm(normalizedForm, leadCreateValidationSchema);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setConfirmOpen(true);
  };

  const handleConfirmSave = () => {
    onCreate(normalizedForm);
    handleReset();
    onClose();
  };

  return (
    <>
      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        direction="right"
        size="560px"
        header={
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Add New Lead
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Create a local lead record for review and assignment.
            </p>
          </div>
        }
        footer={
          <EditableDrawerFooter
            onCancel={onClose}
            onReset={handleReset}
            onSave={handleSave}
          />
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          <TextInput
            label="Full Name"
            value={form.fullName}
            onChange={(event) => updateField("fullName", event.target.value)}
            error={errors.fullName}
            className={inputClassName}
            wrapperClassName="md:col-span-2"
          />
          <TextInput
            label="First Name"
            value={form.firstName}
            onChange={(event) => updateField("firstName", event.target.value)}
            error={errors.firstName}
            className={inputClassName}
          />
          <TextInput
            label="Last Name"
            value={form.lastName}
            onChange={(event) => updateField("lastName", event.target.value)}
            error={errors.lastName}
            className={inputClassName}
          />
          <TextInput
            label="Phone"
            value={form.phone}
            onChange={(event) => updateField("phone", event.target.value)}
            error={errors.phone}
            className={inputClassName}
          />
          <TextInput
            label="Phone Extension"
            value={form.phoneExtension}
            onChange={(event) =>
              updateField("phoneExtension", event.target.value)
            }
            error={errors.phoneExtension}
            className={inputClassName}
          />
          <TextInput
            label="Email"
            type="email"
            value={form.email}
            onChange={(event) => updateField("email", event.target.value)}
            error={errors.email}
            className={inputClassName}
          />
          <TextInput
            label="Role"
            value={form.role}
            onChange={(event) => updateField("role", event.target.value)}
            error={errors.role}
            className={inputClassName}
          />
        </div>
      </Drawer>

      <Modal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Save New Lead"
        description="This will create a local lead record and open it in the leads table."
        icon={<CircleHelp size={18} />}
        primaryAction={{
          label: "Confirm Save",
          onClick: handleConfirmSave,
        }}
        secondaryAction={{
          label: "Cancel",
          onClick: () => setConfirmOpen(false),
          variant: "secondary",
        }}
      >
        <div className="space-y-1">
          <p>{normalizedForm.fullName}</p>
          <p>{normalizedForm.email}</p>
        </div>
      </Modal>
    </>
  );
}
