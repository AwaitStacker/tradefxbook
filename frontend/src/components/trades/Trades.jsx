// src/components/trades/Trades.jsx
import { useState } from "react";
import { fmtMoney, fmtColor } from "../../utils/calculations";
import { PAIR_EMOJI } from "../../data/constants";
import DeleteConfirmModal from "../common/DeleteConfirmModal";

// ─── TRADES PAGE ──────────────────────────────────────────────────────────────
function Trades({ trades, openAdd, onDelete, theme: T }) {
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filtered = trades.filter(t=>{
    if(filter==="WIN"&&!t.isWin) return false;
    if(filter==="LOSS"&&t.isWin) return false;
    if(filter==="BUY"&&t.direction!=="BUY") return false;
    if(filter==="SELL"&&t.direction!=="SELL") return false;
    if(search&&!t.pair.toLowerCase().includes(search.toLowerCase())&&!t.setupType.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  const totalPL = filtered.reduce((a,t)=>a+t.pl,0);
  return (
    <div style={{ padding:"20px 24px", width:"100%", boxSizing:"border-box" }}>
      {deleteTarget && <DeleteConfirmModal trade={deleteTarget} onConfirm={()=>{ onDelete(deleteTarget.id); setDeleteTarget(null); }} onCancel={()=>setDeleteTarget(null)} theme={T}/>}
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16, flexWrap:"wrap" }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search pair or setup..." style={{ background:T.input, border:`1px solid ${T.border2}`, borderRadius:9, padding:"8px 13px", color:T.text, fontSize:13, outline:"none", flex:"1 1 180px", minWidth:0 }}/>
        <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
          {["ALL","WIN","LOSS","BUY","SELL"].map(f=>(
            <button className="tfb-btn" key={f} onClick={()=>setFilter(f)} style={{ background:filter===f?"#1e3a5f":T.cardAlt, border:filter===f?"1px solid #3b82f6":`1px solid ${T.border2}`, borderRadius:8, padding:"7px 13px", color:filter===f?"#60a5fa":T.textFaint, cursor:"pointer", fontSize:12, fontWeight:600 }}>{f}</button>
          ))}
        </div>
        <div style={{ marginLeft:"auto", display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
          <span style={{ fontSize:13, color:T.textFaint }}>{filtered.length} trades</span>
          <span style={{ fontSize:14, fontWeight:700, color:fmtColor(totalPL) }}>{fmtMoney(totalPL)}</span>
          <button className="tfb-btn" onClick={openAdd} style={{ background:"linear-gradient(135deg,#3b82f6,#1d4ed8)", border:"none", borderRadius:8, padding:"8px 16px", color:"#fff", cursor:"pointer", fontSize:13, fontWeight:700, whiteSpace:"nowrap" }}>+ Add Trade</button>
        </div>
      </div>
      <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, overflow:"hidden", width:"100%" }}>
        <div style={{ overflowX:"auto" }}>
          <div style={{ minWidth:820 }}>
            <div style={{ display:"grid", gridTemplateColumns:"2fr 0.6fr 0.6fr 1fr 1fr 1fr 0.7fr 0.7fr 1.1fr 0.8fr 40px", background:T.cardAlt, padding:"11px 16px", gap:8 }}>
              {["PAIR","DIR","LOT","ENTRY","EXIT","P&L","PIPS","R:R","SETUP","STATUS",""].map(h=>(
                <span key={h} style={{ fontSize:10, color:T.textFaintest, fontWeight:700, letterSpacing:0.5 }}>{h}</span>
              ))}
            </div>
            {filtered.length===0?(
              <div style={{ padding:"40px", textAlign:"center", color:T.textFaintest }}>
                <div style={{ fontSize:32, marginBottom:10, opacity:0.3 }}>📋</div>
                <div>No trades found</div>
                <button className="tfb-btn" onClick={openAdd} style={{ marginTop:14, background:"linear-gradient(135deg,#3b82f6,#1d4ed8)", border:"none", borderRadius:8, padding:"9px 20px", color:"#fff", cursor:"pointer", fontSize:13, fontWeight:600 }}>+ Add Trade</button>
              </div>
            ):filtered.map((t,i)=>(
              <div key={t.id} className="tfb-row" style={{ display:"grid", gridTemplateColumns:"2fr 0.6fr 0.6fr 1fr 1fr 1fr 0.7fr 0.7fr 1.1fr 0.8fr 40px", padding:"11px 16px", gap:8, borderTop:`1px solid ${T.border}`, alignItems:"center", background:i%2===0?T.card:T.cardAlt, transition:"background 0.15s" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, minWidth:0 }}>
                  <span style={{ fontSize:15, flexShrink:0 }}>{PAIR_EMOJI[t.pair]||"🔵"}</span>
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontWeight:600, fontSize:13, color:T.text }}>{t.pair}</div>
                    <div style={{ fontSize:10, color:T.textFaint }}>{t.session}</div>
                  </div>
                </div>
                <span style={{ fontSize:12, color:t.direction==="BUY"?"#22c55e":"#ef4444", fontWeight:700 }}>{t.direction}</span>
                <span style={{ fontSize:12, color:T.textMuted }}>{t.lotSize}</span>
                <span style={{ fontSize:12, color:T.textMuted }}>${t.entry}</span>
                <span style={{ fontSize:12, color:T.textMuted }}>${t.exit}</span>
                <span style={{ fontSize:13, fontWeight:700, color:fmtColor(t.pl) }}>{fmtMoney(t.pl)}</span>
                <span style={{ fontSize:12, color:T.textFaint }}>{t.pips}</span>
                <span style={{ fontSize:12, color:"#60a5fa" }}>{t.rr?`1:${t.rr}`:"—"}</span>
                <span style={{ fontSize:11, color:T.textFaint, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{t.setupType}</span>
                <span style={{ background:t.isWin?"#0d2918":"#2a0f0f", color:t.isWin?"#22c55e":"#ef4444", fontSize:10, fontWeight:700, padding:"3px 8px", borderRadius:5, textAlign:"center" }}>{t.isWin?"WIN":"LOSS"}</span>
                <button onClick={()=>setDeleteTarget(t)} title="Delete trade" style={{ background:"none", border:"none", cursor:"pointer", color:"#ef4444", fontSize:15, padding:"2px 4px", opacity:0.6, transition:"opacity 0.15s" }} onMouseEnter={e=>e.currentTarget.style.opacity=1} onMouseLeave={e=>e.currentTarget.style.opacity=0.6}>🗑️</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Trades;
