// src/styles/globalStyles.js
// Responsibility: define THEMES object and inject global CSS once.
// Imported by App.jsx and any page that needs T (theme tokens).
import { useEffect } from "react";

export const THEMES = {
  dark: {
    bg: "#0a0a0f", sidebar: "#0f0f1a", card: "#111120", cardAlt: "#161625",
    border: "#1e2030", border2: "#2d3045",
    text: "#f1f5f9", textMuted: "#94a3b8", textFaint: "#64748b",
    textFaintest: "#475569", accent: "#3b82f6",
    input: "#0d0d1a", hover: "#1e2030",
  },
  light: {
    bg: "#f0f4ff", sidebar: "#ffffff", card: "#ffffff", cardAlt: "#f8faff",
    border: "#e2e8f0", border2: "#cbd5e1",
    text: "#0f172a", textMuted: "#475569", textFaint: "#64748b",
    textFaintest: "#94a3b8", accent: "#2563eb",
    input: "#f8faff", hover: "#e2e8f0",
  },
};

export function GlobalStyles() {
  useEffect(() => {
    const style = document.createElement("style");
    style.id    = "tfb-global-styles";
    style.textContent = `
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      html, body { width: 100%; min-height: 100vh; overflow-x: hidden; }
      #root { width: 100% !important; min-height: 100vh !important; max-width: none !important; }
      .tfb-app { width: 100vw; min-height: 100vh; display: flex; }
      .tfb-card  { transition: transform .2s ease, box-shadow .2s ease; }
      .tfb-card:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0,0,0,.35); }
      .tfb-btn   { transition: filter .15s ease, transform .15s ease; cursor: pointer; }
      .tfb-btn:hover  { filter: brightness(1.12); transform: translateY(-1px); }
      .tfb-btn:active { transform: translateY(0); filter: brightness(.95); }
      .tfb-nav-item { transition: background .15s ease; }
      .tfb-nav-item:hover { background: rgba(59,130,246,.08) !important; }
      .tfb-row { transition: background .12s ease; }
      .tfb-row:hover { background: rgba(59,130,246,.06) !important; }
      .tfb-modal-enter { animation: modalIn .2s ease; }
      @keyframes modalIn {
        from { opacity: 0; transform: scale(.95) translateY(10px); }
        to   { opacity: 1; transform: scale(1)   translateY(0);    }
      }
      @keyframes fadeDown {
        from { opacity: 0; transform: translateY(-10px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes slideRight {
        from { opacity: 0; transform: translateX(16px); }
        to   { opacity: 1; transform: translateX(0); }
      }
      .tfb-toast  { animation: fadeDown .22s ease; }
      .tfb-panel  { animation: slideRight .18s ease; }
      @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    `;
    if (!document.getElementById("tfb-global-styles")) {
      document.head.appendChild(style);
    }
    return () => { try { document.head.removeChild(style); } catch {} };
  }, []);
  return null;
}