// src/components/auth/GoogleButton.jsx
// Responsibility: render "Continue with Google" button using Google Identity Services.
//
// FIX 1: Script loads ONCE using a module-level flag — never loads twice.
// FIX 2: initialize() called ONCE after script ready — stable ref via useRef
//         prevents re-initialization when parent re-renders (was caused by
//         onSuccess/onError being new function refs on every render).
// FIX 3: Stable callback ref — onSuccess/onError stored in a ref so the
//         initialize() call never needs to re-run when those props change.

import { useEffect, useRef, useState } from "react";

// Module-level flag — persists across component mounts/unmounts
// Prevents the script tag being added more than once to <head>
let gsiScriptLoaded  = false;
let gsiInitialized   = false;

export default function GoogleButton({ onSuccess, onError, disabled, theme: T }) {
  const containerRef   = useRef(null);
  const [ready, setReady] = useState(() => !!window.google?.accounts?.id);

  // Keep callbacks in a ref so initialize() closure always has the latest version
  // without needing to re-run the effect when the parent re-renders
  const callbackRef = useRef({ onSuccess, onError });
  useEffect(() => {
    callbackRef.current = { onSuccess, onError };
  });

  // ── Step 1: Load the GIS script exactly once ────────────────────────────
  useEffect(() => {
    if (window.google?.accounts?.id) {
      setReady(true);
      return;
    }
    if (gsiScriptLoaded) return; // already loading — just wait for onload
    gsiScriptLoaded = true;

    const script    = document.createElement("script");
    script.src      = "https://accounts.google.com/gsi/client";
    script.async    = true;
    script.defer    = true;
    script.onload   = () => setReady(true);
    script.onerror  = () => {
      gsiScriptLoaded = false; // allow retry
      callbackRef.current.onError?.("Failed to load Google sign-in. Check your internet connection.");
    };
    document.head.appendChild(script);
  }, []); // empty deps — run ONCE on mount

  // ── Step 2: Initialize + render button ONCE after script is ready ────────
  useEffect(() => {
    if (!ready || !window.google?.accounts?.id) return;
    if (gsiInitialized) {
      // Script already initialized — just re-render the button if container changed
      if (containerRef.current && containerRef.current.childElementCount === 0) {
        window.google.accounts.id.renderButton(containerRef.current, buttonConfig);
      }
      return;
    }

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      callbackRef.current.onError?.(
        "Google Client ID not configured. Add VITE_GOOGLE_CLIENT_ID to your .env file."
      );
      return;
    }

    gsiInitialized = true;

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => {
        if (response?.credential) {
          callbackRef.current.onSuccess(response.credential);
        } else {
          callbackRef.current.onError?.("Google sign-in was cancelled.");
        }
      },
      // Required to avoid Cross-Origin-Opener-Policy issues with popup mode
      // ux_mode: "popup" is the default — we keep it but handle COOP on backend
    });

    if (containerRef.current) {
      window.google.accounts.id.renderButton(containerRef.current, buttonConfig);
    }
  }, [ready]); // only re-runs when ready changes (once)

  return (
    <div style={{ width: "100%", marginBottom: 4 }}>
      {/* Google renders its own fully-branded button inside this div */}
      <div
        ref={containerRef}
        style={{
          minHeight: 44,
          display: ready ? "flex" : "none",
          justifyContent: "center",
          opacity: disabled ? 0.6 : 1,
          pointerEvents: disabled ? "none" : "auto",
        }}
      />
      {/* Shown only while the GIS script is loading */}
      {!ready && (
        <div style={{
          height: 44,
          background: T?.cardAlt || "#161625",
          border: `1px solid ${T?.border || "#1e2030"}`,
          borderRadius: 10,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          color: T?.textFaint || "#64748b",
          fontSize: 13,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" style={{ opacity: 0.6 }}>
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Loading Google…
        </div>
      )}
    </div>
  );
}

const buttonConfig = {
  theme:          "filled_black",
  size:           "large",
  text:           "continue_with",
  width:          340,
  logo_alignment: "left",
  shape:          "rectangular",
};