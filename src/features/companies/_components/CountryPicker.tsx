

import { useMemo } from "react";
import ReactSelect, {
  type FilterOptionOption,
  type SingleValue,
  type StylesConfig,
} from "react-select";
import countryList from "react-select-country-list";
import { optionMatchesSelectSearch } from "@/lib/select-search";
import { useTheme } from "@/providers/ThemeProvider";

type CountryOption = {
  label: string;
  value: string;
};

type CountryPickerProps = {
  error?: string;
  label?: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
};

function getCountryPickerStyles(
  isDark: boolean,
  error?: string,
): StylesConfig<CountryOption, false> {
  const colors = isDark
    ? {
        controlBg: "#1f2937",
        controlBorder: error ? "#ef4444" : "#4b5563",
        text: "#e2e8f0",
        placeholder: "#64748b",
        menuBg: "#1f2937",
        optionText: "#e2e8f0",
        optionFocusedBg: "#334155",
        optionDefaultBg: "#1f2937",
        indicator: "#94a3b8",
        separator: "#4b5563",
      }
    : {
        controlBg: "#ffffff",
        controlBorder: error ? "#ef4444" : "#d1d5db",
        text: "#334155",
        placeholder: "#94a3b8",
        menuBg: "#ffffff",
        optionText: "#0f172a",
        optionFocusedBg: "#eff6ff",
        optionDefaultBg: "#ffffff",
        indicator: "#64748b",
        separator: "#e2e8f0",
      };

  return {
    control: (base) => ({
      ...base,
      minHeight: 40,
      borderRadius: 6,
      backgroundColor: colors.controlBg,
      borderColor: colors.controlBorder,
      boxShadow: "none",
      "&:hover": {
        borderColor: colors.controlBorder,
      },
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
      color: colors.text,
    }),
    singleValue: (base) => ({
      ...base,
      color: colors.text,
    }),
    placeholder: (base) => ({
      ...base,
      color: colors.placeholder,
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: colors.menuBg,
      color: colors.text,
      zIndex: 50,
    }),
    menuList: (base) => ({
      ...base,
      padding: 4,
    }),
    option: (base, state) => ({
      ...base,
      color: state.isSelected ? "#ffffff" : colors.optionText,
      backgroundColor: state.isSelected
        ? "#2563eb"
        : state.isFocused
          ? colors.optionFocusedBg
          : colors.optionDefaultBg,
      cursor: "pointer",
    }),
    dropdownIndicator: (base) => ({
      ...base,
      color: colors.indicator,
    }),
    indicatorSeparator: (base) => ({
      ...base,
      backgroundColor: colors.separator,
    }),
  };
}

// react-select inherits text colour from the parent. Inside the dark-themed
// app shell the cascading `text-slate-200` rule was making the menu options
// nearly invisible on the white menu background in light mode. We pin every
// colour explicitly so the picker reads correctly in both themes regardless
// of what the surrounding shell sets.
export function CountryPicker({
  error,
  label = "Country",
  required = false,
  value,
  onChange,
}: CountryPickerProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

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

  const styles = useMemo(
    () => getCountryPickerStyles(isDark, error),
    [isDark, error],
  );

  return (
    <div className="flex w-full flex-col gap-1">
      <label className="text-sm font-medium">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </label>
      <ReactSelect
        options={countryOptions}
        value={selectedCountry}
        onChange={(option: SingleValue<CountryOption>) =>
          onChange(option?.value ?? "")
        }
        placeholder="Search and select a country"
        isSearchable
        aria-required={required || undefined}
        filterOption={(option: FilterOptionOption<CountryOption>, inputValue) =>
          optionMatchesSelectSearch(
            { label: option.label, value: option.value },
            inputValue,
          )
        }
        className="text-sm"
        menuPlacement="auto"
        styles={styles}
      />
      {error ? <span className="text-xs text-red-500">{error}</span> : null}
    </div>
  );
}
