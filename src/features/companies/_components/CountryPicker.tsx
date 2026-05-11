

import { useMemo } from "react";
import ReactSelect, { type SingleValue } from "react-select";
import countryList from "react-select-country-list";

type CountryOption = {
  label: string;
  value: string;
};

type CountryPickerProps = {
  error?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
};

export function CountryPicker({
  error,
  label = "Country",
  value,
  onChange,
}: CountryPickerProps) {
  const countryOptions = useMemo<CountryOption[]>(
    () =>
      countryList()
        .getData()
        .map((option) => ({
          label: option.label,
          value: option.label,
        })),
    [],
  );

  const selectedCountry =
    countryOptions.find((option) => option.value === value) ?? null;

  return (
    <div className="flex w-full flex-col gap-1">
      <label className="text-sm font-medium">{label}</label>
      <ReactSelect
        options={countryOptions}
        value={selectedCountry}
        onChange={(option: SingleValue<CountryOption>) =>
          onChange(option?.value ?? "")
        }
        placeholder="Search and select a country"
        isSearchable
        className="text-sm"
        styles={{
          control: (base, state) => ({
            ...base,
            minHeight: 40,
            borderRadius: 6,
            borderColor: error
              ? "#ef4444"
              : state.isFocused
                ? "#6366f1"
                : base.borderColor,
            boxShadow: "none",
          }),
          valueContainer: (base) => ({
            ...base,
            paddingTop: 0,
            paddingBottom: 0,
          }),
          input: (base) => ({
            ...base,
            margin: 0,
            padding: 0,
          }),
        }}
      />
      {error ? <span className="text-xs text-red-500">{error}</span> : null}
    </div>
  );
}
