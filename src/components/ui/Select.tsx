

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
import { filterSelectOptions } from "@/lib/select-search";

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
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  filterOptionsLocally?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  isSearching?: boolean;
};

type SelectOptionsPanelProps = {
  options: SelectOption[];
  optionsClassName?: string;
  placement: SelectPlacement;
  search: string;
  searchable: boolean;
  searchPlaceholder: string;
  setSearch: (value: string) => void;
  filterOptionsLocally: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  isSearching?: boolean;
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
  filterOptionsLocally: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  isSearching?: boolean;
};

function SelectOptionsPanel({
  options,
  optionsClassName,
  placement,
  search,
  searchable,
  searchPlaceholder,
  setSearch,
  filterOptionsLocally,
  onLoadMore,
  hasMore,
  isLoadingMore,
  isSearching,
}: SelectOptionsPanelProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const loadMoreSentinelRef = useRef<HTMLDivElement>(null);

  const displayOptions = useMemo(
    () =>
      filterOptionsLocally
        ? filterSelectOptions(options, search)
        : options,
    [filterOptionsLocally, options, search],
  );

  const tryLoadMore = useCallback(() => {
    if (!onLoadMore || !hasMore || isLoadingMore) {
      return;
    }

    onLoadMore();
  }, [hasMore, isLoadingMore, onLoadMore]);

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const element = event.currentTarget;
    const distanceFromBottom =
      element.scrollHeight - element.scrollTop - element.clientHeight;

    if (distanceFromBottom < 48) {
      tryLoadMore();
    }
  };

  useEffect(() => {
    const root = scrollContainerRef.current;
    const sentinel = loadMoreSentinelRef.current;

    if (!root || !sentinel || !onLoadMore || !hasMore) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          tryLoadMore();
        }
      },
      { root, rootMargin: "64px", threshold: 0 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [
    displayOptions.length,
    hasMore,
    isLoadingMore,
    onLoadMore,
    tryLoadMore,
  ]);

  return (
    <ListboxOptions
      anchor={placement === "top" ? "top start" : "bottom start"}
      className={clsx(
        "z-300 max-h-64 w-(--button-width) overflow-hidden rounded-lg border border-slate-200 bg-white p-0 shadow-lg [--anchor-gap:0.25rem] dark:border-slate-700 dark:bg-gray-800",
        optionsClassName,
      )}
    >
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="max-h-[inherit] overflow-auto p-1"
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
                className="h-9 w-full rounded border border-slate-200 bg-white pl-8 pr-3 text-sm text-slate-700 shadow-none outline-none transition placeholder:text-slate-400 focus:outline-none focus:ring-0 dark:border-slate-700 dark:bg-gray-900 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
            </div>
          </div>
        )}

        {displayOptions.length === 0 ? (
          <div className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
            {isSearching ? "Searching..." : "No options found"}
          </div>
        ) : (
          displayOptions.map((option, index) => (
            <ListboxOption
              key={`${String(option.value)}-${index}`}
              value={option.value}
              title={option.label}
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
                  <span
                    title={option.label}
                    className={clsx("truncate", isSelected && "font-medium")}
                  >
                    {option.label}
                  </span>
                  {isSelected && <Check size={14} className="shrink-0" />}
                </div>
              )}
            </ListboxOption>
          ))
        )}

        {isSearching && displayOptions.length > 0 && (
          <div className="px-4 py-2 text-xs text-slate-500 dark:text-slate-400">
            Searching...
          </div>
        )}

        {hasMore && (
          <div ref={loadMoreSentinelRef} className="h-px" aria-hidden="true" />
        )}

        {isLoadingMore && (
          <div className="px-4 py-2 text-xs text-slate-500 dark:text-slate-400">
            Loading more...
          </div>
        )}
      </div>
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
  filterOptionsLocally,
  onLoadMore,
  hasMore,
  isLoadingMore,
  isSearching,
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
          "relative w-full appearance-none cursor-pointer rounded border bg-white pr-8 text-left text-slate-900 shadow-none transition focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 dark:bg-gray-800 dark:text-gray-100",
          error ? "border-red-500" : "border-gray-300 dark:border-gray-600",
          "px-4 py-2",
          className,
        )}
      >
        <span
          title={selected?.label}
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
          filterOptionsLocally={filterOptionsLocally}
          onLoadMore={onLoadMore}
          hasMore={hasMore}
          isLoadingMore={isLoadingMore}
          isSearching={isSearching}
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
  searchValue,
  onSearchChange,
  filterOptionsLocally = true,
  onLoadMore,
  hasMore,
  isLoadingMore,
  isSearching,
}: Props) {
  const id = useId();
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [placement, setPlacement] = useState<SelectPlacement>("bottom");
  const [internalSearch, setInternalSearch] = useState("");
  // Keep the last matched option so remote/paginated lists can clear search
  // (and swap option pages) without wiping the selected label from the trigger.
  const [cachedSelected, setCachedSelected] = useState<SelectOption | null>(
    null,
  );
  const search = searchValue ?? internalSearch;
  const matched = useMemo(
    () => options.find((o) => String(o.value) === String(value)),
    [options, value],
  );
  const selected =
    matched ??
    (cachedSelected && String(cachedSelected.value) === String(value)
      ? cachedSelected
      : undefined);
  const optionsWithSelected = useMemo(() => {
    if (!selected) return options;
    if (options.some((o) => String(o.value) === String(selected.value))) {
      return options;
    }
    return [selected, ...options];
  }, [options, selected]);

  useEffect(() => {
    if (matched) {
      setCachedSelected(matched);
      return;
    }

    if (value === undefined || value === null || value === "") {
      setCachedSelected(null);
    }
  }, [matched, value]);

  const setSearch = useCallback(
    (nextValue: string) => {
      onSearchChange?.(nextValue);
      if (searchValue === undefined) {
        setInternalSearch(nextValue);
      }
    },
    [onSearchChange, searchValue],
  );

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
          const nextSelected = options.find(
            (o) => String(o.value) === String(nextValue),
          );
          if (nextSelected) {
            setCachedSelected(nextSelected);
          }
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
            options={optionsWithSelected}
            optionsClassName={optionsClassName}
            placement={placement}
            placeholder={placeholder}
            search={search}
            searchable={searchable}
            searchPlaceholder={searchPlaceholder}
            selected={selected}
            setSearch={setSearch}
            updatePlacement={updatePlacement}
            filterOptionsLocally={filterOptionsLocally}
            onLoadMore={onLoadMore}
            hasMore={hasMore}
            isLoadingMore={isLoadingMore}
            isSearching={isSearching}
          />
        )}
      </Listbox>

      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
