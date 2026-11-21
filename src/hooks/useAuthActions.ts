

import { useMutation } from "@tanstack/react-query";
import { authApi } from "@/lib/services/auth.service";
import { tokenService } from "@/lib/token";
import { getDashboardRouteForRole, setAuthNotice } from "@/lib/auth-routing";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { delay } from "@/lib/utils";
import { logout as clearSessionAndRedirect } from "@/lib/api";

type MutationError = unknown;

async function redirectAfter(ms: number, path: string) {
  await delay(ms);
  window.location.href = path;
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: authApi.forgotPassword,
    onSuccess: async () => {
      showSuccessToast(
        "Password reset link sent to your email! Please check your inbox.",
      );
      await redirectAfter(500, "/");
    },
    onError: (error: unknown) => {
      showErrorToast(error);
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: authApi.resetPassword,
    onSuccess: async () => {
      showSuccessToast("Password reset successful! Redirecting to login...");
      await redirectAfter(500, "/");
    },
    onError: (error: unknown) => {
      showErrorToast(error);
    },
  });
}

export function useLogin() {
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: async (data) => {
      await tokenService.setTokens(data.accessToken, data.refreshToken);
      showSuccessToast("Login successful! Redirecting to dashboard...");
      await redirectAfter(500, getDashboardRouteForRole(data.user.role));
    },
    onError: (error: unknown) => {
      showErrorToast(error);
    },
  });
}

export function useLogout() {
  return useMutation({
    mutationFn: async () => {
      const refreshToken = tokenService.getRefreshToken();
      if (refreshToken) {
        try {
          await authApi.logout({ refreshToken });
        } catch {
          // Server-side revocation is best-effort; never block logout UX.
        }
      }
    },
    onSuccess: () => {
      setAuthNotice("You have been logged out successfully.");
      clearSessionAndRedirect();
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: authApi.changePassword,
    onSuccess: async () => {
      showSuccessToast("Password changed. Please sign in again.");
      tokenService.clear();
      await delay(800);
      window.location.href = "/";
    },
    onError: (error: MutationError) => {
      showErrorToast(error);
    },
  });
}
