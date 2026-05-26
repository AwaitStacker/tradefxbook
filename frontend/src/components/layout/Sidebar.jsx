// src/components/layout/Sidebar.jsx
import { useState } from "react";

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
function Sidebar({ page, setPage, analyticsTab, setAnalyticsTab, theme: T }) {
  const [analysisOpen, setAnalysisOpen] = useState(page === "analytics");

  const handleAnalyticsClick = (tab) => {
    setPage("analytics");
    setAnalyticsTab(tab);
  };

  return (
    <aside style={{ width:240, background:T.sidebar, borderRight:`1px solid ${T.border}`, display:"flex", flexDirection:"column", flexShrink:0 }}>
      <div style={{ padding:"18px 20px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ background:"linear-gradient(135deg,#3b82f6,#1d4ed8)", borderRadius:8, width:36, height:36, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:13, color:"#fff" }}>TFB</div>
        <span style={{ fontWeight:700, fontSize:16, color:T.text }}>TradeFXBook</span>
        <span style={{ background:"#f59e0b", color:"#000", fontSize:9, fontWeight:700, padding:"2px 5px", borderRadius:4 }}>BETA</span>
      </div>
      <div style={{ margin:"14px 12px", background:T.cardAlt, border:`1px solid ${T.border}`, borderRadius:10, padding:"10px 12px", display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ width:34, height:34, borderRadius:"50%", background:"linear-gradient(135deg,#6366f1,#8b5cf6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:"#fff" }}>IK</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13, fontWeight:600, color:T.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>TRADEFXBOOK</div>
          <div style={{ fontSize:11, color:T.textFaint, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}></div>
        </div>
        <span style={{ background:"#1e3a5f", color:"#60a5fa", fontSize:10, fontWeight:700, padding:"2px 6px", borderRadius:4 }}>FREE</span>
      </div>
      <div style={{ padding:"0 8px", overflowY:"auto", flex:1 }}>
        <div style={{ fontSize:10, color:T.textFaintest, fontWeight:600, letterSpacing:1, padding:"8px 8px 4px" }}>MENU</div>

        {/* Dashboard */}
        {[{key:"dashboard",icon:"⊞",label:"Dashboard"},{key:"trades",icon:"📋",label:"Trades"},{key:"journal",icon:"📖",label:"Journal"}].map(item => (
          <div key={item.key} className="tfb-nav-item" onClick={() => setPage(item.key)} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 12px", borderRadius:8, cursor:"pointer", background:page===item.key&&page!=="analytics"?"linear-gradient(90deg,#1e3a5f,#1a2744)":"transparent", borderLeft:page===item.key&&page!=="analytics"?"3px solid #3b82f6":"3px solid transparent", marginBottom:2 }}>
            <span style={{ fontSize:14 }}>{item.icon}</span>
            <span style={{ fontSize:13.5, color:page===item.key&&page!=="analytics"?"#60a5fa":T.textMuted, fontWeight:page===item.key&&page!=="analytics"?600:400, flex:1 }}>{item.label}</span>
            {page===item.key&&page!=="analytics" && <span style={{ width:6, height:6, borderRadius:"50%", background:"#3b82f6" }}></span>}
          </div>
        ))}

        {/* Analysis expandable */}
        <div>
          <div className="tfb-nav-item" onClick={() => { setAnalysisOpen(o=>!o); if(!analysisOpen){ setPage("analytics"); setAnalyticsTab("performance"); }}} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 12px", borderRadius:8, cursor:"pointer", background:page==="analytics"?"linear-gradient(90deg,#1e3a5f,#1a2744)":"transparent", borderLeft:page==="analytics"?"3px solid #3b82f6":"3px solid transparent", marginBottom:2 }}>
            <span style={{ fontSize:14 }}>📊</span>
            <span style={{ fontSize:13.5, color:page==="analytics"?"#60a5fa":T.textMuted, fontWeight:page==="analytics"?600:400, flex:1 }}>Analysis</span>
            <span style={{ fontSize:10, color:T.textFaint, transform:analysisOpen?"rotate(90deg)":"rotate(0deg)", transition:"transform 0.2s", display:"inline-block" }}>›</span>
          </div>
          {analysisOpen && (
            <div style={{ paddingLeft:24, marginBottom:4 }}>
              {[{tab:"performance",icon:"📈",label:"Performance"},{tab:"tradeanalysis",icon:"📋",label:"Trade Analysis"}].map(sub=>(
                <div key={sub.tab} className="tfb-nav-item" onClick={()=>handleAnalyticsClick(sub.tab)} style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 12px", borderRadius:7, cursor:"pointer", background:page==="analytics"&&analyticsTab===sub.tab?"#1e3a5f22":"transparent", borderLeft:page==="analytics"&&analyticsTab===sub.tab?"2px solid #3b82f655":"2px solid transparent", marginBottom:2 }}>
                  <span style={{ fontSize:12 }}>{sub.icon}</span>
                  <span style={{ fontSize:12.5, color:page==="analytics"&&analyticsTab===sub.tab?"#60a5fa":T.textMuted }}>{sub.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Market, AI Report, etc. */}
        {[
          {key:"aireport", icon:"🤖", label:"AI Report",  badge:"PRO"},
          {key:null,       icon:"🔄", label:"Backtesting", badge:"ELITE"},
          {key:null,       icon:"👥", label:"Traders Lounge"},
          {key:null,       icon:"🔧", label:"Tools"},
        ].map((item,i)=>(
          <div key={i} className="tfb-nav-item"
            onClick={()=> item.key && setPage(item.key)}
            style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 12px", borderRadius:8, cursor:item.key?"pointer":"default", borderLeft:page===item.key?"3px solid #7c3aed":"3px solid transparent", marginBottom:2, background:page===item.key?"linear-gradient(90deg,#2d1b69,#1f1040)":"transparent", opacity:item.key?1:0.45 }}>
            <span style={{ fontSize:14 }}>{item.icon}</span>
            <span style={{ fontSize:13.5, color:page===item.key?"#a78bfa":T.textMuted, fontWeight:page===item.key?600:400, flex:1 }}>{item.label}</span>
            {item.badge && <span style={{ background:item.badge==="PRO"?"#7c3aed":"#0e7490", color:"#fff", fontSize:9, fontWeight:700, padding:"2px 6px", borderRadius:4 }}>{item.badge}</span>}
            {page===item.key && <span style={{ width:6, height:6, borderRadius:"50%", background:"#7c3aed" }}></span>}
          </div>
        ))}
      </div>
      <div style={{ padding:"12px 8px", borderTop:`1px solid ${T.border}` }}>
        <div style={{ fontSize:10, color:T.textFaintest, fontWeight:600, letterSpacing:1, padding:"4px 8px 6px" }}>SUPPORT</div>
        {[{icon:"⚙️",label:"Settings"},{icon:"❓",label:"Help & Support"},{icon:"💳",label:"Subscription"}].map((item,i)=>(
          <div key={i} className="tfb-nav-item" style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 12px", borderRadius:8, cursor:"pointer", marginBottom:2 }}>
            <span style={{ fontSize:13, opacity:0.7 }}>{item.icon}</span>
            <span style={{ fontSize:13, color:T.textFaint }}>{item.label}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}

export default Sidebar;
