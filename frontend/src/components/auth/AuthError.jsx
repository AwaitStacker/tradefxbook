// src/components/auth/AuthError.jsx
// Responsibility: display error messages consistently on all auth pages.
export default function AuthError({ message }) {
  if (!message) return null;
  return (
    <div style={{
      background: "#2a0f0f", border: "1px solid #ef444433",
      borderRadius: 9, padding: "10px 14px",
      fontSize: 13, color: "#f87171",
      display: "flex", alignItems: "flex-start", gap: 8,
    }}>
      <span style={{ flexShrink: 0 }}>⚠️</span>
      <span>{message}</span>
    </div>
  );
}