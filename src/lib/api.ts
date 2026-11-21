import { tokenService } from "./token";
import { setAuthNotice } from "./auth-routing";
import { clearAllGridState } from "./grid-state-memory";

const BASE_URL = import.meta.env.VITE_API_URL;

async function request(url: string, options: RequestInit = {}, retry = true) {
  await tokenService.waitForInit();
  const token = tokenService.getAccessToken();
  const shouldRefreshOnUnauthorized = !url.startsWith("/auth/login");

  const res = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    credentials: "include",
  });

  if (res.status === 401 && retry && shouldRefreshOnUnauthorized) {
    const outcome = await refreshToken();

    if (outcome === "unavailable") {
      // The server or the network is down, not the session. Signing the user
      // out here turned every short outage into a forced re-login; keep the
      // tokens and let the next request try again.
      throw {
        status: 503,
        message: [
          "Can't reach the server right now. Check your connection and try again.",
        ],
        code: "SERVICE_UNAVAILABLE",
      };
    }

    if (outcome === "invalid") {
      const hadToken = tokenService.getAccessToken();

      if (hadToken) {
        logout("Your session has expired. Please sign in again.");
      }
      throw { status: 401, message: ["Unauthorized"] };
    }

    return request(url, options, false);
  }

  // Some failure modes return empty bodies (Next.js HTML error pages, gateway
  // timeouts, network resets). Read text first and parse defensively so the
  // caller gets a real error object instead of a `res.json()` SyntaxError.
  // The return type is intentionally `any` to match the previous res.json()
  // contract — callers cast to their own shape via `as`.
  const text = await res.text();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let data: any = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    const nestedMessage = data?.error?.message;
    const topLevelMessage = data?.message;
    const rawMessage =
      nestedMessage ??
      topLevelMessage ??
      (typeof data?.error === "string" ? data.error : null) ??
      (text && text.length < 200 ? text : null) ??
      `Request failed with status ${res.status}`;

    throw {
      status: res.status,
      message: Array.isArray(rawMessage) ? rawMessage : [rawMessage],
      code: data?.error?.code ?? data?.code ?? "ERROR",
    };
  }

  return data;
}

/**
 * ok           new tokens are stored
 * invalid      the server rejected the refresh token: the session is over
 * unavailable  no answer, or a server-side failure: says nothing about the
 *              session, so it must not end it
 */
type RefreshOutcome = "ok" | "invalid" | "unavailable";

// One refresh at a time. When the access token expires every request on the
// page gets a 401 at once; they all wait on this one call instead of each
// sending its own (six identical refreshes in the same second, before).
let refreshInFlight: Promise<RefreshOutcome> | null = null;

function refreshToken(): Promise<RefreshOutcome> {
  refreshInFlight ??= doRefresh().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

async function doRefresh(): Promise<RefreshOutcome> {
  const refreshToken = tokenService.getRefreshToken();

  if (!refreshToken) return "invalid";

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });
  } catch {
    // fetch only throws when there was no HTTP answer at all.
    return "unavailable";
  }

  // 401/403: the token is expired, revoked or the user was deactivated.
  // 400: the token is malformed. Anything else (5xx, 429, a proxy's HTML
  // error page) is the server's problem, not the session's.
  if (res.status === 400 || res.status === 401 || res.status === 403) {
    return "invalid";
  }
  if (!res.ok) return "unavailable";

  try {
    const data = await res.json();
    await tokenService.setTokens(data.accessToken, data.refreshToken);
    return "ok";
  } catch {
    return "unavailable";
  }
}

export function logout(message?: string) {
  tokenService.clear();
  // Grid filters/sort/grouping live in sessionStorage, which is scoped to the
  // TAB and therefore outlives a logout. Without this, signing in as someone
  // else in the same tab inherits the previous user's filters.
  clearAllGridState();

  if (message) {
    setAuthNotice(message);
  }

  // `replace`, not `href`: assigning href PUSHES a history entry, so the CRM
  // page the user just left stayed one Back press away. Replacing drops it.
  //
  // On its own that is not enough — the browser can still serve the old page
  // from the back/forward cache, fully rendered, without re-running any script
  // that would notice the tokens are gone. `installBfcacheAuthGuard` below
  // closes that door.
  window.location.replace("/");
}

/**
 * Force a reload when a page is restored from the back/forward cache without a
 * valid session.
 *
 * bfcache restores the DOM and JS heap verbatim: after logging out and pressing
 * Back, the CRM re-appears exactly as it was — previous user's rows, filters
 * and all — because no code runs to re-check auth. `pageshow` with
 * `event.persisted` is the one signal that a restore happened, so it is the
 * only place this can be caught.
 *
 * Reloading rather than redirecting keeps the decision in one place: the boot
 * path already sends an unauthenticated visitor to the login screen.
 */
export function installBfcacheAuthGuard() {
  if (typeof window === "undefined") return;

  window.addEventListener("pageshow", (event) => {
    if (!(event as PageTransitionEvent).persisted) return;
    // `hasPersistedSession`, NOT the in-memory token: bfcache restores the JS
    // heap, so an older page comes back with its access token, its React Query
    // cache and its `user` object all intact. PrivateRoute sees a user and
    // renders the CRM, then every request 401s — which is exactly what the
    // tester hit: "it opened the account, but nothing loaded". localStorage is
    // the only thing logout actually emptied.
    if (tokenService.hasPersistedSession()) return;
    window.location.reload();
  });
}

export const api = {
  get: (url: string) => request(url),
  post: (url: string, body: unknown) =>
    request(url, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  put: (url: string, body: unknown) =>
    request(url, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  patch: (url: string, body: unknown) =>
    request(url, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  delete: (url: string, body?: unknown) =>
    request(url, {
      method: "DELETE",
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    }),
};
