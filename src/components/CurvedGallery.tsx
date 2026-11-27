import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';
import { stopScroll, prefersReducedMotion } from '../hooks/useSmoothScroll';
import type { Media } from '../lib/types';

gsap.registerPlugin(Flip);

// ─────────────────────────────────────────────────────────────
//  3D curved gallery: photo cards stand on the inside of a curve,
//  full-bleed. Drag (with momentum + snap), arrow keys, or the
//  buttons; it loops forever. Click the centre photo to open it.
//  Tuned by presets (Admin → Settings → Gallery style).
// ─────────────────────────────────────────────────────────────

export type CurvePreset = {
  id: string;
  label: string;
  shape: 'convex' | 'concave'; // convex: sides recede (centre biggest) · concave: sides come towards you
  curve: number; // 0 flat … 1 strongly curved
  spacing: number; // gap between cards, in card widths
  tilt: number; // how much each card turns with the curve (0–1.4)
  focus: number; // extra size of the centre card (0 = same as the rest)
  perspective: number; // px: smaller = more dramatic depth
  ratio: number; // card width / height
  size: number; // card width as a share of the screen width
  arcs?: boolean; // thin curved guide lines above and below
};

export const CURVE_PRESETS: CurvePreset[] = [
  { id: 'classic', label: 'Classic', shape: 'convex', curve: 0.55, spacing: 1.08, tilt: 1, focus: 0.35, perspective: 1400, ratio: 3 / 4, size: 0.17, arcs: true },
  { id: 'deep', label: 'Deep curve', shape: 'convex', curve: 0.95, spacing: 1.02, tilt: 1.15, focus: 0.3, perspective: 1100, ratio: 3 / 4, size: 0.16, arcs: true },
  { id: 'panorama', label: 'Flat panorama', shape: 'convex', curve: 0.12, spacing: 1.06, tilt: 0.6, focus: 0.08, perspective: 2000, ratio: 3 / 2, size: 0.22 },
  { id: 'compact', label: 'Compact', shape: 'convex', curve: 0.5, spacing: 1.0, tilt: 1, focus: 0.25, perspective: 1300, ratio: 4 / 5, size: 0.12, arcs: true },
  { id: 'cinematic', label: 'Cinematic', shape: 'convex', curve: 0.4, spacing: 1.05, tilt: 1, focus: 0.18, perspective: 1700, ratio: 16 / 9, size: 0.3 },
  { id: 'fullbleed', label: 'Full-bleed', shape: 'convex', curve: 0.3, spacing: 1.02, tilt: 0.9, focus: 0.12, perspective: 1800, ratio: 4 / 3, size: 0.36 },
  { id: 'tunnel', label: 'Tunnel', shape: 'concave', curve: 0.9, spacing: 1.06, tilt: 1, focus: 0, perspective: 900, ratio: 1, size: 0.15 },
  { id: 'oversized', label: 'Oversized', shape: 'convex', curve: 0.45, spacing: 1.04, tilt: 1, focus: 0.15, perspective: 1600, ratio: 4 / 5, size: 0.26, arcs: true },
];

/** Under this many photos the curve looks empty, so the grid is shown instead. */
export const CURVE_MIN_PHOTOS = 5;

export const presetById = (id?: string) => CURVE_PRESETS.find((p) => p.id === id) ?? CURVE_PRESETS[0];

