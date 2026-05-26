// src/App.jsx
// Responsibility: root component — wraps AuthProvider, routes auth vs main app.
// Do NOT add business logic here. This file only wires things together.
import { useState }   from "react";
import { AuthProvider, useAuth }              from "./context/AuthContext";
import { useTrades }                          from "./hooks/useTrades";
import { useLocalStorage }                    from "./services/storage/localStorageService";
import { useClock }                           from "./utils/dateUtils";
import { THEMES, GlobalStyles }               from "./styles/globalStyles";
import AuthPage from "./pages/AuthPage";

// Import all your existing components exactly as before
import Sidebar        from "./components/layout/Sidebar";
import Navbar         from "./components/layout/Navbar";
import Dashboard      from "./components/dashboard/Dashboard";
import Trades         from "./components/trades/Trades";
import Journal        from "./components/journal/Journal";
import Analytics      from "./components/analytics/Analytics";
import TradeAnalysis  from "./components/analytics/TradeAnalysis";
import AIReport       from "./components/ai-report/AIReport";
import AddTradeModal  from "./components/trades/AddTradeModal";

// ─── Inner app (only renders when authenticated) ──────────────────────────────
function TradingApp() {
  const { user, logout } = useAuth();
  const { trades, addTrade, updateTrade, deleteTrade, syncing, syncError, cloudMode } = useTrades();

  const [isDark, setIsDark]       = useLocalStorage("tfb_theme", true);
  const [portfolio, setPortfolio] = useLocalStorage("tfb_portfolio", {});
  const [page, setPage]           = useState("dashboard");
  const [analyticsTab, setAnalyticsTab] = useState("performance");
  const [selectedTradeId, setSelectedTradeId] = useState(null);
  const [showAdd, setShowAdd]     = useState(false);
  const clock = useClock();
  const T     = THEMES[isDark ? "dark" : "light"];

  const analyticsPage = analyticsTab === "tradeanalysis"
    ? <TradeAnalysis trades={trades} theme={T} selectedTradeId={selectedTradeId} onClearSelected={() => setSelectedTradeId(null)} />
    : <Analytics trades={trades} theme={T} />;

  const pages = {
    dashboard: <Dashboard trades={trades} portfolio={portfolio} setPortfolio={setPortfolio} theme={T} openAdd={() => setShowAdd(true)} setPage={setPage} setAnalyticsTab={setAnalyticsTab} setSelectedTradeId={setSelectedTradeId} />,
    trades:    <Trades    trades={trades} openAdd={() => setShowAdd(true)} onDelete={deleteTrade} theme={T} />,
    journal:   <Journal   trades={trades} onUpdate={updateTrade} theme={T} />,
    analytics: analyticsPage,
    aireport:  <AIReport  trades={trades} theme={T} />,
  };

  return (
    <div className="tfb-app" style={{ background: T.bg, fontFamily: "'DM Sans','Segoe UI',sans-serif", color: T.text, transition: "background 0.3s, color 0.3s" }}>
      <GlobalStyles />
      <Sidebar page={page} setPage={setPage} analyticsTab={analyticsTab} setAnalyticsTab={setAnalyticsTab} theme={T} />
      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
        <Navbar
          page={page} analyticsTab={analyticsTab} clock={clock}
          isDark={isDark} setIsDark={setIsDark}
          openAdd={() => setShowAdd(true)} theme={T}
          user={user} onLogout={logout}
          syncing={syncing} cloudMode={cloudMode}
        />
        {/* Sync error banner */}
        {syncError && (
          <div style={{ background: "#292215", borderBottom: "1px solid #f59e0b33", padding: "8px 20px", fontSize: 12, color: "#fbbf24", display: "flex", alignItems: "center", gap: 8 }}>
            ⚠️ {syncError}
          </div>
        )}
        <div style={{ flex: 1, overflowY: "auto", width: "100%" }}>{pages[page] || pages.dashboard}</div>
      </main>
      {showAdd && <AddTradeModal onClose={() => setShowAdd(false)} onAdd={addTrade} theme={T} portfolio={portfolio} />}
      <div className="tfb-btn" style={{ position: "fixed", bottom: 24, right: 24, width: 46, height: 46, borderRadius: "50%", background: "linear-gradient(135deg,#3b82f6,#1d4ed8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, cursor: "pointer", boxShadow: "0 4px 24px #3b82f655", zIndex: 100 }}>💬</div>
    </div>
  );
}

// ─── Root: decides auth vs main app ───────────────────────────────────────────
function AppRoot() {
  const { isAuthenticated, authLoading } = useAuth();
  const [isDark] = useLocalStorage("tfb_theme", true);
  const T = THEMES[isDark ? "dark" : "light"];

  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
        <GlobalStyles />
        <div style={{ fontSize: 36 }}>📊</div>
        <div style={{ fontSize: 15, color: T.textFaint }}>Loading TradeFXBook…</div>
      </div>
    );
  }

  return isAuthenticated ? <TradingApp /> : <AuthPage theme={T} />;
}

// ─── App export: wraps everything with AuthProvider ───────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <AppRoot />
    </AuthProvider>
  );
}