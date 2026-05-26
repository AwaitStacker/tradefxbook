// src/components/auth/AuthInput.jsx
// Responsibility: reusable themed input for all auth pages.
// Keeps input styling consistent and avoids duplication.
import { useState } from "react";

export default function AuthInput({
  label, type = "text", placeholder, value, onChange,
  required, autoFocus, theme: T,
}) {
  const [showPwd, setShowPwd] = useState(false);
  const isPassword = type === "password";
  const inputType  = isPassword ? (showPwd ? "text" : "password") : type;

  return (
    <div>
      {label && (
        <label style={{ fontSize: 12, color: T.textFaint, fontWeight: 600,
          marginBottom: 6, display: "block" }}>
          {label}
        </label>
      )}
      <div style={{ position: "relative" }}>
        <input
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          autoFocus={autoFocus}
          style={{
            width: "100%", background: T.input, border: `1px solid ${T.border2}`,
            borderRadius: 10, padding: isPassword ? "12px 44px 12px 14px" : "12px 14px",
            color: T.text, fontSize: 14, outline: "none", boxSizing: "border-box",
            transition: "border .2s",
          }}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPwd(v => !v)}
            style={{ position: "absolute", right: 12, top: "50%",
              transform: "translateY(-50%)", background: "none",
              border: "none", cursor: "pointer", fontSize: 16, color: T.textFaint }}
          >
            {showPwd ? "🙈" : "👁️"}
          </button>
        )}
      </div>
    </div>
  );
}