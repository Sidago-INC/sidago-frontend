

import {
  Card,
  CardContent,
  Textarea,
  TextInput,
  TimezoneSelect,
} from "@/components/ui";
import { api } from "@/lib/api";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { validateForm } from "@/lib/validation";
import { companyValidationSchema } from "@/lib/validation/company";
import { type COMPANY } from "@/types/company.types";
import type { TIMEZONE } from "@/types/timezone.types";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CountryPicker } from "./CountryPicker";

const blankCompany: COMPANY = {
  symbol: "",
  name: "",
  timezone: "EST",
  country: "United States",
  description: "",
  estimatedMarketCap: "",
  primaryVenue: "",
  city: "",
  state: "",
  website: "",
  twitterHandle: "",
  zip: "",
};

const inputClassName = "h-10 rounded text-sm";
const textareaClassName =
  "rounded border bg-white px-3 py-2 text-sm text-slate-700 transition focus:border-indigo-500 focus:outline-none dark:bg-gray-800 dark:text-slate-200 dark:focus:border-indigo-400";

function normalizeSymbol(value: string) {
  return value.trim().toUpperCase();
}

function normalizeCompany(company: COMPANY): COMPANY {
  return {
    ...company,
    symbol: normalizeSymbol(company.symbol),
    name: company.name.trim(),
    website: company.website.trim(),
    twitterHandle: company.twitterHandle.trim(),
    zip: company.zip.trim(),
    description: company.description.trim(),
    estimatedMarketCap: company.estimatedMarketCap.trim(),
    primaryVenue: company.primaryVenue.trim(),
    city: company.city.trim(),
    state: company.state.trim(),
  };
}

type CreateCompanyResponse = {
  ok: true;
  id: string;
  symbol: string;
  name: string;
};

export function AddCompanyForm() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<COMPANY>(blankCompany);
  const [errors, setErrors] = useState<Partial<Record<keyof COMPANY, string>>>(
    {},
  );
  const [isSaving, setIsSaving] = useState(false);

  const updateField = (field: keyof COMPANY, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
    setErrors((current) => ({
      ...current,
      [field]: undefined,
    }));
  };

  const handleClear = () => {
    setForm(blankCompany);
    setErrors({});
  };

  const handleSave = async () => {
    const nextCompany = normalizeCompany(form);
    const nextErrors = validateForm(nextCompany, companyValidationSchema);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSaving(true);
    try {
      // primaryVenue is intentionally not sent — the DB has no column for it,
      // so it stays as form-only UI state until the schema picks it up.
      const response = (await api.post("/companies", {
        companySymbol: nextCompany.symbol,
        companyName: nextCompany.name,
        timezone: nextCompany.timezone,
        country: nextCompany.country,
        description: nextCompany.description,
        estimatedMarketcap: nextCompany.estimatedMarketCap,
        city: nextCompany.city,
        state: nextCompany.state,
        zip: nextCompany.zip,
        website: nextCompany.website,
        twitter: nextCompany.twitterHandle,
      })) as CreateCompanyResponse;

      // The Add Lead form's company dropdown caches this list — drop the
      // cache so the new row is pickable without a hard refresh.
      queryClient.invalidateQueries({ queryKey: ["companies", "picker"] });

      setForm(blankCompany);
      setErrors({});
      showSuccessToast(`Company "${response.symbol}" saved.`);
    } catch (err) {
      showErrorToast(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-4 py-6 lg:px-6">
      <Card className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <CardContent className="p-0">
          <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-700 sm:px-6">
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
              Add Company
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Create a company record, then continue managing it from the
              companies directory.
            </p>
          </div>

          <div className="grid gap-5 px-5 py-5 sm:px-6 sm:py-6">
            <div className="grid gap-4 md:grid-cols-2">
              <TextInput
                label="Company Symbol"
                value={form.symbol}
                onChange={(event) => updateField("symbol", event.target.value)}
                error={errors.symbol}
                required
                className={inputClassName}
              />
              <TextInput
                label="Company Name"
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                error={errors.name}
                required
                className={inputClassName}
              />
              <TimezoneSelect
                label="Time Zone"
                value={form.timezone}
                onChange={(value) => updateField("timezone", value as TIMEZONE)}
                error={errors.timezone}
                required
                className="h-10 rounded text-sm"
              />
              <CountryPicker
                value={form.country}
                onChange={(value) => updateField("country", value)}
                error={errors.country}
                required
              />
            </div>

            <Textarea
              label="Description"
              value={form.description}
              onChange={(event) =>
                updateField("description", event.target.value)
              }
              rows={4}
              error={errors.description}
              className={textareaClassName}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <TextInput
                label="Estimated Market Cap"
                value={form.estimatedMarketCap}
                onChange={(event) =>
                  updateField("estimatedMarketCap", event.target.value)
                }
                error={errors.estimatedMarketCap}
                className={inputClassName}
              />
              <TextInput
                label="Primary Venue"
                value={form.primaryVenue}
                onChange={(event) =>
                  updateField("primaryVenue", event.target.value)
                }
                error={errors.primaryVenue}
                className={inputClassName}
              />
              <TextInput
                label="City"
                value={form.city}
                onChange={(event) => updateField("city", event.target.value)}
                error={errors.city}
                className={inputClassName}
              />
              <TextInput
                label="State"
                value={form.state}
                onChange={(event) => updateField("state", event.target.value)}
                error={errors.state}
                className={inputClassName}
              />
              <TextInput
                label="Website"
                value={form.website}
                onChange={(event) => updateField("website", event.target.value)}
                error={errors.website}
                className={inputClassName}
              />
              <TextInput
                label="X (Twitter handle)"
                value={form.twitterHandle}
                onChange={(event) =>
                  updateField("twitterHandle", event.target.value)
                }
                error={errors.twitterHandle}
                className={inputClassName}
              />
              <TextInput
                label="Zip"
                value={form.zip}
                onChange={(event) => updateField("zip", event.target.value)}
                error={errors.zip}
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
              {isSaving ? "Saving..." : "Save Company"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
