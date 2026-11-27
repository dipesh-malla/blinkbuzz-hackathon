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
      {visual === 'idea' && <Idea />}
      {visual === 'rocket' && <Rocket />}
      {visual === 'leaf' && <Leaf />}
      {visual === 'shield' && <Shield />}
      {visual === 'cloud' && <Cloud />}
      {visual === 'book' && <Book />}
      {visual === 'cart' && <Cart />}
      {visual === 'globe' && <Globe />}
      {visual === 'bolt' && <Bolt />}
      {visual === 'people' && <People />}
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
      {/* planets travel along their ellipses */}
      <circle r="5" fill="var(--c)" stroke="none" filter="url(#tvglow)">
        <animateMotion dur="5s" repeatCount="indefinite" path="M90 0 A90 30 0 1 1 -90 0 A90 30 0 1 1 90 0" />
      </circle>
      <circle r="4" fill="var(--c)" fillOpacity="0.8" stroke="none">
        <animateMotion dur="3.4s" repeatCount="indefinite" path="M-54 0 A54 18 0 1 0 54 0 A54 18 0 1 0 -54 0" />
      </circle>
    </g>
  );
}

const dl = (s: number): CSSProperties => ({ animationDelay: `${s}s` });

/** Idea → business: a bulb lights up, the spark travels along, and the business grows. */
function Idea() {
  return (
    <g fill="none" stroke="var(--c)" strokeLinecap="round" strokeLinejoin="round">
      {/* bulb */}
      <g transform="translate(40 58)">
        <circle r="30" fill="var(--c)" fillOpacity="0.12" stroke="none" className="tv-glowp" />
        <path d="M-12 8 C-22 0 -22 -24 0 -26 C22 -24 22 0 12 8 L10 16 H-10 Z" fill="var(--c)" fillOpacity="0.14" strokeWidth="2.2" filter="url(#tvglow)" />
        <path d="M-8 22 H8 M-6 28 H6" strokeWidth="2.2" />
        <path d="M-5 8 L-3 -6 L0 2 L3 -6 L5 8" strokeWidth="1.6" className="tv-glowp" />
        <path d="M-32 -20 L-26 -16 M32 -20 L26 -16 M0 -40 V-34 M-36 2 H-30 M36 2 H30" strokeWidth="1.6" strokeOpacity="0.7" className="tv-glowp" />
      </g>
      {/* path from idea to business */}
      <path d="M78 58 C100 58 102 40 124 40 S150 58 166 58" strokeOpacity="0.2" strokeWidth="1.5" />
      <path d="M78 58 C100 58 102 40 124 40 S150 58 166 58" strokeWidth="2" className="tv-flow" filter="url(#tvglow)" />
      <path d="M160 52 L167 58 L160 64" strokeWidth="2" />
      {/* business growing */}
      <line x1="176" x2="234" y1="100" y2="100" strokeOpacity="0.35" />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={180 + i * 13} y={100 - (18 + i * 14)} width="9" height={18 + i * 14} rx="2" fill="var(--c)" fillOpacity={0.3 + i * 0.18} stroke="none" className="tv-grow" style={dl(i * 0.18)} />
      ))}
      <path d="M178 76 L194 66 L206 70 L232 40" strokeWidth="2" className="tv-draw" pathLength={1} filter="url(#tvglow)" />
      <path d="M224 40 H232 V48" strokeWidth="2" />
    </g>
  );
}

