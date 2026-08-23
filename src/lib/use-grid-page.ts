import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  GRID_PARAM_KEYS,
  readGridState,
  sameGridState,
} from "@/lib/grid-state-memory";
import { useGridUrlState } from "@/lib/use-grid-url-state";
import { useServerPagination } from "@/lib/use-server-pagination";

/**
 * Everything a server-driven grid page needs: pagination, the URL-backed
 * search/filter/sort/group state, and the debounce between the two.
 *
 * Twenty-three pages used to hand-roll this block. Every copy had the same two
 * defects, so both are fixed here once:
 *
 *  1. `searchInput` was seeded with `useState(url.search)`, which runs only on
 *     mount. React reuses the same component when you navigate between two
 *     agents or two brands (`/email/mariz-cabido` -> `/email/tom-silver`
 *     renders the same `AgentEmail` element in the same slot), so the previous
 *     agent's search term survived and the effect below immediately wrote it
 *     back onto the new agent's URL. `resetKey` fixes that.
 *
 *  2. Pages gated their whole render on `isLoading`. Combined with a query key
 *     that contains the search term, every debounced keystroke unmounted the
 *     page — including the input being typed into. Use `showSkeleton` for the
 *     first load only and `isRefreshing` for everything after.
 */
export type UseGridPageOptions = {
  /**
   * Identity of the data set being shown — an agent slug, a brand code, a tab.
   * Each value keeps its own filters: switching to a different agent shows that
   * agent's state (empty the first time), and coming back restores what you
   * left rather than starting over.
   */
  resetKey?: string | null;
  /** Debounce before a keystroke reaches the URL and the API. */
  debounceMs?: number;
  /** Starting rows-per-page, for grids that don't want the shared default. */
  initialPerPage?: number;
};

export function useGridPage(options: UseGridPageOptions = {}) {
  const { resetKey = null, debounceMs = 300, initialPerPage } = options;

  const { page, perPage, setPage, setPerPage } =
    useServerPagination(initialPerPage);

  // Where this grid's state is remembered. The agent/brand is part of the key,
  // so each one keeps its own and switching between them does not leak.
  const { pathname, search: locationSearch } = useLocation();
  const memoryKey = resetKey ? `${pathname}?${resetKey}` : pathname;

  const url = useGridUrlState(memoryKey);

  // `searchInput` is reset during render, not in an effect, whenever the page
  // identity changes. React reuses this component when you move between two
  // agents, so without this the previous agent's term stays in the box — and
  // an effect would be too late: the debounce effect below runs before the
  // restore effect, so it re-published the old term and the restore then saw a
  // non-empty URL and did nothing.
  const [searchInput, setSearchInput] = useState(
    () => url.search || readGridState(memoryKey)?.search || "",
  );
  const [seenKey, setSeenKey] = useState(memoryKey);

  if (seenKey !== memoryKey) {
    setSeenKey(memoryKey);
    setSearchInput(readGridState(memoryKey)?.search ?? "");
  }

  // The URL is written only when someone types, on a timer this hook owns.
  // Deriving it from a debounced value inside an effect meant the effect also
  // fired on mount and on route changes, which is how the previous agent's
  // search kept following the user around.
  const pushTimer = useRef<number | undefined>(undefined);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchInput(value);
      window.clearTimeout(pushTimer.current);
      pushTimer.current = window.setTimeout(() => {
        url.setSearch(value);
      }, debounceMs);
    },
    [debounceMs, url],
  );

  // Leaving the page cancels a pending write, so a half-typed term never lands
  // on the page you moved to.
  useEffect(
    () => () => window.clearTimeout(pushTimer.current),
    [memoryKey],
  );

  // Any change to the query means the current page number is meaningless.
  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url.grid]);

  // Restore on arrival. Idempotent by design rather than guarded by a ref: it
  // re-runs whenever the URL changes and does nothing once the URL carries
  // state. A ref-guarded version broke under StrictMode, whose second pass
  // took the early return and skipped the restore entirely.
  //
  // A URL that already has params always wins, so a pasted link opens as sent.
  useEffect(() => {
    const params = new URLSearchParams(locationSearch);
    if (GRID_PARAM_KEYS.some((key) => params.get(key))) return;

    const saved = readGridState(memoryKey);
    if (!saved || sameGridState(saved, params)) return;

    url.setAll(saved);
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memoryKey, locationSearch]);

  return {
    page,
    perPage,
    setPage,
    setPerPage,
    url,
    searchInput,
    /** Wired to the search box; owns the debounce and the URL write. */
    setSearchInput: handleSearchChange,
    /**
     * The settled term — i.e. what is in the URL. A couple of data hooks take
     * it as an explicit argument as well as reading `url.grid`.
     */
    debouncedSearch: url.grid.search ?? "",
  };
}

/**
 * Splits a query's loading state into the two cases a grid actually has.
 *
 * `showSkeleton` is the genuine cold start, when there is nothing to display.
 * `isRefreshing` is every load after that — the previous rows are still on
 * screen (see `placeholderData: keepPreviousData`), so the page must stay
 * mounted and show a small inline indicator instead of blanking.
 */
export function gridLoadingState(args: {
  isLoading: boolean;
  isFetching?: boolean;
  hasData: boolean;
}) {
  const { isLoading, isFetching = false, hasData } = args;

  return {
    showSkeleton: isLoading && !hasData,
    isRefreshing: (isFetching || isLoading) && hasData,
  };
}
