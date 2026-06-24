
import { Card, CardContent, Select, TextInput } from "@/components/ui";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { validateForm } from "@/lib/validation";
import {
  additionalContactValidationSchema,
  type AdditionalContactFormValues,
} from "@/lib/validation/additional-contact";
import { useState } from "react";
import { useCompanyIdSelectSource } from "@/features/companies/_lib/hooks";
import { useCreateAdditionalContact } from "../_lib/hooks";

const blankForm: AdditionalContactFormValues = {
  firstName: "",
  lastName: "",
  fullName: "",
  role: "",
  email: "",
  companyId: "",
};

const inputClassName = "h-10 rounded text-sm";

function buildFullName(firstName: string, lastName: string) {
  return [firstName.trim(), lastName.trim()].filter(Boolean).join(" ");
}

function splitFullName(fullName: string) {
  const trimmed = fullName.trim();
  const parts = trimmed.split(/\s+/).filter(Boolean);

  if (parts.length < 2) {
    return null;
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

export function AdditionalContactsForm() {
  const companySelectSource = useCompanyIdSelectSource();
  const createAdditionalContact = useCreateAdditionalContact();
  const [form, setForm] = useState<AdditionalContactFormValues>(blankForm);
  const [errors, setErrors] = useState<
    Partial<Record<keyof AdditionalContactFormValues, string>>
  >({});

  const updateField = (
    field: keyof AdditionalContactFormValues,
    value: string,
  ) => {
    setForm((current) => {
      if (field === "firstName" || field === "lastName") {
        const nextFirstName =
          field === "firstName" ? value : current.firstName;
        const nextLastName = field === "lastName" ? value : current.lastName;

        return {
          ...current,
          [field]: value,
          fullName: buildFullName(nextFirstName, nextLastName),
        };
      }

      if (field === "fullName") {
        const next = { ...current, fullName: value };
        const namesAreEmpty =
          !current.firstName.trim() && !current.lastName.trim();
        const split = splitFullName(value);

        if (namesAreEmpty && split) {
          next.firstName = split.firstName;
          next.lastName = split.lastName;
        }

        return next;
      }

      return { ...current, [field]: value };
    });
    setErrors((current) => {
      if (field === "firstName" || field === "lastName") {
        return {
          ...current,
          firstName: undefined,
          lastName: undefined,
          fullName: undefined,
        };
      }

      if (field === "fullName") {
        return {
          ...current,
          fullName: undefined,
          firstName: undefined,
          lastName: undefined,
        };
      }

      return { ...current, [field]: undefined };
    });
  };

  const handleClear = () => {
    setForm(blankForm);
    setErrors({});
  };

  const handleSave = async () => {
    const nextForm = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      fullName: form.fullName.trim(),
      role: form.role.trim(),
      email: form.email.trim(),
      companyId: form.companyId.trim(),
    };
    const nextErrors = validateForm(
      nextForm,
      additionalContactValidationSchema,
    );

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    try {
      const result = await createAdditionalContact.mutateAsync({
        firstName: nextForm.firstName,
        lastName: nextForm.lastName,
        ...(nextForm.fullName ? { fullName: nextForm.fullName } : {}),
        ...(nextForm.role ? { role: nextForm.role } : {}),
        email: nextForm.email,
        companyId: nextForm.companyId,
      });

      setForm(blankForm);
      setErrors({});
      showSuccessToast(
        `Additional contact saved for ${result.companyName ?? result.companySymbol ?? "company"}.`,
      );
    } catch (error) {
      showErrorToast(error);
    }
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
                value={form.companyId}
                onChange={(value) => updateField("companyId", String(value))}
                options={companySelectSource.options}
                placeholder={
                  companySelectSource.isLoading &&
                  companySelectSource.options.length === 0
                    ? "Loading companies..."
                    : "Search and select a company"
                }
                searchable
                searchPlaceholder="Search companies"
                searchValue={companySelectSource.searchInput}
                onSearchChange={companySelectSource.onSearchChange}
                filterOptionsLocally={false}
                onLoadMore={companySelectSource.onLoadMore}
                hasMore={companySelectSource.hasMore}
                isLoadingMore={companySelectSource.isLoadingMore}
                isSearching={companySelectSource.isSearching}
                error={errors.companyId}
                disabled={
                  (companySelectSource.isLoading &&
                    companySelectSource.options.length === 0) ||
                  createAdditionalContact.isPending
                }
                className="h-10 rounded text-sm"
                labelClassName="text-sm font-medium"
              />
            </div>
          </div>

          <div className="flex flex-row justify-end gap-2 border-t border-slate-200 px-5 py-4 dark:border-slate-700 sm:px-6">
            <button
              type="button"
              onClick={handleClear}
              disabled={createAdditionalContact.isPending}
              className="cursor-pointer inline-flex h-10 items-center justify-center rounded border border-slate-200 px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={createAdditionalContact.isPending}
              className="cursor-pointer inline-flex h-10 items-center justify-center rounded bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
            >
              {createAdditionalContact.isPending ? "Saving..." : "Save"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
