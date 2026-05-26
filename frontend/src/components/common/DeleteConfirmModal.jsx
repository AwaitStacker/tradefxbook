// src/components/common/DeleteConfirmModal.jsx
import { fmtMoney, fmtColor } from "../../utils/calculations";
// ─── DELETE CONFIRM MODAL ─────────────────────────────────────────────────────
function DeleteConfirmModal({ trade, onConfirm, onCancel, theme: T }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"#000c", zIndex:300, display:"flex", alignItems:"center", justifyContent:"center" }} onClick={onCancel}>
      <div className="tfb-modal-enter" onClick={e=>e.stopPropagation()} style={{ background:T.card, border:`1px solid #ef444455`, borderRadius:14, padding:"28px 30px", width:400, textAlign:"center" }}>
        <div style={{ fontSize:36, marginBottom:12 }}>🗑️</div>
        <div style={{ fontSize:17, fontWeight:700, color:T.text, marginBottom:8 }}>Delete Trade?</div>
        <div style={{ fontSize:13, color:T.textFaint, marginBottom:6 }}>
          <strong style={{color:T.text}}>{trade.pair}</strong> — {trade.direction} @ ${trade.entry}
        </div>
        <div style={{ fontSize:13, color:T.textMuted, marginBottom:22 }}>
          P&L: <span style={{color:fmtColor(trade.pl),fontWeight:700}}>{fmtMoney(trade.pl)}</span>
          <br/><span style={{fontSize:12,color:T.textFaintest}}>This action cannot be undone.</span>
        </div>
        <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
          <button className="tfb-btn" onClick={onCancel} style={{ background:T.cardAlt, border:`1px solid ${T.border2}`, borderRadius:9, padding:"10px 22px", color:T.textMuted, cursor:"pointer", fontSize:13 }}>Cancel</button>
          <button className="tfb-btn" onClick={onConfirm} style={{ background:"linear-gradient(135deg,#7f1d1d,#991b1b)", border:"none", borderRadius:9, padding:"10px 22px", color:"#fff", cursor:"pointer", fontSize:13, fontWeight:700 }}>Delete Trade</button>
        </div>
      </div>
    </div>
  );
}

export default DeleteConfirmModal;