/** Startup launch: a rocket climbing with a flickering flame. */
function Rocket() {
  return (
    <g fill="none" stroke="var(--c)" strokeLinecap="round" strokeLinejoin="round">
      {[
        [30, 24],
        [200, 18],
        [214, 80],
        [52, 92],
        [170, 104],
        [80, 40],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="1.6" fill="var(--c)" stroke="none" className="tv-node" style={dl(i * -0.4)} />
      ))}
      <path d="M120 116 V96" strokeWidth="2" strokeDasharray="3 6" className="tv-flow" strokeOpacity="0.6" />
      <g className="tv-float">
        <g transform="translate(120 56)">
          <path d="M0 -40 C14 -28 16 -6 12 14 H-12 C-16 -6 -14 -28 0 -40 Z" fill="var(--c)" fillOpacity="0.14" strokeWidth="2.2" filter="url(#tvglow)" />
          <circle cy="-14" r="6" strokeWidth="2" />
          <path d="M-12 2 L-22 18 L-12 14 M12 2 L22 18 L12 14" strokeWidth="2" />
          <path d="M-6 18 Q0 34 6 18" fill="var(--c)" fillOpacity="0.6" strokeWidth="1.6" className="tv-flame" />
        </g>
      </g>
    </g>
  );
}

/** Agri / sustainability: a sprout grows its leaves under a pulsing sun. */
function Leaf() {
  return (
    <g fill="none" stroke="var(--c)" strokeLinecap="round" strokeLinejoin="round">
      <g transform="translate(196 30)">
        <circle r="11" fill="var(--c)" fillOpacity="0.25" className="tv-glowp" filter="url(#tvglow)" />
        <g className="tv-spin" strokeOpacity="0.6">
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
            <line key={a} x1="16" x2="22" transform={`rotate(${a})`} />
          ))}
        </g>
      </g>
      <path d="M40 104 Q120 92 200 104" strokeOpacity="0.35" strokeWidth="1.5" />
      <path d="M60 108 H180" strokeOpacity="0.2" strokeDasharray="2 6" />
      <path d="M120 104 C120 80 118 60 122 30" strokeWidth="2.4" className="tv-draw" pathLength={1} filter="url(#tvglow)" />
      <path d="M121 72 C104 72 92 62 90 48 C106 46 118 56 121 72 Z" fill="var(--c)" fillOpacity="0.25" strokeWidth="2" className="tv-pop" style={{ ...dl(0.5), transformOrigin: '121px 72px' }} />
      <path d="M121 56 C136 56 148 46 150 32 C134 30 122 40 121 56 Z" fill="var(--c)" fillOpacity="0.25" strokeWidth="2" className="tv-pop" style={{ ...dl(0.9), transformOrigin: '121px 56px' }} />
      <path d="M122 34 C114 30 110 22 112 14 C120 16 124 24 122 34 Z" fill="var(--c)" fillOpacity="0.35" strokeWidth="1.8" className="tv-pop" style={{ ...dl(1.3), transformOrigin: '122px 34px' }} />
    </g>
  );
}

/** Cybersecurity: a shield with a lock, a scan line and expanding rings. */
function Shield() {
  return (
    <g fill="none" stroke="var(--c)" strokeLinecap="round" strokeLinejoin="round">
      <g transform="translate(120 60)">
        <circle r="34" strokeOpacity="0.5" className="tv-ping" />
        <circle r="34" strokeOpacity="0.5" className="tv-ping" style={dl(1.2)} />
        <path d="M0 -46 L34 -34 V-4 C34 22 18 38 0 46 C-18 38 -34 22 -34 -4 V-34 Z" fill="var(--c)" fillOpacity="0.1" strokeWidth="2.2" filter="url(#tvglow)" />
        <rect x="-11" y="-4" width="22" height="18" rx="3" fill="var(--c)" fillOpacity="0.3" strokeWidth="2" />
        <path d="M-7 -4 V-11 A7 7 0 0 1 7 -11 V-4" strokeWidth="2" />
        <circle cy="5" r="2" fill="var(--c)" stroke="none" />
        <line x1="-30" x2="30" y1="-30" y2="-30" strokeWidth="1.6" className="tv-scany" />
      </g>
      <text x="16" y="24" fontFamily="DM Mono, monospace" fontSize="9" fill="var(--c)" stroke="none" fillOpacity="0.7">
        AES-256
      </text>
      <text x="224" y="104" textAnchor="end" fontFamily="DM Mono, monospace" fontSize="9" fill="var(--c)" stroke="none" className="tv-bpm">
        secure
      </text>
    </g>
  );
}

