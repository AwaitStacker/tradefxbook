// ─── NAVBAR ───────────────────────────────────────────────────────────────────
function Navbar({ page, analyticsTab, clock, isDark, setIsDark, openAdd, user, onLogout, theme: T }) {
  const titles = {
    dashboard: "Dashboard",
    trades: "Trades",
    journal: "Journal",
    aireport: "AI Report",
    analytics: analyticsTab === "tradeanalysis" ? "Trade Analysis" : "Performance Analytics"
  };
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 28px", borderBottom: `1px solid ${T.border}`, background: T.sidebar, flexShrink: 0 }}>
      <div>
        <div style={{ fontSize: 20, fontWeight: 700, color: T.text }}>{titles[page] || page}</div>
        <div style={{ fontSize: 12, color: T.textFaint }}>{clock.short} • IST</div>
      </div>
      <div style={{ flex: 1, maxWidth: 380, margin: "0 20px", background: T.input, border: `1px solid ${T.border2}`, borderRadius: 10, display: "flex", alignItems: "center", padding: "8px 14px", gap: 8 }}>
        <span style={{ color: T.textFaintest }}>🔍</span>
        <input placeholder="Search..." style={{ background: "none", border: "none", outline: "none", color: T.textMuted, fontSize: 13.5, flex: 1 }} />
        <span style={{ fontSize: 11, color: T.textFaintest, background: T.hover, padding: "2px 6px", borderRadius: 5, fontFamily: "monospace" }}>Ctrl+K</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button className="tfb-btn" onClick={() => setIsDark(d => !d)} title="Toggle Theme" style={{ background: T.cardAlt, border: `1px solid ${T.border2}`, borderRadius: 8, width: 36, height: 36, cursor: "pointer", color: T.textMuted, fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {isDark ? "☀️" : "🌙"}
        </button>
        <button className="tfb-btn" onClick={openAdd} style={{ background: "linear-gradient(135deg,#3b82f6,#1d4ed8)", border: "none", borderRadius: 8, padding: "0 16px", height: 36, cursor: "pointer", color: "#fff", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
          + Add Trade
        </button>
        <div style={{ background: T.cardAlt, border: `1px solid ${T.border2}`, borderRadius: 8, padding: "6px 12px", fontSize: 12, color: T.textMuted, display: "flex", alignItems: "center", gap: 6, fontFamily: "monospace" }}>
          🕐 {clock.time}
        </div>
        <button style={{ background: T.cardAlt, border: `1px solid ${T.border2}`, borderRadius: 8, width: 36, height: 36, cursor: "pointer", color: T.textMuted, fontSize: 16 }}>🔔</button>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer" }}>IK</div>
      </div>
      {user && (
        <button onClick={onLogout} style={{ background: "linear-gradient(135deg,#3b82f6,#1d4ed8)", border: "none", borderRadius: 8, padding: "0 16px", height: 36, cursor: "pointer", color: "#fff", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
          Logout ({user.name})
        </button>
      )}
    </div>
  );
}

export default Navbar;
