// src/components/common/ScreenshotUploader.jsx
import { useState, useRef } from "react";
import { uid } from "../../utils/calculations";

// ─── SCREENSHOT UPLOADER ──────────────────────────────────────────────────────
function ScreenshotUploader({ screenshots, onChange, theme: T }) {
  const inputRef = useRef();
  const handleFiles = (files) => {
    Array.from(files).forEach(file => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = (e) => onChange([...screenshots, { id:uid(), url:e.target.result, name:file.name }]);
      reader.readAsDataURL(file);
    });
  };
  const [dragging, setDragging] = useState(false);
  return (
    <div>
      <div
        onDragOver={e=>{e.preventDefault();setDragging(true)}}
        onDragLeave={()=>setDragging(false)}
        onDrop={e=>{e.preventDefault();setDragging(false);handleFiles(e.dataTransfer.files)}}
        onClick={()=>inputRef.current.click()}
        style={{ border:`2px dashed ${dragging?"#3b82f6":T.border2}`, borderRadius:10, padding:"22px", textAlign:"center", cursor:"pointer", background:dragging?"#1e3a5f22":T.input, transition:"all 0.2s" }}
      >
        <div style={{ fontSize:28, marginBottom:6 }}>📸</div>
        <div style={{ fontSize:13, color:T.textFaint }}>Click or drag & drop screenshots here</div>
        <div style={{ fontSize:11, color:T.textFaintest, marginTop:4 }}>PNG, JPG, WebP supported</div>
        <input ref={inputRef} type="file" accept="image/*" multiple style={{ display:"none" }} onChange={e=>handleFiles(e.target.files)}/>
      </div>
      {screenshots.length > 0 && (
        <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginTop:12 }}>
          {screenshots.map(sc => (
            <div key={sc.id} style={{ position:"relative", borderRadius:10, overflow:"hidden", border:`1px solid ${T.border2}` }}>
              <img src={sc.url} alt={sc.name} style={{ width:120, height:80, objectFit:"cover", display:"block" }}/>
              <button onClick={() => onChange(screenshots.filter(s=>s.id!==sc.id))} style={{ position:"absolute", top:4, right:4, background:"#000a", border:"none", borderRadius:"50%", width:22, height:22, color:"#fff", cursor:"pointer", fontSize:12, display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ScreenshotUploader;