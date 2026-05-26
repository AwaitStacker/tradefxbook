// src/utils/calculations.js
import { INSTRUMENT_CONFIG } from "../data/constants";

export const getInstrumentCfg = (pair) =>
  INSTRUMENT_CONFIG[pair?.toUpperCase()] || { pipMultiplier: 10000, lotValue: 10, category: "forex" };

/** Pips from absolute price difference */
export const calcPips = (pair, absDiff) => {
  const cfg = getInstrumentCfg(pair);
  return (absDiff * cfg.pipMultiplier).toFixed(cfg.category === "crypto" ? 2 : 1);
};

/**
 * P&L in USD.
 * Formula: diff × lotValue × lotSize
 * XAUUSD example: BUY 0.1 lot, entry 2000 → exit 2010
 *   diff=10, P&L = 10 × 100 × 0.1 = $100
 */
export const calcPL = (pair, direction, lotSize, entry, exit) => {
  const cfg = getInstrumentCfg(pair);
  const diff = direction === "BUY" ? exit - entry : entry - exit;
  return parseFloat((diff * cfg.lotValue * lotSize).toFixed(2));
};

/**
 * XAU pip check: 1920.10 → 1920.20 = diff 0.10 × 10 = 1 pip ✓
 */
export const calcXAUPips = (entry, exit, direction) => {
  const diff = direction === "BUY" ? exit - entry : entry - exit;
  return parseFloat((diff * 10).toFixed(1));
};

export const uid = () => Math.random().toString(36).slice(2, 9);

export const fmtMoney = (n) => {
  if (n === null || n === undefined || isNaN(n)) return "$0.00";
  const abs = Math.abs(n);
  const str = abs >= 1000 ? `$${(abs / 1000).toFixed(1)}k` : `$${abs.toFixed(2)}`;
  return n < 0 ? `-${str}` : `+${str}`;
};

export const fmtColor       = (n) => (n >= 0 ? "#60a5fa" : "#ef4444");
export const fmtColorBg     = (n) => (n >= 0 ? "#0d1f3c" : "#2a0f0f");
export const fmtColorBorder = (n) => (n >= 0 ? "#60a5fa33" : "#ef444433");

export const calcTradeScore = (trade) => {
  let score = 0;
  if (trade.isWin) score += 30;
  const checkedExec = Object.values(trade.checklist || {}).filter(Boolean).length;
  score += Math.min(40, checkedExec * 10);
  if (trade.preAnalysis) score += 5;
  if (trade.postReview)  score += 5;
  if (trade.emotionBefore && trade.emotionBefore !== "Neutral") score += 5;
  if (trade.lessons)     score += 5;
  score += Math.round(trade.rating || 0);
  return Math.min(100, score);
};

export const holdTimeBetween = (d1, d2) => {
  if (!d1 || !d2) return "—";
  const mins = Math.abs(new Date(d2) - new Date(d1)) / 60000;
  if (mins < 60)   return `${Math.round(mins)}m`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ${Math.round(mins % 60)}m`;
  return `${Math.floor(mins / 1440)}d ${Math.floor((mins % 1440) / 60)}h`;
};