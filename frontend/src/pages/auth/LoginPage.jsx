// src/pages/auth/LoginPage.jsx
// Responsibility: email+password login form + Google button.
// On requiresOTP response → calls onNeedOTP(email) so AuthPage routes to OTP screen.
import { useState } from "react";
import { useAuth }        from "../../context/AuthContext";
import { useAuthForm }    from "../../hooks/useAuthForm";
import AuthCard           from "../../components/auth/AuthCard";
import AuthInput          from "../../components/auth/AuthInput";
import AuthError          from "../../components/auth/AuthError";
import AuthDivider        from "../../components/auth/AuthDivider";
import GoogleButton       from "../../components/auth/GoogleButton";

export default function LoginPage({ theme: T, onSwitch, onNeedOTP }) {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const { login, googleLogin }  = useAuth();
  const { loading, error, setError, run } = useAuthForm();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = await run(() => login(email, password));
    if (data?.requiresOTP) onNeedOTP(email);
    // If login succeeded, AuthContext sets user → App re-renders automatically
  };

  const handleGoogle = async (idToken) => {
    await run(() => googleLogin(idToken));
  };

  const btnStyle = {
    background: loading ? T.cardAlt : "linear-gradient(135deg,#3b82f6,#1d4ed8)",
    border: "none", borderRadius: 10, padding: "13px", width: "100%",
    color: loading ? T.textFaint : "#fff", fontSize: 15, fontWeight: 700,
    cursor: loading ? "not-allowed" : "pointer",
    boxShadow: loading ? "none" : "0 4px 20px #3b82f655",
    transition: "all .2s",
  };

  return (
    <AuthCard subtitle="Sign in to your trading journal" theme={T}>
      {/* Tab row */}
      <div style={{ display: "flex", background: T.cardAlt, borderRadius: 10, padding: 4, marginBottom: 24 }}>
        {[["login","Login"],["signup","Sign Up"]].map(([m, label]) => (
          <button key={m} onClick={() => m === "signup" && onSwitch()}
            style={{ flex: 1, padding: "9px", borderRadius: 8, border: "none", cursor: "pointer",
              fontWeight: 700, fontSize: 13,
              background: m === "login" ? "#3b82f6" : "transparent",
              color: m === "login" ? "#fff" : T.textFaint }}>
            {label}
          </button>
        ))}
      </div>

      {/* Google */}
      <GoogleButton
        onSuccess={handleGoogle}
        onError={setError}
        disabled={loading}
        theme={T}
      />

      <AuthDivider text="or continue with email" theme={T} />

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <AuthInput label="Email" type="email" placeholder="you@example.com"
          value={email} onChange={e => setEmail(e.target.value)} required theme={T} />
        <AuthInput label="Password" type="password" placeholder="Your password"
          value={password} onChange={e => setPassword(e.target.value)} required theme={T} />

        <div style={{ textAlign: "right", marginTop: -6 }}>
          <button type="button" onClick={() => onSwitch("forgot")}
            style={{ background: "none", border: "none", color: "#3b82f6", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
            Forgot password?
          </button>
        </div>

        <AuthError message={error} />

        <button type="submit" disabled={loading} style={btnStyle}>
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </form>

      <div style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: T.textFaintest }}>
        Your trades are private and synced to the cloud.
      </div>
    </AuthCard>
  );
}