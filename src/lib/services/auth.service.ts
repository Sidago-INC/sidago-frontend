import { api } from "@/lib/api";

export const authApi = {
  signup: (data: { name: string; email: string; password: string }) =>
    api.post("/auth/signup", data),

  verifyEmail: (token: string) => api.get(`/auth/verify?token=${token}`),

  resendVerification: (email: string) =>
    api.post("/auth/resend-verification", { email }),

  forgotPassword: (email: string) =>
    api.post("/auth/forgot-password", { email }),

  resetPassword: (data: { newPassword: string; token: string }) =>
    api.post("/auth/reset-password", data),

  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data),

  logout: (data: { refreshToken: string }) => api.post("/auth/logout", data),

  changePassword: (data: {
    oldPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => api.post("/auth/change-password", data),
};
