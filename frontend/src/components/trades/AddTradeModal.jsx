// src/components/trades/AddTradeModal.jsx
import { useState } from "react";
import { PAIRS, SETUPS, MARKETS, PAIR_EMOJI } from "../../data/constants";
import { calcPL, calcPips, uid, fmtMoney } from "../../utils/calculations";
import { getSession } from "../../utils/sessionUtils";
import ScreenshotUploader from "../common/ScreenshotUploader";

// ─── ADD TRADE MODAL ──────────────────────────────────────────────────────────
function AddTradeModal({ onClose, onAdd, theme: T, portfolio }) {
  const [form, setForm] = useState({
    pair:"XAUUSD", direction:"BUY", lotSize:"0.1", entry:"", exit:"",
    stopLoss:"", takeProfit:"", date:new Date().toISOString().slice(0,16),
    setupType:"Breakout", marketCondition:"Trending", notes:"",
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const preview = (() => {
    const e = parseFloat(form.entry), x = parseFloat(form.exit);
    const sl = parseFloat(form.stopLoss), tp = parseFloat(form.takeProfit);
    const lot = parseFloat(form.lotSize) || 0.1;
    if (!e || !x) return null;
    const pl = calcPL(form.pair, form.direction, lot, e, x);
    const diff = form.direction === "BUY" ? x - e : e - x;
    const slD = sl ? Math.abs(e - sl) : null;
    const tpD = tp ? Math.abs(tp - e) : null;
    return { pl, rr: slD && tpD ? (tpD / slD).toFixed(2) : null, pips: calcPips(form.pair, Math.abs(diff)), isWin: diff > 0 };
  })();

  const submit = () => {
    const e = parseFloat(form.entry), x = parseFloat(form.exit);
    if (!form.pair || !e || !x) return alert("Pair, Entry, Exit required!");
    const lot = parseFloat(form.lotSize) || 0.1;
    const pl = calcPL(form.pair, form.direction, lot, e, x);
    const diff = form.direction === "BUY" ? x - e : e - x;
    const slD = form.stopLoss ? Math.abs(e - parseFloat(form.stopLoss)) : null;
    const tpD = form.takeProfit ? Math.abs(parseFloat(form.takeProfit) - e) : null;
    onAdd({
      id: uid(), ...form, lotSize: lot, entry: e, exit: x,
      stopLoss: form.stopLoss ? parseFloat(form.stopLoss) : null,
      takeProfit: form.takeProfit ? parseFloat(form.takeProfit) : null,
      exitDate: form.date,
      pl, rr: slD && tpD ? parseFloat((tpD / slD).toFixed(2)) : null,
      pips: parseFloat(calcPips(form.pair, Math.abs(diff))),
      isWin: diff > 0, journaled: false, session: getSession(form.date),
      tags:"", rating:5, checklist:{}, customChecklist:[],
      preAnalysis:"", postReview:"", emotionBefore:"Neutral", emotionAfter:"Neutral",
      followedPlan: null, mistakes:"", lessons:"", screenshots:[],
      rrManual:"1:2", journalProgress: 0,
    });
    onClose();
  };

  const inp = { background:T.input, border:`1px solid ${T.border2}`, borderRadius:9, padding:"10px 13px", color:T.text, fontSize:13.5, outline:"none", width:"100%", boxSizing:"border-box" };
  const lbl = { fontSize:11, color:T.textFaint, fontWeight:600, letterSpacing:0.4, display:"block", marginBottom:5 };

  return (
    <div style={{ position:"fixed", inset:0, background:"#000b", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background:T.card, border:`1px solid ${T.border2}`, borderRadius:16, width:660, maxHeight:"92vh", overflowY:"auto", padding:"28px 30px" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:22 }}>
          <div>
            <div style={{ fontSize:18, fontWeight:700, color:T.text }}>Add New Trade</div>
            <div style={{ fontSize:12, color:T.textFaint, marginTop:2 }}>P&L, Pips & R:R auto-calculated • Session auto-detected</div>
          </div>
          <button onClick={onClose} style={{ background:T.cardAlt, border:`1px solid ${T.border}`, borderRadius:8, width:32, height:32, color:T.textMuted, cursor:"pointer", fontSize:16 }}>✕</button>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
          <div>
            <label style={lbl}>PAIR</label>
            <select value={form.pair} onChange={e=>set("pair",e.target.value)} style={{...inp,cursor:"pointer"}}>
              {PAIRS.map(p=><option key={p} value={p}>{PAIR_EMOJI[p]||"🔵"} {p}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>DIRECTION</label>
            <div style={{ display:"flex", gap:8 }}>
              {["BUY","SELL"].map(d=>(
                <button key={d} onClick={()=>set("direction",d)} style={{ flex:1, padding:"10px", borderRadius:9, fontWeight:700, fontSize:14, cursor:"pointer", border:form.direction===d?"none":`1px solid ${T.border2}`, background:form.direction===d?(d==="BUY"?"linear-gradient(135deg,#166534,#14532d)":"linear-gradient(135deg,#7f1d1d,#6b1d1d)"):T.input, color:form.direction===d?(d==="BUY"?"#4ade80":"#f87171"):T.textFaint }}>
                  {d==="BUY"?"▲ BUY":"▼ SELL"}
                </button>
              ))}
            </div>
          </div>
          <div><label style={lbl}>LOT SIZE</label><input type="number" step="0.01" value={form.lotSize} onChange={e=>set("lotSize",e.target.value)} style={inp} placeholder="0.10"/></div>
          <div><label style={lbl}>DATE & TIME (auto-detects session)</label><input type="datetime-local" value={form.date} onChange={e=>set("date",e.target.value)} style={inp}/></div>
          <div><label style={lbl}>ENTRY PRICE</label><input type="number" step="any" value={form.entry} onChange={e=>set("entry",e.target.value)} style={inp} placeholder="4555.00"/></div>
          <div><label style={lbl}>EXIT PRICE</label><input type="number" step="any" value={form.exit} onChange={e=>set("exit",e.target.value)} style={inp} placeholder="4665.00"/></div>
          <div><label style={lbl}>STOP LOSS <span style={{color:T.textFaintest}}>(optional)</span></label><input type="number" step="any" value={form.stopLoss} onChange={e=>set("stopLoss",e.target.value)} style={inp} placeholder="4510.00"/></div>
          <div><label style={lbl}>TAKE PROFIT <span style={{color:T.textFaintest}}>(optional)</span></label><input type="number" step="any" value={form.takeProfit} onChange={e=>set("takeProfit",e.target.value)} style={inp} placeholder="4700.00"/></div>
          <div>
            <label style={lbl}>SETUP TYPE</label>
            <select value={form.setupType} onChange={e=>set("setupType",e.target.value)} style={{...inp,cursor:"pointer"}}>
              {SETUPS.map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>MARKET CONDITION</label>
            <select value={form.marketCondition} onChange={e=>set("marketCondition",e.target.value)} style={{...inp,cursor:"pointer"}}>
              {MARKETS.map(m=><option key={m}>{m}</option>)}
            </select>
          </div>
        </div>

        <div style={{ marginBottom:14 }}>
          <label style={lbl}>NOTES / LOGIC</label>
          <textarea value={form.notes} onChange={e=>set("notes",e.target.value)} rows={3} placeholder="Quick notes..." style={{...inp,resize:"vertical",fontFamily:"inherit"}}/>
        </div>

        {/* Session preview */}
        <div style={{ marginBottom:14, display:"flex", gap:8, alignItems:"center" }}>
          <div style={{ background:T.cardAlt, border:`1px solid ${T.border}`, borderRadius:8, padding:"7px 14px", fontSize:12, color:T.textMuted }}>
            📍 Session: <strong style={{color:"#60a5fa"}}>{getSession(form.date)}</strong>
          </div>
          {portfolio?.startingBalance && (
            <div style={{ background:T.cardAlt, border:`1px solid ${T.border}`, borderRadius:8, padding:"7px 14px", fontSize:12, color:T.textMuted }}>
              💼 Account: <strong style={{color:T.text}}>${portfolio.startingBalance}</strong>
            </div>
          )}
        </div>

        {preview && (
          <div style={{ background:preview.isWin?"#0a2318":"#2a0f0f", border:`1px solid ${preview.isWin?"#22c55e33":"#ef444433"}`, borderRadius:12, padding:"14px 18px", marginBottom:18, display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
            <div><div style={{fontSize:10,color:T.textFaint,fontWeight:600,marginBottom:4}}>EST. P&L</div><div style={{fontSize:18,fontWeight:700,color:preview.isWin?"#22c55e":"#ef4444"}}>{fmtMoney(preview.pl)}</div></div>
            <div><div style={{fontSize:10,color:T.textFaint,fontWeight:600,marginBottom:4}}>PIPS</div><div style={{fontSize:18,fontWeight:700,color:T.textMuted}}>{preview.pips}</div></div>
            <div><div style={{fontSize:10,color:T.textFaint,fontWeight:600,marginBottom:4}}>RISK:REWARD</div><div style={{fontSize:18,fontWeight:700,color:"#60a5fa"}}>{preview.rr?`1:${preview.rr}`:"—"}</div></div>
          </div>
        )}

        <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
          <button onClick={onClose} style={{ background:T.cardAlt, border:`1px solid ${T.border2}`, borderRadius:9, padding:"10px 22px", color:T.textMuted, cursor:"pointer", fontSize:13 }}>Cancel</button>
          <button onClick={submit} style={{ background:"linear-gradient(135deg,#3b82f6,#1d4ed8)", border:"none", borderRadius:9, padding:"10px 26px", color:"#fff", cursor:"pointer", fontSize:13, fontWeight:700 }}>Add Trade ✓</button>
        </div>
      </div>
    </div>
  );
}

export default AddTradeModal;