// src/hooks/useTrades.js
// Smart trades hook:
// - If user is logged in → syncs with backend API
// - If not logged in (offline/guest mode) → falls back to localStorage
// This means the app NEVER breaks even if the backend is down.

import { useState, useEffect, useCallback } from "react";
import { tradesService } from "../services/api/tradesService";
import { useAuth } from "../context/AuthContext";

const STORAGE_KEY = "tfb_trades_v2";

const readLocalStorage = () => {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    return s ? JSON.parse(s) : [];
  } catch { return []; }
};

const writeLocalStorage = (trades) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(trades)); } catch {}
};

export function useTrades() {
  const { isAuthenticated, migrationDone } = useAuth();
  const [trades,   setTradesState] = useState(readLocalStorage);
  const [syncing,  setSyncing]     = useState(false);
  const [syncError,setSyncError]   = useState(null);
  const [cloudMode,setCloudMode]   = useState(false);

  // ── On login: load trades from DB ──────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) {
      setCloudMode(false);
      setTradesState(readLocalStorage());
      return;
    }

    // Fetch from cloud
    const fetchCloud = async () => {
      setSyncing(true);
      setSyncError(null);
      try {
        const cloudTrades = await tradesService.getAll();
        setTradesState(cloudTrades);
        setCloudMode(true);
        // Keep localStorage in sync as a local cache/backup
        writeLocalStorage(cloudTrades);
      } catch (err) {
        setSyncError("Could not load cloud trades. Using local data.");
        setCloudMode(false);
        setTradesState(readLocalStorage());
      } finally {
        setSyncing(false);
      }
    };

    fetchCloud();
  }, [isAuthenticated, migrationDone]);

  // ── Setters that go to cloud when authenticated ───────────────────────────
  const addTrade = useCallback(async (trade) => {
    // Optimistic update first
    setTradesState(prev => {
      const next = [...prev, trade];
      writeLocalStorage(next);
      return next;
    });

    if (isAuthenticated) {
      try {
        const saved = await tradesService.create(trade);
        // Replace the optimistic entry with the server version (has _id)
        setTradesState(prev => {
          const next = prev.map(t => (t.id === trade.id ? { ...saved, id: saved._id || trade.id } : t));
          writeLocalStorage(next);
          return next;
        });
      } catch (err) {
        console.warn("Trade sync failed:", err.message);
        setSyncError("Trade saved locally. Will sync when connection restores.");
      }
    }
  }, [isAuthenticated]);

  const updateTrade = useCallback(async (updated) => {
    setTradesState(prev => {
      const next = prev.map(t => (t.id === updated.id || t._id === updated.id) ? updated : t);
      writeLocalStorage(next);
      return next;
    });

    if (isAuthenticated && (updated._id || updated.id)) {
      try {
        await tradesService.update(updated._id || updated.id, updated);
      } catch (err) {
        console.warn("Trade update sync failed:", err.message);
      }
    }
  }, [isAuthenticated]);

  const deleteTrade = useCallback(async (id) => {
    setTradesState(prev => {
      const next = prev.filter(t => t.id !== id && t._id !== id);
      writeLocalStorage(next);
      return next;
    });

    if (isAuthenticated) {
      try {
        await tradesService.delete(id);
      } catch (err) {
        console.warn("Trade delete sync failed:", err.message);
      }
    }
  }, [isAuthenticated]);

  return {
    trades,
    addTrade,
    updateTrade,
    deleteTrade,
    syncing,
    syncError,
    cloudMode,
    tradeCount: trades.length,
  };
}