/** Cloud & data: packets syncing up and down. */
function Cloud() {
  return (
    <g fill="none" stroke="var(--c)" strokeLinecap="round" strokeLinejoin="round">
      <path d="M78 58 C66 58 60 50 60 42 C60 32 70 26 80 28 C84 16 96 10 110 12 C124 14 132 24 134 32 C144 28 160 34 160 46 C160 54 154 58 146 58 Z" transform="translate(16 0)" fill="var(--c)" fillOpacity="0.12" strokeWidth="2.2" filter="url(#tvglow)" />
      {[70, 120, 170].map((x, i) => (
        <g key={x}>
          <line x1={x} x2={x} y1="62" y2="96" strokeOpacity="0.2" strokeDasharray="2 4" />
          <rect x={x - 16} y="96" width="32" height="14" rx="3" fill="var(--c)" fillOpacity="0.1" />
          <circle cx={x - 8} cy="103" r="1.6" fill="var(--c)" stroke="none" className="tv-node" style={dl(i * -0.3)} />
          <rect x={x - 3} y="84" width="6" height="6" rx="1" fill="var(--c)" stroke="none" className={i % 2 ? 'tv-down' : 'tv-up'} style={dl(i * 0.4)} />
        </g>
      ))}
    </g>
  );
}

/** EdTech: an open book writing itself, with a cap above. */
function Book() {
  return (
    <g fill="none" stroke="var(--c)" strokeLinecap="round" strokeLinejoin="round">
      <path d="M120 44 C100 34 76 32 56 38 V104 C76 98 100 100 120 110 C140 100 164 98 184 104 V38 C164 32 140 34 120 44 Z" fill="var(--c)" fillOpacity="0.1" strokeWidth="2.2" filter="url(#tvglow)" />
      <path d="M120 44 V110" strokeWidth="1.6" strokeOpacity="0.6" />
      {[54, 64, 74, 84].map((y, i) => (
        <g key={y}>
          <path d={`M66 ${y} Q88 ${y - 4} 110 ${y + 2}`} strokeWidth="1.6" className="tv-write" pathLength={1} style={dl(i * 0.4)} />
          <path d={`M130 ${y + 2} Q152 ${y - 4} 174 ${y}`} strokeWidth="1.6" className="tv-write" pathLength={1} style={dl(1.6 + i * 0.4)} />
        </g>
      ))}
      <g transform="translate(120 18)" className="tv-float">
        <path d="M-24 0 L0 -10 L24 0 L0 10 Z" fill="var(--c)" fillOpacity="0.35" strokeWidth="1.8" />
        <path d="M24 0 V12" strokeWidth="1.6" />
        <circle cx="24" cy="14" r="2" fill="var(--c)" stroke="none" />
      </g>
    </g>
  );
}

/** E-commerce: parcels drop into a rolling cart. */
function Cart() {
  return (
    <g fill="none" stroke="var(--c)" strokeLinecap="round" strokeLinejoin="round">
      <line x1="16" x2="224" y1="110" y2="110" strokeOpacity="0.3" strokeDasharray="3 6" className="tv-link" />
      <g className="tv-roll">
        <path d="M70 44 H86 L98 88 H164 L176 56 H92" strokeWidth="2.4" filter="url(#tvglow)" />
        <path d="M98 88 L94 76" strokeWidth="2" />
        <circle cx="106" cy="100" r="6" strokeWidth="2.2" />
        <circle cx="156" cy="100" r="6" strokeWidth="2.2" />
        <rect x="104" y="64" width="18" height="18" rx="2" fill="var(--c)" fillOpacity="0.35" strokeWidth="1.8" />
        <rect x="126" y="60" width="22" height="22" rx="2" fill="var(--c)" fillOpacity="0.2" strokeWidth="1.8" className="tv-drop" />
        <path d="M137 60 V82 M126 71 H148" strokeWidth="1.2" strokeOpacity="0.7" className="tv-drop" />
      </g>
      <text x="224" y="26" textAnchor="end" fontFamily="DM Mono, monospace" fontSize="11" fill="var(--c)" stroke="none" className="tv-bpm">
        +1 order
      </text>
    </g>
  );
}

