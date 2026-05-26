// src/components/journal/Journal.jsx
import { useState, useEffect } from "react";
import { CHECKLIST_ITEMS, EMOTIONS, PAIR_EMOJI } from "../../data/constants";
import { fmtMoney, fmtColor, calcTradeScore, holdTimeBetween } from "../../utils/calculations";
import ScreenshotUploader from "../common/ScreenshotUploader";

// ─── JOURNAL PAGE ─────────────────────────────────────────────────────────────
function Journal({ trades, onUpdate, theme: T }) {
  const [selId, setSelId] = useState(null);
  const [section, setSection] = useState("tags");
  const [filterTab, setFilterTab] = useState("All");
  const [toast, setToast] = useState(null);

  const pending = trades.filter(t=>!t.journaled);
  const journaled = trades.filter(t=>t.journaled);
  const displayed = filterTab==="All"?trades:filterTab==="Pending"?pending:journaled;
  const sel = selId ? trades.find(t=>t.id===selId) : displayed[0]||null;
  const upd = (field, val) => { if(!sel) return; onUpdate({...sel,[field]:val}); };

  // Journal completion %
  const journalFields = sel ? [
    sel.tags, sel.preAnalysis, sel.postReview, sel.lessons,
    sel.emotionBefore && sel.emotionBefore!=="Neutral",
    sel.followedPlan!==null,
    Object.values(sel.checklist||{}).some(Boolean)
  ] : [];
  const completedFields = journalFields.filter(Boolean).length;
  const completionPct = sel ? Math.round(completedFields / journalFields.length * 100) : 0;

  const allItems = sel ? [...CHECKLIST_ITEMS,...(sel.customChecklist||[])] : CHECKLIST_ITEMS;
  const checkedCount = sel ? Object.values(sel.checklist||{}).filter(Boolean).length : 0;

  // Auto-save indicator
  const [autoSaved, setAutoSaved] = useState(false);
  useEffect(() => {
    if(sel) { setAutoSaved(true); const t=setTimeout(()=>setAutoSaved(false),1500); return()=>clearTimeout(t); }
  }, [sel?.tags,sel?.preAnalysis,sel?.postReview,sel?.lessons,sel?.emotionBefore,sel?.emotionAfter,sel?.followedPlan]);

  const showToast = (msg, type="success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveJournal = () => {
    if(!sel) return;
    onUpdate({ ...sel, journaled: true });
    showToast("Journal saved successfully! ✓");
  };

  return (
    <div style={{ display:"flex", height:"calc(100vh - 62px)", overflow:"hidden", padding:"16px 20px", gap:16, width:"100%", boxSizing:"border-box", position:"relative" }}>

      {/* Toast notification */}
      {toast && (
        <div style={{ position:"fixed", top:80, left:"50%", transform:"translateX(-50%)", background:toast.type==="success"?"#0d2918":"#2a0f0f", border:`1px solid ${toast.type==="success"?"#22c55e":"#ef4444"}`, borderRadius:10, padding:"12px 24px", zIndex:300, display:"flex", alignItems:"center", gap:8, boxShadow:"0 8px 32px #0008", animation:"fadeIn 0.2s ease" }}>
          <span style={{ fontSize:16 }}>{toast.type==="success"?"✅":"❌"}</span>
          <span style={{ fontSize:14, color:toast.type==="success"?"#4ade80":"#f87171", fontWeight:600 }}>{toast.msg}</span>
        </div>
      )}

      {/* Left panel */}
      <div style={{ width:280, flexShrink:0, background:T.card, border:`1px solid ${T.border}`, borderRadius:14, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <div style={{ padding:"14px 14px 0", borderBottom:`1px solid ${T.border}`, flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
            <span style={{ fontWeight:700, fontSize:14, color:T.text }}>Trade Journal</span>
            <div style={{ display:"flex", gap:5 }}>
              <span style={{ background:"#0d2918", color:"#22c55e", fontSize:10, fontWeight:600, padding:"2px 7px", borderRadius:5, display:"flex", alignItems:"center", gap:3 }}>
                <span style={{ width:5, height:5, borderRadius:"50%", background:"#22c55e", display:"inline-block" }}></span>Live
              </span>
              <span style={{ background:T.hover, color:T.textFaint, fontSize:10, fontWeight:600, padding:"2px 7px", borderRadius:5 }}>{trades.length}</span>
            </div>
          </div>
          <div style={{ display:"flex", borderBottom:`1px solid ${T.border}`, marginLeft:-14, marginRight:-14, paddingLeft:14 }}>
            {[{k:"All",c:trades.length},{k:"Pending",c:pending.length},{k:"Journaled",c:journaled.length}].map(({k,c})=>(
              <button key={k} onClick={()=>setFilterTab(k)} style={{ background:"none", border:"none", cursor:"pointer", padding:"7px 10px", fontSize:12, color:filterTab===k?"#60a5fa":T.textFaint, fontWeight:filterTab===k?600:400, borderBottom:filterTab===k?"2px solid #3b82f6":"2px solid transparent", display:"flex", alignItems:"center", gap:4 }}>
                {k} <span style={{ background:filterTab===k?"#1e3a5f":T.hover, color:filterTab===k?"#60a5fa":T.textFaint, fontSize:9, padding:"1px 5px", borderRadius:8, fontWeight:700 }}>{c}</span>
              </button>
            ))}
          </div>
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:"8px" }}>
          {displayed.length===0?(
            <div style={{ padding:"22px 10px", textAlign:"center", color:T.textFaintest, fontSize:12 }}>
              {filterTab==="Pending"?"All trades journaled 🎉":"No trades yet"}
            </div>
          ):displayed.map(t=>(
            <div key={t.id} onClick={()=>setSelId(t.id)} style={{ background:(sel?.id===t.id)?"linear-gradient(135deg,#1e3a5f,#1a2744)":T.cardAlt, border:(sel?.id===t.id)?"1px solid #3b82f6":`1px solid ${T.border}`, borderRadius:11, padding:"11px 12px", cursor:"pointer", marginBottom:6 }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:5 }}>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <span style={{ fontSize:15 }}>{PAIR_EMOJI[t.pair]||"🔵"}</span>
                  <span style={{ fontWeight:700, fontSize:13, color:T.text }}>{t.pair}</span>
                  <span style={{ fontSize:9, color:T.textFaint, background:T.hover, padding:"1px 5px", borderRadius:3 }}>{t.session}</span>
                </div>
                <span style={{ background:t.journaled?"#1e3a5f":"#0d2918", color:t.journaled?"#60a5fa":"#22c55e", fontSize:9, fontWeight:700, padding:"2px 7px", borderRadius:4 }}>{t.journaled?"✓":"NEW"}</span>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div style={{ display:"flex", gap:7 }}>
                  <span style={{ color:t.direction==="BUY"?"#22c55e":"#ef4444", fontSize:11, fontWeight:700 }}>{t.direction==="BUY"?"Long":"Short"}</span>
                  <span style={{ color:T.textFaint, fontSize:11 }}>${t.entry}</span>
                </div>
                <span style={{ color:fmtColor(t.pl), fontSize:13, fontWeight:700 }}>{fmtMoney(t.pl)}</span>
              </div>
              {/* Micro progress bar */}
              <div style={{ marginTop:6, height:2, background:T.border, borderRadius:2 }}>
                <div style={{ width:t.journaled?"100%":"0%", height:"100%", background:t.journaled?"#22c55e":"#3b82f6", borderRadius:2, transition:"width 0.4s" }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      {sel ? (
        <div style={{ flex:1, background:T.card, border:`1px solid ${T.border}`, borderRadius:14, display:"flex", flexDirection:"column", overflow:"hidden", minWidth:0 }}>
          {/* Header */}
          <div style={{ padding:"14px 20px", borderBottom:`1px solid ${T.border}`, flexShrink:0 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, minWidth:0 }}>
                <span style={{ fontSize:24, flexShrink:0 }}>{PAIR_EMOJI[sel.pair]||"🔵"}</span>
                <div style={{ minWidth:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:7, flexWrap:"wrap" }}>
                    <span style={{ fontWeight:800, fontSize:18, color:T.text }}>{sel.pair}</span>
                    <span style={{ background:sel.isWin?"#0d2918":"#2a0f0f", color:sel.isWin?"#22c55e":"#ef4444", fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:5 }}>{sel.isWin?"WINNER":"LOSER"}</span>
                    <span style={{ background:T.hover, color:T.textFaint, fontSize:10, padding:"2px 8px", borderRadius:4 }}>{sel.session}</span>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:3, fontSize:11, color:T.textFaint, flexWrap:"wrap" }}>
                    <span style={{ color:sel.direction==="BUY"?"#22c55e":"#ef4444", fontWeight:700 }}>{sel.direction==="BUY"?"Long":"Short"}</span>
                    <span>•</span><span>Entry ${sel.entry}</span>
                    <span>•</span><span>Exit ${sel.exit}</span>
                    <span>•</span><span>Lot {sel.lotSize}</span>
                  </div>
                </div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
                {/* Completion % */}
                <div style={{ textAlign:"center" }}>
                  <div style={{ fontSize:9, color:T.textFaint, marginBottom:3 }}>Completion {completionPct}%</div>
                  <div style={{ width:72, height:5, background:T.border, borderRadius:3 }}>
                    <div style={{ width:`${completionPct}%`, height:"100%", background:completionPct>=80?"#22c55e":completionPct>=50?"#f59e0b":"#ef4444", borderRadius:3, transition:"width 0.4s" }}></div>
                  </div>
                </div>
                <div style={{ background:fmtColor(sel.pl)==="#22c55e"?"#0d2918":"#2a0f0f", borderRadius:9, padding:"6px 12px", textAlign:"center" }}>
                  <div style={{ fontSize:9, color:T.textFaint }}>P&L</div>
                  <div style={{ fontSize:15, fontWeight:700, color:fmtColor(sel.pl) }}>{fmtMoney(sel.pl)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Section tabs */}
          <div style={{ display:"flex", borderBottom:`1px solid ${T.border}`, flexShrink:0 }}>
            {[{k:"tags",l:"📝 Tags & Checklist"},{k:"analysis",l:"📋 Analysis"},{k:"stats",l:"📊 Stats"}].map(s=>(
              <button key={s.k} onClick={()=>setSection(s.k)} style={{ background:"none", border:"none", cursor:"pointer", padding:"10px 16px", fontSize:12.5, color:section===s.k?"#60a5fa":T.textFaint, fontWeight:section===s.k?600:400, borderBottom:section===s.k?"2px solid #3b82f6":"2px solid transparent", whiteSpace:"nowrap" }}>{s.l}</button>
            ))}
          </div>

          {/* Scrollable content */}
          <div style={{ flex:1, overflowY:"auto", padding:"18px 20px 100px 20px" }}>
            {section==="tags" && (
              <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:16 }}>
                  <div>
                    <div style={{ fontSize:11, color:T.textFaint, fontWeight:600, marginBottom:6 }}>🏷️ TAGS <span style={{ color:T.textFaintest }}>(optional)</span></div>
                    <input value={sel.tags||""} onChange={e=>upd("tags",e.target.value)} placeholder="breakout, trend, news..." style={{ width:"100%", background:T.input, border:`1px solid ${T.border2}`, borderRadius:9, padding:"9px 12px", color:T.textMuted, fontSize:13, outline:"none", boxSizing:"border-box" }}/>
                    {sel.tags && <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginTop:6 }}>{sel.tags.split(",").map((t,i)=>t.trim()&&<span key={i} style={{ background:"#1e3a5f", color:"#60a5fa", fontSize:11, padding:"3px 9px", borderRadius:20 }}>{t.trim()}</span>)}</div>}
                  </div>
                  <div>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
                      <div style={{ fontSize:11, color:T.textFaint, fontWeight:600 }}>⭐ RATING</div>
                      <span style={{ color:"#3b82f6", fontWeight:700, fontSize:14 }}>{sel.rating||5}/10</span>
                    </div>
                    <input type="range" min={1} max={10} value={sel.rating||5} onChange={e=>upd("rating",Number(e.target.value))} style={{ width:"100%", accentColor:"#3b82f6", cursor:"pointer" }}/>
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:T.textFaintest, marginTop:2 }}><span>1</span><span>5</span><span>10</span></div>
                  </div>
                </div>

                <div>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:9 }}>
                    <div style={{ fontSize:11, color:T.textFaint, fontWeight:600 }}>✅ EXECUTION CHECKLIST</div>
                    <span style={{ color:checkedCount===allItems.length&&allItems.length>0?"#22c55e":T.textFaint, fontSize:12, fontWeight:600 }}>{checkedCount}/{allItems.length}</span>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:8 }}>
                    {allItems.map((item,i) => {
                      const checked=sel.checklist?.[item]||false;
                      return <div key={i} onClick={()=>upd("checklist",{...sel.checklist,[item]:!checked})} style={{ background:checked?"#0d2918":T.cardAlt, border:`1px solid ${checked?"#22c55e44":T.border}`, borderRadius:10, padding:"10px 12px", display:"flex", alignItems:"flex-start", gap:8, cursor:"pointer" }}>
                        <div style={{ width:16, height:16, borderRadius:4, border:`2px solid ${checked?"#22c55e":"#475569"}`, background:checked?"#22c55e":"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:1 }}>{checked&&<span style={{ color:"#fff", fontSize:10 }}>✓</span>}</div>
                        <span style={{ fontSize:12, color:checked?T.text:T.textMuted }}>{item}</span>
                      </div>;
                    })}
                    <div style={{ background:T.cardAlt, border:`1px dashed ${T.border2}`, borderRadius:10, padding:"8px 12px", display:"flex", alignItems:"center", gap:7 }}>
                      <input placeholder="Add item... (↵)" onKeyDown={e=>{ if(e.key==="Enter"&&e.target.value.trim()){ upd("customChecklist",[...(sel.customChecklist||[]),e.target.value.trim()]); e.target.value=""; }}} style={{ background:"none", border:"none", outline:"none", color:T.textFaint, fontSize:12, flex:1 }}/>
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize:11, color:T.textFaint, fontWeight:600, marginBottom:8 }}>📌 FOLLOWED MY PLAN?</div>
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                    {[{v:true,l:"✅ Yes"},{v:"partial",l:"🤔 Partially"},{v:false,l:"❌ No"}].map(({v,l})=>(
                      <button key={String(v)} onClick={()=>upd("followedPlan",v)} style={{ background:sel.followedPlan===v?"#1e3a5f":T.cardAlt, border:sel.followedPlan===v?"1px solid #3b82f6":`1px solid ${T.border}`, borderRadius:9, padding:"8px 14px", cursor:"pointer", color:sel.followedPlan===v?"#60a5fa":T.textFaint, fontSize:13 }}>{l}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize:11, color:T.textFaint, fontWeight:600, marginBottom:8 }}>🖼️ SCREENSHOTS</div>
                  <ScreenshotUploader screenshots={sel.screenshots||[]} onChange={v=>upd("screenshots",v)} theme={T}/>
                </div>
              </div>
            )}

            {section==="analysis" && (
              <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                <div>
                  <div style={{ fontSize:11, color:T.textFaint, fontWeight:600, marginBottom:7 }}>📋 PRE-TRADE ANALYSIS <span style={{ color:"#ef4444" }}>*</span></div>
                  <textarea value={sel.preAnalysis||""} onChange={e=>upd("preAnalysis",e.target.value)} placeholder="What did you see? Plan, thesis, levels, risk..." rows={5} style={{ width:"100%", background:T.input, border:`1px solid ${T.border2}`, borderRadius:10, padding:"11px 13px", color:T.textMuted, fontSize:13, outline:"none", resize:"vertical", boxSizing:"border-box", fontFamily:"inherit" }}/>
                </div>
                <div>
                  <div style={{ fontSize:11, color:T.textFaint, fontWeight:600, marginBottom:7 }}>🔁 POST-TRADE REVIEW <span style={{ color:"#ef4444" }}>*</span></div>
                  <textarea value={sel.postReview||""} onChange={e=>upd("postReview",e.target.value)} placeholder="What happened? Execution, slippage, improvements..." rows={4} style={{ width:"100%", background:T.input, border:`1px solid ${T.border2}`, borderRadius:10, padding:"11px 13px", color:T.textMuted, fontSize:13, outline:"none", resize:"vertical", boxSizing:"border-box", fontFamily:"inherit" }}/>
                </div>
                <div style={{ background:T.cardAlt, border:`1px solid ${T.border}`, borderRadius:12, padding:"13px 16px" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
                    <div style={{ fontSize:11, color:T.textFaint, fontWeight:600 }}>⚖️ RISK : REWARD</div>
                    <input value={(sel.rrManual||"1:2").split(":")[0]||"1"} onChange={e=>{ const p=(sel.rrManual||"1:2").split(":"); upd("rrManual",`${e.target.value}:${p[1]||2}`); }} style={{ width:50, background:T.input, border:"1px solid #3b82f6", borderRadius:7, padding:"6px", color:"#60a5fa", fontSize:14, fontWeight:700, outline:"none", textAlign:"center" }}/>
                    <span style={{ color:T.textFaintest, fontSize:16, fontWeight:700 }}>:</span>
                    <input value={(sel.rrManual||"1:2").split(":")[1]||"2"} onChange={e=>{ const p=(sel.rrManual||"1:2").split(":"); upd("rrManual",`${p[0]||1}:${e.target.value}`); }} style={{ width:50, background:T.input, border:`1px solid ${T.border2}`, borderRadius:7, padding:"6px", color:T.textMuted, fontSize:14, fontWeight:700, outline:"none", textAlign:"center" }}/>
                    {sel.rr&&<span style={{ marginLeft:"auto", background:"#0d2918", color:"#22c55e", fontSize:11, fontWeight:700, padding:"4px 10px", borderRadius:7 }}>Actual: 1:{sel.rr}</span>}
                  </div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))", gap:16 }}>
                  <div>
                    <div style={{ fontSize:11, color:T.textFaint, fontWeight:600, marginBottom:7 }}>😌 EMOTIONS BEFORE <span style={{ color:"#ef4444" }}>*</span></div>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                      {EMOTIONS.map(em=><button key={em} onClick={()=>upd("emotionBefore",em)} style={{ background:sel.emotionBefore===em?"#1e3a5f":T.cardAlt, border:sel.emotionBefore===em?"1px solid #3b82f6":`1px solid ${T.border}`, borderRadius:20, padding:"5px 11px", color:sel.emotionBefore===em?"#60a5fa":T.textFaint, cursor:"pointer", fontSize:12 }}>{em}</button>)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize:11, color:T.textFaint, fontWeight:600, marginBottom:7 }}>😶 EMOTIONS AFTER</div>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                      {EMOTIONS.map(em=><button key={em} onClick={()=>upd("emotionAfter",em)} style={{ background:sel.emotionAfter===em?"#1e3a5f":T.cardAlt, border:sel.emotionAfter===em?"1px solid #3b82f6":`1px solid ${T.border}`, borderRadius:20, padding:"5px 11px", color:sel.emotionAfter===em?"#60a5fa":T.textFaint, cursor:"pointer", fontSize:12 }}>{em}</button>)}
                    </div>
                  </div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))", gap:16 }}>
                  <div>
                    <div style={{ fontSize:11, color:T.textFaint, fontWeight:600, marginBottom:7 }}>⚠️ MISTAKE MADE?</div>
                    <textarea value={sel.mistakes||""} onChange={e=>upd("mistakes",e.target.value)} placeholder="Any mistakes in this trade?" rows={3} style={{ width:"100%", background:T.input, border:`1px solid ${T.border2}`, borderRadius:10, padding:"10px 12px", color:T.textMuted, fontSize:13, outline:"none", resize:"none", boxSizing:"border-box", fontFamily:"inherit" }}/>
                  </div>
                  <div>
                    <div style={{ fontSize:11, color:T.textFaint, fontWeight:600, marginBottom:7 }}>📚 LESSONS LEARNED <span style={{ color:"#ef4444" }}>*</span></div>
                    <textarea value={sel.lessons||""} onChange={e=>upd("lessons",e.target.value)} placeholder="Key takeaways to repeat or avoid..." rows={3} style={{ width:"100%", background:T.input, border:`1px solid ${T.border2}`, borderRadius:10, padding:"10px 12px", color:T.textMuted, fontSize:13, outline:"none", resize:"none", boxSizing:"border-box", fontFamily:"inherit" }}/>
                  </div>
                </div>
              </div>
            )}

            {section==="stats" && (
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:10 }}>
                  {[
                    {l:"P&L",v:fmtMoney(sel.pl),c:fmtColor(sel.pl)},
                    {l:"PIPS",v:String(sel.pips||0),c:T.textMuted},
                    {l:"R:R RATIO",v:sel.rr?`1:${sel.rr}`:"N/A",c:"#60a5fa"},
                    {l:"LOT SIZE",v:String(sel.lotSize),c:T.textMuted},
                    {l:"ENTRY",v:`$${sel.entry}`,c:T.textMuted},
                    {l:"EXIT",v:`$${sel.exit}`,c:T.textMuted},
                    {l:"STOP LOSS",v:sel.stopLoss?`$${sel.stopLoss}`:"—",c:"#ef4444"},
                    {l:"TAKE PROFIT",v:sel.takeProfit?`$${sel.takeProfit}`:"—",c:"#22c55e"},
                    {l:"SESSION",v:sel.session||"—",c:"#f59e0b"},
                  ].map((s,i)=>(
                    <div key={i} style={{ background:T.cardAlt, border:`1px solid ${T.border}`, borderRadius:11, padding:"12px 14px", minWidth:0 }}>
                      <div style={{ fontSize:10, color:T.textFaint, fontWeight:600, letterSpacing:0.5, marginBottom:4 }}>{s.l}</div>
                      <div style={{ fontSize:17, fontWeight:700, color:s.c }}>{s.v}</div>
                    </div>
                  ))}
                </div>
                {sel.notes&&<div style={{ background:T.cardAlt, border:`1px solid ${T.border}`, borderRadius:11, padding:"13px 15px" }}>
                  <div style={{ fontSize:11, color:T.textFaint, fontWeight:600, marginBottom:6 }}>ORIGINAL NOTES</div>
                  <div style={{ fontSize:13, color:T.textMuted, lineHeight:1.7 }}>{sel.notes}</div>
                </div>}
                {sel.screenshots?.length>0&&<div>
                  <div style={{ fontSize:11, color:T.textFaint, fontWeight:600, marginBottom:7 }}>SCREENSHOTS</div>
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                    {sel.screenshots.map(sc=><img key={sc.id} src={sc.url} alt="" style={{ width:150, height:95, objectFit:"cover", borderRadius:9, border:`1px solid ${T.border}` }}/>)}
                  </div>
                </div>}
              </div>
            )}
          </div>

          {/* ── STICKY SAVE BAR ── */}
          <div style={{ flexShrink:0, background:T.card, borderTop:`1px solid ${T.border}`, padding:"12px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", zIndex:10 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              {autoSaved && <span style={{ fontSize:11, color:"#22c55e", display:"flex", alignItems:"center", gap:4 }}>✓ Auto-saved</span>}
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <div style={{ width:90, height:4, background:T.border, borderRadius:2 }}>
                  <div style={{ width:`${completionPct}%`, height:"100%", background:completionPct>=80?"#22c55e":completionPct>=50?"#f59e0b":"#ef4444", borderRadius:2, transition:"width 0.4s" }}></div>
                </div>
                <span style={{ fontSize:11, color:T.textFaint }}>{completionPct}% complete</span>
              </div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              {sel.journaled && <span style={{ fontSize:12, color:"#22c55e", fontWeight:600 }}>✓ Journaled</span>}
              <button onClick={handleSaveJournal} style={{ background:sel.journaled?"linear-gradient(135deg,#166534,#14532d)":"linear-gradient(135deg,#3b82f6,#1d4ed8)", border:"none", borderRadius:9, padding:"9px 22px", cursor:"pointer", color:"#fff", fontSize:13, fontWeight:700, display:"flex", alignItems:"center", gap:7 }}>
                {sel.journaled ? "✓ Saved" : "💾 Save Journal"}
              </button>
            </div>
          </div>
        </div>
      ):(
        <div style={{ flex:1, background:T.card, border:`1px solid ${T.border}`, borderRadius:14, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:10 }}>
          <span style={{ fontSize:40, opacity:0.2 }}>📖</span>
          <div style={{ fontSize:15, color:T.textFaint }}>Select a trade to journal</div>
          <div style={{ fontSize:12, color:T.textFaintest }}>Add trades using + Add Trade button</div>
        </div>
      )}
    </div>
  );
}

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

export default Journal;
