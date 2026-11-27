import type { CSSProperties } from 'react';
import type { TrackVisual } from '../lib/types';

/** Small looping graphic for each track. Pure SVG + CSS, so it costs nothing to run. */
export default function TrackViz({ visual, color, className = '' }: { visual: TrackVisual; color: string; className?: string }) {
  const style = { '--c': color } as CSSProperties;
  return (
    <svg viewBox="0 0 240 120" className={`tv block h-full w-full overflow-visible ${className}`} style={style} aria-hidden>
      <defs>
        <filter id="tvglow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {visual === 'neural' && <Neural />}
      {visual === 'candles' && <Candles />}
      {visual === 'pulse' && <Pulse />}
      {visual === 'arm' && <Arm />}
      {visual === 'chain' && <Chain />}
      {visual === 'orbit' && <Orbit />}
    </svg>
  );
}

function Neural() {
  const layers = [
    [30, 60, 90],
    [20, 47, 74, 101],
    [40, 80],
  ];
  const xs = [36, 120, 204];
  const lines: [number, number, number, number, number][] = [];
  layers.slice(0, -1).forEach((l, li) =>
    l.forEach((y1, a) => layers[li + 1].forEach((y2, b) => lines.push([xs[li], y1, xs[li + 1], y2, (a + b + li) % 5]))),
  );
  return (
    <g>
      {lines.map(([x1, y1, x2, y2, d], i) => (
        <g key={i}>
          <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--c)" strokeOpacity="0.18" strokeWidth="1" />
          <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--c)" strokeWidth="1.4" className="tv-flow" style={{ animationDelay: `${d * -0.35}s` }} filter="url(#tvglow)" />
        </g>
      ))}
      {layers.map((l, li) =>
        l.map((y, i) => (
          <g key={`${li}-${i}`}>
            <circle cx={xs[li]} cy={y} r="7" fill="var(--c)" fillOpacity="0.12" stroke="var(--c)" strokeOpacity="0.5" />
            <circle cx={xs[li]} cy={y} r="3.2" fill="var(--c)" className="tv-node" style={{ animationDelay: `${(li * 3 + i) * -0.27}s` }} filter="url(#tvglow)" />
          </g>
        )),
      )}
    </g>
  );
}

function Candles() {
  const c = [
    [62, 30, 1],
    [52, 26, 1],
    [70, 34, 0],
    [58, 22, 1],
    [44, 30, 1],
    [50, 18, 0],
    [36, 28, 1],
    [30, 22, 1],
    [22, 26, 1],
  ];
  return (
    <g>
      {[30, 60, 90].map((y) => (
        <line key={y} x1="8" x2="232" y1={y} y2={y} stroke="var(--c)" strokeOpacity="0.1" strokeDasharray="2 5" />
      ))}
      {c.map(([y, h, up], i) => {
        const x = 18 + i * 25;
        return (
          <g key={i} className="tv-candle" style={{ animationDelay: `${i * -0.22}s`, transformOrigin: `${x + 5}px ${y + h}px` }}>
            <line x1={x + 5} x2={x + 5} y1={y - 8} y2={y + h + 8} stroke="var(--c)" strokeOpacity="0.6" />
            <rect x={x} y={y} width="10" height={h} rx="2" fill={up ? 'var(--c)' : 'transparent'} fillOpacity={up ? 0.85 : 0} stroke="var(--c)" />
          </g>
        );
      })}
      <polyline
        points="10,96 40,84 66,90 92,70 120,74 146,56 172,60 198,42 230,30"
        fill="none"
        stroke="var(--c)"
        strokeWidth="2"
        className="tv-draw"
        pathLength={1}
        filter="url(#tvglow)"
      />
    </g>
  );
}

function Pulse() {
  const d = 'M0,64 L46,64 L56,64 L64,40 L72,88 L82,18 L92,100 L100,64 L132,64 L140,56 L148,64 L240,64';
  return (
    <g>
      <path d={d} fill="none" stroke="var(--c)" strokeOpacity="0.16" strokeWidth="1.5" />
      <path d={d} fill="none" stroke="var(--c)" strokeWidth="2.2" strokeLinejoin="round" pathLength={1} className="tv-scan" filter="url(#tvglow)" />
      <text x="232" y="22" textAnchor="end" fill="var(--c)" fontFamily="DM Mono, monospace" fontSize="13" className="tv-bpm">
        72 bpm
      </text>
    </g>
  );
}

function Arm() {
  return (
    <g stroke="var(--c)" fill="none" strokeWidth="2" strokeLinecap="round">
      <line x1="20" x2="220" y1="108" y2="108" strokeOpacity="0.25" />
      <rect x="166" y="92" width="18" height="16" rx="2" fill="var(--c)" fillOpacity="0.15" className="tv-box" />
      <g transform="translate(70 104)">
        <rect x="-18" y="-6" width="36" height="10" rx="3" fill="var(--c)" fillOpacity="0.2" />
        <g className="tv-arm1">
          <line x1="0" y1="0" x2="0" y2="-52" strokeWidth="6" strokeOpacity="0.85" />
          <circle cx="0" cy="0" r="6" fill="var(--c)" />
          <g transform="translate(0 -52)">
            <g className="tv-arm2">
              <line x1="0" y1="0" x2="58" y2="0" strokeWidth="5" strokeOpacity="0.85" />
              <circle cx="0" cy="0" r="5" fill="var(--c)" filter="url(#tvglow)" />
              <g transform="translate(58 0)" className="tv-claw">
                <path d="M0 0 L8 -7 M0 0 L8 7" />
                <circle cx="0" cy="0" r="3.5" fill="var(--c)" />
              </g>
            </g>
          </g>
        </g>
      </g>
    </g>
  );
}

function Chain() {
  const hashes = ['0x9f3a', '0x41c7', '0xb02e', '0x7d15'];
  return (
    <g>
      {hashes.map((h, i) => {
        const x = 8 + i * 58;
        return (
          <g key={h}>
            {i > 0 && <line x1={x - 14} x2={x} y1="60" y2="60" stroke="var(--c)" strokeWidth="2" strokeDasharray="3 3" className="tv-link" />}
            <rect x={x} y="34" width="46" height="52" rx="7" fill="var(--c)" fillOpacity="0.08" stroke="var(--c)" strokeOpacity="0.7" />
            <rect x={x} y="34" width="46" height="52" rx="7" fill="var(--c)" className="tv-block" style={{ animationDelay: `${i * 0.5}s` }} />
            <text x={x + 23} y="56" textAnchor="middle" fontFamily="DM Mono, monospace" fontSize="9" fill="var(--c)">
              #{i + 1}
            </text>
            <text x={x + 23} y="72" textAnchor="middle" fontFamily="DM Mono, monospace" fontSize="8" fill="var(--c)" fillOpacity="0.7">
              {h}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function Orbit() {
  return (
    <g transform="translate(120 60)" fill="none" stroke="var(--c)">
      <ellipse rx="90" ry="30" strokeOpacity="0.3" />
      <ellipse rx="54" ry="18" strokeOpacity="0.3" />
      <circle r="9" fill="var(--c)" filter="url(#tvglow)" />
      <g className="tv-spin">
        <circle cx="90" cy="0" r="5" fill="var(--c)" />
      </g>
      <g className="tv-spin2">
        <circle cx="-54" cy="0" r="4" fill="var(--c)" fillOpacity="0.8" />
      </g>
    </g>
  );
}
