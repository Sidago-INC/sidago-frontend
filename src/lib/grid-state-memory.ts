/**
 * Remembers a grid's search / filters / sort / grouping per page, for the
 * length of the browser session.
 *
 * Two QA reports pull in opposite directions and both are right:
 *
 *   "Selecting a filter for one agent then switching to another does not clear
 *    it — the new agent's list should start unfiltered."
 *
 *   "I put filters on Chris's email page, went to Mariz and came back, and
 *    everything was gone."
 *
 * The resolution is that grid state is per page, not global and not thrown
 * away. Each route keeps its own; moving to a different agent shows that
 * agent's state (empty the first time), and coming back restores what you left.
 *
 * State lives in the URL so a filtered view can still be copied and shared.
 * This only covers the gap React Router leaves: navigating to a new path drops
 * the query string, so without somewhere to put it the state is simply lost.
 *
 * sessionStorage, not localStorage: filters should not outlive the tab. It also
 * works in a private window, which is what the tester was using.
 */
const PREFIX = "sidago.grid:";

/** The grid params, exactly as they appear in the query string. */
export type GridStateSnapshot = {
  search?: string;
  filters?: string;
  sort?: string;
  groupBy?: string;
};

/** The four params that make up a grid view. */
export const GRID_PARAM_KEYS = [
  "search",
  "filters",
  "sort",
  "groupBy",
] as const;

const GRID_KEYS = GRID_PARAM_KEYS;

function storage(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    // Storage can be disabled outright; the grid still works, it just forgets.
    return null;
  }
}

/** Everything after the origin identifies the grid — path plus any agent id. */
export function gridStateKey(pathname: string): string {
  return PREFIX + pathname;
}

/**
 * Forget every remembered grid view.
 *
 * sessionStorage is scoped to the TAB, not to the session — it outlives a
 * logout, so signing out and signing back in as someone else in the same tab
 * handed the second person the first person's filters. Reported after the
 * migration: a "Timezone is INTL" filter set by one user was still applied for
 * the next.
 *
 * Called from `logout()`, which is the single exit point for both the menu
 * action and an expired-token redirect, so there is no way out of the app that
 * skips it.
 */
export function clearAllGridState(): void {
  const store = storage();
  if (!store) return;

  try {
    const keys: string[] = [];
    for (let i = 0; i < store.length; i += 1) {
      const key = store.key(i);
      if (key && key.startsWith(PREFIX)) keys.push(key);
    }
    // Collected first: removing during iteration reindexes the store.
    for (const key of keys) store.removeItem(key);
  } catch {
    // Storage disabled — nothing was remembered in the first place.
  }
}

export function readGridState(pathname: string): GridStateSnapshot | null {
  const store = storage();
  if (!store) return null;

  try {
    const raw = store.getItem(gridStateKey(pathname));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GridStateSnapshot;
    return typeof parsed === "object" && parsed !== null ? parsed : null;
  } catch {
    return null;
  }
}

export function writeGridState(
  pathname: string,
  snapshot: GridStateSnapshot,
): void {
  const store = storage();
  if (!store) return;

  const cleaned: GridStateSnapshot = {};
  for (const key of GRID_KEYS) {
    const value = snapshot[key];
    if (value) cleaned[key] = value;
  }

  try {
    if (Object.keys(cleaned).length === 0) {
      // Nothing set — forget the page rather than storing an empty object, so
      // clearing your filters really does clear them next time.
      store.removeItem(gridStateKey(pathname));
      return;
    }
    store.setItem(gridStateKey(pathname), JSON.stringify(cleaned));
  } catch {
    // Quota or private-mode write failure: not worth breaking the page over.
  }
}

/**
 * The same memory, for a page's OWN query params.
 *
 * Some pages have filters that are not part of the shared grid — the Fix Queue
 * has a contacts bucket, a timezone and a has-other-contacts toggle. Putting
 * them in the URL makes them survive Back and a refresh, but NOT a fresh
 * navigation: clicking "Fix Leads" in the sidebar goes to a bare path and the
 * query string is dropped, which is the very gap this module exists to close.
 * Without this, the built-in Filter/Sort/Group came back and the page's own
 * filters did not — which reads as "the filters don't save" even though the
 * grid ones do.
 *
 * Stored under the same `sidago.grid:` prefix on purpose: `clearAllGridState()`
 * matches on that prefix, so these are wiped on logout too. Anything stored
 * outside it would leak one user's filters to the next in the same tab, which
 * is exactly the bug that prefix was introduced to fix.
 */
const PARAMS_PREFIX = `${PREFIX}params:`;

export function readPageParams(pathname: string): Record<string, string> {
  const store = storage();
  if (!store) return {};
  try {
    const raw = store.getItem(PARAMS_PREFIX + pathname);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, string>;
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

export function writePageParams(
  pathname: string,
  params: Record<string, string>,
): void {
  const store = storage();
  if (!store) return;

  const cleaned: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value) cleaned[key] = value;
  }

  try {
    if (Object.keys(cleaned).length === 0) {
      // Clearing every filter must really clear it, not leave an empty object
      // that gets restored as "something was remembered".
      store.removeItem(PARAMS_PREFIX + pathname);
      return;
    }
    store.setItem(PARAMS_PREFIX + pathname, JSON.stringify(cleaned));
  } catch {
    // Quota or private-mode write failure: not worth breaking the page over.
  }
}

/** True when the snapshot would change nothing about the current params. */
export function sameGridState(
  snapshot: GridStateSnapshot,
  params: URLSearchParams,
): boolean {
  return GRID_KEYS.every(
    (key) => (snapshot[key] ?? "") === (params.get(key) ?? ""),
  );
}
