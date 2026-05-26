// src/pages/auth/SignupPage.jsx
// Responsibility: name+email+password signup form + Google button.
// On success → calls onNeedOTP(email) to go to OTP verification screen.
import { useState } from "react";
import { useAuth }      from "../../context/AuthContext";
import { useAuthForm }  from "../../hooks/useAuthForm";
import AuthCard         from "../../components/auth/AuthCard";
import AuthInput        from "../../components/auth/AuthInput";
import AuthError        from "../../components/auth/AuthError";
import AuthDivider      from "../../components/auth/AuthDivider";
import GoogleButton     from "../../components/auth/GoogleButton";

export default function SignupPage({ theme: T, onSwitch, onNeedOTP }) {
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const { signup, googleLogin } = useAuth();
  const { loading, error, setError, run } = useAuthForm();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim())          return setError("Name is required.");
    if (password !== confirm)  return setError("Passwords do not match.");
    if (password.length < 8)   return setError("Password must be at least 8 characters.");

    const data = await run(() => signup(name, email, password));
    if (data?.requiresOTP) onNeedOTP(email);
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
    <AuthCard subtitle="Create your free account" theme={T}>
      {/* Tab row */}
      <div style={{ display: "flex", background: T.cardAlt, borderRadius: 10, padding: 4, marginBottom: 24 }}>
        {[["login","Login"],["signup","Sign Up"]].map(([m, label]) => (
          <button key={m} onClick={() => m === "login" && onSwitch()}
            style={{ flex: 1, padding: "9px", borderRadius: 8, border: "none", cursor: "pointer",
              fontWeight: 700, fontSize: 13,
              background: m === "signup" ? "#3b82f6" : "transparent",
              color: m === "signup" ? "#fff" : T.textFaint }}>
            {label}
          </button>
        ))}
      </div>

      <GoogleButton onSuccess={handleGoogle} onError={setError} disabled={loading} theme={T} />
      <AuthDivider text="or sign up with email" theme={T} />

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <AuthInput label="Full Name" placeholder="Your name"
          value={name} onChange={e => setName(e.target.value)} required theme={T} />
        <AuthInput label="Email" type="email" placeholder="you@example.com"
          value={email} onChange={e => setEmail(e.target.value)} required theme={T} />
        <AuthInput label="Password" type="password" placeholder="Min. 8 characters"
          value={password} onChange={e => setPassword(e.target.value)} required theme={T} />
        <AuthInput label="Confirm Password" type="password" placeholder="Repeat password"
          value={confirm} onChange={e => setConfirm(e.target.value)} required theme={T} />

        <AuthError message={error} />

        <button type="submit" disabled={loading} style={btnStyle}>
          {loading ? "Creating account…" : "Create Account"}
        </button>
      </form>

      <div style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: T.textFaintest }}>
        A 6-digit code will be emailed to verify your address.
      </div>
    </AuthCard>
  );
}