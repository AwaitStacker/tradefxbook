// src/components/analytics/Analytics.jsx
import { useState } from "react";
import { fmtMoney, fmtColor } from "../../utils/calculations";
import { PAIR_EMOJI } from "../../data/constants";
import AnalyticsCalendar from "./AnalyticsCalendar";

function Analytics({ trades, theme: T }) {
  const [timePeriod, setTimePeriod] = useState("30 Days");
  const [filter, setFilter] = useState("All Trades");

  const now = new Date();
  const periodMap = { "Today":1, "7 Days":7, "30 Days":30, "3 Months":90, "1 Year":365, "All Time":99999 };
  const days = periodMap[timePeriod]||30;

  let closed = trades.filter(t => {
    const d = (now - new Date(t.date)) / 86400000;
    return d <= days;
  });
  if(filter==="Winners") closed = closed.filter(t=>t.isWin);
  if(filter==="Losers") closed = closed.filter(t=>!t.isWin);

  const wins = closed.filter(t=>t.isWin);
  const losses = closed.filter(t=>!t.isWin);
  const totalPL = closed.reduce((a,t)=>a+t.pl,0);
  const winRate = closed.length?(wins.length/closed.length*100).toFixed(1):0;
  const grossWin = wins.reduce((a,t)=>a+t.pl,0);
  const grossLoss = Math.abs(losses.reduce((a,t)=>a+t.pl,0));
  const pf = grossLoss>0?(grossWin/grossLoss).toFixed(2):grossWin>0?"Infinity":"0.00";
  const expectancy = closed.length?(totalPL/closed.length).toFixed(2):0;

  // Win streak
  let maxWin=0,curWin=0,maxLoss=0,curLoss=0;
  closed.forEach(t=>{ curWin=t.isWin?curWin+1:0; maxWin=Math.max(maxWin,curWin); curLoss=!t.isWin?curLoss+1:0; maxLoss=Math.max(maxLoss,curLoss); });

  // Session performance — fix "Others" bucket key
  const sessions = {
    Asian: {pl:0,trades:0,wins:0,rr:[]},
    London:{pl:0,trades:0,wins:0,rr:[]},
    NYC:   {pl:0,trades:0,wins:0,rr:[]},
    Others:{pl:0,trades:0,wins:0,rr:[]},
  };
  closed.forEach(t=>{
    const key = ["Asian","London","NYC"].includes(t.session) ? t.session : "Others";
    const s = sessions[key];
    s.pl+=t.pl; s.trades++; if(t.isWin)s.wins++; if(t.rr)s.rr.push(t.rr);
  });

  // Pair performance
  const pairMap = {};
  closed.forEach(t=>{ if(!pairMap[t.pair])pairMap[t.pair]={pl:0,trades:0,wins:0}; pairMap[t.pair].pl+=t.pl; pairMap[t.pair].trades++; if(t.isWin)pairMap[t.pair].wins++; });
  const pairArr = Object.entries(pairMap).sort((a,b)=>b[1].pl-a[1].pl);

  // Setup performance
  const setupMap = {};
  closed.forEach(t=>{ if(!setupMap[t.setupType])setupMap[t.setupType]={pl:0,trades:0,wins:0,rr:[]}; setupMap[t.setupType].pl+=t.pl; setupMap[t.setupType].trades++; if(t.isWin)setupMap[t.setupType].wins++; if(t.rr)setupMap[t.setupType].rr.push(t.rr); });
  const setupArr = Object.entries(setupMap).sort((a,b)=>b[1].pl-a[1].pl);

  // Market condition
  const marketMap = {};
  closed.forEach(t=>{ if(!marketMap[t.marketCondition])marketMap[t.marketCondition]={pl:0,trades:0,wins:0}; marketMap[t.marketCondition].pl+=t.pl; marketMap[t.marketCondition].trades++; if(t.isWin)marketMap[t.marketCondition].wins++; });

  // Monthly performance
  const monthMap = {};
  closed.forEach(t=>{ const d=new Date(t.date), k=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; if(!monthMap[k])monthMap[k]={pl:0,trades:0}; monthMap[k].pl+=t.pl; monthMap[k].trades++; });
  const monthArr = Object.entries(monthMap).sort();

  // Total trading days
  const tradingDays = new Set(closed.map(t=>new Date(t.date).toDateString())).size;
  const dayPL = {};
  closed.forEach(t=>{ const d=new Date(t.date).toDateString(); dayPL[d]=(dayPL[d]||0)+t.pl; });
  const dayPLArr = Object.values(dayPL);
  const winDays = dayPLArr.filter(v=>v>0).length;
  const lossDays = dayPLArr.filter(v=>v<0).length;

  // Max drawdown
  let peak=0, maxDD=0, running=0;
  closed.forEach(t=>{ running+=t.pl; if(running>peak)peak=running; const dd=peak-running; if(dd>maxDD)maxDD=dd; });

  const card = (label,value,color=T.text,sub="") => (
    <div style={{ background:T.cardAlt, border:`1px solid ${T.border}`, borderRadius:12, padding:"14px 16px" }}>
      <div style={{ fontSize:10, color:T.textFaint, fontWeight:600, letterSpacing:0.5, marginBottom:5 }}>{label}</div>
      <div style={{ fontSize:18, fontWeight:700, color }}>{value}</div>
      {sub&&<div style={{ fontSize:11, color:T.textFaintest, marginTop:3 }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ padding:"20px 24px", width:"100%", boxSizing:"border-box" }}>
      {/* Header filters */}
      <div style={{ display:"flex", flexWrap:"wrap", alignItems:"flex-end", gap:16, marginBottom:22 }}>
        <div>
          <div style={{ fontSize:11, color:T.textFaint, fontWeight:600, letterSpacing:1, marginBottom:6 }}>TIME PERIOD</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
            {["Today","7 Days","30 Days","3 Months","1 Year","All Time"].map(p=>(
              <button key={p} onClick={()=>setTimePeriod(p)} style={{ background:timePeriod===p?"#3b82f6":T.cardAlt, border:timePeriod===p?"none":`1px solid ${T.border}`, borderRadius:8, padding:"6px 12px", color:timePeriod===p?"#fff":T.textFaint, cursor:"pointer", fontSize:12, fontWeight:timePeriod===p?600:400 }}>{p}</button>
            ))}
          </div>
        </div>
        <div style={{ marginLeft:"auto" }}>
          <div style={{ fontSize:11, color:T.textFaint, fontWeight:600, letterSpacing:1, marginBottom:6 }}>FILTER BY</div>
          <div style={{ display:"flex", gap:5 }}>
            {["All Trades","Winners","Losers"].map(f=>(
              <button key={f} onClick={()=>setFilter(f)} style={{ background:filter===f?"#3b82f6":T.cardAlt, border:filter===f?"none":`1px solid ${T.border}`, borderRadius:8, padding:"6px 14px", color:filter===f?"#fff":T.textFaint, cursor:"pointer", fontSize:12, fontWeight:filter===f?600:400, display:"flex", alignItems:"center", gap:5 }}>
                {f==="Winners"&&"✓ "}{f==="Losers"&&"✕ "}{f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Top 4 KPI cards — responsive auto-fit */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:16, marginBottom:24 }}>
        {[
          { label:"TOTAL P&L",      value:fmtMoney(totalPL),             valueColor:fmtColor(totalPL),  sub:`From ${closed.length} closed trades`,      sub2:"Your net profit/loss for the selected period", icon:"💵", accent:"#3b82f6" },
          { label:"WIN RATE",       value:`${winRate}%`,                  valueColor:"#60a5fa",           sub:`${wins.length} wins · ${losses.length} losses`, sub2:"Percentage of profitable trades",           icon:"✅", accent:"#22c55e", bar:true, barVal:parseFloat(winRate) },
          { label:"PROFIT FACTOR",  value:pf,                             valueColor:parseFloat(pf)>=1?"#22c55e":"#ef4444", sub:parseFloat(pf)>=1.5?"🔥 Excellent":parseFloat(pf)>=1?"👍 Good":"⚠️ Needs work", sub2:"Gross profit ÷ Gross loss (above 1.5 is good)", icon:"📊", accent:"#8b5cf6" },
          { label:"EXPECTANCY",     value:fmtMoney(parseFloat(expectancy)), valueColor:fmtColor(parseFloat(expectancy)), sub:"Average per trade",              sub2:"Expected profit per trade based on your stats",  icon:"🎯", accent:"#f59e0b" },
        ].map((c,i)=>(
          <div key={i} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:"20px 20px" }}>
            <div style={{ width:44, height:44, borderRadius:12, background:`${c.accent}22`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, marginBottom:14 }}>{c.icon}</div>
            <div style={{ fontSize:11, color:T.textFaint, fontWeight:600, letterSpacing:0.5, marginBottom:6 }}>{c.label}</div>
            <div style={{ fontSize:26, fontWeight:700, color:c.valueColor, marginBottom:5 }}>{c.value}</div>
            <div style={{ fontSize:12, color:T.textMuted, marginBottom:c.bar?8:0 }}>{c.sub}</div>
            {c.bar&&<div style={{ height:4, background:T.border, borderRadius:2, marginBottom:8 }}><div style={{ width:`${c.barVal}%`, height:"100%", background:"#3b82f6", borderRadius:2 }}></div></div>}
            <div style={{ fontSize:11, color:T.textFaintest, marginTop:4 }}>{c.sub2}</div>
          </div>
        ))}
      </div>

      {/* Quick Stats + Equity Curve — responsive */}
      <div style={{ display:"grid", gridTemplateColumns:"minmax(180px,220px) 1fr", gap:20, marginBottom:20 }}>
        {/* Quick Stats */}
        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:"18px" }}>
          <div style={{ fontSize:14, fontWeight:700, color:T.text, marginBottom:14, display:"flex", alignItems:"center", gap:7 }}>📋 Quick Stats</div>
          <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
            {(()=>{
              const avgWinnerVal  = wins.length   ? grossWin / wins.length   : 0;
              const avgLoserVal   = losses.length ? -(grossLoss / losses.length) : 0;
              const bestTradeVal  = closed.length ? Math.max(...closed.map(t=>t.pl)) : 0;
              const worstTradeVal = closed.length ? Math.min(...closed.map(t=>t.pl)) : 0;
              const avgRR = closed.filter(t=>t.rr).length
                ? (closed.filter(t=>t.rr).reduce((a,t)=>a+t.rr,0) / closed.filter(t=>t.rr).length).toFixed(2)
                : "0.00";
              return [
                { l:"AVG WINNER",   v: avgWinnerVal  >= 0 ? `+$${avgWinnerVal.toFixed(2)}`  : `-$${Math.abs(avgWinnerVal).toFixed(2)}`,  c: fmtColor(avgWinnerVal)  },
                { l:"AVG LOSER",    v: avgLoserVal   >= 0 ? `+$${avgLoserVal.toFixed(2)}`   : `-$${Math.abs(avgLoserVal).toFixed(2)}`,   c: fmtColor(avgLoserVal)   },
                { l:"BEST TRADE",   v: bestTradeVal  >= 0 ? `+$${bestTradeVal.toFixed(2)}`  : `-$${Math.abs(bestTradeVal).toFixed(2)}`,  c: fmtColor(bestTradeVal)  },
                { l:"WORST TRADE",  v: worstTradeVal >= 0 ? `+$${worstTradeVal.toFixed(2)}` : `-$${Math.abs(worstTradeVal).toFixed(2)}`, c: fmtColor(worstTradeVal) },
                { l:"WIN STREAK",   v: `${maxWin} trades`,  c: maxWin > 0  ? "#22c55e" : T.text },
                { l:"LOSS STREAK",  v: `${maxLoss} trades`, c: maxLoss > 0 ? "#ef4444" : T.text },
                { l:"AVG RISK:RWD", v: `1:${avgRR}`,        c: parseFloat(avgRR) >= 1 ? "#22c55e" : "#ef4444" },
                { l:"OPEN TRADES",  v: "0",                 c: T.text },
              ];
            })().map((s,i)=>(
              <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:`1px solid ${T.border}` }}>
                <span style={{ fontSize:11, color:T.textFaint, fontWeight:600 }}>{s.l}</span>
                <span style={{ fontSize:13, fontWeight:700, color:s.c }}>{s.v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Equity Curve */}
        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:"20px 22px" }}>
          <div style={{ fontSize:14, fontWeight:700, color:T.text, marginBottom:4, display:"flex", alignItems:"center", gap:8 }}>📉 Equity Curve</div>
          <div style={{ fontSize:12, color:T.textFaint, marginBottom:14 }}>Cumulative P&L progression</div>
          {closed.length < 2 ? (
            <div style={{ height:200, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:8, background:T.input, borderRadius:10, border:`1px solid ${T.border}` }}>
              <span style={{ fontSize:36, opacity:0.15 }}>📈</span>
              <span style={{ color:T.textFaintest, fontSize:13 }}>Close more trades to see your equity curve</span>
            </div>
          ) : (()=>{
            let r=0;
            const pts=closed.map((t,i)=>{ r+=t.pl; return{x:i,y:r}; });
            const minY=Math.min(0,...pts.map(p=>p.y)), maxY=Math.max(...pts.map(p=>p.y));
            const rx=(i)=>(i/(pts.length-1))*560+20;
            const ry=(y)=>180-((y-minY)/(maxY-minY||1))*160;
            const d="M "+pts.map(p=>`${rx(p.x)},${ry(p.y)}`).join(" L ");
            const area=d+` L ${rx(pts.length-1)},180 L 20,180 Z`;
            const col=totalPL>=0?"#22c55e":"#ef4444";
            return <svg viewBox="0 0 600 200" style={{width:"100%",height:200}}>
              <defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={col} stopOpacity="0.3"/><stop offset="100%" stopColor={col} stopOpacity="0"/></linearGradient></defs>
              <path d={area} fill="url(#ag)"/>
              <path d={d} fill="none" stroke={col} strokeWidth="2.5"/>
              {pts.map((p,i)=><circle key={i} cx={rx(p.x)} cy={ry(p.y)} r="4" fill={closed[i].isWin?"#22c55e":"#ef4444"}/>)}
            </svg>;
          })()}
        </div>
      </div>

      {/* Session Performance */}
      <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:"20px 22px", marginBottom:20 }}>
        <div style={{ fontSize:14, fontWeight:700, color:T.text, marginBottom:4 }}>🌐 Session Performance (IST)</div>
        <div style={{ fontSize:12, color:T.textFaint, marginBottom:16 }}>Breakdown by trading session — Asian, London & NYC</div>
        {/* Session timeline bar */}
        <div style={{ display:"grid", gridTemplateColumns:"310px 218px 1fr", height:28, borderRadius:8, overflow:"hidden", marginBottom:6 }}>
          {[{n:"ASIAN",c:"#92400e"},{n:"LONDON",c:"#1e3a5f"},{n:"NEW YORK",c:"#0e3a2a"}].map(s=>(
            <div key={s.n} style={{ background:s.c, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <span style={{ fontSize:11, fontWeight:700, color:"#e2e8f0", letterSpacing:1 }}>{s.n}</span>
            </div>
          ))}
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:T.textFaintest, marginBottom:14 }}>
          <span>00:00</span><span>05:30</span><span>08:30</span><span>11:30</span><span>14:00</span><span>17:00</span><span>20:30</span><span>22:00</span>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))", gap:14 }}>
          {[
            { key:"Asian",  label:"Asian",    time:"5:30 AM – 8:30 AM IST",  icon:"🌏" },
            { key:"London", label:"London",   time:"11:30 AM – 2:00 PM IST", icon:"🏛️" },
            { key:"NYC",    label:"New York", time:"5:00 PM – 8:30 PM IST",  icon:"🗽" },
          ].map(({key,label,time,icon})=>{
            const s=sessions[key];
            const wr=s.trades?(s.wins/s.trades*100).toFixed(1):null;
            const vol=closed.length?(s.trades/closed.length*100).toFixed(0):0;
            const avgTrade=s.trades?s.pl/s.trades:0;
            return (
              <div key={key} style={{ background:T.cardAlt, border:`1px solid ${T.border}`, borderRadius:12, padding:"16px 18px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
                  <div style={{ width:36, height:36, borderRadius:10, background:T.hover, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>{icon}</div>
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, color:T.text }}>{label}</div>
                    <div style={{ fontSize:11, color:T.textFaint }}>{time}</div>
                  </div>
                </div>
                {s.trades>0&&<div style={{ fontSize:18, fontWeight:700, color:fmtColor(s.pl), marginBottom:10 }}>{fmtMoney(s.pl)}</div>}
                <div style={{ height:4, background:T.border, borderRadius:2, marginBottom:12 }}>
                  <div style={{ width:`${Math.min(100,parseFloat(vol))}%`, height:"100%", background:s.pl>=0?"#22c55e":"#ef4444", borderRadius:2 }}></div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                  {[
                    { l:"TRADES",   v: s.trades,                           c: T.text },
                    { l:"WIN RATE", v: wr ? `${wr}%` : "—",                c: wr ? (parseFloat(wr)>=50?"#22c55e":"#ef4444") : T.textFaint },
                    { l:"AVG TRADE",v: s.trades ? fmtMoney(avgTrade) : "—", c: s.trades ? fmtColor(avgTrade) : T.textFaint },
                    { l:"VOLUME",   v: `${vol}%`,                           c: T.text },
                  ].map(({l,v,c})=>(
                    <div key={l}><div style={{ fontSize:10, color:T.textFaintest, fontWeight:600, marginBottom:2 }}>{l}</div><div style={{ fontSize:14, fontWeight:700, color:c }}>{v}</div></div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pair + Setup Performance — responsive */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(320px,1fr))", gap:20, marginBottom:20 }}>
        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:"20px" }}>
          <div style={{ fontSize:14, fontWeight:700, color:T.text, marginBottom:14 }}>🔵 Pair Performance</div>
          {pairArr.length===0?<div style={{ color:T.textFaintest, fontSize:13, padding:"20px 0", textAlign:"center" }}>No data yet</div>:pairArr.map(([pair,d])=>(
            <div key={pair} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
              <span style={{ fontSize:16 }}>{PAIR_EMOJI[pair]||"🔵"}</span>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                  <span style={{ fontSize:13, color:T.text, fontWeight:600 }}>{pair}</span>
                  <span style={{ fontSize:11, color:T.textFaint }}>{d.trades}x · {d.trades?(d.wins/d.trades*100).toFixed(0):0}% WR</span>
                </div>
                <div style={{ height:5, background:T.border, borderRadius:3 }}>
                  <div style={{ width:`${pairArr.length?Math.min(100,Math.abs(d.pl)/Math.max(...pairArr.map(p=>Math.abs(p[1].pl)||1))*100):0}%`, height:"100%", background:d.pl>=0?"#22c55e":"#ef4444", borderRadius:3 }}></div>
                </div>
              </div>
              <span style={{ fontSize:13, fontWeight:700, color:fmtColor(d.pl), minWidth:72, textAlign:"right" }}>{fmtMoney(d.pl)}</span>
            </div>
          ))}
        </div>
        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:"20px" }}>
          <div style={{ fontSize:14, fontWeight:700, color:T.text, marginBottom:14 }}>⚡ Setup Performance</div>
          {setupArr.length===0?<div style={{ color:T.textFaintest, fontSize:13, padding:"20px 0", textAlign:"center" }}>No data yet</div>:setupArr.map(([setup,d])=>(
            <div key={setup} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                  <span style={{ fontSize:13, color:T.text }}>{setup}</span>
                  <span style={{ fontSize:11, color:T.textFaint }}>{d.trades}x · {d.rr.length?`Avg RR 1:${(d.rr.reduce((a,v)=>a+v,0)/d.rr.length).toFixed(1)}`:"—"}</span>
                </div>
                <div style={{ height:5, background:T.border, borderRadius:3 }}>
                  <div style={{ width:`${setupArr.length?Math.min(100,Math.abs(d.pl)/Math.max(...setupArr.map(s=>Math.abs(s[1].pl)||1))*100):0}%`, height:"100%", background:d.pl>=0?"#22c55e":"#ef4444", borderRadius:3 }}></div>
                </div>
              </div>
              <span style={{ fontSize:13, fontWeight:700, color:fmtColor(d.pl), minWidth:72, textAlign:"right" }}>{fmtMoney(d.pl)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Win/Loss Distribution + Recent Trades — responsive */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))", gap:20, marginBottom:20 }}>
        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:"20px" }}>
          <div style={{ fontSize:14, fontWeight:700, color:T.text, marginBottom:14 }}>📊 Win/Loss Distribution</div>
          {closed.length>0?(
            <>
              <div style={{ height:16, borderRadius:8, overflow:"hidden", display:"flex", marginBottom:16 }}>
                <div style={{ width:`${winRate}%`, background:"#3b82f6", transition:"width 0.5s" }}></div>
                <div style={{ flex:1, background:"#ef444444" }}></div>
              </div>
              {[
                { l:"Gross Profit", v: `+$${grossWin.toFixed(2)}`,                 c:"#22c55e" },
                { l:"Gross Loss",   v: grossLoss>0 ? `-$${grossLoss.toFixed(2)}` : "$0.00", c: grossLoss>0?"#ef4444":T.textFaint },
                { l:"Net Result",   v: fmtMoney(totalPL),                           c: fmtColor(totalPL) },
              ].map(({l,v,c})=>(
                <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:`1px solid ${T.border}` }}>
                  <span style={{ fontSize:12, color:T.textFaint, display:"flex", alignItems:"center", gap:6 }}>
                    <span style={{ width:8, height:8, borderRadius:"50%", background:c, display:"inline-block" }}></span>{l}
                  </span>
                  <span style={{ fontSize:13, fontWeight:700, color:c }}>{v}</span>
                </div>
              ))}
            </>
          ):<div style={{ color:T.textFaintest, fontSize:13, textAlign:"center", padding:"20px 0" }}>No data</div>}
        </div>
        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:"20px" }}>
          <div style={{ fontSize:14, fontWeight:700, color:T.text, marginBottom:4 }}>🕐 Recent Trades</div>
          <div style={{ fontSize:12, color:T.textFaint, marginBottom:14 }}>Your last 10 trades</div>
          {closed.length===0?<div style={{ color:T.textFaintest, fontSize:13 }}>No trades in this period</div>:[...closed].reverse().slice(0,10).map(t=>(
            <div key={t.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"9px 12px", background:T.cardAlt, borderRadius:10, marginBottom:6 }}>
              <div style={{ width:32, height:32, borderRadius:8, background:"#1e3a5f", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>{PAIR_EMOJI[t.pair]||"🔵"}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:600, color:T.text }}>{t.pair} <span style={{ fontSize:11, color:t.direction==="BUY"?"#22c55e":"#ef4444" }}>{t.direction}</span> <span style={{ fontSize:11, color:"#f59e0b" }}>({t.session})</span></div>
                <div style={{ fontSize:11, color:T.textFaint }}>{new Date(t.date).toLocaleDateString("en-IN",{timeZone:"Asia/Kolkata"})}</div>
              </div>
              <span style={{ fontSize:14, fontWeight:700, color:fmtColor(t.pl), whiteSpace:"nowrap" }}>{fmtMoney(t.pl)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Your Stats summary table */}
      <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:"22px 24px", marginBottom:20 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
          <div style={{ fontSize:15, fontWeight:700, color:T.text }}>Your Stats</div>
          <span style={{ background:T.cardAlt, border:`1px solid ${T.border}`, borderRadius:20, padding:"3px 12px", fontSize:11, color:T.textMuted, fontWeight:600 }}>{timePeriod.toUpperCase()}</span>
        </div>

        {/* Best/Worst Month */}
        {monthArr.length>0&&(
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:14, marginBottom:18 }}>
            {[
              { label:"BEST MONTH",  val:Math.max(...monthArr.map(([,v])=>v.pl)), month:monthArr.reduce((a,b)=>b[1].pl>a[1].pl?b:a)[0] },
              { label:"WORST MONTH", val:Math.min(...monthArr.map(([,v])=>v.pl)), month:monthArr.reduce((a,b)=>b[1].pl<a[1].pl?b:a)[0] },
              { label:"AVERAGE",     val:monthArr.reduce((a,[,v])=>a+v.pl,0)/monthArr.length, month:"per Month" },
            ].map(({label,val,month})=>(
              <div key={label} style={{ background:T.cardAlt, border:`1px solid ${T.border}`, borderRadius:12, padding:"14px 16px" }}>
                <div style={{ fontSize:10, color:T.textFaint, fontWeight:600, letterSpacing:0.5, marginBottom:6 }}>{label}</div>
                <div style={{ fontSize:20, fontWeight:700, color:fmtColor(val) }}>{fmtMoney(val)}</div>
                <div style={{ fontSize:11, color:T.textFaintest, marginTop:3 }}>{month}</div>
              </div>
            ))}
          </div>
        )}

        {/* Stats table — 2 columns on wide, 1 on narrow */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(380px,1fr))", gap:"0 40px" }}>
          {(()=>{
            const avgWinVal    = wins.length   ? grossWin / wins.length    : 0;
            const avgLossVal   = losses.length ? -(grossLoss / losses.length) : 0;
            const bestT        = closed.length ? Math.max(...closed.map(t=>t.pl)) : 0;
            const worstT       = closed.length ? Math.min(...closed.map(t=>t.pl)) : 0;
            const largestProfDay = dayPLArr.length ? Math.max(...dayPLArr) : 0;
            const largestLossDay = dayPLArr.length ? Math.min(...dayPLArr) : 0;
            const avgDailyPL   = tradingDays ? totalPL / tradingDays : 0;
            const avgWinDayPL  = winDays  ? dayPLArr.filter(v=>v>0).reduce((a,v)=>a+v,0) / winDays  : 0;
            const avgLossDayPL = lossDays ? dayPLArr.filter(v=>v<0).reduce((a,v)=>a+v,0) / lossDays : 0;
            const ddPct        = peak>0 ? ((maxDD/peak)*100).toFixed(1) : "0.0";
            const col1 = [
              ["Total P&L",                  fmtMoney(totalPL),                              fmtColor(totalPL)],
              ["Average daily volume",        (closed.length/(tradingDays||1)).toFixed(2),     T.text],
              ["Average winning trade",       `+$${avgWinVal.toFixed(2)}`,                    "#22c55e"],
              ["Average losing trade",        avgLossVal<0?`-$${Math.abs(avgLossVal).toFixed(2)}`:"$0.00", avgLossVal<0?"#ef4444":T.textFaint],
              ["Total number of trades",      closed.length,                                  T.text],
              ["Number of winning trades",    wins.length,                                    wins.length>0?"#22c55e":T.text],
              ["Number of losing trades",     losses.length,                                  losses.length>0?"#ef4444":T.text],
              ["Number of break even trades", 0,                                              T.text],
              ["Max consecutive wins",        maxWin,                                         maxWin>0?"#22c55e":T.text],
              ["Max consecutive losses",      maxLoss,                                        maxLoss>0?"#ef4444":T.text],
              ["Total commissions",           "$0.00",                                        T.text],
              ["Total swap",                  "$0.00",                                        T.text],
              ["Largest profit",              `+$${bestT.toFixed(2)}`,                        bestT>0?"#22c55e":T.textFaint],
              ["Largest loss",                worstT<0?`-$${Math.abs(worstT).toFixed(2)}`:"$0.00", worstT<0?"#ef4444":T.textFaint],
              ["Avg hold time (All)",         "—",                                            T.text],
              ["Avg hold time (Winners)",     "—",                                            T.text],
              ["Avg hold time (Losers)",      "—",                                            T.text],
            ];
            const col2 = [
              ["Open trades",                 0,                                              T.text],
              ["Total trading days",          tradingDays,                                    tradingDays>0?"#60a5fa":T.text],
              ["Winning days",                winDays,                                        winDays>0?"#22c55e":T.text],
              ["Losing days",                 lossDays,                                       lossDays>0?"#ef4444":T.text],
              ["Breakeven days",              0,                                              T.text],
              ["Max consecutive winning days",maxWin,                                         maxWin>0?"#22c55e":T.text],
              ["Max consecutive losing days", maxLoss,                                        maxLoss>0?"#ef4444":T.text],
              ["Average daily P&L",           fmtMoney(avgDailyPL),                          fmtColor(avgDailyPL)],
              ["Average winning day P&L",     avgWinDayPL>0?`+$${avgWinDayPL.toFixed(2)}`:"$0.00", avgWinDayPL>0?"#22c55e":T.textFaint],
              ["Average losing day P&L",      avgLossDayPL<0?`-$${Math.abs(avgLossDayPL).toFixed(2)}`:"$0.00", avgLossDayPL<0?"#ef4444":T.textFaint],
              ["Largest profitable day",      largestProfDay>0?`+$${largestProfDay.toFixed(2)}`:"$0.00", largestProfDay>0?"#22c55e":T.textFaint],
              ["Largest losing day",          largestLossDay<0?`-$${Math.abs(largestLossDay).toFixed(2)}`:"$0.00", largestLossDay<0?"#ef4444":T.textFaint],
              ["Trade expectancy",            fmtMoney(parseFloat(expectancy)),               fmtColor(parseFloat(expectancy))],
              ["Max drawdown",               maxDD>0?`-$${maxDD.toFixed(2)}`:"$0.00",        maxDD>0?"#ef4444":T.textFaint],
              ["Max drawdown %",              `${ddPct}%`,                                   parseFloat(ddPct)>0?"#ef4444":T.textFaint],
            ];
            return [col1, col2].map((col,ci)=>(
              <div key={ci}>{col.map(([l,v,c])=>(
                <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"9px 0", borderBottom:`1px solid ${T.border}` }}>
                  <span style={{ fontSize:13, color:T.textMuted }}>{l}</span>
                  <span style={{ fontSize:13, fontWeight:600, color:c }}>{String(v)}</span>
                </div>
              ))}</div>
            ));
          })()}
        </div>
      </div>

      {/* ── Long vs Short | Day Performance | Top Symbols ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:20, marginBottom:20 }}>

        {/* Long vs Short */}
        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:"20px" }}>
          <div style={{ fontSize:14, fontWeight:700, color:T.text, marginBottom:4, display:"flex", alignItems:"center", gap:8 }}>↑ Long vs Short</div>
          <div style={{ fontSize:11, color:T.textFaint, marginBottom:14 }}>Performance by trade direction</div>
          {[
            { dir:"BUY",  label:"Long",  icon:"↗", color:"#60a5fa", border:"#3b82f6" },
            { dir:"SELL", label:"Short", icon:"↙", color:"#ef4444", border:"#ef4444" },
          ].map(({dir,label,icon,color,border})=>{
            const dirT = closed.filter(t=>t.direction===dir);
            const dirW = dirT.filter(t=>t.isWin);
            const dirPL = dirT.reduce((a,t)=>a+t.pl, 0);
            const dirWR = dirT.length ? (dirW.length/dirT.length*100).toFixed(1) : "0.0";
            return (
              <div key={dir} style={{ background:T.cardAlt, border:`1px solid ${border}22`, borderRadius:12, padding:"14px 16px", marginBottom:10, borderLeft:`3px solid ${border}` }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
                  <div style={{ width:32, height:32, borderRadius:8, background:color+"22", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>{icon}</div>
                  <span style={{ fontSize:15, fontWeight:700, color:T.text }}>{label}</span>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
                  {[["TRADES",dirT.length,T.text],["P&L",fmtMoney(dirPL),fmtColor(dirPL)],["WIN %",`${dirWR}%`,"#60a5fa"]].map(([l,v,c])=>(
                    <div key={l}>
                      <div style={{ fontSize:9, color:T.textFaintest, fontWeight:600, letterSpacing:0.5, marginBottom:3 }}>{l}</div>
                      <div style={{ fontSize:15, fontWeight:700, color:c }}>{String(v)}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Day Performance */}
        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:"20px" }}>
          <div style={{ fontSize:14, fontWeight:700, color:T.text, marginBottom:4, display:"flex", alignItems:"center", gap:8 }}>📅 Day Performance</div>
          <div style={{ fontSize:11, color:T.textFaint, marginBottom:14 }}>Find your best trading days</div>
          {(()=>{
            const dayNames = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
            const dayData = dayNames.map((d,i)=>{
              const dayT = closed.filter(t=>{ const dow=(new Date(t.date).getDay()+6)%7; return dow===i; });
              const dayPLSum = dayT.reduce((a,t)=>a+t.pl, 0);
              return { name:d, pl:dayPLSum, trades:dayT.length };
            });
            const maxAbsPL = Math.max(1, ...dayData.map(d=>Math.abs(d.pl)));
            return dayData.map(({name,pl,trades})=>(
              <div key={name} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
                <div style={{ fontSize:12, color:T.textFaint, width:30 }}>{name}</div>
                <div style={{ flex:1, height:16, background:T.cardAlt, borderRadius:4, position:"relative", overflow:"hidden" }}>
                  <div style={{ position:"absolute", left:0, top:0, width:`${(Math.abs(pl)/maxAbsPL)*100}%`, height:"100%", background:pl>0?"#3b82f6":pl<0?"#ef4444":T.border, borderRadius:4, transition:"width 0.4s" }}></div>
                </div>
                <div style={{ fontSize:12, fontWeight:700, color:fmtColor(pl), width:55, textAlign:"right", flexShrink:0 }}>{pl!==0?fmtMoney(pl):"—"}</div>
              </div>
            ));
          })()}
        </div>

        {/* Top Symbols */}
        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:"20px" }}>
          <div style={{ fontSize:14, fontWeight:700, color:T.text, marginBottom:4, display:"flex", alignItems:"center", gap:8 }}>🏆 Top Symbols</div>
          <div style={{ fontSize:11, color:T.textFaint, marginBottom:14 }}>Best performing assets</div>
          {pairArr.length===0 ? (
            <div style={{ color:T.textFaintest, fontSize:13, textAlign:"center", padding:"20px 0" }}>No data yet</div>
          ) : pairArr.slice(0,5).map(([pair,d],i)=>{
            const wr = d.trades ? Math.round(d.wins/d.trades*100) : 0;
            return (
              <div key={pair} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", background:T.cardAlt, border:`1px solid ${T.border}`, borderRadius:10, marginBottom:8 }}>
                <div style={{ width:28, height:28, borderRadius:8, background:"#1e3a5f", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:"#60a5fa", flexShrink:0 }}>{i+1}</div>
                <span style={{ fontSize:16, flexShrink:0 }}>{PAIR_EMOJI[pair]||"🔵"}</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:T.text }}>{pair}</div>
                  <div style={{ fontSize:11, color:T.textFaint }}>{d.trades} trades · {wr}% win</div>
                </div>
                <div style={{ fontSize:14, fontWeight:700, color:fmtColor(d.pl) }}>{fmtMoney(d.pl)}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Analytics Trading Calendar ── */}
      <AnalyticsCalendar allTrades={trades} theme={T} />
    </div>
  );
}

export default Analytics;