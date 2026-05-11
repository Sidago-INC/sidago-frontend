

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";
import { Check, ChevronDown, Search } from "lucide-react";
import clsx from "clsx";

export type SelectOption = {
  label: string;
  value: string | number;
};

type SelectPlacement = "top" | "bottom";

type Props = {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
  value?: string | number;
  onChange?: (value: string | number) => void;
  className?: string;
  optionsClassName?: string;
  labelClassName?: string;
  disabled?: boolean;
  floatingOptions?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
};

type SelectOptionsPanelProps = {
  options: SelectOption[];
  optionsClassName?: string;
  placement: SelectPlacement;
  search: string;
  searchable: boolean;
  searchPlaceholder: string;
  setSearch: (value: string) => void;
};

type SelectControlProps = {
  buttonRef: React.RefObject<HTMLButtonElement | null>;
  className: string;
  error?: string;
  id: string;
  open: boolean;
  options: SelectOption[];
  optionsClassName?: string;
  placement: SelectPlacement;
  placeholder: string;
  search: string;
  searchable: boolean;
  searchPlaceholder: string;
  selected?: SelectOption;
  setSearch: (value: string) => void;
  updatePlacement: () => void;
};

function SelectOptionsPanel({
  options,
  optionsClassName,
  placement,
  search,
  searchable,
  searchPlaceholder,
  setSearch,
}: SelectOptionsPanelProps) {
  const filteredOptions = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return options;
    }

    return options.filter((option) =>
      option.label.toLowerCase().includes(query),
    );
  }, [options, search]);

  return (
    <ListboxOptions
      anchor={placement === "top" ? "top start" : "bottom start"}
      className={clsx(
        "z-[300] max-h-64 w-[var(--button-width)] overflow-auto rounded-lg border border-slate-200 bg-white p-1 shadow-lg [--anchor-gap:0.25rem] dark:border-slate-700 dark:bg-gray-800",
        optionsClassName,
      )}
    >
      {searchable && (
        <div className="sticky top-0 z-10 bg-white pb-1 dark:bg-gray-800">
          <div className="relative">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => event.stopPropagation()}
              placeholder={searchPlaceholder}
              className="h-9 w-full rounded border border-slate-200 bg-white pl-8 pr-3 text-sm text-slate-700 shadow-none outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-0 dark:border-slate-700 dark:bg-gray-900 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </div>
        </div>
      )}

      {filteredOptions.length === 0 ? (
        <div className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
          No options found
        </div>
      ) : (
        filteredOptions.map((option, index) => (
          <ListboxOption
            key={`${String(option.value)}-${index}`}
            value={option.value}
            className={({ focus }) =>
              clsx(
                "relative cursor-pointer select-none rounded px-4 py-2 text-sm",
                focus
                  ? "bg-indigo-50 text-indigo-700 dark:bg-slate-700 dark:text-indigo-300"
                  : "text-slate-700 dark:text-gray-200",
              )
            }
          >
            {({ selected: isSelected }) => (
              <div className="flex items-center justify-between gap-2">
                <span className={clsx("truncate", isSelected && "font-medium")}>
                  {option.label}
                </span>
                {isSelected && <Check size={14} className="shrink-0" />}
              </div>
            )}
          </ListboxOption>
        ))
      )}
    </ListboxOptions>
  );
}

function SelectControl({
  buttonRef,
  className,
  error,
  id,
  open,
  options,
  optionsClassName,
  placement,
  placeholder,
  search,
  searchable,
  searchPlaceholder,
  selected,
  setSearch,
  updatePlacement,
}: SelectControlProps) {
  useEffect(() => {
    if (!open) {
      setSearch("");
      return;
    }

    updatePlacement();
    window.addEventListener("resize", updatePlacement);
    window.addEventListener("scroll", updatePlacement, true);

    return () => {
      window.removeEventListener("resize", updatePlacement);
      window.removeEventListener("scroll", updatePlacement, true);
    };
  }, [open, setSearch, updatePlacement]);

  return (
    <div className="relative">
      <ListboxButton
        ref={buttonRef}
        id={id}
        onClick={updatePlacement}
        className={clsx(
          "relative w-full appearance-none cursor-pointer rounded border bg-white pr-8 text-left text-slate-900 shadow-none transition focus:border-indigo-500 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-indigo-400",
          error ? "border-red-500" : "border-gray-300 dark:border-gray-600",
          "px-4 py-2",
          className,
        )}
      >
        <span
          className={clsx(
            "block truncate",
            !selected && "text-slate-400 dark:text-gray-500",
          )}
        >
          {selected ? selected.label : placeholder}
        </span>
        <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
          <ChevronDown
            size={14}
            className={clsx("text-slate-400 transition", open && "rotate-180")}
          />
        </span>
      </ListboxButton>

      {open && (
        <SelectOptionsPanel
          options={options}
          optionsClassName={optionsClassName}
          placement={placement}
          search={search}
          searchable={searchable}
          searchPlaceholder={searchPlaceholder}
          setSearch={setSearch}
        />
      )}
    </div>
  );
}

export function Select({
  label,
  error,
  className = "",
  options,
  placeholder = "Select an option",
  value,
  onChange,
  optionsClassName,
  labelClassName,
  disabled,
  searchable = false,
  searchPlaceholder = "Search options",
}: Props) {
  const id = useId();
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [placement, setPlacement] = useState<SelectPlacement>("bottom");
  const [search, setSearch] = useState("");
  const selected = options.find((o) => String(o.value) === String(value));

  const updatePlacement = useCallback(() => {
    if (typeof window === "undefined" || !buttonRef.current) {
      return;
    }

    const rect = buttonRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const desiredPanelHeight = searchable ? 304 : 260;

    setPlacement(
      spaceBelow < desiredPanelHeight && spaceAbove > spaceBelow
        ? "top"
        : "bottom",
    );
  }, [searchable]);

  return (
    <div className="flex w-full flex-col gap-1">
      {label && (
        <label
          htmlFor={id}
          className={clsx("text-sm font-medium", labelClassName)}
        >
          {label}
        </label>
      )}

      <Listbox
        value={value ?? ""}
        onChange={(nextValue) => {
          onChange?.(nextValue);
          setSearch("");
        }}
        disabled={disabled}
      >
        {({ open }) => (
          <SelectControl
            buttonRef={buttonRef}
            className={className}
            error={error}
            id={id}
            open={open}
            options={options}
            optionsClassName={optionsClassName}
            placement={placement}
            placeholder={placeholder}
            search={search}
            searchable={searchable}
            searchPlaceholder={searchPlaceholder}
            selected={selected}
            setSearch={setSearch}
            updatePlacement={updatePlacement}
          />
        )}
      </Listbox>

      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
