// src/components/auth/AuthDivider.jsx
// Responsibility: render the "or" visual divider on auth pages.
export default function AuthDivider({ text = "or", theme: T }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "4px 0" }}>
      <div style={{ flex: 1, height: 1, background: T.border }} />
      <span style={{ fontSize: 11, color: T.textFaintest, fontWeight: 600, letterSpacing: 1 }}>
        {text.toUpperCase()}
      </span>
      <div style={{ flex: 1, height: 1, background: T.border }} />
    </div>
  );
}