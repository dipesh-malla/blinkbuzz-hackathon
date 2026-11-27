import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';
import { Section } from '../components/ui';
import CurvedGallery, { CURVE_MIN_PHOTOS, CURVE_PRESETS, presetById } from '../components/CurvedGallery';
import { useSite } from '../lib/store';
import { isDemo } from '../lib/supabase';
import { demoMedia } from '../lib/demo';

/** The curved gallery is topped up with artwork to at least this many cards. */
const FILL_TO = 9;
import { youtubeId } from '../lib/data';
import { prefersReducedMotion, stopScroll } from '../hooks/useSmoothScroll';
import type { Media } from '../lib/types';

gsap.registerPlugin(Flip);

// ─────────────────────────────────────────────────────────────
//  FLIP gallery modal (after the GSAP demo): the clicked photo
//  grows out of its frame into a large view, and back on close.
// ─────────────────────────────────────────────────────────────

export function FlipGallery({ images }: { images: Media[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const [closing, setClosing] = useState<number | null>(null);
  const flipState = useRef<Flip.FlipState | null>(null);
  const aspects = useRef<Record<string, number>>({});
  const modalImg = useRef<HTMLImageElement>(null);
  const backdrop = useRef<HTMLDivElement>(null);
  const reduce = prefersReducedMotion();

  const openAt = (i: number) => {
    const thumb = document.querySelector<HTMLImageElement>(`[data-flip-id="g-${images[i].id}"]`);
    flipState.current = thumb && !reduce ? Flip.getState(thumb) : null;
    setOpen(i);
  };

  const [leaving, setLeaving] = useState(false);
  const close = useCallback(() => {
    if (open === null || leaving) return;
    const thumb = document.querySelector<HTMLImageElement>(`[data-flip-id="g-${images[open].id}"]`);
    const img = modalImg.current;
    const done = () => {
      setLeaving(false);
      setClosing(open);
      setOpen(null);
    };
    if (!img || !thumb || reduce) return done();
    setLeaving(true);
    // fly the big image back onto its thumbnail, then hand over
    thumb.scrollIntoView({ block: 'nearest' });
    gsap.to(backdrop.current, { opacity: 0, duration: 0.5, ease: 'power2.in' });
    Flip.fit(img, thumb, { duration: 0.55, ease: 'expo.inOut', scale: false, absolute: true, onComplete: done });
  }, [open, leaving, images, reduce]);

  const step = useCallback(
    (d: number) => {
      if (open === null) return;
      setOpen((open + d + images.length) % images.length);
      flipState.current = null;
    },
    [open, images.length],
  );

  // opening: animate from the thumbnail's box
  useLayoutEffect(() => {
    if (open === null) return;
    stopScroll(true);
    if (backdrop.current) gsap.fromTo(backdrop.current, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: 'power2.out' });
    if (flipState.current && modalImg.current) {
      Flip.from(flipState.current, { targets: modalImg.current, duration: 0.7, ease: 'expo.inOut', absolute: false, scale: false, props: 'borderRadius' });
      flipState.current = null;
    } else if (modalImg.current) {
      gsap.fromTo(modalImg.current, { opacity: 0, scale: 0.96 }, { opacity: 1, scale: 1, duration: 0.35, ease: 'power2.out' });
    }
  }, [open]);

  // closing: release the page scroll
  useLayoutEffect(() => {
    if (closing === null) return;
    stopScroll(false);
    setClosing(null);
  }, [closing]);

  useEffect(() => {
    if (open === null) return;
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open, close, step]);

  useEffect(() => () => stopScroll(false), []);

  const cur = open !== null ? images[open] : null;
  const ar = cur ? aspects.current[cur.id] ?? 1 : 1;
  // plain pixel size (not CSS min()) so Flip can tween it smoothly
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  const mw = Math.round(Math.min(vw * 0.9, vh * 0.76 * ar));
  const mh = Math.round(mw / ar);

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
        {images.map((m, i) => (
          <li key={m.id} data-reveal={i % 3} className="rounded-[22px] border border-dashed border-line p-2 transition-colors hover:border-accent/60 md:p-2.5">
            <button
              onClick={() => openAt(i)}
              className="focus-ring group relative block aspect-square w-full overflow-hidden rounded-[16px] bg-surface"
              aria-label={`Open photo ${i + 1} of ${images.length}${m.alt ? `: ${m.alt}` : ''}`}
            >
              <img
                data-flip-id={`g-${m.id}`}
                src={m.url}
                alt={m.alt}
                loading="lazy"
                onLoad={(e) => (aspects.current[m.id] = e.currentTarget.naturalWidth / e.currentTarget.naturalHeight)}
                className="absolute inset-0 h-full w-full rounded-[16px] object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                style={{ visibility: open === i ? 'hidden' : 'visible' }}
              />
            </button>
          </li>
        ))}
      </ul>

      {cur && open !== null && (
        <div className="fixed inset-0 z-[90] grid place-items-center p-4 md:p-10" role="dialog" aria-modal aria-label="Photo viewer">
          <div ref={backdrop} className="absolute inset-0 bg-bg/80 backdrop-blur-xl" onClick={close} />
          <img
            ref={modalImg}
            data-flip-id={`g-${cur.id}`}
            src={cur.url}
            alt={cur.alt}
            className="relative rounded-[20px] object-cover shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)]"
            style={{ width: mw, height: mh }}
            onClick={close}
          />
          <div className="glass absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full p-1">
            <button onClick={() => step(-1)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-ink/10" aria-label="Previous photo">
              <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden>
                <path d="M10 3.5L5.5 8l4.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <span className="min-w-[64px] text-center font-mono text-[12px]">
              {open + 1} / {images.length}
            </span>
            <button onClick={() => step(1)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-ink/10" aria-label="Next photo">
              <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden>
                <path d="M6 3.5l4.5 4.5L6 12.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <span className="mx-1 h-5 w-px bg-line" />
            <button onClick={close} className="h-10 rounded-full px-4 text-[14px] hover:bg-ink/10">
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export function VideoModal({ id, onClose }: { id: string; onClose: () => void }) {
  useEffect(() => {
    stopScroll(true);
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => {
      stopScroll(false);
      window.removeEventListener('keydown', k);
    };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-bg/85 p-4 backdrop-blur-xl" role="dialog" aria-modal onClick={onClose}>
      <div className="relative aspect-video w-full max-w-5xl overflow-hidden rounded-[22px] bg-black" onClick={(e) => e.stopPropagation()}>
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
          title="Video"
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      </div>
      <button onClick={onClose} className="btn btn-ghost absolute right-5 top-5 h-10 px-4 text-[14px]">
        Close
      </button>
    </div>
  );
}

export function VideoGrid({ videos }: { videos: Media[] }) {
  const [playing, setPlaying] = useState<string | null>(null);
  if (!videos.length) return null;
  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {videos.map((v) => {
          const id = youtubeId(v.url);
          if (!id) return null;
          return (
            <button
              key={v.id}
              onClick={() => setPlaying(id)}
              className="focus-ring card-lift group relative aspect-video overflow-hidden rounded-[22px] border border-line bg-surface text-left"
              aria-label={`Play video: ${v.alt || 'event video'}`}
            >
              <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
              <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent" />
              <span className="absolute bottom-4 left-4 flex items-center gap-3">
                <span className="btn-primary grid h-11 w-11 place-items-center rounded-full">
                  <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden>
                    <path d="M4.5 2.5v11l9-5.5z" fill="currentColor" />
                  </svg>
                </span>
                <span className="text-[15px] font-medium text-white">{v.alt || 'Watch'}</span>
              </span>
            </button>
          );
        })}
      </div>
      {playing && <VideoModal id={playing} onClose={() => setPlaying(null)} />}
    </>
  );
}

function EditionSelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { id: string; title: string; count: number }[] }) {
  return (
    <label className="glass relative flex h-11 items-center gap-2 rounded-full pl-4 pr-10 text-[14px]">
      <span className="text-muted">Edition</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="focus-ring cursor-pointer appearance-none bg-transparent font-medium text-ink outline-none"
        aria-label="Show photos from edition"
      >
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.title} ({o.count})
          </option>
        ))}
      </select>
      <svg viewBox="0 0 16 16" width="12" height="12" className="pointer-events-none absolute right-4 text-muted" aria-hidden>
        <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </label>
  );
}