function Viewer({ images, index, onIndex, onClose, fromState }: { images: Media[]; index: number; onIndex: (i: number) => void; onClose: () => void; fromState: Flip.FlipState | null }) {
  const img = useRef<HTMLImageElement>(null);
  const back = useRef<HTMLDivElement>(null);
  const [ar, setAr] = useState(4 / 3);
  const m = images[index];

  useLayoutEffect(() => {
    stopScroll(true);
    gsap.fromTo(back.current, { opacity: 0 }, { opacity: 1, duration: 0.35 });
    if (fromState && img.current && !prefersReducedMotion()) Flip.from(fromState, { targets: img.current, duration: 0.7, ease: 'expo.inOut', scale: false });
    return () => stopScroll(false);
    // only on open
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onIndex((index + 1) % images.length);
      if (e.key === 'ArrowLeft') onIndex((index - 1 + images.length) % images.length);
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [index, images.length, onClose, onIndex]);

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const w = Math.round(Math.min(vw * 0.9, vh * 0.76 * ar));
  return (
    <div className="fixed inset-0 z-[90] grid place-items-center p-4" role="dialog" aria-modal aria-label="Photo viewer">
      <div ref={back} className="absolute inset-0 bg-bg/85 backdrop-blur-xl" onClick={onClose} />
      <img
        ref={img}
        data-flip-id={`cg-${m.id}`}
        src={m.url}
        alt={m.alt}
        onLoad={(e) => setAr(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight || 4 / 3)}
        className="relative rounded-[20px] object-cover shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)]"
        style={{ width: w, height: Math.round(w / ar) }}
        onClick={onClose}
      />
      <div className="glass absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full p-1">
        <button onClick={() => onIndex((index - 1 + images.length) % images.length)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-ink/10" aria-label="Previous photo">
          ‹
        </button>
        <span className="min-w-[64px] text-center font-mono text-[12px]">
          {index + 1} / {images.length}
        </span>
        <button onClick={() => onIndex((index + 1) % images.length)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-ink/10" aria-label="Next photo">
          ›
        </button>
        <span className="mx-1 h-5 w-px bg-line" />
        <button onClick={onClose} className="h-10 rounded-full px-4 text-[14px] hover:bg-ink/10">
          Close
        </button>
      </div>
    </div>
  );
}

export default function CurvedGallery({ images, preset }: { images: Media[]; preset: CurvePreset }) {
  const stage = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLButtonElement | null)[]>([]);
  const pos = useRef({ p: 0 });
  const [width, setWidth] = useState(1200);
  const [current, setCurrent] = useState(0);
  const [viewer, setViewer] = useState<{ i: number; state: Flip.FlipState | null } | null>(null);
  const n = images.length;

  // short lists are repeated so the curve is always full and loops smoothly
  const slots = useMemo(() => {
    if (!n) return [] as { m: Media; i: number; k: string }[];
    const reps = Math.max(1, Math.ceil(11 / n));
    return Array.from({ length: n * reps }, (_, j) => ({ m: images[j % n], i: j % n, k: `${images[j % n].id}-${j}` }));
  }, [images, n]);
  const total = slots.length;

  useLayoutEffect(() => {
    const el = stage.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const mobile = width < 640;
  const cw = Math.round(Math.min(520, Math.max(150, width * (mobile ? Math.min(0.62, Math.max(0.42, preset.size * 2.6)) : preset.size))));
  const ch = Math.round(cw / preset.ratio);
  const curve = mobile ? preset.curve * 0.7 : preset.curve;

  const layout = useCallback(() => {
    const p = pos.current.p;
    const stepX = cw * preset.spacing;
    // the cards stand on a ring of radius R. Convex: the ring bulges towards you, so
    // the sides recede and turn their inner edge to you. Concave: you stand inside it.
    const R = curve > 0.01 ? (preset.shape === 'concave' ? preset.perspective * (1 + (1 - curve) * 3) : (cw * 3.4) / curve) : Infinity;
    const sign = preset.shape === 'concave' ? 1 : -1;
    cards.current.forEach((el, j) => {
      if (!el) return;
      const d = gsap.utils.wrap(-total / 2, total / 2, j - p);
      const a = Math.abs(d);
      // the centre card grows, its neighbours make room for it
      const grow = preset.focus * Math.max(0, 1 - a);
      const push = Math.sign(d) * Math.min(a, 1) * preset.focus * cw * 0.5;
      let x: number, z: number, ry: number, th = 0;
      if (R === Infinity) {
        x = d * stepX + push;
        z = 0;
        ry = 0;
      } else {
        th = (d * stepX + push) / R;
        x = R * Math.sin(th);
        z = sign * R * (1 - Math.cos(th));
        ry = -sign * th * (180 / Math.PI) * preset.tilt;
      }
      const visible = Math.abs(x) < width * 0.72 + cw && a < total / 2 - 0.5 && Math.abs(th) < 1.45;
      el.style.visibility = visible ? 'visible' : 'hidden';
      el.style.transform = `translate3d(${x.toFixed(1)}px, 0, ${z.toFixed(1)}px) rotateY(${ry.toFixed(2)}deg) scale(${(1 + grow).toFixed(3)})`;
      el.style.zIndex = String(1000 - Math.round(a * 10));
      el.style.setProperty('--dim', String(Math.min(0.55, a * 0.12)));
    });
    const c = gsap.utils.wrap(0, total, Math.round(p));
    setCurrent((prev) => (prev === c ? prev : c));
  }, [curve, cw, preset.spacing, preset.tilt, total, width]);

  useLayoutEffect(() => {
    layout();
  }, [layout]);

  const goTo = useCallback(
    (target: number, dur = 0.9) => gsap.to(pos.current, { p: target, duration: prefersReducedMotion() ? 0 : dur, ease: 'expo.out', onUpdate: layout, overwrite: true }),
    [layout],
  );
  const step = (d: number) => goTo(Math.round(pos.current.p) + d);

  // drag with momentum, then snap to the nearest card
  const drag = useRef({ on: false, moved: false, x: 0, startP: 0, v: 0, lastX: 0, lastT: 0 });
  const onDown = (e: React.PointerEvent) => {
    gsap.killTweensOf(pos.current);
    drag.current = { on: true, moved: false, x: e.clientX, startP: pos.current.p, v: 0, lastX: e.clientX, lastT: performance.now() };
  };
  useEffect(() => {
    const move = (e: PointerEvent) => {
      const s = drag.current;
      if (!s.on) return;
      const dx = e.clientX - s.x;
      if (Math.abs(dx) > 4) s.moved = true;
      const now = performance.now();
      s.v = (e.clientX - s.lastX) / Math.max(1, now - s.lastT);
      s.lastX = e.clientX;
      s.lastT = now;
      pos.current.p = s.startP - dx / (cw * preset.spacing);
      layout();
    };
    const up = () => {
      const s = drag.current;
      if (!s.on) return;
      s.on = false;
      if (!s.moved) return;
      const fling = (-s.v * 260) / (cw * preset.spacing);
      goTo(Math.round(pos.current.p + fling), 1.1);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  }, [cw, preset.spacing, layout, goTo]);

  // horizontal trackpad swipes
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    let acc = 0;
    let t: number | undefined;
    const wheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      gsap.killTweensOf(pos.current);
      acc += e.deltaX;
      pos.current.p += e.deltaX / (cw * preset.spacing);
      layout();
      clearTimeout(t);
      t = window.setTimeout(() => {
        goTo(Math.round(pos.current.p), 0.6);
        acc = 0;
      }, 120);
    };
    el.addEventListener('wheel', wheel, { passive: false });
    return () => el.removeEventListener('wheel', wheel);
  }, [cw, preset.spacing, layout, goTo]);

  const onCard = (j: number) => {
    if (drag.current.moved) return;
    const near = Math.round(pos.current.p);
    const d = gsap.utils.wrap(-total / 2, total / 2, j - pos.current.p);
    if (Math.abs(d) > 0.5) return goTo(near + Math.round(d)); // side card: bring it to the centre
    const img = cards.current[j]?.querySelector('img');
    setViewer({ i: slots[j].i, state: img && !prefersReducedMotion() ? Flip.getState(img) : null });
  };

  if (!n) return null;
  const cur = slots[current];

  return (
    <div className="relative">
      <div
        ref={stage}
        onPointerDown={onDown}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') step(1);
          if (e.key === 'ArrowLeft') step(-1);
        }}
        tabIndex={0}
        role="region"
        aria-roledescription="carousel"
        aria-label="Photo gallery"
        className="focus-ring relative w-full cursor-grab touch-pan-y select-none overflow-hidden active:cursor-grabbing"
        style={{
          height: ch * (1 + preset.focus) + (mobile ? 60 : 110),
          perspective: `${preset.perspective}px`,
          maskImage: 'linear-gradient(90deg, transparent, #000 7%, #000 93%, transparent)',
          WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 7%, #000 93%, transparent)',
        }}
      >
        {preset.arcs && (
          <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 1000 100" preserveAspectRatio="none" aria-hidden>
            <path d="M0 14 Q500 -2 1000 14" fill="none" stroke="var(--line)" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
            <path d="M0 86 Q500 102 1000 86" fill="none" stroke="var(--line)" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
          </svg>
        )}
        <div className="absolute left-1/2 top-1/2" style={{ transformStyle: 'preserve-3d' }}>
          {slots.map((s, j) => {
            const d = Math.abs(gsap.utils.wrap(-total / 2, total / 2, j - current));
            return (
              <button
                key={s.k}
                ref={(el) => {
                  cards.current[j] = el;
                }}
                onClick={() => onCard(j)}
                tabIndex={-1}
                aria-hidden={j !== current}
                className="absolute overflow-hidden rounded-[18px] border border-line bg-surface shadow-[0_30px_80px_-30px_rgba(0,0,0,0.85)] [backface-visibility:hidden]"
                style={{ width: cw, height: ch, left: -cw / 2, top: -ch / 2, willChange: 'transform' }}
              >
                {/* only photos near the centre load */}
                {d < 6 && <img data-flip-id={j === current ? `cg-${s.m.id}` : undefined} src={s.m.url} alt={s.m.alt} draggable={false} loading="lazy" className="h-full w-full object-cover" />}
                <span className="pointer-events-none absolute inset-0 bg-bg transition-opacity duration-300" style={{ opacity: 'var(--dim, 0)' as unknown as number }} />
              </button>
            );
          })}
        </div>
      </div>

      {/* side arrows, as in the reference */}
      <button
        onClick={() => step(-1)}
        className="glass focus-ring absolute left-[max(12px,calc(var(--edge)-8px))] z-20 grid h-12 w-12 place-items-center rounded-full transition-transform hover:scale-105 max-sm:hidden"
        style={{ top: `calc(${(ch * (1 + preset.focus) + 110) / 2}px - 24px)` }}
        aria-label="Previous photo"
      >
        <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden>
          <path d="M13 8H3m4-4L3 8l4 4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <button
        onClick={() => step(1)}
        className="glass focus-ring absolute right-[max(12px,calc(var(--edge)-8px))] z-20 grid h-12 w-12 place-items-center rounded-full transition-transform hover:scale-105 max-sm:hidden"
        style={{ top: `calc(${(ch * (1 + preset.focus) + 110) / 2}px - 24px)` }}
        aria-label="Next photo"
      >
        <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden>
          <path d="M3 8h10M9 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* controls */}
      <div className="wrap mt-6 flex items-center justify-between gap-4">
        <p className="min-w-0 truncate font-mono text-[12px] uppercase tracking-[0.06em] text-muted" aria-live="polite">
          <span className="text-ink">{String((cur?.i ?? 0) + 1).padStart(2, '0')}</span> / {String(n).padStart(2, '0')}
          <span className="ml-3 hidden sm:inline">{mobile ? 'Swipe' : 'Drag, swipe or use ← →'} · click the centre photo to open</span>
        </p>
        <div className="glass flex shrink-0 items-center gap-1 rounded-full p-1 sm:hidden">
          <button onClick={() => step(-1)} className="focus-ring grid h-10 w-10 place-items-center rounded-full hover:bg-ink/10" aria-label="Previous photo">
            <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden>
              <path d="M10 3.5L5.5 8l4.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button onClick={() => step(1)} className="focus-ring grid h-10 w-10 place-items-center rounded-full hover:bg-ink/10" aria-label="Next photo">
            <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden>
              <path d="M6 3.5l4.5 4.5L6 12.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {viewer && <Viewer images={images} index={viewer.i} fromState={viewer.state} onIndex={(i) => setViewer({ i, state: null })} onClose={() => setViewer(null)} />}
    </div>
  );
}
