

import { Card, CardContent, Select, TextInput } from "@/components/ui";
import { showSuccessToast } from "@/lib/toast";
import { validateForm } from "@/lib/validation";
import {
  additionalContactValidationSchema,
  type AdditionalContactFormValues,
} from "@/lib/validation/additional-contact";
import { COMPANY_VALUES } from "@/types/company.types";
import { useMemo, useState } from "react";

const blankForm: AdditionalContactFormValues = {
  name: "",
  fullName: "",
  role: "",
  email: "",
  companyName: "",
};

const inputClassName = "h-10 rounded text-sm";

export function AdditionalContactsForm() {
  const [form, setForm] = useState<AdditionalContactFormValues>(blankForm);
  const [errors, setErrors] = useState<
    Partial<Record<keyof AdditionalContactFormValues, string>>
  >({});

  const companyOptions = useMemo(
    () =>
      COMPANY_VALUES.map((company) => ({
        label: `${company.name} (${company.symbol})`,
        value: company.name,
      })),
    [],
  );

  const updateField = (
    field: keyof AdditionalContactFormValues,
    value: string,
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleClear = () => {
    setForm(blankForm);
    setErrors({});
  };

  const handleSave = () => {
    const nextForm = {
      name: form.name.trim(),
      fullName: form.fullName.trim(),
      role: form.role.trim(),
      email: form.email.trim(),
      companyName: form.companyName.trim(),
    };
    const nextErrors = validateForm(
      nextForm,
      additionalContactValidationSchema,
    );

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setForm(nextForm);
    setErrors({});
    showSuccessToast(
      `Additional contact for ${nextForm.companyName} saved locally.`,
    );
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-6 lg:px-6">
      <Card className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <CardContent className="p-0">
          <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-700 sm:px-6">
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
              Additional Contacts
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Add an additional contact and associate it with an existing
              company.
            </p>
          </div>

          <div className="grid gap-5 px-5 py-5 sm:px-6 sm:py-6">
            <div className="grid gap-4 md:grid-cols-2">
              <TextInput
                label="Name"
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                error={errors.name}
                className={inputClassName}
              />
              <TextInput
                label="Full Name"
                value={form.fullName}
                onChange={(event) =>
                  updateField("fullName", event.target.value)
                }
                error={errors.fullName}
                className={inputClassName}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <TextInput
                label="Role"
                value={form.role}
                onChange={(event) => updateField("role", event.target.value)}
                error={errors.role}
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
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/40">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Company Association
              </p>
              <Select
                label="Select Company"
                value={form.companyName}
                onChange={(value) => updateField("companyName", String(value))}
                options={companyOptions}
                placeholder="Search and select a company"
                searchable
                searchPlaceholder="Search companies"
                error={errors.companyName}
                className="h-10 rounded text-sm"
                labelClassName="text-sm font-medium"
              />
            </div>
          </div>

          <div className="flex flex-row justify-end gap-2 border-t border-slate-200 px-5 py-4 dark:border-slate-700 sm:px-6">
            <button
              type="button"
              onClick={handleClear}
              className="cursor-pointer inline-flex h-10 items-center justify-center rounded border border-slate-200 px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="cursor-pointer inline-flex h-10 items-center justify-center rounded bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
            >
              Save
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