export default function Gallery() {
  const { media, editions, settings } = useSite();
  // editions listed in the dropdown: any that has photos, plus every edition that isn't just planned
  const withMedia = useMemo(() => editions.filter((e) => e.status !== 'planned' || media.some((m) => m.edition_id === e.id && m.kind === 'image')), [editions, media]);
  const [filter, setFilter] = useState<string>('all');
  // default perspective comes from Admin → Settings; visitors can switch it (?gallery=deep previews one)
  const initial = (typeof location !== 'undefined' && new URLSearchParams(location.search).get('gallery')) || settings.galleryStyle;
  const [styleId, setStyleId] = useState<string>(presetById(initial).id);
  const preset = presetById(styleId);
  const shown = media.filter((m) => filter === 'all' || m.edition_id === filter);
  const real = shown.filter((m) => m.kind === 'image');
  // Until there are enough event photos, coloured artwork fills the curve so the
  // gallery always looks complete. Real photos always come first.
  const filler = real.length < FILL_TO ? (isDemo ? [] : demoMedia.slice(0, FILL_TO - real.length).map((m) => ({ ...m, id: `art-${m.id}`, alt: 'BlinkBuzz artwork' }))) : [];
  const images = isDemo ? real : [...real, ...filler];
  const videos = shown.filter((m) => m.kind === 'video');
  const count = (id: string) => media.filter((m) => m.kind === 'image' && (id === 'all' || m.edition_id === id)).length;
  const curved = images.length >= CURVE_MIN_PHOTOS;
  const options = [{ id: 'all', title: 'All editions', count: count('all') }, ...withMedia.map((e) => ({ id: e.id, title: e.title, count: count(e.id) }))];

  return (
    <Section id="gallery" bare>
      <div className="wrap">
        <p className="tag mb-5" data-reveal>
          Gallery
        </p>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <h2 data-reveal className="h-section">
            Photos and films <span className="text-muted">from every edition.</span>
          </h2>
          {withMedia.length > 0 && (
            <div data-reveal>
              <EditionSelect value={filter} onChange={setFilter} options={options} />
            </div>
          )}
        </div>
        {(isDemo || filler.length > 0) && (
          <p className="mt-4 font-mono text-[12px] text-muted">
            {real.length ? 'Event photos first; artwork fills the rest until more are added.' : 'Artwork for now. Event photos appear here as they are added.'}
          </p>
        )}

        {/* perspective picker */}
        {curved && (
          <div data-reveal className="-mx-[var(--edge)] mt-10 overflow-x-auto px-[var(--edge)] pb-1 [scrollbar-width:none]">
            <div className="flex min-w-max gap-2 lg:grid lg:min-w-0 lg:grid-cols-8" role="tablist" aria-label="Gallery perspective">
              {CURVE_PRESETS.map((p, i) => {
                const on = p.id === preset.id;
                return (
                  <button
                    key={p.id}
                    role="tab"
                    aria-selected={on}
                    onClick={() => setStyleId(p.id)}
                    className={`focus-ring flex min-w-[112px] flex-col items-center justify-center gap-1 rounded-[14px] border px-3 py-3 transition-[border-color,background-color,box-shadow] duration-300 ${
                      on ? 'border-accent bg-accent/10 shadow-[0_0_24px_-8px_var(--accent)]' : 'border-line bg-ink/[0.03] hover:border-ink/40'
                    }`}
                  >
                    <span className={`font-mono text-[12px] ${on ? 'text-accent' : 'text-muted'}`}>{String(i + 1).padStart(2, '0')}</span>
                    <span className={`whitespace-nowrap text-[14px] ${on ? 'text-ink' : 'text-ink/70'}`}>{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {images.length === 0 && videos.length === 0 ? (
        <div className="wrap">
          <div data-reveal className="glass mt-12 grid min-h-[44svh] place-items-center rounded-[28px] p-8 text-center">
            <p className="mx-auto max-w-[26ch] text-[clamp(24px,3vw,36px)] font-medium tracking-[-0.02em]">The first photos land here after hack day.</p>
          </div>
        </div>
      ) : (
        <div className="mt-8 space-y-14">
          {images.length > 0 &&
            (curved ? (
              // full bleed: edge to edge of the screen
              <div data-reveal key={`${filter}-${preset.id}`}>
                <CurvedGallery images={images} preset={preset} />
              </div>
            ) : (
              // only a few photos: the framed grid reads better than a sparse curve
              <div className="wrap" key={filter}>
                <FlipGallery images={images} />
              </div>
            ))}
          {videos.length > 0 && (
            <div className="wrap">
              <VideoGrid videos={videos} />
            </div>
          )}
        </div>
      )}
    </Section>
  );
}
