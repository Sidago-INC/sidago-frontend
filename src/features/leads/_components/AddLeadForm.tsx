

import { Card, CardContent, TextInput } from "@/components/ui";
import { showSuccessToast } from "@/lib/toast";
import { validateForm } from "@/lib/validation";
import {
  leadCreateValidationSchema,
  type LeadCreateFormValues,
} from "@/lib/validation/lead-create";
import { useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import PhoneInput from "react-phone-input-2";
import { createLeadDirectoryRow, getLeadId } from "../_lib/data";
import { getStoredLeads, saveStoredLeads } from "../_lib/storage";

const blankForm: LeadCreateFormValues = {
  fullName: "",
  firstName: "",
  lastName: "",
  phone: "",
  phoneExtension: "",
  email: "",
  role: "",
};

const inputClassName = "h-10 rounded text-sm";

export function AddLeadForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState<LeadCreateFormValues>(blankForm);
  const [errors, setErrors] = useState<
    Partial<Record<keyof LeadCreateFormValues, string>>
  >({});

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

  const handleClear = () => {
    setForm(blankForm);
    setErrors({});
  };

  const handleSave = () => {
    const nextErrors = validateForm(normalizedForm, leadCreateValidationSchema);
    const currentRows = getStoredLeads();
    const duplicateEmail = currentRows.some(
      (row) =>
        row.email.trim().toLowerCase() === normalizedForm.email.toLowerCase(),
    );

    if (duplicateEmail) {
      nextErrors.email = "A lead with this email already exists.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const nextRow = createLeadDirectoryRow(
      {
        lead: "General",
        companyName: "Pending Assignment",
        fullName: normalizedForm.fullName,
        phone: normalizedForm.phone,
        role: normalizedForm.role,
        email: normalizedForm.email,
        timezone: "",
        contactType: "Prospecting",
        svgLeadType: "General",
        svgToBeCalledBy: "",
        svgLastCallDate: "",
        bentonLeadType: "General",
        bentonToBeCalledBy: "",
        bentonLastCallDate: "",
        rm95LeadType: "General",
        rm95ToBeCalledBy: "",
        rm95LastCallDate: "",
        svgDateBecomeHot: "",
        bentonDateBecomeHot: "",
        rm95DateBecomeHot: "",
        lastActionDate: "",
        lastFixedDate: "",
        notWorked: false,
      },
      {
        firstName: normalizedForm.firstName,
        lastName: normalizedForm.lastName,
        phoneExtension: normalizedForm.phoneExtension,
      },
    );

    saveStoredLeads([nextRow, ...currentRows]);
    setForm(normalizedForm);
    setErrors({});
    showSuccessToast("Lead created locally and added to the list.");
    navigate(`/leads?lead=${encodeURIComponent(getLeadId(nextRow))}`);
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
              Create a local lead record, then continue managing it from the
              leads directory.
            </p>
          </div>

          <div className="grid gap-5 px-5 py-5 sm:px-6 sm:py-6">
            <div className="grid gap-4 md:grid-cols-2">
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
              <TextInput
                label="Phone"
                value=""
                onChange={() => {}}
                className="hidden"
                wrapperClassName="hidden"
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
          </div>

          <div className="flex flex-row justify-end gap-2 border-t border-slate-200 px-5 py-4 dark:border-slate-700 sm:px-6">
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex h-10 cursor-pointer items-center justify-center rounded border border-slate-200 px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex h-10 cursor-pointer items-center justify-center rounded bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
            >
              Save Lead
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
