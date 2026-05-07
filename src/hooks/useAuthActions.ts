
import { useMutation } from "@tanstack/react-query";
import { authApi } from "@/lib/services/auth.service";
import { tokenService } from "@/lib/token";
import { getDashboardRouteForRole, setAuthNotice } from "@/lib/auth-routing";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { delay } from "@/lib/utils";
import { logout as clearSessionAndRedirect } from "@/lib/api";

type MutationError = unknown;

export function useSignup() {
  return useMutation({
    mutationFn: authApi.signup,
    onSuccess: async () => {
      showSuccessToast("Signup successful! Redirecting to login...");
      await delay(500);
      window.location.href = "/";
    },
    onError: (error: MutationError) => {
      showErrorToast(error);
    },
  });
}

export function useVerifyEmail() {
  return useMutation({
    mutationFn: authApi.verifyEmail,
    onSuccess: async () => {
      showSuccessToast("Email verified successfully! Redirecting to login...");
      await delay(500);
      window.location.href = "/";
    },
    onError: (error: MutationError) => {
      showErrorToast(error);
    },
  });
}

export function useResendVerification() {
  return useMutation({
    mutationFn: authApi.resendVerification,
    onSuccess: () => {
      showSuccessToast("Verification email sent! Please check your inbox.");
    },
    onError: (error: MutationError) => {
      showErrorToast(error);
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: authApi.forgotPassword,
    onSuccess: async () => {
      showSuccessToast(
        "Password reset link sent to your email! Please check your inbox.",
      );
      await delay(500);
      window.location.href = "/";
    },
    onError: (error: MutationError) => {
      showErrorToast(error);
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: authApi.resetPassword,
    onSuccess: async () => {
      showSuccessToast("Password reset successful! Redirecting to login...");
      await delay(500);
      window.location.href = "/";
    },
    onError: (error: MutationError) => {
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
      await delay(500);
      window.location.href = getDashboardRouteForRole(data.user.role);
    },
    onError: (error: MutationError) => {
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
