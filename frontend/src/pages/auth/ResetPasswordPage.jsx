// src/pages/auth/ResetPasswordPage.jsx
// Responsibility: new-password form after clicking the reset email link.
// Reads ?token= from the URL. On success → user is logged in automatically.
import { useState } from "react";
import { useAuth }     from "../../context/AuthContext";
import { useAuthForm } from "../../hooks/useAuthForm";
import AuthCard        from "../../components/auth/AuthCard";
import AuthInput       from "../../components/auth/AuthInput";
import AuthError       from "../../components/auth/AuthError";

export default function ResetPasswordPage({ theme: T }) {
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const { resetPassword } = useAuth();
  const { loading, error, setError, run } = useAuthForm();

  // Read token from URL: /reset-password?token=abc123
  const token = new URLSearchParams(window.location.search).get("token");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) return setError("Passwords do not match.");
    if (password.length < 8)  return setError("Password must be at least 8 characters.");
    if (!token)               return setError("Reset token missing. Please use the link from your email.");
    await run(() => resetPassword(token, password));
    // On success AuthContext.setUser fires → App renders main app
  };

  if (!token) {
    return (
      <AuthCard subtitle="Invalid reset link" theme={T}>
        <div style={{ textAlign: "center", padding: "20px 0", color: T.textFaint, fontSize: 14 }}>
          This reset link is invalid or has expired.
          <br /><br />
          Please request a new one from the login page.
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard subtitle="Set a new password" theme={T}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <AuthInput label="New Password" type="password" placeholder="Min. 8 characters"
          value={password} onChange={e => setPassword(e.target.value)} required autoFocus theme={T} />
        <AuthInput label="Confirm New Password" type="password" placeholder="Repeat new password"
          value={confirm} onChange={e => setConfirm(e.target.value)} required theme={T} />

        <AuthError message={error} />

        <button type="submit" disabled={loading}
          style={{
            background: loading ? T.cardAlt : "linear-gradient(135deg,#3b82f6,#1d4ed8)",
            border: "none", borderRadius: 10, padding: "13px", width: "100%",
            color: loading ? T.textFaint : "#fff", fontSize: 15, fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer", transition: "all .2s",
          }}>
          {loading ? "Saving…" : "Set New Password"}
        </button>
      </form>
    </AuthCard>
  );
}