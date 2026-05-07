import { encrypt, decrypt } from "./secureStorage";

let accessToken: string | null = null;
let refreshToken: string | null = null;

let initialized = false;
let initPromise: Promise<void> | null = null;

const ACCESS_KEY = "app_access_token";
const REFRESH_KEY = "app_refresh_token";

function canUseBrowserStorage() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export const tokenService = {
  async init() {
    if (initialized) return;

    if (!initPromise) {
      initPromise = (async () => {
        if (!canUseBrowserStorage()) {
          initialized = true;
          return;
        }

        const storedAccess = localStorage.getItem(ACCESS_KEY);
        const storedRefresh = localStorage.getItem(REFRESH_KEY);

        if (storedAccess) {
          accessToken = await decrypt(storedAccess);
        }

        if (storedRefresh) {
          refreshToken = await decrypt(storedRefresh);
        }

        initialized = true;
      })();
    }

    return initPromise;
  },

  // 🔥 NEW: wait until ready
  async waitForInit() {
    if (!initialized) {
      await this.init();
    }
  },

  getAccessToken() {
    return accessToken;
  },

  getRefreshToken() {
    return refreshToken;
  },

  async setTokens(access: string, refresh: string) {
    accessToken = access;
    refreshToken = refresh;

    if (!canUseBrowserStorage()) {
      return;
    }

    const encAccess = await encrypt(access);
    const encRefresh = await encrypt(refresh);

    localStorage.setItem(ACCESS_KEY, encAccess);
    localStorage.setItem(REFRESH_KEY, encRefresh);
  },

  clear() {
    accessToken = null;
    refreshToken = null;

    if (!canUseBrowserStorage()) {
      return;
    }

    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};
