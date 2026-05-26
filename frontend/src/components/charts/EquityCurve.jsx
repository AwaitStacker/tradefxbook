// src/components/charts/EquityCurve.jsx
// Responsibility: render the equity curve SVG chart.
// ALL chart math is computed once per `curvePts` change (useMemo).
// Hover uses a single onMouseMove on the SVG — no per-point event handlers.
// setState is guarded by index identity → zero re-renders on micro-movements.
import { useState, useMemo, useCallback } from "react";

const W = 580, H = 175, X0 = 10;

function buildChartData(curvePts) {
  if (curvePts.length < 2) return null;
  const minY = Math.min(0, ...curvePts.map(p => p.y));
  const maxY = Math.max(0.01, ...curvePts.map(p => p.y));
  const pad  = (maxY - minY) * 0.08;
  const chartMin = minY - pad;
  const chartMax = maxY + pad;
  const rx = i => X0 + (i / (curvePts.length - 1)) * W;
  const ry = y => H  - ((y - chartMin) / (chartMax - chartMin)) * H;
  const zero = ry(0);

  // Smooth cubic bezier path string
  const smoothPath = curvePts.reduce((acc, p, i) => {
    const x = rx(p.x), y = ry(p.y);
    if (i === 0) return `M ${x},${y}`;
    const prev = curvePts[i - 1];
    const cpx  = (rx(prev.x) + x) / 2;
    return `${acc} C ${cpx},${ry(prev.y)} ${cpx},${y} ${x},${y}`;
  }, "");

  const last        = curvePts[curvePts.length - 1];
  const lastX       = rx(last.x);
  const lastY       = ry(last.y);
  const firstX      = X0;
  const profitArea  = `${smoothPath} L ${lastX},${zero} L ${firstX},${zero} Z`;
  const lossArea    = profitArea; // same path, different clip

  const yLabels = Array.from({ length: 5 }, (_, i) => {
    const val = chartMin + (chartMax - chartMin) * i / 4;
    return { y: ry(val), val };
  });

  const dateLabels = curvePts.filter((_, i) =>
    i === 0 || i === curvePts.length - 1 ||
    (curvePts.length > 4 && i % Math.ceil(curvePts.length / 5) === 0)
  );

  // Pre-compute SVG x/y for every point — used at hover time, no recalculation
  const pts = curvePts.map(p => ({ ...p, sx: rx(p.x), sy: ry(p.y) }));

  return { zero, smoothPath, last, lastX, lastY, profitArea, lossArea, yLabels, dateLabels, minY, pts };
}

