// src/pages/auth/ForgotPasswordPage.jsx
// Responsibility: "forgot password" form.
// Always shows the "sent" confirmation after submit — matching backend behavior
// (backend always returns 200 to prevent email enumeration attacks).
import { useState } from "react";
import { useAuth }     from "../../context/AuthContext";
import { useAuthForm } from "../../hooks/useAuthForm";
import AuthCard        from "../../components/auth/AuthCard";
import AuthInput       from "../../components/auth/AuthInput";
import AuthError       from "../../components/auth/AuthError";

export default function ForgotPasswordPage({ theme: T, onBack }) {
  const [email, setEmail] = useState("");
  const [sent,  setSent]  = useState(false);
  const { forgotPassword }           = useAuth();
  const { loading, error, run }      = useAuthForm();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    // run() catches errors internally. Backend always returns 200 for security,
    // so we show success UI regardless — same UX as production apps (Gmail, etc.)
    await run(() => forgotPassword(email));
    // Always show sent screen after attempt (prevents email enumeration via UI)
    setSent(true);
  };

  if (sent) {
    return (
      <AuthCard subtitle="Check your inbox" theme={T}>
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 8 }}>
            Reset link sent
          </div>
          <div style={{ fontSize: 13, color: T.textFaint, lineHeight: 1.7, marginBottom: 24 }}>
            If <strong style={{ color: T.text }}>{email}</strong> is registered,
            you'll receive a reset link within a few minutes. Check your spam folder too.
            The link expires in 1 hour.
          </div>
          <button onClick={onBack}
            style={{ background: "none", border: `1px solid ${T.border2}`, borderRadius: 10,
              padding: "11px 24px", color: T.text, cursor: "pointer", fontSize: 14, fontWeight: 600 }}>
            ← Back to Login
          </button>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard subtitle="Reset your password" theme={T}>
      <p style={{ fontSize: 13, color: T.textFaint, marginBottom: 20, lineHeight: 1.7 }}>
        Enter your registered email address and we'll send a secure reset link.
      </p>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <AuthInput
          label="Email address"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          autoFocus
          theme={T}
        />

        <AuthError message={error} />

        <button type="submit" disabled={loading || !email.trim()}
          style={{
            background: (loading || !email.trim()) ? T.cardAlt : "linear-gradient(135deg,#3b82f6,#1d4ed8)",
            border: "none", borderRadius: 10, padding: "13px", width: "100%",
            color: (loading || !email.trim()) ? T.textFaint : "#fff",
            fontSize: 15, fontWeight: 700,
            cursor: (loading || !email.trim()) ? "not-allowed" : "pointer",
            transition: "all .2s",
          }}>
          {loading ? "Sending…" : "Send Reset Link"}
        </button>

        <button type="button" onClick={onBack}
          style={{ background: "none", border: "none", color: T.textFaint,
            cursor: "pointer", fontSize: 13, padding: "8px", textAlign: "center" }}>
          ← Back to Login
        </button>
      </form>
    </AuthCard>
  );
}