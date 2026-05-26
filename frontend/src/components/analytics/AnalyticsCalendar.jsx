// src/components/analytics/AnalyticsCalendar.jsx
import { useState } from "react";
import { fmtMoney, fmtColor } from "../../utils/calculations";
import { PAIR_EMOJI } from "../../data/constants";

// ─── ANALYTICS CALENDAR (standalone component) ────────────────────────────────
function AnalyticsCalendar({ allTrades, theme: T }) {
  const [aCalYear, setACalYear] = useState(new Date().getFullYear());
  const [aCalMonth, setACalMonth] = useState(new Date().getMonth());
  const [aClickedDay, setAClickedDay] = useState(null);
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const closed = allTrades.filter(t=>t.exit);
  const aFirstDay = new Date(aCalYear, aCalMonth, 1).getDay();
  const aDaysInMonth = new Date(aCalYear, aCalMonth+1, 0).getDate();
  const aAdjFirst = (aFirstDay+6)%7;
  const aCalCells = [...Array(aAdjFirst).fill(null), ...Array.from({length:aDaysInMonth},(_,i)=>i+1)];
  const aDayPL = {}, aDayTrades = {};
  closed.forEach(t=>{
    const td = new Date(t.date);
    if(td.getFullYear()===aCalYear && td.getMonth()===aCalMonth){
      const d = td.getDate();
      aDayPL[d] = (aDayPL[d]||0)+t.pl;
      if(!aDayTrades[d]) aDayTrades[d]=[];
      aDayTrades[d].push(t);
    }
  });
  const aClickedTrades = aClickedDay ? (aDayTrades[aClickedDay]||[]) : [];
  const aClickedPL = aClickedTrades.reduce((a,t)=>a+t.pl, 0);
  const today = new Date();
  const rows = []; let week2 = [];
  aCalCells.forEach((day,i)=>{ week2.push(day); if(week2.length===7||i===aCalCells.length-1){ while(week2.length<7)week2.push(null); rows.push([...week2]); week2=[]; }});

  return (
    <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:"22px", marginBottom:20 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
        <div>
          <div style={{ fontSize:15, fontWeight:700, color:T.text }}>📅 Trading Calendar</div>
          <div style={{ fontSize:11, color:T.textFaint }}>Daily P&L heatmap — Click on days to see trades</div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <button className="tfb-btn" onClick={()=>{ let m=aCalMonth-1,y=aCalYear; if(m<0){m=11;y--;} setACalMonth(m);setACalYear(y);setAClickedDay(null); }} style={{ background:T.cardAlt, border:`1px solid ${T.border}`, borderRadius:7, width:30, height:30, cursor:"pointer", color:T.textMuted, fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>‹</button>
          <span style={{ fontSize:14, fontWeight:700, color:T.text, minWidth:110, textAlign:"center" }}>{monthNames[aCalMonth]} {aCalYear}</span>
          <button className="tfb-btn" onClick={()=>{ let m=aCalMonth+1,y=aCalYear; if(m>11){m=0;y++;} setACalMonth(m);setACalYear(y);setAClickedDay(null); }} style={{ background:T.cardAlt, border:`1px solid ${T.border}`, borderRadius:7, width:30, height:30, cursor:"pointer", color:T.textMuted, fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>›</button>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr minmax(0,280px)", gap:20 }}>
        <div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr) 70px", gap:4, marginBottom:6 }}>
            {["MON","TUE","WED","THU","FRI","SAT","SUN"].map((d,i)=><div key={i} style={{ textAlign:"center", fontSize:10, color:T.textFaintest, fontWeight:700 }}>{d}</div>)}
            <div style={{ textAlign:"center", fontSize:10, color:T.textFaintest, fontWeight:700 }}>WEEKLY</div>
          </div>
          {rows.map((row,ri)=>{
            const wpl = row.reduce((s,d)=>s+(d?aDayPL[d]||0:0),0);
            const tradedD = row.filter(d=>d&&aDayTrades[d]?.length>0).length;
            return (
              <div key={ri} style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr) 70px", gap:4, marginBottom:4 }}>
                {row.map((day,ci)=>{
                  const pl = day?aDayPL[day]||null:null;
                  const isToday = day===today.getDate()&&aCalMonth===today.getMonth()&&aCalYear===today.getFullYear();
                  const isClicked = aClickedDay===day&&day!==null;
                  return <div key={ci} onClick={()=>day&&setAClickedDay(aClickedDay===day?null:day)} style={{ background:!day?"transparent":isClicked?"#1e3a5f":pl>0?"#0d1f3c":pl<0?"#2a0f0f":T.cardAlt, border:!day?"none":isClicked?"1px solid #3b82f6":isToday?"1px solid #3b82f633":pl>0?"1px solid #60a5fa44":pl<0?"1px solid #ef444433":`1px solid ${T.border}`, borderRadius:8, padding:"6px 3px", minHeight:52, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", cursor:day&&aDayTrades[day]?.length>0?"pointer":"default", transition:"all 0.15s" }}>
                    {day&&<>
                      <span style={{ fontSize:11, fontWeight:600, color:isClicked?"#93c5fd":isToday?"#60a5fa":pl>0?"#93c5fd":pl<0?"#f87171":T.textFaint }}>{day}</span>
                      {pl!==null&&<span style={{ fontSize:9, fontWeight:700, color:pl>0?"#60a5fa":"#f87171", marginTop:2 }}>{fmtMoney(pl)}</span>}
                      {aDayTrades[day]?.length>0&&<span style={{ fontSize:8, color:T.textFaintest }}>{aDayTrades[day].length}t</span>}
                    </>}
                  </div>;
                })}
                <div style={{ background:wpl>0?"#0d1f3c":wpl<0?"#2a0f0f":T.hover, border:`1px solid ${wpl>0?"#60a5fa33":wpl<0?"#ef444433":T.border}`, borderRadius:8, padding:"5px 6px", minHeight:52, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
                  <div style={{ fontSize:9, color:T.textFaintest, fontWeight:700 }}>WEEKLY</div>
                  <div style={{ fontSize:11, fontWeight:700, color:wpl>0?"#60a5fa":wpl<0?"#f87171":T.textFaintest }}>{wpl!==0?fmtMoney(wpl):"$0"}</div>
                  <div style={{ fontSize:8, color:T.textFaintest }}>Traded Days {tradedD}</div>
                </div>
              </div>
            );
          })}
          <div style={{ display:"flex", gap:12, marginTop:10, justifyContent:"center" }}>
            {[["#60a5fa","Profitable Day"],["#ef4444","Losing Day"],["#64748b","No Trades"]].map(([c,l])=>(
              <span key={l} style={{ display:"flex", alignItems:"center", gap:4, fontSize:10, color:T.textFaint }}>
                <span style={{ width:8, height:8, borderRadius:"50%", background:c, display:"inline-block" }}></span>{l}
              </span>
            ))}
          </div>
        </div>

        {/* Day detail panel */}
        <div style={{ background:T.cardAlt, border:`1px solid ${T.border}`, borderRadius:12, padding:"16px", minHeight:200 }}>
          {aClickedDay && aClickedTrades.length>0 ? (
            <>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                <div>
                  <div style={{ fontSize:14, fontWeight:700, color:T.text }}>Trades on {monthNames[aCalMonth]} {aClickedDay}</div>
                  <div style={{ fontSize:11, color:T.textFaint }}>{aClickedTrades.length} trade{aClickedTrades.length>1?"s":""}</div>
                </div>
                <button onClick={()=>setAClickedDay(null)} style={{ background:T.hover, border:`1px solid ${T.border}`, borderRadius:7, width:24, height:24, cursor:"pointer", color:T.textMuted, fontSize:13 }}>✕</button>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:12 }}>
                {[
                  {l:"TOTAL P&L", v:fmtMoney(aClickedPL), c:fmtColor(aClickedPL)},
                  {l:"TRADES",    v:aClickedTrades.length, c:T.text},
                  {l:"WIN RATE",  v:`${aClickedTrades.length?Math.round(aClickedTrades.filter(t=>t.isWin).length/aClickedTrades.length*100):0}%`, c:"#60a5fa"},
                ].map(({l,v,c})=>(
                  <div key={l} style={{ background:T.card, borderRadius:8, padding:"8px 10px", border:`1px solid ${T.border}` }}>
                    <div style={{ fontSize:9, color:T.textFaintest, fontWeight:600, marginBottom:3 }}>{l}</div>
                    <div style={{ fontSize:14, fontWeight:700, color:c }}>{String(v)}</div>
                  </div>
                ))}
              </div>
              {aClickedTrades.map(t=>(
                <div key={t.id} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:9, padding:"9px 12px", marginBottom:6, display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:15 }}>{PAIR_EMOJI[t.pair]||"🔵"}</span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12, fontWeight:600, color:T.text }}>{t.pair} <span style={{ color:t.direction==="BUY"?"#22c55e":"#ef4444", fontSize:11 }}>{t.direction==="BUY"?"LONG":"SHORT"}</span></div>
                    <div style={{ fontSize:10, color:T.textFaint }}>{t.session} · {new Date(t.date).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",timeZone:"Asia/Kolkata"})}</div>
                  </div>
                  <span style={{ fontSize:13, fontWeight:700, color:fmtColor(t.pl) }}>{fmtMoney(t.pl)}</span>
                </div>
              ))}
            </>
          ) : (
            <div style={{ height:"100%", minHeight:150, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:8, opacity:0.5 }}>
              <span style={{ fontSize:28 }}>📋</span>
              <span style={{ fontSize:12, color:T.textFaint, textAlign:"center" }}>Click on a day with trades to view details</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AnalyticsCalendar;