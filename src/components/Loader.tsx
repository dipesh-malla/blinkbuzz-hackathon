import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { prefersReducedMotion } from '../hooks/useSmoothScroll';
import { useSite } from '../lib/store';
import { Mark } from './Nav';

// Shown only on a visitor's first visit (kept short). Resolves `loaderDone` when it lifts.
function seen() {
  try {
    return localStorage.getItem('loader-seen') === '1';
  } catch {
    return false;
  }
}
let resolveDone: () => void;
export const loaderDone = new Promise<void>((r) => (resolveDone = r));

export default function Loader() {
  const { brand } = useSite();
  const [show] = useState(() => {
    const skip = prefersReducedMotion() || seen();
    if (skip) queueMicrotask(() => resolveDone());
    return !skip;
  });
  const root = useRef<HTMLDivElement>(null);
  const num = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    if (!show) return;
    try {
      localStorage.setItem('loader-seen', '1');
    } catch {
      /* private mode */
    }
    const counter = { v: 0 };
    const tl = gsap.timeline({
      onComplete: () => {
        setGone(true);
      },
    });
    tl.to(counter, {
      v: 100,
      duration: 0.75,
      ease: 'power2.inOut',
      onUpdate: () => {
        if (num.current) num.current.textContent = String(Math.round(counter.v)).padStart(3, '0');
        if (bar.current) bar.current.style.transform = `scaleX(${counter.v / 100})`;
      },
    })
      .add(() => resolveDone(), '-=0.05')
      .to(root.current, { yPercent: -100, duration: 0.65, ease: 'expo.inOut' });
    return () => {
      tl.kill();
    };
  }, [show]);

  if (!show || gone) return null;
  return (
    <div ref={root} className="fixed inset-0 z-[100] flex flex-col justify-between bg-bg" aria-hidden>
      <div className="wrap flex h-[var(--nav-h)] items-center gap-3">
        <Mark size={24} />
        <span className="eyebrow">{brand} · Hackathon series</span>
      </div>
      <div className="wrap pb-10">
        <div className="flex items-end justify-between">
          <span className="eyebrow">Wiring the neurons</span>
          <span ref={num} className="font-mono text-[clamp(56px,12vw,160px)] leading-none tracking-[-0.04em]">
            000
          </span>
        </div>
        <span className="mt-6 block h-px w-full bg-line">
          <span ref={bar} className="block h-px w-full origin-left scale-x-0 bg-[linear-gradient(90deg,var(--accent),var(--accent2),var(--hot))]" />
        </span>
      </div>
    </div>
  );
}
