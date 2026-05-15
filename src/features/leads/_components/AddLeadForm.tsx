

import { Card, CardContent, Select, TextInput } from "@/components/ui";
import { api } from "@/lib/api";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { validateForm } from "@/lib/validation";
import {
  leadCreateValidationSchema,
  type LeadCreateFormValues,
} from "@/lib/validation/lead-create";
import { useCompanyOptions } from "@/features/companies/_lib/hooks";
import { useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import PhoneInput from "react-phone-input-2";

const blankForm: LeadCreateFormValues = {
  companyId: "",
  fullName: "",
  firstName: "",
  lastName: "",
  phone: "",
  phoneExtension: "",
  email: "",
  role: "",
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

type CreateLeadResponse = {
  ok: true;
  id: string;
  fullName: string;
  email: string;
};

export function AddLeadForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState<LeadCreateFormValues>(blankForm);
  const [errors, setErrors] = useState<
    Partial<Record<keyof LeadCreateFormValues, string>>
  >({});
  const [isSaving, setIsSaving] = useState(false);

  const { data: companiesRaw, isLoading: companiesLoading } =
    useCompanyOptions();

  const companyOptions = useMemo(
    () =>
      (companiesRaw ?? []).map((c) => ({
        value: c.id,
        label: c.label || c.name || c.symbol || c.id,
      })),
    [companiesRaw],
  );

  const normalizedForm = useMemo(
    () => ({
      companyId: form.companyId,
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
      const response = (await api.post("/leads", {
        companyId: normalizedForm.companyId,
        fullName: normalizedForm.fullName,
        firstName: normalizedForm.firstName,
        lastName: normalizedForm.lastName,
        phone: normalizedForm.phone,
        phoneExtension: normalizedForm.phoneExtension,
        email: normalizedForm.email,
        role: normalizedForm.role,
      })) as CreateLeadResponse;

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
                  options={companyOptions}
                  onChange={(value) => updateField("companyId", String(value))}
                  placeholder={
                    companiesLoading
                      ? "Loading companies..."
                      : "Select a company"
                  }
                  searchable
                  searchPlaceholder="Search company"
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
              <TextInput
                label="First Name"
                value={form.firstName}
                onChange={(event) =>
                  updateField("firstName", event.target.value)
                }
                error={errors.firstName}
                className={inputClassName}
              />
              <TextInput
                label="Last Name"
                value={form.lastName}
                onChange={(event) =>
                  updateField("lastName", event.target.value)
                }
                error={errors.lastName}
                className={inputClassName}
              />
              <div className="flex w-full flex-col gap-1">
                <label className="text-sm font-medium">Phone</label>
                <PhoneInput
                  country="us"
                  enableSearch
                  value={form.phone}
                  onChange={(value) => updateField("phone", value ?? "")}
                  inputClass={errors.phone ? "phone-error" : ""}
                  inputStyle={{
                    width: "100%",
                    height: "40px",
                    borderRadius: "0.375rem",
                    borderColor: errors.phone ? "#ef4444" : "#d1d5db",
                    fontSize: "0.875rem",
                    color: "#334155",
                    paddingLeft: "48px",
                  }}
                  buttonStyle={{
                    borderTopLeftRadius: "0.375rem",
                    borderBottomLeftRadius: "0.375rem",
                    borderColor: errors.phone ? "#ef4444" : "#d1d5db",
                    backgroundColor: "#ffffff",
                  }}
                  dropdownStyle={{
                    color: "#0f172a",
                  }}
                  searchStyle={{
                    width: "90%",
                  }}
                />
                {errors.phone ? (
                  <span className="text-xs text-red-500">{errors.phone}</span>
                ) : null}
              </div>
              <TextInput
                label="Phone Extension (optional)"
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
