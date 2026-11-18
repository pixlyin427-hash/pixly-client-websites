import { useState, useRef } from 'react';

type Pt = { label: string; value: number; sub?: string };
const niceMax = (v: number) => { if (v <= 0) return 1; const p = Math.pow(10, Math.floor(Math.log10(v))); const n = v / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p; };

export function BarChart({ data, format = (n: number) => String(n), height = 220, labelEvery = 1 }: { data: Pt[]; format?: (n: number) => string; height?: number; labelEvery?: number }) {
  const [tip, setTip] = useState<{ x: number; y: number; t: string } | null>(null);
  const W = 640, H = height, padL = 46, padB = 26, padT = 10;
  const max = niceMax(Math.max(...data.map((d) => d.value), 0));
  const bw = (W - padL) / Math.max(data.length, 1);
  const ref = useRef<SVGSVGElement>(null);
  const show = (i: number, d: Pt) => {
    const svg = ref.current; if (!svg) return; const r = svg.getBoundingClientRect(); const sx = r.width / W;
    const h = ((H - padB - padT) * d.value) / max;
    setTip({ x: (padL + i * bw + bw / 2) * sx, y: (H - padB - h) * (r.height / H), t: `${d.sub || d.label}: ${format(d.value)}` });
  };
  return (
    <div style={{ position: 'relative' }} onMouseLeave={() => setTip(null)}>
      <svg ref={ref} className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Bar chart">
        {[0, 0.5, 1].map((f) => { const y = padT + (H - padB - padT) * (1 - f); return <g key={f}><line x1={padL} x2={W} y1={y} y2={y} stroke="#eee5da" /><text x={padL - 8} y={y + 4} textAnchor="end">{format(max * f)}</text></g>; })}
        {data.map((d, i) => {
          const h = ((H - padB - padT) * d.value) / max;
          return (
            <g key={i}>
              <rect className="bar" x={padL + i * bw + bw * 0.18} y={H - padB - h} width={bw * 0.64} height={Math.max(h, d.value > 0 ? 2 : 0)} rx={Math.min(6, bw * 0.2)}
                onMouseEnter={() => show(i, d)} onClick={() => show(i, d)} />
              {i % labelEvery === 0 && <text x={padL + i * bw + bw / 2} y={H - 8} textAnchor="middle">{d.label}</text>}
            </g>
          );
        })}
      </svg>
      {tip && <div className="chart-tip" style={{ left: tip.x, top: tip.y }}>{tip.t}</div>}
    </div>
  );
}

export function LineChart({ data, format = (n: number) => String(n), height = 220, labelEvery = 1 }: { data: Pt[]; format?: (n: number) => string; height?: number; labelEvery?: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 640, H = height, padL = 40, padB = 26, padT = 12;
  const max = niceMax(Math.max(...data.map((d) => d.value), 0));
  const step = (W - padL - 10) / Math.max(data.length - 1, 1);
  const pts = data.map((d, i) => [padL + i * step, padT + (H - padB - padT) * (1 - d.value / max)]);
  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area = pts.length ? `${path} L${pts[pts.length - 1][0]},${H - padB} L${pts[0][0]},${H - padB} Z` : '';
  return (
    <div style={{ position: 'relative' }}>
      <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Line chart" onMouseLeave={() => setHover(null)}>
        <defs><linearGradient id="lg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--caramel)" stopOpacity=".35" /><stop offset="100%" stopColor="var(--caramel)" stopOpacity="0" /></linearGradient></defs>
        {[0, 0.5, 1].map((f) => { const y = padT + (H - padB - padT) * (1 - f); return <g key={f}><line x1={padL} x2={W} y1={y} y2={y} stroke="#eee5da" /><text x={padL - 8} y={y + 4} textAnchor="end">{format(max * f)}</text></g>; })}
        <path d={area} fill="url(#lg)" />
        <path d={path} fill="none" stroke="var(--espresso)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {pts.map((p, i) => (
          <g key={i}>
            <rect x={p[0] - step / 2} y={0} width={step} height={H} fill="transparent" onMouseEnter={() => setHover(i)} onClick={() => setHover(i)} />
            {(hover === i) && <><line x1={p[0]} x2={p[0]} y1={padT} y2={H - padB} stroke="#d8c9b8" strokeDasharray="3 3" /><circle cx={p[0]} cy={p[1]} r="5" fill="var(--caramel)" stroke="#fff" strokeWidth="2" /></>}
            {i % labelEvery === 0 && <text x={p[0]} y={H - 8} textAnchor="middle">{data[i].label}</text>}
          </g>
        ))}
      </svg>
      {hover != null && data[hover] && <div className="chart-tip" style={{ left: `${(pts[hover][0] / W) * 100}%`, top: `${(pts[hover][1] / H) * 100}%` }}>{data[hover].sub || data[hover].label}: {format(data[hover].value)}</div>}
    </div>
  );
}

const PALETTE = ['#C98243', '#241711', '#8D3024', '#d9b38c', '#6a574c', '#3f9a63', '#5b88c7'];
export function Donut({ data, format = (n: number) => String(n), size = 160 }: { data: { label: string; value: number; color?: string }[]; format?: (n: number) => string; size?: number }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = 60, c = 2 * Math.PI * r; let acc = 0;
  return (
    <div className="donut-wrap">
      <svg width={size} height={size} viewBox="0 0 160 160" role="img" aria-label="Donut chart">
        <circle cx="80" cy="80" r={r} fill="none" stroke="#f0e7dc" strokeWidth="22" />
        {total > 0 && data.map((d, i) => {
          const len = (d.value / total) * c; const el = <circle key={i} cx="80" cy="80" r={r} fill="none" stroke={d.color || PALETTE[i % PALETTE.length]} strokeWidth="22" strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-acc} transform="rotate(-90 80 80)" />;
          acc += len; return el;
        })}
        <text x="80" y="76" textAnchor="middle" style={{ fontSize: 22, fontWeight: 700, fill: 'var(--espresso)' }}>{format(total)}</text>
        <text x="80" y="96" textAnchor="middle" style={{ fontSize: 11, fill: 'var(--ink-3)' }}>total</text>
      </svg>
      <div className="legend">
        {data.map((d, i) => <div key={i}><i style={{ background: d.color || PALETTE[i % PALETTE.length] }} /><span>{d.label}</span><span>{format(d.value)}{total ? <small className="muted" style={{ fontWeight: 400 }}> · {Math.round((d.value / total) * 100)}%</small> : null}</span></div>)}
      </div>
    </div>
  );
}

export function HBars({ data, format = (n: number) => String(n) }: { data: { label: string; value: number; sub?: string }[]; format?: (n: number) => string }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="hbar">
      {data.map((d, i) => (
        <div key={i} className="hbar-row">
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.label}{d.sub && <small className="muted"> · {d.sub}</small>}</span>
          <b className="num">{format(d.value)}</b>
          <div className="hbar-track"><div className="hbar-fill" style={{ width: `${(d.value / max) * 100}%` }} /></div>
        </div>
      ))}
    </div>
  );
}
