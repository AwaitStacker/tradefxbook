// src/services/api/authService.js
// Responsibility: ALL auth HTTP calls. Components import this — never import apiClient directly.
import apiClient from "./apiClient";

const setAuthTokens = ({ accessToken, refreshToken, user }) => {
  localStorage.setItem("tfb_access_token",  accessToken);
  localStorage.setItem("tfb_refresh_token", refreshToken);
  localStorage.setItem("tfb_user",          JSON.stringify(user));
};

const clearAuthTokens = () => {
  localStorage.removeItem("tfb_access_token");
  localStorage.removeItem("tfb_refresh_token");
  localStorage.removeItem("tfb_user");
};

export const authService = {
  // ── Local email+password ────────────────────────────────────────────────
  signup: async (name, email, password) => {
    const { data } = await apiClient.post("/auth/signup", { name, email, password });
    // signup returns requiresOTP:true — no tokens yet
    return data;
  },

  verifyOTP: async (email, otp) => {
    const { data } = await apiClient.post("/auth/verify-otp", { email, otp });
    setAuthTokens(data);
    return data;
  },

  resendOTP: async (email) => {
    const { data } = await apiClient.post("/auth/resend-otp", { email });
    return data;
  },

  login: async (email, password) => {
    const { data } = await apiClient.post("/auth/login", { email, password });
    // login returns requiresOTP:true if not verified
    if (data.accessToken) setAuthTokens(data);
    return data;
  },

  // ── Google OAuth ─────────────────────────────────────────────────────────
  googleLogin: async (idToken) => {
    const { data } = await apiClient.post("/auth/google", { idToken });
    setAuthTokens(data);
    return data;
  },

  // ── Password reset ────────────────────────────────────────────────────────
  forgotPassword: async (email) => {
    const { data } = await apiClient.post("/auth/forgot-password", { email });
    return data;
  },

  resetPassword: async (token, newPassword) => {
    const { data } = await apiClient.post("/auth/reset-password", { token, newPassword });
    setAuthTokens(data);
    return data;
  },

  // ── Session ──────────────────────────────────────────────────────────────
  logout: async () => {
    try { await apiClient.post("/auth/logout"); } catch {}
    clearAuthTokens();
  },

  getMe: async () => {
    const { data } = await apiClient.get("/auth/me");
    return data.user;
  },

  updateProfile: async (updates) => {
    const { data } = await apiClient.patch("/auth/me", updates);
    localStorage.setItem("tfb_user", JSON.stringify(data.user));
    return data.user;
  },

  changePassword: async (currentPassword, newPassword) => {
    const { data } = await apiClient.patch("/auth/change-password", { currentPassword, newPassword });
    setAuthTokens(data);
    return data;
  },

  getCachedUser: () => {
    try { return JSON.parse(localStorage.getItem("tfb_user") || "null"); } catch { return null; }
  },

  isLoggedIn: () => !!localStorage.getItem("tfb_access_token"),
};