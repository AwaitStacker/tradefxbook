// src/components/dashboard/Dashboard.jsx
// Equity curve is now <EquityCurve /> — memoized, zero flicker.
// All other dashboard logic is identical to the original.
import { useState } from "react";
import { fmtMoney, fmtColor } from "../../utils/calculations";
import { PAIR_EMOJI } from "../../data/constants";
import EquityCurve from "../charts/EquityCurve";

function Dashboard({ trades, portfolio, setPortfolio, theme: T, openAdd, setPage, setAnalyticsTab, setSelectedTradeId }) {
  const closed     = trades.filter(t => t.exit);
  const wins       = closed.filter(t => t.isWin);
  const losses     = closed.filter(t => !t.isWin);
  const totalPL    = closed.reduce((a, t) => a + t.pl, 0);
  const winRate    = closed.length ? (wins.length / closed.length * 100).toFixed(1) : 0;
  const grossWin   = wins.reduce((a, t) => a + t.pl, 0);
  const grossLoss  = Math.abs(losses.reduce((a, t) => a + t.pl, 0));
  const pf         = grossLoss > 0 ? (grossWin / grossLoss).toFixed(2) : grossWin > 0 ? "∞" : "0.00";
  const expectancy = closed.length ? (totalPL / closed.length).toFixed(2) : 0;

  const [calYear,    setCalYear]    = useState(new Date().getFullYear());
  const [calMonth,   setCalMonth]   = useState(new Date().getMonth());
  const [clickedDay, setClickedDay] = useState(null);

  const firstDay      = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth   = new Date(calYear, calMonth + 1, 0).getDate();
  const adjustedFirst = (firstDay + 6) % 7;
  const calCells      = [...Array(adjustedFirst).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  const dayPL = {}, dayTrades = {};
  closed.forEach(t => {
    const td = new Date(t.date);
    if (td.getFullYear() === calYear && td.getMonth() === calMonth) {
      const d = td.getDate();
      dayPL[d] = (dayPL[d] || 0) + t.pl;
      if (!dayTrades[d]) dayTrades[d] = [];
      dayTrades[d].push(t);
    }
  });

  const monthlyTotalPL = Object.values(dayPL).reduce((a, v) => a + v, 0);
  const monthNames     = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  // Equity curve data — computed once here, memoization happens inside EquityCurve
  let running = 0;
  const curvePts = closed.map((t, i) => { running += t.pl; return { x: i, y: running, trade: t }; });

  const clickedDayTrades = clickedDay ? (dayTrades[clickedDay] || []) : [];
  const clickedDayPL     = clickedDayTrades.reduce((a, t) => a + t.pl, 0);
  const clickedDayWins   = clickedDayTrades.filter(t => t.isWin).length;

  return (
    <div style={{ padding: "20px 24px", width: "100%", boxSizing: "border-box" }}>

      {/* ── Stat cards ─────────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 14, marginBottom: 20 }}>
        {[
          { label: "TOTAL P&L",     value: fmtMoney(totalPL),               sub: `From ${closed.length} closed trades`,  icon: "💵", accent: "#3b82f6", badge: "TOTAL", bg: "linear-gradient(135deg,#1e3a5f,#1a2744)" },
          { label: "WIN RATE",      value: `${winRate}%`,                   sub: `${wins.length} wins · ${losses.length} losses`, icon: "✅", accent: "#22c55e", bg: "linear-gradient(135deg,#0f2918,#0d2014)" },
          { label: "PROFIT FACTOR", value: pf,                              sub: parseFloat(pf) >= 1.5 ? "🔥 Excellent" : parseFloat(pf) >= 1 ? "Good" : "Needs work", icon: "📊", accent: "#8b5cf6", bg: "linear-gradient(135deg,#1f1030,#160d25)" },
          { label: "EXPECTANCY",    value: fmtMoney(parseFloat(expectancy)), sub: "Average per trade",                    icon: "🎯", accent: "#f59e0b", bg: "linear-gradient(135deg,#292215,#1f1a0f)" },
        ].map((card, i) => (
          <div key={i} className="tfb-card" style={{ background: card.bg, border: `1px solid ${card.accent}22`, borderRadius: 14, padding: "18px", position: "relative", minWidth: 0 }}>
            {card.badge && <span style={{ position: "absolute", top: 12, right: 12, background: card.accent, color: "#fff", fontSize: 9, fontWeight: 700, padding: "3px 7px", borderRadius: 5 }}>{card.badge}</span>}
            <div style={{ width: 38, height: 38, borderRadius: 10, background: `${card.accent}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, marginBottom: 10 }}>{card.icon}</div>
            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, letterSpacing: 0.5, marginBottom: 4 }}>{card.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: i === 0 ? fmtColor(totalPL) : "#f1f5f9", marginBottom: 4 }}>{card.value}</div>
            <div style={{ fontSize: 11, color: "#475569" }}>{card.sub}</div>
            {i === 1 && closed.length > 0 && (
              <div style={{ marginTop: 8, height: 4, background: "#1e2030", borderRadius: 2 }}>
                <div style={{ width: `${winRate}%`, height: "100%", background: "#3b82f6", borderRadius: 2 }}></div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr minmax(0,420px)", gap: 18, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>

          {/* Quick Stats */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "18px 20px" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>📋 Quick Stats</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 10 }}>
              {[
                { label: "AVG WINNER",  value: fmtMoney(wins.length   ? grossWin / wins.length   : 0), color: "#60a5fa" },
                { label: "AVG LOSER",   value: fmtMoney(losses.length ? -grossLoss / losses.length : 0), color: "#ef4444" },
                { label: "BEST TRADE",  value: fmtMoney(closed.length ? Math.max(...closed.map(t => t.pl)) : 0), color: "#60a5fa" },
                { label: "WORST TRADE", value: fmtMoney(closed.some(t => t.pl < 0) ? Math.min(...closed.filter(t => t.pl < 0).map(t => t.pl)) : 0), color: "#ef4444" },
                { label: "WIN STREAK",  value: `${(() => { let m=0,c=0; closed.forEach(t=>{c=t.isWin?c+1:0;m=Math.max(m,c);}); return m; })()} trades`, color: T.text },
                { label: "LOSS STREAK", value: `${(() => { let m=0,c=0; closed.forEach(t=>{c=!t.isWin?c+1:0;m=Math.max(m,c);}); return m; })()} trades`, color: T.text },
                { label: "AVG R:R",     value: `1:${closed.filter(t=>t.rr).length ? (closed.filter(t=>t.rr).reduce((a,t)=>a+t.rr,0)/closed.filter(t=>t.rr).length).toFixed(2) : "0.00"}`, color: "#f59e0b" },
                { label: "OPEN TRADES", value: "0", color: T.text },
              ].map((s, i) => (
                <div key={i} style={{ background: T.cardAlt, border: `1px solid ${T.border}`, borderRadius: 10, padding: "11px 13px", minWidth: 0 }}>
                  <div style={{ fontSize: 10, color: T.textFaint, fontWeight: 600, letterSpacing: 0.5, marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Equity Curve — memoized component, no more inline SVG ──────── */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "18px 20px" }}>
            <EquityCurve
              curvePts={curvePts}
              totalPL={totalPL}
              fmtMoney={fmtMoney}
              fmtColor={fmtColor}
              theme={T}
            />
          </div>

          {/* Recent Trades */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "18px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>Recent Trades</div>
              <span onClick={() => setPage("trades")} style={{ fontSize: 12, color: "#60a5fa", cursor: "pointer" }}>View all →</span>
            </div>
            {closed.length === 0 ? (
              <div style={{ padding: "16px", textAlign: "center", color: T.textFaintest, fontSize: 12 }}>
                No trades yet — <span style={{ color: "#60a5fa", cursor: "pointer" }} onClick={openAdd}>Add one!</span>
              </div>
            ) : [...closed].reverse().slice(0, 5).map(t => (
              <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: `1px solid ${T.border}` }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{PAIR_EMOJI[t.pair] || "🔵"}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>
                    {t.pair}{" "}
                    <span style={{ fontSize: 11, color: t.direction === "BUY" ? "#22c55e" : "#ef4444" }}>{t.direction}</span>{" "}
                    <span style={{ fontSize: 10, color: T.textFaint }}>({t.session})</span>
                  </div>
                  <div style={{ fontSize: 11, color: T.textFaint }}>{new Date(t.date).toLocaleDateString()}</div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: fmtColor(t.pl) }}>{fmtMoney(t.pl)}</div>
                  <div style={{ fontSize: 10, color: T.textFaint }}>{t.pips} pips</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right column ─────────────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>

          {/* Trading Calendar */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "18px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>Trading Calendar</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  onClick={() => { let m=calMonth-1,y=calYear; if(m<0){m=11;y--;} setCalMonth(m);setCalYear(y);setClickedDay(null); }}
                  style={{ background: T.cardAlt, border: `1px solid ${T.border}`, borderRadius: 7, width: 28, height: 28, cursor: "pointer", color: T.textMuted, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
                <span style={{ fontSize: 13, fontWeight: 600, color: T.text, minWidth: 90, textAlign: "center" }}>{monthNames[calMonth]} {calYear}</span>
                <button
                  onClick={() => { let m=calMonth+1,y=calYear; if(m>11){m=0;y++;} setCalMonth(m);setCalYear(y);setClickedDay(null); }}
                  style={{ background: T.cardAlt, border: `1px solid ${T.border}`, borderRadius: 7, width: 28, height: 28, cursor: "pointer", color: T.textMuted, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>
              </div>
            </div>
            {monthlyTotalPL !== 0 && (
              <div style={{ fontSize: 11, color: fmtColor(monthlyTotalPL), fontWeight: 700, marginBottom: 10 }}>
                Monthly: {fmtMoney(monthlyTotalPL)}
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr) 58px", gap: 3, marginBottom: 5 }}>
              {["MON","TUE","WED","THU","FRI","SAT","SUN"].map((d, i) => (
                <div key={i} style={{ textAlign: "center", fontSize: 9, color: T.textFaintest, fontWeight: 700, letterSpacing: 0.3 }}>{d}</div>
              ))}
              <div style={{ textAlign: "center", fontSize: 9, color: T.textFaintest, fontWeight: 700 }}>WEEKLY</div>
            </div>
            {(() => {
              const rows = []; let week = [];
              calCells.forEach((day, i) => {
                week.push(day);
                if (week.length === 7 || i === calCells.length - 1) {
                  while (week.length < 7) week.push(null);
                  rows.push([...week]); week = [];
                }
              });
              const today = new Date();
              return rows.map((row, ri) => {
                const weeklyPL   = row.reduce((sum, d) => sum + (d ? dayPL[d] || 0 : 0), 0);
                const tradedDays = row.filter(d => d && dayTrades[d]?.length > 0).length;
                return (
                  <div key={ri} style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr) 58px", gap: 3, marginBottom: 3 }}>
                    {row.map((day, ci) => {
                      const pl        = day ? dayPL[day] || null : null;
                      const isToday   = day === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear();
                      const isClicked = clickedDay === day && day !== null;
                      const hasTrades = day && dayTrades[day]?.length > 0;
                      return (
                        <div key={ci}
                          onClick={() => day && setClickedDay(clickedDay === day ? null : day)}
                          style={{ background: !day?"transparent":isClicked?"#1e3a5f":isToday?"#172040":pl>0?"#0d1f3c":pl<0?"#2a0f0f":T.cardAlt, border: !day?"none":isClicked?"1px solid #3b82f6":isToday?"1px solid #3b82f633":pl>0?"1px solid #60a5fa44":pl<0?"1px solid #ef444433":`1px solid ${T.border}`, borderRadius: 7, padding: "5px 3px", minHeight: 44, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: hasTrades?"pointer":"default", transition: "all 0.15s" }}>
                          {day && <>
                            <span style={{ fontSize: 10, fontWeight: 600, color: isClicked?"#93c5fd":isToday?"#60a5fa":pl>0?"#93c5fd":pl<0?"#f87171":T.textFaint }}>{day}</span>
                            {pl !== null && <span style={{ fontSize: 8, fontWeight: 700, color: pl>0?"#60a5fa":"#f87171", marginTop: 1 }}>{fmtMoney(pl)}</span>}
                            {hasTrades && !pl && <span style={{ fontSize: 7, color: T.textFaintest }}>{dayTrades[day].length} trade{dayTrades[day].length>1?"s":""}</span>}
                          </>}
                        </div>
                      );
                    })}
                    <div style={{ background: weeklyPL>0?"#0d1f3c":weeklyPL<0?"#2a0f0f":T.hover, border: `1px solid ${weeklyPL>0?"#60a5fa33":weeklyPL<0?"#ef444433":T.border}`, borderRadius: 7, padding: "4px 5px", minHeight: 44, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                      <div style={{ fontSize: 8, color: T.textFaintest, fontWeight: 700, letterSpacing: 0.3 }}>WEEKLY</div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: weeklyPL>0?"#60a5fa":weeklyPL<0?"#f87171":T.textFaintest, marginTop: 1 }}>{weeklyPL!==0?fmtMoney(weeklyPL):"$0"}</div>
                      {tradedDays>0 && <div style={{ fontSize: 7, color: T.textFaintest }}>Traded {tradedDays}</div>}
                    </div>
                  </div>
                );
              });
            })()}
            <div style={{ display: "flex", gap: 12, marginTop: 10, justifyContent: "center" }}>
              {[["#60a5fa","Profitable Day"],["#ef4444","Losing Day"],["#64748b","No Trades"]].map(([c, l]) => (
                <span key={l} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 9, color: T.textFaint }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: c, display: "inline-block" }}></span>{l}
                </span>
              ))}
            </div>
          </div>

          {/* Day popup */}
          {clickedDay && clickedDayTrades.length > 0 && (
            <div style={{ background: T.card, border: "1px solid #3b82f655", borderRadius: 14, padding: "18px", animation: "modalIn 0.18s ease" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>Trades on {monthNames[calMonth]} {clickedDay}</div>
                  <div style={{ fontSize: 11, color: T.textFaint, marginTop: 2 }}>{clickedDayTrades.length} trade{clickedDayTrades.length>1?"s":""}</div>
                </div>
                <button onClick={() => setClickedDay(null)} style={{ background: T.cardAlt, border: `1px solid ${T.border}`, borderRadius: 8, width: 28, height: 28, cursor: "pointer", color: T.textMuted, fontSize: 14 }}>✕</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
                {[
                  { l: "TOTAL P&L", v: fmtMoney(clickedDayPL), c: fmtColor(clickedDayPL) },
                  { l: "TRADES",    v: String(clickedDayTrades.length), c: T.text },
                  { l: "WIN RATE",  v: clickedDayTrades.length ? `${Math.round(clickedDayWins/clickedDayTrades.length*100)}%` : "—", c: "#60a5fa" },
                ].map(({ l, v, c }) => (
                  <div key={l} style={{ background: T.cardAlt, border: `1px solid ${T.border}`, borderRadius: 9, padding: "9px 12px" }}>
                    <div style={{ fontSize: 9, color: T.textFaint, fontWeight: 600, marginBottom: 3 }}>{l}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: c }}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {clickedDayTrades.map(t => (
                  <div key={t.id}
                    onClick={() => { setClickedDay(null); setPage("analytics"); setAnalyticsTab("tradeanalysis"); setSelectedTradeId(t.id); }}
                    style={{ background: T.cardAlt, border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 13px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer", transition: "all 0.15s" }}
                    onMouseEnter={e => { e.currentTarget.style.border="1px solid #3b82f655"; e.currentTarget.style.background="#1a2744"; }}
                    onMouseLeave={e => { e.currentTarget.style.border=`1px solid ${T.border}`; e.currentTarget.style.background=T.cardAlt; }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "#1e3a5f", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{PAIR_EMOJI[t.pair]||"🔵"}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>
                        {t.pair}{" "}
                        <span style={{ color: t.direction==="BUY"?"#22c55e":"#ef4444", fontSize: 11, fontWeight: 700 }}>{t.direction==="BUY"?"LONG":"SHORT"}</span>
                      </div>
                      <div style={{ fontSize: 11, color: T.textFaint }}>{new Date(t.date).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",timeZone:"Asia/Kolkata"})} · {t.session}</div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: fmtColor(t.pl) }}>{fmtMoney(t.pl)}</div>
                      <div style={{ fontSize: 9, color: T.textFaintest }}>View Analysis →</div>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => setPage("trades")} style={{ width: "100%", marginTop: 12, background: T.cardAlt, border: `1px solid ${T.border2}`, borderRadius: 9, padding: "9px", color: T.textMuted, cursor: "pointer", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                View All Trades →
              </button>
            </div>
          )}

          {/* Performance */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "16px" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 12 }}>Performance</div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {[
                ["Profit Factor", pf,                            parseFloat(pf)>=1?"#60a5fa":"#ef4444"],
                ["Win Rate",      `${winRate}%`,                 parseFloat(winRate)>=50?"#60a5fa":"#ef4444"],
                ["Total Trades",  closed.length,                 T.text],
                ["Gross Profit",  `+$${grossWin.toFixed(2)}`,   "#60a5fa"],
                ["Gross Loss",    grossLoss>0?`-$${grossLoss.toFixed(2)}`:"$0.00", grossLoss>0?"#ef4444":T.textFaint],
                ["Net P&L",       fmtMoney(totalPL),             fmtColor(totalPL)],
              ].map(([l, v, c]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: `1px solid ${T.border}` }}>
                  <span style={{ fontSize: 12, color: T.textFaint }}>{l}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: c }}>{String(v)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;