export const selectLikeFieldClassName =
  "box-border w-full cursor-pointer rounded border border-gray-300 bg-white px-3 py-1.5 pr-8 text-left text-sm leading-normal text-slate-900 shadow-none transition placeholder:text-slate-400 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500";

// react-datepicker renders a plain text input; without autocomplete hints,
// browsers treat it as a generic form field and offer saved emails/passwords.
// readOnly must not be used — react-datepicker refuses to open when readOnly.
export const datePickerInputProps = {
  autoComplete: "off",
  preventOpenOnFocus: true,
} as const;

// Fixed positioning keeps the calendar aligned inside scrollable tables/grids.
export const datePickerPopperConfig = {
  popperProps: { strategy: "fixed" as const },
  popperPlacement: "bottom-start" as const,
  popperClassName: "datepicker-popper",
} as const;
