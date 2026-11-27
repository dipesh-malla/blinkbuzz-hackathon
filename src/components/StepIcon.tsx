import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useInView } from '../hooks/usePalette';

/**
 * Hand-drawn neon line icons for "How it works". One visual language for all four:
 * 2.2px round strokes in the accent colour, a soft tinted fill, one "hot" detail each.
 * They draw themselves in when scrolled into view, then keep a small idle loop
 * (all CSS, paused for reduced motion; see .si-* in index.css).
 */
export type StepKind = 'register' | 'reveal' | 'build' | 'judge';

const D = (n: number) => ({ '--d': `${n * 90}ms` }) as React.CSSProperties;

function Badge() {
  return (
    <>
      {/* lanyard + clip */}
      <path className="si-d" style={D(0)} pathLength={1} d="M46 6 L60 21 L74 6" />
      <rect className="si-d" style={D(1)} pathLength={1} x="53" y="19" width="14" height="9" rx="2.5" />
      {/* card */}
      <rect className="si-d si-fill" style={D(2)} pathLength={1} x="29" y="28" width="62" height="82" rx="11" />
      {/* avatar */}
      <circle className="si-d" style={D(3)} pathLength={1} cx="60" cy="52" r="9" />
      <path className="si-d" style={D(4)} pathLength={1} d="M45 77 C47 68 53 64 60 64 C67 64 73 68 75 77" />
      {/* name lines */}
      <path className="si-d si-soft" style={D(5)} pathLength={1} d="M42 88 H78" />
      <path className="si-d si-soft" style={D(6)} pathLength={1} d="M48 97 H66" />
      {/* scanner sweep (idle) */}
      <path className="si-scan" d="M33 34 H87" />
      {/* approved tick */}
      <circle className="si-d si-hot si-solid" style={D(7)} pathLength={1} cx="88" cy="102" r="11" />
      <path className="si-d si-hot" style={D(8)} pathLength={1} d="M83 102 L87 106 L94 98" />
    </>
  );
}

function Brief() {
  return (
    <>
      {/* the brief rising out of the envelope (idle) */}
      <g className="si-paper">
        <rect className="si-d si-fill" style={D(4)} pathLength={1} x="32" y="34" width="56" height="50" rx="5" />
        <path className="si-d si-soft" style={D(5)} pathLength={1} d="M40 46 H80 M40 55 H74 M40 64 H70" />
      </g>
      {/* envelope */}
      <rect className="si-d si-fill si-front" style={D(0)} pathLength={1} x="16" y="44" width="88" height="58" rx="9" />
      <path className="si-d" style={D(1)} pathLength={1} d="M18 99 L50 72 M102 99 L70 72" />
      {/* flap: closed, then open (idle swaps them) */}
      <path className="si-d si-flap-closed" style={D(2)} pathLength={1} d="M18 47 L60 77 L102 47" />
      <path className="si-flap-open" d="M18 46 L60 18 L102 46" />
      {/* wax seal */}
      <g className="si-seal">
        <circle className="si-d si-hot si-solid" style={D(3)} pathLength={1} cx="60" cy="76" r="10" />
        <path className="si-d si-hot" style={D(4)} pathLength={1} d="M61 69 L56 77 H62 L59 83" />
      </g>
    </>
  );
}

