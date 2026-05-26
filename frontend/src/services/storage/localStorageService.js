// src/services/storage/localStorageService.js
// Responsibility: drop-in useState replacement that syncs to localStorage.
// Future swap: replace body with Supabase/IndexedDB without touching components.
import { useState, useCallback } from "react";

export function useLocalStorage(key, init) {
  const [val, setVal] = useState(() => {
    try {
      const s = localStorage.getItem(key);
      return s !== null ? JSON.parse(s) : init;
    } catch { return init; }
  });

  const set = useCallback((v) => {
    setVal(prev => {
      const next = typeof v === "function" ? v(prev) : v;
      try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
      return next;
    });
  }, [key]);

  return [val, set];
}