/** Travel / global: a turning globe with a plane circling it. */
function Globe() {
  return (
    <g fill="none" stroke="var(--c)" strokeLinecap="round">
      <g transform="translate(120 60)">
        <circle r="40" fill="var(--c)" fillOpacity="0.1" strokeWidth="2.2" filter="url(#tvglow)" />
        <ellipse rx="40" ry="14" strokeOpacity="0.45" />
        <line x1="-40" x2="40" strokeOpacity="0.45" />
        <ellipse rx="16" ry="40" strokeOpacity="0.5" className="tv-meridian" />
        <ellipse rx="16" ry="40" strokeOpacity="0.5" className="tv-meridian" style={dl(-1.5)} />
        <line y1="-40" y2="40" strokeOpacity="0.45" />
        <ellipse rx="62" ry="22" strokeOpacity="0.25" strokeDasharray="3 5" transform="rotate(-14)" />
        <g transform="rotate(-14)">
          <g>
            <path d="M5 0 L-5 -4 V4 Z M1 0 L-2 -7 M1 0 L-2 7" fill="var(--c)" strokeWidth="1.6" filter="url(#tvglow)" />
            <animateMotion dur="6s" repeatCount="indefinite" rotate="auto" path="M0 22 A62 22 0 1 1 0 -22 A62 22 0 1 1 0 22" />
          </g>
        </g>
      </g>
    </g>
  );
}

/** Energy: a lightning bolt charging a battery. */
function Bolt() {
  return (
    <g fill="none" stroke="var(--c)" strokeLinecap="round" strokeLinejoin="round">
      <path d="M70 12 L46 64 H66 L56 108 L94 50 H72 L86 12 Z" fill="var(--c)" fillOpacity="0.25" strokeWidth="2.2" className="tv-flicker" filter="url(#tvglow)" />
      <path d="M100 60 H124" strokeWidth="2" strokeDasharray="4 4" className="tv-link" />
      <rect x="132" y="40" width="80" height="40" rx="7" strokeWidth="2.2" />
      <rect x="212" y="52" width="7" height="16" rx="2" fill="var(--c)" fillOpacity="0.6" />
      <rect x="138" y="46" width="68" height="28" rx="4" fill="var(--c)" fillOpacity="0.55" stroke="none" className="tv-charge" />
      <text x="172" y="98" textAnchor="middle" fontFamily="DM Mono, monospace" fontSize="10" fill="var(--c)" stroke="none" fillOpacity="0.75">
        charging
      </text>
    </g>
  );
}

/** Social impact / community: people linking up into a network. */
function People() {
  const pts: [number, number][] = [
    [44, 40],
    [100, 26],
    [160, 44],
    [210, 30],
    [70, 92],
    [140, 96],
    [198, 90],
  ];
  const links = [
    [0, 1],
    [1, 2],
    [2, 3],
    [0, 4],
    [4, 5],
    [5, 2],
    [5, 6],
    [6, 3],
    [1, 5],
  ];
  return (
    <g fill="none" stroke="var(--c)" strokeLinecap="round">
      {links.map(([a, b], i) => (
        <g key={i}>
          <line x1={pts[a][0]} y1={pts[a][1]} x2={pts[b][0]} y2={pts[b][1]} strokeOpacity="0.2" />
          <line x1={pts[a][0]} y1={pts[a][1]} x2={pts[b][0]} y2={pts[b][1]} strokeWidth="1.4" className="tv-flow" style={dl(i * -0.3)} />
        </g>
      ))}
      {pts.map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y})`}>
          <circle r="12" fill="var(--bg, #000)" fillOpacity="0.6" strokeOpacity="0.6" />
          <circle cy="-3" r="3.4" fill="var(--c)" stroke="none" className="tv-node" style={dl(i * -0.25)} />
          <path d="M-6 7 C-5 2 5 2 6 7" strokeWidth="1.8" />
        </g>
      ))}
    </g>
  );
}
