// src/pages/auth/OTPPage.jsx
// Responsibility: 6-digit OTP entry form.
// Receives the email that was just signed up.
// On success → AuthContext sets user → App renders main app automatically.
import { useState, useRef, useEffect } from "react";
import { useAuth }     from "../../context/AuthContext";
import { useAuthForm } from "../../hooks/useAuthForm";
import AuthCard        from "../../components/auth/AuthCard";
import AuthError       from "../../components/auth/AuthError";

export default function OTPPage({ theme: T, email, onBack }) {
  const [digits, setDigits] = useState(["","","","","",""]);
  const [resent,  setResent]  = useState(false);
  const inputRefs = useRef([]);
  const { verifyOTP, resendOTP } = useAuth();
  const { loading, error, setError, run } = useAuthForm();

  // Auto-focus first box
  useEffect(() => { inputRefs.current[0]?.focus(); }, []);

  const handleDigit = (idx, val) => {
    const v = val.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[idx] = v;
    setDigits(next);
    if (v && idx < 5) inputRefs.current[idx + 1]?.focus();
    // Auto-submit when all 6 filled
    if (v && idx === 5 && next.every(d => d)) {
      submitOTP(next.join(""));
    }
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === "Backspace" && !digits[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length === 6) {
      setDigits(text.split(""));
      inputRefs.current[5]?.focus();
      submitOTP(text);
    }
  };

  const submitOTP = async (otp) => {
    await run(() => verifyOTP(email, otp));
    // On success AuthContext.setUser fires → App re-renders to main app
  };

  const handleResend = async () => {
    setResent(false);
    const result = await run(() => resendOTP(email));
    if (result) { setResent(true); setDigits(["","","","","",""]); inputRefs.current[0]?.focus(); }
  };

  const boxStyle = (filled) => ({
    width: 48, height: 56, textAlign: "center", fontSize: 22, fontWeight: 700,
    background: T.input, border: `2px solid ${filled ? "#3b82f6" : T.border2}`,
    borderRadius: 10, color: T.text, outline: "none",
    transition: "border .15s",
  });

  return (
    <AuthCard subtitle={`Enter the 6-digit code sent to ${email}`} theme={T}>
      <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 24 }}
        onPaste={handlePaste}>
        {digits.map((d, i) => (
          <input key={i} ref={el => inputRefs.current[i] = el}
            style={boxStyle(!!d)} value={d} maxLength={1} inputMode="numeric"
            onChange={e => handleDigit(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
          />
        ))}
      </div>

      {resent && (
        <div style={{ textAlign: "center", fontSize: 13, color: "#22c55e", marginBottom: 12 }}>
          ✅ New code sent to {email}
        </div>
      )}

      <AuthError message={error} />

      <button
        onClick={() => submitOTP(digits.join(""))}
        disabled={loading || digits.some(d => !d)}
        style={{
          background: loading ? T.cardAlt : "linear-gradient(135deg,#3b82f6,#1d4ed8)",
          border: "none", borderRadius: 10, padding: "13px", width: "100%",
          color: loading ? T.textFaint : "#fff", fontSize: 15, fontWeight: 700,
          cursor: (loading || digits.some(d => !d)) ? "not-allowed" : "pointer",
          marginBottom: 16, transition: "all .2s",
        }}>
        {loading ? "Verifying…" : "Verify Email"}
      </button>

      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
        <button onClick={onBack} style={{ background: "none", border: "none",
          color: T.textFaint, cursor: "pointer" }}>
          ← Back
        </button>
        <button onClick={handleResend} disabled={loading}
          style={{ background: "none", border: "none", color: "#3b82f6",
            cursor: "pointer", fontWeight: 600 }}>
          Resend code
        </button>
      </div>
    </AuthCard>
  );
}