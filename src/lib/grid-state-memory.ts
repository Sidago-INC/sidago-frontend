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

/** True when the snapshot would change nothing about the current params. */
export function sameGridState(
  snapshot: GridStateSnapshot,
  params: URLSearchParams,
): boolean {
  return GRID_KEYS.every(
    (key) => (snapshot[key] ?? "") === (params.get(key) ?? ""),
  );
}
