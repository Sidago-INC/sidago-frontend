import clsx from "clsx";
import { useMemo } from "react";
import PhoneInput from "react-phone-input-2";
import { useTheme } from "@/providers/ThemeProvider";

type PhoneInputFieldProps = {
  label?: string;
  error?: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  country?: string;
};

function getPhoneInputStyles(isDark: boolean, error?: string) {
  const borderColor = error ? "#ef4444" : isDark ? "#4b5563" : "#d1d5db";
  const backgroundColor = isDark ? "#1f2937" : "#ffffff";
  const color = isDark ? "#e2e8f0" : "#334155";

  return {
    inputStyle: {
      width: "100%",
      height: "40px",
      borderRadius: "0.375rem",
      borderColor,
      backgroundColor,
      fontSize: "0.875rem",
      color,
      paddingLeft: "48px",
    },
    buttonStyle: {
      borderTopLeftRadius: "0.375rem",
      borderBottomLeftRadius: "0.375rem",
      borderColor,
      backgroundColor,
    },
    dropdownStyle: {
      backgroundColor,
      color,
    },
    searchStyle: {
      width: "90%",
      backgroundColor: isDark ? "#111827" : "#ffffff",
      color,
      borderColor: isDark ? "#4b5563" : "#d1d5db",
    },
  };
}

export function PhoneInputField({
  label = "Phone",
  error,
  required = false,
  value,
  onChange,
  country = "us",
}: PhoneInputFieldProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const styles = useMemo(
    () => getPhoneInputStyles(isDark, error),
    [isDark, error],
  );

  return (
    <div className="flex w-full flex-col gap-1">
      <label className="text-sm font-medium">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </label>
      <PhoneInput
        country={country}
        enableSearch
        value={value}
        onChange={(nextValue) => onChange(nextValue ?? "")}
        containerClass={clsx(
          "phone-input-field",
          error && "phone-input-field--error",
        )}
        inputProps={{
          "aria-required": required || undefined,
        }}
        {...styles}
      />
      {error ? <span className="text-xs text-red-500">{error}</span> : null}
    </div>
  );
}
