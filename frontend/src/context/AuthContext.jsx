// src/context/AuthContext.jsx
// Responsibility: global auth state — user, loading, all auth actions.
// All pages/hooks read from here. authService handles HTTP. Context handles state.
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authService }  from "../services/api/authService";
import { tradesService } from "../services/api/tradesService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,          setUser]          = useState(null);
  const [authLoading,   setAuthLoading]   = useState(true);
  const [migrationDone, setMigrationDone] = useState(false);

  // ── Restore session on app start ─────────────────────────────────────────
  useEffect(() => {
    const restore = async () => {
      if (authService.isLoggedIn()) {
        try {
          const freshUser = await authService.getMe();
          setUser(freshUser);
        } catch {
          await authService.logout();
          setUser(null);
        }
      }
      setAuthLoading(false);
    };
    restore();

    const onForceLogout = () => setUser(null);
    window.addEventListener("auth:logout", onForceLogout);
    return () => window.removeEventListener("auth:logout", onForceLogout);
  }, []);

  // ── One-time localStorage → DB migration ─────────────────────────────────
  const runMigrationIfNeeded = useCallback(async () => {
    const key = "tfb_migration_done_v2";
    if (localStorage.getItem(key)) return;
    try {
      const raw = localStorage.getItem("tfb_trades_v2");
      if (raw) {
        const trades = JSON.parse(raw);
        if (Array.isArray(trades) && trades.length > 0) {
          await tradesService.bulkImport(trades);
        }
      }
    } catch (e) {
      console.warn("Migration (non-critical):", e.message);
    }
    localStorage.setItem(key, "true");
    setMigrationDone(true);
  }, []);

  // ── Auth actions (called by pages/hooks) ──────────────────────────────────

  // Returns { requiresOTP: true, email } — page then navigates to OTP screen
  const signup = async (name, email, password) => {
    const data = await authService.signup(name, email, password);
    return data; // no setUser yet — OTP pending
  };

  // Called after OTP verified — this is when the user is actually logged in
  const verifyOTP = async (email, otp) => {
    const data = await authService.verifyOTP(email, otp);
    setUser(data.user);
    await runMigrationIfNeeded();
    return data;
  };

  const resendOTP = async (email) => authService.resendOTP(email);

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    if (data.requiresOTP) return data; // page handles OTP redirect
    setUser(data.user);
    await runMigrationIfNeeded();
    return data;
  };

  const googleLogin = async (idToken) => {
    const data = await authService.googleLogin(idToken);
    setUser(data.user);
    await runMigrationIfNeeded();
    return data;
  };

  const forgotPassword = async (email) => authService.forgotPassword(email);

  const resetPassword = async (token, newPassword) => {
    const data = await authService.resetPassword(token, newPassword);
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user, authLoading, migrationDone,
      isAuthenticated: !!user,
      signup, verifyOTP, resendOTP,
      login, googleLogin,
      forgotPassword, resetPassword,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
};