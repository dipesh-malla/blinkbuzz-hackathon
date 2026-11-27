import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { loaderDone } from '../components/Loader';
import TrackViz from '../components/TrackViz';
import { hasWebGL, useInView, useMediaQuery, usePalette } from '../hooks/usePalette';
import { prefersReducedMotion, scrollToId } from '../hooks/useSmoothScroll';
import { useSite } from '../lib/store';

const BrainScene = lazy(() => import('../components/three/BrainScene'));

const CYCLE_MS = 4200;

function ArrowUpRight({ size = 12 }: { size?: number }) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} aria-hidden>
      <path d="M5 11L11 5M6 5h5v5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Hero() {
  const { headline, tagline, current, tracks } = useSite();
  const palette = usePalette();
  const root = useRef<HTMLElement>(null);
  const cardA = useRef<HTMLDivElement>(null);
  const cardB = useRef<HTMLDivElement>(null);
  const inView = useInView(root, '0px');
  const mobile = useMediaQuery('(max-width: 767px)');
  const [gl] = useState(hasWebGL);
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [holding, setHolding] = useState(false);
  const list = tracks.slice(0, 6);
  const n = list.length || 1;
  const t = list[active] ?? list[0];

  // entrance, after the loader lifts
  useEffect(() => {
    let alive = true;
    loaderDone.then(() => {
      if (!alive) return;
      setReady(true);
      const els = root.current?.querySelectorAll('[data-enter]');
      if (!els) return;
      if (prefersReducedMotion()) {
        gsap.set(els, { opacity: 1 });
        return;
      }
      gsap.fromTo(els, { opacity: 0, y: 28, filter: 'blur(8px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.2, ease: 'expo.out', stagger: 0.08, delay: 0.35 });
    });
    return () => {
      alive = false;
    };
  }, []);

  // cycle through the tracks until the visitor takes over
  useEffect(() => {
    if (paused || holding || !inView || n < 2 || prefersReducedMotion()) return;
    const id = setTimeout(() => setActive((a) => (a + 1) % n), CYCLE_MS);
    return () => clearTimeout(id);
  }, [active, paused, holding, inView, n]);

  // swap the glass cards
  useEffect(() => {
    if (!ready || prefersReducedMotion()) return;
    const els = [cardA.current, cardB.current].filter(Boolean);
    gsap.fromTo(els, { opacity: 0, y: 10, filter: 'blur(6px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.6, ease: 'power3.out', stagger: 0.06 });
  }, [active, ready]);

  const pick = useCallback((i: number) => setActive(i), []);
  const hold = useCallback((h: boolean) => setHolding(h), []);
  const step = (d: number) => {
    setActive((a) => (a + d + n) % n);
    setPaused(true);
  };

  const open = current?.registration_open;
  const words = headline.split(' ');
  const tail = words.length > 2 ? words.slice(-2).join(' ') : '';
  const lead = tail ? words.slice(0, -2).join(' ') : headline;

  return (
    <section ref={root} id="top" className="relative isolate min-h-[100svh] overflow-hidden" aria-label="Introduction">
      {/* the scene */}
      <div className="absolute inset-0 -z-10">
        {gl ? (
          <Suspense fallback={<div className="absolute inset-0" style={{ background: `radial-gradient(60% 60% at 65% 45%, ${palette.bg2}, ${palette.bg})` }} />}>
            <BrainScene palette={palette} tracks={list} active={active} onActive={pick} onHold={hold} running={inView} start={ready} lowPower={mobile} />
          </Suspense>
        ) : (
          <div className="absolute inset-0" style={{ background: `radial-gradient(60% 60% at 65% 45%, ${palette.bg2}, ${palette.bg})` }} />
        )}
        {/* keep text readable on the left and at the bottom */}
        <div className="pointer-events-none absolute inset-0 wide:bg-[linear-gradient(90deg,var(--bg)_0%,color-mix(in_oklab,var(--bg)_55%,transparent)_32%,transparent_58%)] tall:bg-[linear-gradient(0deg,var(--bg)_6%,color-mix(in_oklab,var(--bg)_70%,transparent)_42%,transparent_62%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-bg to-transparent" />
      </div>

      <div className="wrap pointer-events-none relative flex min-h-[100svh] flex-col justify-end pb-8 pt-[calc(var(--nav-h)+24px)] wide:justify-center wide:pb-24">
        <div className="pointer-events-auto max-w-[640px] tall:mt-[42svh] wide:max-xl:max-w-[54%]">
          <div data-enter className="inline-flex items-center gap-2 rounded-full border border-line bg-bg/40 py-1.5 pl-2 pr-3 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              {open && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-hot opacity-70" />}
              <span className="relative inline-flex h-2 w-2 rounded-full bg-hot" />
            </span>
            <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink/90">
              {current?.title ?? 'Edition 01'} · {open ? 'Registration open' : 'Coming soon'}
            </span>
          </div>

          <h1 data-enter className="h-display mt-6 text-[clamp(42px,6.4vw,96px)] [text-wrap:balance]">
            {lead} {tail && <span className="grad-text">{tail}</span>}
          </h1>
          <p data-enter className="mt-6 max-w-[44ch] text-[16px] text-ink/70 md:text-[17px]">
            {tagline}
          </p>

          <div data-enter className="mt-9 flex flex-wrap items-center gap-3">
            <button onClick={() => scrollToId('register')} className="btn btn-primary btn-orb h-[52px] pr-6">
              <span className="orb">
                <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden>
                  <path d="M6 3.5l4.5 4.5L6 12.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              {open ? 'Register your team' : 'Get notified'}
            </button>
            <button onClick={() => scrollToId('how')} className="btn btn-ghost h-[52px]">
              How it works
            </button>
          </div>

          {/* track chips: tap to light a region */}
          <div data-enter className="mt-10 wide:mt-14">
            <p className="eyebrow mb-3">Tap a track to light it up</p>
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Innovation tracks">
              {list.map((tr, i) => (
                <button
                  key={tr.id}
                  role="tab"
                  aria-selected={i === active}
                  onClick={() => {
                    setActive(i);
                    setPaused(true);
                  }}
                  onMouseEnter={() => setHolding(true)}
                  onMouseLeave={() => setHolding(false)}
                  className="focus-ring flex h-9 items-center gap-2 rounded-full border px-3.5 text-[13px] transition-[background-color,border-color,color,box-shadow] duration-300"
                  style={{
                    borderColor: i === active ? tr.color : 'var(--line)',
                    background: i === active ? `color-mix(in oklab, ${tr.color} 18%, transparent)` : 'color-mix(in oklab, var(--ink) 4%, transparent)',
                    boxShadow: i === active ? `0 0 24px -6px ${tr.color}` : 'none',
                    color: i === active ? 'var(--ink)' : 'color-mix(in oklab, var(--ink) 75%, transparent)',
                  }}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: tr.color, boxShadow: `0 0 8px ${tr.color}` }} />
                  {tr.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* glass widget cards, top right (Saltmere's instrument cards) */}
      {t && (
        <div className="pointer-events-none absolute right-[max(var(--edge),calc((100%-1440px)/2+var(--edge)))] top-[calc(var(--nav-h)+36px)] hidden w-[248px] flex-col gap-3 xl:flex">
          <div ref={cardA} className="glass pointer-events-auto rounded-[calc(22px*var(--rk))] bg-bg/55 p-4">
            <div className="flex items-start justify-between">
              <span className="eyebrow">Track {String(active + 1).padStart(2, '0')}</span>
              <button onClick={() => scrollToId('tracks')} className="grid h-7 w-7 place-items-center rounded-full border border-line text-ink/80 transition-colors hover:text-ink" aria-label="See all tracks">
                <ArrowUpRight />
              </button>
            </div>
            <p className="mt-6 text-[30px] font-medium leading-none tracking-[-0.03em]" style={{ color: t.color, textShadow: `0 0 28px ${t.color}66` }}>
              {t.name}
            </p>
            <p className="mt-2 text-[13px] leading-snug text-ink/70">{t.blurb}</p>
          </div>
          <div ref={cardB} className="glass pointer-events-auto rounded-[calc(22px*var(--rk))] bg-bg/55 p-4">
            <div className="flex items-center justify-between">
              <span className="eyebrow">Signal</span>
              <span className="font-mono text-[11px]" style={{ color: t.color }}>
                live
              </span>
            </div>
            <div className="mt-3 h-[92px]">
              <TrackViz visual={t.visual} color={t.color} />
            </div>
          </div>
        </div>
      )}

      {/* switcher, bottom right (Saltmere's "‹ Wagasa umbrella ›") */}
      {t && (
        <div data-enter className="glass absolute bottom-8 right-[max(var(--edge),calc((100%-1440px)/2+var(--edge)))] hidden items-center gap-1 rounded-full p-1 wide:md:flex">
          <button onClick={() => step(-1)} className="focus-ring grid h-9 w-9 place-items-center rounded-full text-ink/80 transition-colors hover:bg-ink/10 hover:text-ink" aria-label="Previous track">
            <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden>
              <path d="M10 3.5L5.5 8l4.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <span className="min-w-[112px] text-center font-mono text-[12px] uppercase tracking-[0.06em]" aria-live="polite">
            {t.name}
          </span>
          <button onClick={() => step(1)} className="focus-ring grid h-9 w-9 place-items-center rounded-full text-ink/80 transition-colors hover:bg-ink/10 hover:text-ink" aria-label="Next track">
            <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden>
              <path d="M6 3.5l4.5 4.5L6 12.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <span className="mx-1 h-5 w-px bg-line" />
          <button onClick={() => setPaused((p) => !p)} className="focus-ring grid h-9 w-9 place-items-center rounded-full text-ink/80 transition-colors hover:bg-ink/10 hover:text-ink" aria-label={paused ? 'Play' : 'Pause'}>
            {paused ? (
              <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden>
                <path d="M4.5 3v10l8-5z" fill="currentColor" />
              </svg>
            ) : (
              <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden>
                <path d="M4.5 3h2.5v10H4.5zM9 3h2.5v10H9z" fill="currentColor" />
              </svg>
            )}
          </button>
          {/* progress */}
          <span className="absolute inset-x-5 -bottom-px h-px overflow-hidden rounded-full">
            <span
              key={`${active}-${paused}-${holding}`}
              className="block h-full origin-left"
              style={{
                background: t.color,
                animation: paused || holding ? 'none' : `hero-progress ${CYCLE_MS}ms linear forwards`,
                transform: paused || holding ? 'scaleX(0)' : undefined,
              }}
            />
          </span>
        </div>
      )}
    </section>
  );
}
