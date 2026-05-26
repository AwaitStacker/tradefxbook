// src/components/auth/AuthCard.jsx
// Responsibility: provide consistent page layout + card shell for all auth pages.
// Logo, title, subtitle live here so every auth page looks the same.
export default function AuthCard({ title, subtitle, children, theme: T }) {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: T.bg, padding: "20px",
    }}>
      <div style={{
        background: T.card, border: `1px solid ${T.border}`,
        borderRadius: 20, padding: "40px 36px", width: "100%", maxWidth: 420,
        boxShadow: "0 20px 60px rgba(0,0,0,.4)",
      }}>
        {/* Brand */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>📊</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: T.text }}>TradeFXBook</div>
          {subtitle && (
            <div style={{ fontSize: 13, color: T.textFaint, marginTop: 4 }}>{subtitle}</div>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}