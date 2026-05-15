

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

// react-select inherits text colour from the parent. Inside the dark-themed
// app shell the cascading `text-slate-200` rule was making the menu options
// nearly invisible on the white menu background in light mode. We pin every
// colour explicitly so the picker reads correctly in both themes regardless
// of what the surrounding shell sets.
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
        menuPlacement="auto"
        styles={{
          control: (base, state) => ({
            ...base,
            minHeight: 40,
            borderRadius: 6,
            backgroundColor: "#ffffff",
            borderColor: error
              ? "#ef4444"
              : state.isFocused
                ? "#6366f1"
                : "#d1d5db",
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
            color: "#0f172a",
          }),
          singleValue: (base) => ({
            ...base,
            color: "#0f172a",
          }),
          placeholder: (base) => ({
            ...base,
            color: "#94a3b8",
          }),
          menu: (base) => ({
            ...base,
            backgroundColor: "#ffffff",
            color: "#0f172a",
            zIndex: 50,
          }),
          menuList: (base) => ({
            ...base,
            padding: 4,
          }),
          option: (base, state) => ({
            ...base,
            color: state.isSelected ? "#ffffff" : "#0f172a",
            backgroundColor: state.isSelected
              ? "#2563eb"
              : state.isFocused
                ? "#eff6ff"
                : "#ffffff",
            cursor: "pointer",
          }),
          dropdownIndicator: (base) => ({
            ...base,
            color: "#64748b",
          }),
          indicatorSeparator: (base) => ({
            ...base,
            backgroundColor: "#e2e8f0",
          }),
        }}
      />
      {error ? <span className="text-xs text-red-500">{error}</span> : null}
    </div>
  );
}
