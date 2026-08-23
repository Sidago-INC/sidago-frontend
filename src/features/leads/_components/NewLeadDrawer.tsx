

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
  onCreate: (values: LeadCreateFormValues) => void | Promise<void>;
  /**
   * Opened from a lead's own page, the company is already known and must not
   * be changed — the point is to add a colleague AT this company. Passing it
   * here shows it as a read-only row and pre-fills the payload, so the
   * drawer needs no company picker.
   */
  fixedCompany?: { id: string; label: string };
  /** Set while the create request is in flight, to disable the footer. */
  isSaving?: boolean;
};

const blankForm: LeadCreateFormValues = {
  companyId: "",
  fullName: "",
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
  fixedCompany,
  isSaving = false,
}: NewLeadDrawerProps) {
  const [form, setForm] = useState<LeadCreateFormValues>(blankForm);
  const [errors, setErrors] = useState<
    Partial<Record<keyof LeadCreateFormValues, string>>
  >({});
  const [confirmOpen, setConfirmOpen] = useState(false);

  const normalizedForm = useMemo(
    () => ({
      companyId: fixedCompany?.id ?? form.companyId,
      fullName: form.fullName.trim(),
      phone: form.phone.trim(),
      phoneExtension: form.phoneExtension.trim(),
      email: form.email.trim(),
      role: form.role.trim(),
    }),
    [fixedCompany?.id, form],
  );

  const updateField = (field: keyof LeadCreateFormValues, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleReset = () => {
    setForm({ ...blankForm, companyId: fixedCompany?.id ?? "" });
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

  const handleConfirmSave = async () => {
    try {
      // Await it: if the request fails the drawer has to stay open with the
      // user's input intact, rather than closing and losing everything typed.
      await onCreate(normalizedForm);
    } catch {
      setConfirmOpen(false);
      return;
    }
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
            saveDisabled={isSaving}
            saveLabel={isSaving ? "Saving…" : undefined}
          />
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          {fixedCompany && (
            <div className="flex flex-col gap-1 md:col-span-2">
              <span className="text-sm font-medium">Company</span>
              <div className="rounded border border-gray-300 bg-slate-100 px-3 py-2 text-sm text-slate-700 dark:border-gray-600 dark:bg-slate-800 dark:text-slate-200">
                {fixedCompany.label}
              </div>
            </div>
          )}
          <TextInput
            label="Full Name"
            value={form.fullName}
            onChange={(event) => updateField("fullName", event.target.value)}
            error={errors.fullName}
            className={inputClassName}
            wrapperClassName="md:col-span-2"
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