export default function EquityCurve({ curvePts, totalPL, fmtMoney, fmtColor, theme: T }) {
  const [hovered, setHovered] = useState(null);

  // useMemo: rebuild chart data ONLY when curvePts changes, not on hover
  const chart = useMemo(() => buildChartData(curvePts), [curvePts]);

  // Single mouse handler on the SVG — maps client X → nearest data point
  const handleMouseMove = useCallback((e) => {
    if (!chart) return;
    const rect  = e.currentTarget.getBoundingClientRect();
    const svgX  = ((e.clientX - rect.left) / rect.width) * 600;
    const n     = chart.pts.length;
    const idx   = Math.max(0, Math.min(n - 1, Math.round(((svgX - X0) / W) * (n - 1))));
    const pt    = chart.pts[idx];
    // Guard: skip setState if same point → no wasted re-render
    setHovered(prev => (prev?.x === pt.x ? prev : pt));
  }, [chart]);

  const handleMouseLeave = useCallback(() => setHovered(null), []);

  if (!chart) {
    return (
      <div style={{ height: 200, background: T.input, borderRadius: 10, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 6 }}>
        <span style={{ fontSize: 32, opacity: 0.15 }}>📈</span>
        <span style={{ color: T.textFaintest, fontSize: 12 }}>Close more trades to see your equity curve</span>
      </div>
    );
  }

  return (
    <div>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14, minHeight: 52 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>📉 Equity Curve</div>
          <div style={{ fontSize: 12, color: T.textFaint, marginTop: 2 }}>
            {fmtMoney(totalPL)}
          </div>
        </div>
        {/* Tooltip — only this sub-tree re-renders on hover */}
        {hovered && (
          <div style={{ background: "#1a2744", border: "1px solid #3b82f655", borderRadius: 10, padding: "10px 14px", textAlign: "right", minWidth: 140 }}>
            <div style={{ fontSize: 10, color: "#64748b", marginBottom: 2 }}>
              {new Date(hovered.trade.date).toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric", timeZone: "Asia/Kolkata" })}
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: fmtColor(hovered.y), lineHeight: 1.2 }}>
              {fmtMoney(hovered.y)}
            </div>
            <div style={{ fontSize: 9, color: "#64748b", marginTop: 2 }}>CUMULATIVE P&L</div>
            <div style={{ borderTop: "1px solid #1e2030", marginTop: 6, paddingTop: 6, display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <div>
                <div style={{ fontSize: 9, color: "#64748b" }}>TRADE P&L</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: fmtColor(hovered.trade.pl) }}>{fmtMoney(hovered.trade.pl)}</div>
              </div>
              <div>
                <div style={{ fontSize: 9, color: "#64748b" }}>PAIR</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#e2e8f0" }}>{hovered.trade.pair}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SVG chart — paths/grid are static DOM nodes, never touched on hover */}
      <svg
        viewBox="0 0 600 200"
        preserveAspectRatio="none"
        style={{ width: "100%", height: 200, overflow: "visible", display: "block", cursor: "crosshair" }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <defs>
          <linearGradient id="eqBlue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stopColor="#3b82f6" stopOpacity="0.45" />
            <stop offset="85%" stopColor="#3b82f6" stopOpacity="0.04" />
          </linearGradient>
          <linearGradient id="eqRed" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#ef4444" stopOpacity="0.04" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0.38" />
          </linearGradient>
          <clipPath id="eqAbove">
            <rect x="0" y="0" width="600" height={Math.max(0, chart.zero)} />
          </clipPath>
          <clipPath id="eqBelow">
            <rect x="0" y={Math.max(0, chart.zero)} width="600" height={H + 10} />
          </clipPath>
          <filter id="eqGlow">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Grid + Y-axis labels */}
        {chart.yLabels.map((l, i) => (
          <g key={i}>
            <line x1={X0} y1={l.y} x2={X0 + W} y2={l.y} stroke={T.border} strokeWidth="0.6" strokeDasharray="4,5" />
            <text x={X0 + W + 6} y={l.y + 4} fontSize="9" fill={T.textFaintest} textAnchor="start">
              {Math.abs(l.val) >= 1000
                ? `${l.val < 0 ? "-" : ""}$${(Math.abs(l.val) / 1000).toFixed(1)}k`
                : `$${Math.round(l.val)}`}
            </text>
          </g>
        ))}

        {/* Zero baseline */}
        {chart.minY < 0 && (
          <line x1={X0} y1={chart.zero} x2={X0 + W} y2={chart.zero}
            stroke="#475569" strokeWidth="1" strokeDasharray="5,4" opacity="0.7" />
        )}

        {/* Area fills */}
        <path d={chart.profitArea} fill="url(#eqBlue)" clipPath="url(#eqAbove)" />
        <path d={chart.lossArea}   fill="url(#eqRed)"  clipPath="url(#eqBelow)" />

        {/* Curve lines */}
        <path d={chart.smoothPath} fill="none" stroke="#3b82f6" strokeWidth="2.2"
          clipPath="url(#eqAbove)" strokeLinecap="round" strokeLinejoin="round" />
        <path d={chart.smoothPath} fill="none" stroke="#ef4444" strokeWidth="2.2"
          clipPath="url(#eqBelow)" strokeLinecap="round" strokeLinejoin="round" />

        {/* X-axis date labels */}
        {chart.dateLabels.map((p, i) => (
          <text key={i} x={p.sx} y={H + 16} fontSize="8" fill={T.textFaintest} textAnchor="middle">
            {new Date(p.trade.date).toLocaleDateString("en-IN", { month: "short", day: "numeric", timeZone: "Asia/Kolkata" })}
          </text>
        ))}

        {/* Last point highlight dot */}
        <circle cx={chart.lastX} cy={chart.lastY} r="7"
          fill={chart.last.y >= 0 ? "#3b82f6" : "#ef4444"} opacity="0.25" filter="url(#eqGlow)" />
        <circle cx={chart.lastX} cy={chart.lastY} r="4.5"
          fill={chart.last.y >= 0 ? "#3b82f6" : "#ef4444"} stroke="#fff" strokeWidth="1.5" />

        {/* Hover crosshair — only this <g> re-renders on hover state change */}
        {hovered && (() => {
          const col = hovered.y >= 0 ? "#3b82f6" : "#ef4444";
          return (
            <g>
              <line x1={hovered.sx} y1={0}    x2={hovered.sx}  y2={H}    stroke={col} strokeWidth="1"   strokeDasharray="4,3" opacity="0.5" />
              <line x1={X0}         y1={hovered.sy} x2={X0 + W} y2={hovered.sy} stroke={col} strokeWidth="0.5" strokeDasharray="2,4" opacity="0.35" />
              <circle cx={hovered.sx} cy={hovered.sy} r="6" fill={col} opacity="0.2" />
              <circle cx={hovered.sx} cy={hovered.sy} r="4" fill={col} stroke="#fff" strokeWidth="2" />
            </g>
          );
        })()}
      </svg>
    </div>
  );
}