function Build() {
  return (
    <>
      {/* editor window */}
      <rect className="si-d si-fill" style={D(0)} pathLength={1} x="10" y="18" width="100" height="72" rx="10" />
      <path className="si-d si-soft" style={D(1)} pathLength={1} d="M10 33 H110" />
      <circle className="si-d si-hot" style={D(1)} pathLength={1} cx="20" cy="25.5" r="2.2" />
      <circle className="si-d" style={D(1)} pathLength={1} cx="28" cy="25.5" r="2.2" />
      <circle className="si-d si-soft" style={D(1)} pathLength={1} cx="36" cy="25.5" r="2.2" />
      {/* code typing (idle) */}
      <path className="si-type" style={{ '--i': 0 } as React.CSSProperties} pathLength={1} d="M22 46 H52" />
      <path className="si-type" style={{ '--i': 1 } as React.CSSProperties} pathLength={1} d="M30 56 H74" />
      <path className="si-type" style={{ '--i': 2 } as React.CSSProperties} pathLength={1} d="M30 66 H58" />
      <path className="si-type si-soft" style={{ '--i': 3 } as React.CSSProperties} pathLength={1} d="M22 76 H44" />
      <rect className="si-cursor" x="48" y="72" width="5" height="8" rx="1" />
      {/* stand */}
      <path className="si-d" style={D(2)} pathLength={1} d="M60 90 V102 M44 104 H76" />
      {/* gear (spins) */}
      <g className="si-gear">
        <circle className="si-d si-hot si-solid" style={D(3)} pathLength={1} cx="94" cy="88" r="9" />
        <circle className="si-d si-hot" style={D(4)} pathLength={1} cx="94" cy="88" r="3" />
        <path
          className="si-d si-hot"
          style={D(4)}
          pathLength={1}
          d="M94 75 V78 M94 98 V101 M81 88 H84 M104 88 H107 M84.8 78.8 L86.9 80.9 M101.1 95.1 L103.2 97.2 M84.8 97.2 L86.9 95.1 M101.1 80.9 L103.2 78.8"
        />
      </g>
    </>
  );
}

function Trophy() {
  return (
    <>
      {/* sparkles (twinkle) */}
      <path className="si-spark si-hot" style={{ '--i': 0 } as React.CSSProperties} d="M20 18 L22 24 L28 26 L22 28 L20 34 L18 28 L12 26 L18 24 Z" />
      <path className="si-spark" style={{ '--i': 1 } as React.CSSProperties} d="M100 12 L101.5 16.5 L106 18 L101.5 19.5 L100 24 L98.5 19.5 L94 18 L98.5 16.5 Z" />
      <path className="si-spark" style={{ '--i': 2 } as React.CSSProperties} d="M104 56 L105.2 59.8 L109 61 L105.2 62.2 L104 66 L102.8 62.2 L99 61 L102.8 59.8 Z" />
      {/* cup */}
      <path className="si-d si-fill" style={D(0)} pathLength={1} d="M38 18 H82 V42 C82 57 72 68 60 68 C48 68 38 57 38 42 Z" />
      <path className="si-d" style={D(1)} pathLength={1} d="M38 26 H27 C27 40 32 47 40 50 M82 26 H93 C93 40 88 47 80 50" />
      {/* stem + plinth */}
      <path className="si-d" style={D(2)} pathLength={1} d="M60 68 V82 M48 82 H72" />
      <rect className="si-d si-fill" style={D(3)} pathLength={1} x="38" y="82" width="44" height="18" rx="4" />
      <path className="si-d si-soft" style={D(4)} pathLength={1} d="M50 91 H70" />
      {/* star */}
      <path className="si-d si-hot" style={D(5)} pathLength={1} d="M60 30 L63.2 36.6 L70.4 37.6 L65.2 42.6 L66.4 49.8 L60 46.4 L53.6 49.8 L54.8 42.6 L49.6 37.6 L56.8 36.6 Z" />
      {/* shine sweep (idle) */}
      <clipPath id="si-cup">
        <path d="M38 18 H82 V42 C82 57 72 68 60 68 C48 68 38 57 38 42 Z" />
      </clipPath>
      <g clipPath="url(#si-cup)">
        <path className="si-shine" d="M30 70 L58 10" />
      </g>
    </>
  );
}

const ART: Record<StepKind, () => ReactNode> = { register: Badge, reveal: Brief, build: Build, judge: Trophy };

export default function StepIcon({ kind, active }: { kind: StepKind; active?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, '-15% 0px');
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    if (inView) setSeen(true); // draw once, then keep the idle loop
  }, [inView]);
  const Art = ART[kind];
  return (
    <div ref={ref} className={`si si-${kind} ${seen ? 'is-in' : ''} ${active ? 'is-hot' : ''}`} aria-hidden>
      <span className="si-corner tl" />
      <span className="si-corner tr" />
      <span className="si-corner bl" />
      <span className="si-corner br" />
      <svg viewBox="0 0 120 120" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <Art />
      </svg>
    </div>
  );
}
