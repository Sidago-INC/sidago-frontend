

import {
  Card,
  CardContent,
  EmailListField,
  PhoneInputField,
  Select,
  TextInput,
  Textarea,
} from "@/components/ui";
import { createLead } from "../_lib/hooks";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { validateForm } from "@/lib/validation";
import {
  leadCreateValidationSchema,
  type LeadCreateFormValues,
} from "@/lib/validation/lead-create";
import { useCompanyIdSelectSource } from "@/features/companies/_lib/hooks";
import { useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";

const blankForm: LeadCreateFormValues = {
  companyId: "",
  fullName: "",
  phone: "",
  phoneExtension: "",
  email: "",
  role: "",
  otherContacts: "",
};

const inputClassName = "h-10 rounded text-sm";

// Wider trigger so labels like "NASDAQ:CHDN - Churchill Downs Incorporated"
// fit instead of truncating to the exchange. Mirrors the lead picker on the
// Level 2 Update page.
const companySelectClass =
  "h-10 min-w-[18rem] rounded border-slate-200 text-sm dark:border-slate-700";

// The Select panel inherits the trigger width via --button-width. Pin it
// wider so the dropdown can show the full label even on narrow triggers.
const companySelectOptionsClass =
  "z-[300] !w-[26rem] max-w-[90vw] max-h-72 rounded-xl border-slate-200 p-1 shadow-xl dark:border-slate-700 dark:bg-slate-950";

export function AddLeadForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState<LeadCreateFormValues>(blankForm);
  const [errors, setErrors] = useState<
    Partial<Record<keyof LeadCreateFormValues, string>>
  >({});
  const [isSaving, setIsSaving] = useState(false);

  const companySelectSource = useCompanyIdSelectSource();

  const normalizedForm = useMemo(
    () => ({
      companyId: form.companyId,
      fullName: form.fullName.trim(),
      phone: form.phone.trim(),
      phoneExtension: form.phoneExtension.trim(),
      email: form.email.trim(),
      role: form.role.trim(),
      otherContacts: form.otherContacts.trim(),
    }),
    [form],
  );

  const updateField = (field: keyof LeadCreateFormValues, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleClear = () => {
    setForm(blankForm);
    setErrors({});
  };

  const handleSave = async () => {
    const nextErrors = validateForm(normalizedForm, leadCreateValidationSchema);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSaving(true);
    try {
      const response = await createLead({
        companyId: normalizedForm.companyId,
        fullName: normalizedForm.fullName,
        phone: normalizedForm.phone,
        phoneExtension: normalizedForm.phoneExtension,
        email: normalizedForm.email,
        role: normalizedForm.role,
        otherContacts: normalizedForm.otherContacts || undefined,
      });

      setForm(blankForm);
      setErrors({});
      showSuccessToast(`Lead "${response.fullName}" saved.`);
      navigate(`/leads?lead=${encodeURIComponent(response.id)}`);
    } catch (err) {
      showErrorToast(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-6 lg:px-6">
      <Card className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <CardContent className="p-0">
          <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-700 sm:px-6">
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
              Add Lead
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Attach a new contact to a company. Saving writes the lead to the
              database immediately.
            </p>
          </div>

          <div className="grid gap-5 px-5 py-5 sm:px-6 sm:py-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium">
                  Company
                </label>
                <Select
                  value={form.companyId}
                  options={companySelectSource.options}
                  onChange={(value) => updateField("companyId", String(value))}
                  placeholder={
                    companySelectSource.isLoading &&
                    companySelectSource.options.length === 0
                      ? "Loading companies..."
                      : "Select a company"
                  }
                  searchable
                  searchPlaceholder="Search company"
                  searchValue={companySelectSource.searchInput}
                  onSearchChange={companySelectSource.onSearchChange}
                  filterOptionsLocally={false}
                  onLoadMore={companySelectSource.onLoadMore}
                  hasMore={companySelectSource.hasMore}
                  isLoadingMore={companySelectSource.isLoadingMore}
                  isSearching={companySelectSource.isSearching}
                  className={companySelectClass}
                  optionsClassName={companySelectOptionsClass}
                  error={errors.companyId}
                />
              </div>
              <TextInput
                label="Full Name"
                value={form.fullName}
                onChange={(event) =>
                  updateField("fullName", event.target.value)
                }
                error={errors.fullName}
                className={inputClassName}
                wrapperClassName="md:col-span-2"
              />
              <PhoneInputField
                value={form.phone}
                onChange={(value) => updateField("phone", value)}
                error={errors.phone}
              />
              <TextInput
                label="Phone Extension (optional)"
                value={form.phoneExtension}
                onChange={(event) =>
                  updateField("phoneExtension", event.target.value)
                }
                error={errors.phoneExtension}
                className={inputClassName}
              />
              <EmailListField
                value={form.email}
                onChange={(value) => updateField("email", value)}
                error={errors.email}
                inputClassName={inputClassName}
              />
              <TextInput
                label="Role"
                value={form.role}
                onChange={(event) => updateField("role", event.target.value)}
                error={errors.role}
                className={inputClassName}
              />
              <div className="md:col-span-2">
                <Textarea
                  label="Other Contacts (optional)"
                  value={form.otherContacts}
                  onChange={(event) =>
                    updateField("otherContacts", event.target.value)
                  }
                  error={errors.otherContacts}
                  rows={3}
                  placeholder="Additional phone numbers, alternate contacts, notes…"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-row justify-end gap-2 border-t border-slate-200 px-5 py-4 dark:border-slate-700 sm:px-6">
            <button
              type="button"
              onClick={handleClear}
              disabled={isSaving}
              className="inline-flex h-10 cursor-pointer items-center justify-center rounded border border-slate-200 px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex h-10 cursor-pointer items-center justify-center rounded bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? "Saving..." : "Save Lead"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
