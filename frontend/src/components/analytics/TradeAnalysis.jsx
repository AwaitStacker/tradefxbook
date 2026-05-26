// src/components/analytics/TradeAnalysis.jsx
import { useState } from "react";
import { useEffect } from "react";
import { fmtMoney, fmtColor, calcTradeScore, holdTimeBetween } from "../../utils/calculations";
import { PAIR_EMOJI, CHECKLIST_ITEMS } from "../../data/constants";
import ScreenshotUploader from "../common/ScreenshotUploader";


// ─── TRADE ANALYSIS PAGE ──────────────────────────────────────────────────────
function TradeAnalysis({ trades, theme: T, selectedTradeId, onClearSelected }) {
  const journaled = trades.filter(t => t.journaled);
  const [selId, setSelId] = useState(selectedTradeId || journaled[0]?.id || null);
  const [listFilter, setListFilter] = useState("All");
  const [sortBy, setSortBy] = useState("date");

  // When navigated from calendar with a specific trade, auto-select it
  useEffect(() => {
    if (selectedTradeId) {
      setSelId(selectedTradeId);
      // If the trade is not journaled, show all trades in list so it's visible
      const t = trades.find(t => t.id === selectedTradeId);
      if (t && !t.journaled) setListFilter("All");
      if (onClearSelected) onClearSelected();
    }
  }, [selectedTradeId]);

  const winners = journaled.filter(t => t.isWin);
  const losers  = journaled.filter(t => !t.isWin);
  const displayed = listFilter==="Winners"?winners:listFilter==="Losers"?losers:journaled;
  const sorted = [...displayed].sort((a,b)=>{
    if(sortBy==="date")   return new Date(b.date)-new Date(a.date);
    if(sortBy==="pl")     return b.pl-a.pl;
    if(sortBy==="score")  return calcTradeScore(b)-calcTradeScore(a);
    return 0;
  });

  // sel searches ALL trades so calendar navigation works even for non-journaled trades
  const sel = selId ? trades.find(t=>t.id===selId) : sorted[0]||null;
  const score = sel ? calcTradeScore(sel) : 0;

  // Score breakdown
  const profScore = sel?.isWin ? 30 : 0;
  const execItems = Object.values(sel?.checklist||{}).filter(Boolean).length;
  const execScore = Math.min(40, execItems*10);
  const jrnlScore = [sel?.preAnalysis,sel?.postReview,sel?.emotionBefore&&sel?.emotionBefore!=="Neutral",sel?.lessons].filter(Boolean).length * 5;
  const ratScore  = Math.round(sel?.rating||0);

  const scoreColor = score>=80?"#22c55e":score>=60?"#60a5fa":score>=40?"#f59e0b":"#ef4444";
  const scoreLabel = score>=80?"Excellent":score>=60?"Good":score>=40?"Average":"Needs Work";

  // vs average
  const avgPL  = winners.length ? winners.reduce((a,t)=>a+t.pl,0)/winners.length : 0;
  const avgScore = journaled.length ? journaled.reduce((a,t)=>a+calcTradeScore(t),0)/journaled.length : 0;

  return (
    <div style={{ display:"flex", height:"calc(100vh - 62px)", overflow:"hidden", padding:"16px 20px", gap:16, width:"100%", boxSizing:"border-box" }}>

      {/* Left — trade list */}
      <div style={{ width:290, flexShrink:0, background:T.card, border:`1px solid ${T.border}`, borderRadius:14, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <div style={{ padding:"14px 14px 0", borderBottom:`1px solid ${T.border}`, flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
            <span style={{ fontWeight:700, fontSize:14, color:T.text }}>Trade Analysis</span>
            <span style={{ background:T.hover, color:T.textFaint, fontSize:10, fontWeight:600, padding:"2px 7px", borderRadius:5 }}>{journaled.length} journaled</span>
          </div>
          {/* Filter tabs */}
          <div style={{ display:"flex", borderBottom:`1px solid ${T.border}`, marginLeft:-14, marginRight:-14, paddingLeft:14 }}>
            {[{k:"All",c:journaled.length},{k:"Winners",c:winners.length},{k:"Losers",c:losers.length}].map(({k,c})=>(
              <button key={k} onClick={()=>setListFilter(k)} style={{ background:"none", border:"none", cursor:"pointer", padding:"7px 10px", fontSize:12, color:listFilter===k?"#60a5fa":T.textFaint, fontWeight:listFilter===k?600:400, borderBottom:listFilter===k?"2px solid #3b82f6":"2px solid transparent", display:"flex", alignItems:"center", gap:4 }}>
                {k} <span style={{ background:listFilter===k?"#1e3a5f":T.hover, color:listFilter===k?"#60a5fa":T.textFaint, fontSize:9, padding:"1px 5px", borderRadius:8, fontWeight:700 }}>{c}</span>
              </button>
            ))}
          </div>
          {/* Sort */}
          <div style={{ display:"flex", gap:5, padding:"8px 0" }}>
            {[{v:"date",l:"By Date"},{v:"pl",l:"By P&L"},{v:"score",l:"By Score"}].map(s=>(
              <button key={s.v} onClick={()=>setSortBy(s.v)} style={{ background:sortBy===s.v?"#1e3a5f":T.cardAlt, border:sortBy===s.v?"1px solid #3b82f655":`1px solid ${T.border}`, borderRadius:6, padding:"4px 9px", color:sortBy===s.v?"#60a5fa":T.textFaint, cursor:"pointer", fontSize:11 }}>{s.l}</button>
            ))}
          </div>
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:"8px" }}>
          {sorted.length===0?(
            <div style={{ padding:"30px 10px", textAlign:"center", color:T.textFaintest, fontSize:12 }}>
              <div style={{ fontSize:28, marginBottom:8, opacity:0.3 }}>📋</div>
              No journaled trades yet.<br/>Complete a journal entry first.
            </div>
          ):sorted.map(t => {
            const s = calcTradeScore(t);
            const sc = s>=80?"#22c55e":s>=60?"#60a5fa":s>=40?"#f59e0b":"#ef4444";
            return (
              <div key={t.id} className="tfb-card" onClick={()=>setSelId(t.id)} style={{ background:sel?.id===t.id?"linear-gradient(135deg,#1e3a5f,#1a2744)":T.cardAlt, border:sel?.id===t.id?"1px solid #3b82f6":`1px solid ${T.border}`, borderRadius:11, padding:"11px 12px", cursor:"pointer", marginBottom:6 }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:5 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <span style={{ fontSize:15 }}>{PAIR_EMOJI[t.pair]||"🔵"}</span>
                    <span style={{ fontWeight:700, fontSize:13, color:T.text }}>{t.pair}</span>
                    <span style={{ fontSize:9, background:T.hover, color:T.textFaint, padding:"1px 5px", borderRadius:3 }}>{t.session}</span>
                  </div>
                  <div style={{ background:sc+"22", border:`1px solid ${sc}55`, borderRadius:6, padding:"2px 8px", display:"flex", alignItems:"center", gap:3 }}>
                    <span style={{ fontSize:11, fontWeight:700, color:sc }}>Score: {s}</span>
                  </div>
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div style={{ fontSize:11, color:T.textFaint }}>
                    <span style={{ color:t.direction==="BUY"?"#22c55e":"#ef4444", fontWeight:700 }}>{t.direction==="BUY"?"Long":"Short"}</span>
                    {" "}${t.entry} · {new Date(t.date).toLocaleDateString("en-IN",{timeZone:"Asia/Kolkata"})}
                  </div>
                  <span style={{ fontSize:13, fontWeight:700, color:fmtColor(t.pl) }}>{fmtMoney(t.pl)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right — detail panel */}
      {sel ? (
        <div className="tfb-panel" style={{ flex:1, display:"flex", flexDirection:"column", gap:14, overflowY:"auto", minWidth:0 }}>
          {/* Header */}
          <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:"18px 22px" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <span style={{ fontSize:28 }}>{PAIR_EMOJI[sel.pair]||"🔵"}</span>
                <div>
                  <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                    <span style={{ fontSize:20, fontWeight:800, color:T.text }}>{sel.pair}</span>
                    <span style={{ background:sel.isWin?"#0d2918":"#2a0f0f", color:sel.isWin?"#22c55e":"#ef4444", fontSize:11, fontWeight:700, padding:"3px 9px", borderRadius:6 }}>{sel.isWin?"WINNER":"LOSER"}</span>
                    <span style={{ background:scoreColor+"22", color:scoreColor, fontSize:11, fontWeight:700, padding:"3px 9px", borderRadius:6 }}>Score: {score}</span>
                  </div>
                  <div style={{ fontSize:12, color:T.textFaint, marginTop:4 }}>
                    <span style={{ color:sel.direction==="BUY"?"#22c55e":"#ef4444", fontWeight:700 }}>{sel.direction==="BUY"?"Long":"Short"}</span>
                    {" • "}{new Date(sel.date).toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})}
                    {" • Duration: "}{holdTimeBetween(sel.date, sel.exitDate||sel.date)}
                  </div>
                </div>
              </div>
              <div style={{ background:fmtColor(sel.pl)==="#22c55e"?"#0d2918":"#2a0f0f", borderRadius:12, padding:"10px 20px", textAlign:"right" }}>
                <div style={{ fontSize:10, color:T.textFaint }}>P&L</div>
                <div style={{ fontSize:22, fontWeight:800, color:fmtColor(sel.pl) }}>{fmtMoney(sel.pl)}</div>
              </div>
            </div>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))", gap:14 }}>
            {/* Journal Entry card */}
            <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:"18px 20px" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
                <div style={{ fontSize:14, fontWeight:700, color:T.text, display:"flex", alignItems:"center", gap:7 }}>📖 Journal Entry</div>
                <span style={{ background:"#1e3a5f", color:"#60a5fa", fontSize:11, fontWeight:600, padding:"3px 10px", borderRadius:5 }}>Journaled</span>
              </div>
              {/* Checklist items */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, marginBottom:14 }}>
                {[...CHECKLIST_ITEMS,...(sel.customChecklist||[])].map(item=>{
                  const checked = sel.checklist?.[item];
                  return <div key={item} style={{ background:checked?"#1e3a5f":T.cardAlt, border:`1px solid ${checked?"#3b82f655":T.border}`, borderRadius:8, padding:"7px 10px", display:"flex", alignItems:"center", gap:6 }}>
                    <span style={{ color:checked?"#60a5fa":T.textFaintest, fontSize:14 }}>{checked?"✓":"○"}</span>
                    <span style={{ fontSize:12, color:checked?"#60a5fa":T.textFaint }}>{item}</span>
                  </div>;
                })}
              </div>
              {/* Rating stars */}
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
                <span style={{ fontSize:12, color:T.textFaint }}>Rating:</span>
                <div style={{ display:"flex", gap:2 }}>
                  {[1,2,3,4,5,6,7,8,9,10].map(n=><span key={n} style={{ fontSize:14, color:n<=(sel.rating||0)?"#f59e0b":T.textFaintest }}>★</span>)}
                </div>
                <span style={{ fontSize:13, fontWeight:700, color:T.text }}>{sel.rating||0}/10</span>
              </div>
              {/* Lessons */}
              {sel.lessons && (
                <div style={{ marginBottom:12 }}>
                  <div style={{ fontSize:10, color:T.textFaint, fontWeight:600, letterSpacing:0.5, marginBottom:5 }}>LESSONS LEARNED:</div>
                  <div style={{ fontSize:13, color:T.textMuted, lineHeight:1.6 }}>{sel.lessons}</div>
                </div>
              )}
              <button className="tfb-btn" style={{ width:"100%", background:T.cardAlt, border:`1px solid ${T.border2}`, borderRadius:9, padding:"10px", color:T.textMuted, cursor:"pointer", fontSize:13, fontWeight:600 }}>View Full Journal</button>
            </div>

            {/* Trade Quality Score */}
            <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:"18px 20px" }}>
              <div style={{ fontSize:14, fontWeight:700, color:T.text, marginBottom:16, display:"flex", alignItems:"center", gap:7 }}>🎯 Trade Quality</div>
              <div style={{ display:"flex", gap:16, alignItems:"flex-start", marginBottom:16 }}>
                {/* Circle score */}
                <div style={{ position:"relative", width:80, height:80, flexShrink:0 }}>
                  <svg viewBox="0 0 80 80" style={{ position:"absolute", inset:0, transform:"rotate(-90deg)" }}>
                    <circle cx="40" cy="40" r="32" fill="none" stroke={T.border} strokeWidth="7"/>
                    <circle cx="40" cy="40" r="32" fill="none" stroke={scoreColor} strokeWidth="7" strokeDasharray={`${2*Math.PI*32}`} strokeDashoffset={`${2*Math.PI*32*(1-score/100)}`} strokeLinecap="round"/>
                  </svg>
                  <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <span style={{ fontSize:18, fontWeight:800, color:scoreColor }}>{score}</span>
                  </div>
                </div>
                {/* Score breakdown bars */}
                <div style={{ flex:1 }}>
                  {[
                    {l:"Profitability", val:profScore, max:30},
                    {l:"Execution",     val:execScore, max:40},
                    {l:"Journal",       val:jrnlScore, max:20},
                    {l:"Rating",        val:ratScore,  max:10},
                  ].map(({l,val,max})=>(
                    <div key={l} style={{ marginBottom:8 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                        <span style={{ fontSize:11, color:T.textFaint }}>{l}</span>
                        <span style={{ fontSize:11, fontWeight:700, color:"#60a5fa" }}>{val}/{max}</span>
                      </div>
                      <div style={{ height:4, background:T.border, borderRadius:2 }}>
                        <div style={{ width:`${(val/max)*100}%`, height:"100%", background:"#3b82f6", borderRadius:2, transition:"width 0.5s" }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* How calculated */}
              <div style={{ borderTop:`1px solid ${T.border}`, paddingTop:12 }}>
                <div style={{ fontSize:12, color:T.textFaint, fontWeight:600, marginBottom:8 }}>How is this calculated?</div>
                {[
                  {l:"Profitability (30 pts)",c:"Win: 30 | Break-even: 15 | Loss: 0"},
                  {l:"Execution (40 pts)",    c:"10 pts each: Followed Plan, Proper Risk, Good Entry, Patient Exit"},
                  {l:"Journal (20 pts)",      c:"5 pts each: Pre-analysis, Post-review, Emotions, Lessons"},
                  {l:"Rating (10 pts)",       c:"Your self-rating (1–10)"},
                ].map(({l,c})=>(
                  <div key={l} style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:6 }}>
                    <span style={{ fontSize:12, fontWeight:600, color:T.text }}>{l}</span>
                    <span style={{ fontSize:11, color:T.textFaint, textAlign:"right" }}>{c}</span>
                  </div>
                ))}
                <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:10 }}>
                  {[["#22c55e","80+ Excellent"],["#60a5fa","60+ Good"],["#f59e0b","40+ Average"],["#ef4444","<40 Needs Work"]].map(([c,l])=>(
                    <span key={l} style={{ background:c+"22", color:c, fontSize:10, fontWeight:700, padding:"3px 8px", borderRadius:5 }}>{l}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Insights */}
          <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:"18px 22px" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
              <div style={{ fontSize:14, fontWeight:700, color:T.text, display:"flex", alignItems:"center", gap:7 }}>💡 Insights</div>
              <span style={{ background:"#1e3a5f", color:"#60a5fa", fontSize:10, fontWeight:700, padding:"3px 10px", borderRadius:5 }}>COMING SOON</span>
            </div>
            <div style={{ background:T.cardAlt, border:`1px solid ${T.border}`, borderRadius:10, padding:"14px 16px", display:"flex", alignItems:"center", gap:12 }}>
              <span style={{ fontSize:24 }}>💡</span>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:T.text }}>AI-Powered Insights</div>
                <div style={{ fontSize:12, color:T.textFaint }}>Get personalized trading insights and pattern analysis</div>
              </div>
            </div>
          </div>

          {/* vs Your Average */}
          <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:"18px 22px" }}>
            <div style={{ fontSize:14, fontWeight:700, color:T.text, marginBottom:14, display:"flex", alignItems:"center", gap:7 }}>📊 vs Your Average</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:12 }}>
              {[
                { label:"VS AVG WINNER",    main: fmtMoney(sel.pl),               sub: sel.pl>=avgPL?`+${((sel.pl-avgPL)/Math.max(avgPL,1)*100).toFixed(0)}%`:`${((sel.pl-avgPL)/Math.max(avgPL,1)*100).toFixed(0)}%`,  subColor: sel.pl>=avgPL?"#22c55e":"#ef4444" },
                { label:"HOLD DURATION",    main: holdTimeBetween(sel.date,sel.exitDate||sel.date), sub:"+0%", subColor:"#22c55e" },
                { label:"EXECUTION SCORE",  main: `${score}%`,                    sub: score>=avgScore?`+${(score-avgScore).toFixed(0)}%`:`${(score-avgScore).toFixed(0)}%`, subColor: score>=avgScore?"#22c55e":"#ef4444" },
              ].map(({label,main,sub,subColor})=>(
                <div key={label} style={{ background:T.cardAlt, border:`1px solid ${T.border}`, borderRadius:11, padding:"14px 16px" }}>
                  <div style={{ fontSize:10, color:T.textFaint, fontWeight:600, letterSpacing:0.5, marginBottom:6 }}>{label}</div>
                  <div style={{ fontSize:18, fontWeight:700, color:T.text }}>{main}</div>
                  <div style={{ fontSize:12, color:subColor, fontWeight:600, marginTop:3 }}>{sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Pre/Post analysis if filled */}
          {(sel.preAnalysis||sel.postReview) && (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:14 }}>
              {sel.preAnalysis && (
                <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:"16px 18px" }}>
                  <div style={{ fontSize:12, color:T.textFaint, fontWeight:600, marginBottom:8 }}>📋 PRE-TRADE ANALYSIS</div>
                  <div style={{ fontSize:13, color:T.textMuted, lineHeight:1.7 }}>{sel.preAnalysis}</div>
                </div>
              )}
              {sel.postReview && (
                <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:"16px 18px" }}>
                  <div style={{ fontSize:12, color:T.textFaint, fontWeight:600, marginBottom:8 }}>🔁 POST-TRADE REVIEW</div>
                  <div style={{ fontSize:13, color:T.textMuted, lineHeight:1.7 }}>{sel.postReview}</div>
                </div>
              )}
            </div>
          )}

          {/* Screenshots */}
          {sel.screenshots?.length>0 && (
            <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:"16px 18px" }}>
              <div style={{ fontSize:12, color:T.textFaint, fontWeight:600, marginBottom:10 }}>🖼️ SCREENSHOTS</div>
              <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                {sel.screenshots.map(sc=><img key={sc.id} src={sc.url} alt="" style={{ width:180, height:110, objectFit:"cover", borderRadius:10, border:`1px solid ${T.border}`, transition:"transform 0.2s" }} onMouseEnter={e=>e.currentTarget.style.transform="scale(1.04)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}/>)}
              </div>
            </div>
          )}
        </div>
      ):(
        <div style={{ flex:1, background:T.card, border:`1px solid ${T.border}`, borderRadius:14, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:10 }}>
          <span style={{ fontSize:40, opacity:0.2 }}>📊</span>
          <div style={{ fontSize:15, color:T.textFaint }}>Select a journaled trade to see analysis</div>
        </div>
      )}
    </div>
  );
}

export default TradeAnalysis;
