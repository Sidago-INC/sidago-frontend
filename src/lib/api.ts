import { tokenService } from "./token";
import { setAuthNotice } from "./auth-routing";

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
    const refreshed = await refreshToken();

    if (!refreshed) {
      const hadToken = tokenService.getAccessToken();

      if (hadToken) {
        logout("Your session has expired. Please sign in again.");
      }
      throw { status: 401, message: ["Unauthorized"] };
    }

    return request(url, options, false);
  }

  const data = await res.json();

  if (!res.ok) {
    throw {
      status: res.status,
      message: Array.isArray(data?.message)
        ? data.message
        : [data?.message || data?.error || "Something went wrong"],
      code: data?.code || "ERROR",
    };
  }

  return data;
}

async function refreshToken() {
  try {
    const refreshToken = tokenService.getRefreshToken();

    if (!refreshToken) return false;

    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) return false;

    const data = await res.json();

    await tokenService.setTokens(data.accessToken, data.refreshToken);

    return true;
  } catch {
    return false;
  }
}

export function logout(message?: string) {
  tokenService.clear();

  if (message) {
    setAuthNotice(message);
  }

  window.location.href = "/";
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
