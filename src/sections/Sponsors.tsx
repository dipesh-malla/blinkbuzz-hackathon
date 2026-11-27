import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { Draggable } from 'gsap/Draggable';
import { Arrow, Section } from '../components/ui';
import { useSite } from '../lib/store';
import { useMediaQuery } from '../hooks/usePalette';
import { prefersReducedMotion } from '../hooks/useSmoothScroll';
import { FEATURED_TIERS, type RequestTier, type Sponsor, type SponsorTier } from '../lib/types';
import PartnerForm from '../components/PartnerForm';

gsap.registerPlugin(Draggable);

export const tierLabel: Record<SponsorTier, string> = {
  title: 'Title sponsor',
  powered: 'Powered by',
  gold: 'Gold sponsor',
  sponsor: 'Sponsor',
  partner: 'Industry partner',
  community: 'Community partner',
};

const tierColor: Record<SponsorTier, string> = {
  title: 'var(--hot)',
  powered: 'var(--accent)',
  gold: '#ffcf5a',
  sponsor: 'var(--accent2)',
  partner: 'var(--accent)',
  community: 'var(--accent2)',
};

type Card = { key: string; tier: SponsorTier; sponsor: Sponsor | null };

function host(url: string | null) {
  if (!url) return '';
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

/** The logo fills the box it is given (object-contain); no logo → the name, set large. */
function LogoFace({ s, big, eager }: { s: Sponsor; big?: boolean; eager?: boolean }) {
  return s.logo_url ? (
    <img
      src={s.logo_url}
      alt={s.name}
      // rings sit in 3D space where lazy-loading can wait forever, so they load eagerly
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      className="h-full w-full object-contain drop-shadow-[0_6px_18px_rgba(0,0,0,.35)]"
      draggable={false}
    />
  ) : (
    <span className={`${big ? 'text-[30px]' : 'text-[19px]'} text-center font-semibold leading-tight tracking-[-0.02em]`}>{s.name}</span>
  );
}

// ─────────────────────────────────────────────────────────────
//  Infinite card slider (after the GSAP demo): the front card is
//  large, the rest fan out smaller and fade. Drag, arrows or keys.
// ─────────────────────────────────────────────────────────────
function FeaturedSlider({ cards, onOpenSlot }: { cards: Card[]; onOpenSlot: (t: SponsorTier) => void }) {
  const stage = useRef<HTMLDivElement>(null);
  const proxy = useRef<HTMLDivElement>(null);
  const els = useRef<(HTMLDivElement | null)[]>([]);
  const pos = useRef({ p: 0 });
  const [current, setCurrent] = useState(0);
  const [hold, setHold] = useState(false);
  const mobile = useMediaQuery('(max-width: 639px)');
  const n = cards.length;
  const spacing = mobile ? 150 : 210;

  const layout = useCallback(() => {
    const p = pos.current.p;
    els.current.forEach((el, i) => {
      if (!el) return;
      const d = gsap.utils.wrap(-n / 2, n / 2, i - p);
      const a = Math.abs(d);
      gsap.set(el, {
        x: d * spacing,
        scale: 1 - Math.min(a, 3) * 0.15,
        rotateY: -d * 10,
        opacity: a > 2.6 ? Math.max(0, 1 - (a - 2.6) * 2) : 1,
        zIndex: 100 - Math.round(a * 10),
        '--dim': Math.min(a, 2.5) * 0.28,
      } as gsap.TweenVars);
    });
    const c = gsap.utils.wrap(0, n, Math.round(p));
    setCurrent((prev) => (prev === c ? prev : c));
  }, [n, spacing]);

  const goTo = useCallback(
    (target: number) =>
      gsap.to(pos.current, {
        p: target,
        duration: 0.8,
        ease: 'expo.out',
        onUpdate: layout,
        overwrite: true,
      }),
    [layout],
  );

  useEffect(() => {
    layout();
  }, [layout]);

  // bring card i to the front by the shortest way round
  const bringToFront = useCallback(
    (i: number) => {
      const p = Math.round(pos.current.p);
      goTo(p + gsap.utils.wrap(-n / 2, n / 2, i - p));
    },
    [goTo, n],
  );
  const cardsRef = useRef(cards);
  cardsRef.current = cards;
  const moved = useRef(false);
  // a click (not a drag) on a side card brings it to the front; on the open front card it opens the form
  const onCardClick = (i: number) => {
    if (moved.current) return;
    const front = gsap.utils.wrap(0, n, Math.round(pos.current.p));
    if (i !== front) return bringToFront(i);
    const c = cardsRef.current[i];
    if (c && !c.sponsor) onOpenSlot(c.tier);
  };

  // drag; a click (no drag) on a side card brings it to the front, on the open front card opens the form
  useEffect(() => {
    if (!proxy.current) return;
    let startP = 0;
    const [d] = Draggable.create(proxy.current, {
      type: 'x',
      trigger: stage.current,
      zIndexBoost: false, // keep the invisible drag layer under the cards so clicks reach them
      onPress() {
        moved.current = false;
        gsap.killTweensOf(pos.current);
        startP = pos.current.p;
        setHold(true);
      },
      onDrag() {
        if (Math.abs(this.x - this.startX) > 3) moved.current = true;
        pos.current.p = startP - (this.x - this.startX) / spacing;
        layout();
      },
      onRelease() {
        const v = (this.x - this.startX) / spacing;
        if (Math.abs(this.x - this.startX) > 3) goTo(Math.round(startP - v * 1.15));
        gsap.set(proxy.current, { x: 0 });
        setHold(false);
      },
    });
    return () => {
      d.kill();
    };
  }, [spacing, layout, goTo]);

  // autoplay
  useEffect(() => {
    if (hold || prefersReducedMotion()) return;
    const id = setInterval(() => goTo(Math.round(pos.current.p) + 1), 3400);
    return () => clearInterval(id);
  }, [hold, goTo]);

  const step = (d: number) => goTo(Math.round(pos.current.p) + d);

  return (
    <div
      className="relative"
      onMouseEnter={() => setHold(true)}
      onMouseLeave={() => setHold(false)}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') step(1);
        if (e.key === 'ArrowLeft') step(-1);
      }}
    >
      <div
        ref={stage}
        className="relative mx-auto h-[360px] cursor-grab touch-pan-y select-none overflow-hidden active:cursor-grabbing sm:h-[430px]"
        style={{
          perspective: '1400px',
          maskImage: 'linear-gradient(90deg, transparent, #000 14%, #000 86%, transparent)',
          WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 14%, #000 86%, transparent)',
        }}
        role="region"
        aria-roledescription="carousel"
        aria-label="Featured sponsors"
        tabIndex={0}
      >
        <div ref={proxy} className="absolute inset-0 opacity-0" aria-hidden />
        {cards.map((c, i) => {
          const color = tierColor[c.tier];
          const isCur = i === current;
          return (
            <div
              key={c.key}
              ref={(el) => {
                els.current[i] = el;
              }}
              data-card={i}
              onClick={() => onCardClick(i)}
              className={`absolute left-1/2 top-1/2 -ml-[95px] -mt-[135px] h-[270px] w-[190px] sm:-ml-[120px] sm:-mt-[165px] sm:h-[330px] sm:w-[240px] ${isCur ? '' : 'cursor-pointer'}`}
              aria-hidden={!isCur}
            >
              <div
                className="relative flex h-full w-full flex-col justify-between overflow-hidden rounded-[22px] border p-4 sm:p-5"
                style={{
                  borderColor: isCur ? color : 'var(--line)',
                  background: `linear-gradient(180deg, color-mix(in oklab, ${color} ${isCur ? 16 : 6}%, var(--surface)), var(--bg))`,
                  boxShadow: isCur ? `0 0 0 1px ${color}, 0 30px 80px -30px ${color}` : '0 20px 50px -30px rgba(0,0,0,.9)',
                  transition: 'border-color .4s, box-shadow .4s, background .4s',
                }}
              >
                {/* playing-card corners, as in the demo */}
                <div className="flex items-start justify-between font-mono text-[10px] uppercase tracking-[0.08em] sm:text-[11px]" style={{ color }}>
                  <span>{tierLabel[c.tier]}</span>
                  <span>{String(FEATURED_TIERS.indexOf(c.tier) + 1).padStart(2, '0')}</span>
                </div>
                <div className="grid min-h-0 flex-1 place-items-center py-3">
                  {c.sponsor ? (
                    <div className="grid h-full max-h-[190px] w-full place-items-center sm:max-h-[230px]">
                      <LogoFace s={c.sponsor} big />
                    </div>
                  ) : (
                    <div className="text-center">
                      <svg viewBox="0 0 24 24" width="34" height="34" className="mx-auto" style={{ color }} aria-hidden>
                        <path d="M12 3l2.2 6.8L21 12l-6.8 2.2L12 21l-2.2-6.8L3 12l6.8-2.2Z" fill="currentColor" opacity=".9" />
                      </svg>
                      <p className="mt-3 text-[18px] font-medium tracking-[-0.02em] sm:text-[20px]">Your logo here</p>
                    </div>
                  )}
                </div>
                <div className="flex items-end justify-between font-mono text-[10px] uppercase tracking-[0.08em] text-muted sm:text-[11px]">
                  <span className="truncate">{c.sponsor ? host(c.sponsor.website) || c.sponsor.name : 'Slot open'}</span>
                  <span className="rotate-180" style={{ color }}>
                    {tierLabel[c.tier]}
                  </span>
                </div>
                {/* fades side cards */}
                <span className="pointer-events-none absolute inset-0 bg-bg" style={{ opacity: 'var(--dim, 0)' as unknown as number }} />
                {c.sponsor?.website && isCur && <a href={c.sponsor.website} target="_blank" rel="noreferrer" className="absolute inset-0" aria-label={`Visit ${c.sponsor.name}`} />}
                {!c.sponsor && isCur && (
                  <button type="button" className="absolute inset-0 cursor-pointer" aria-label={`Ask about the ${tierLabel[c.tier]} slot`} />
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex items-center justify-center gap-3">
        <button onClick={() => step(-1)} className="btn btn-ghost h-11 px-5 text-[14px]" aria-label="Previous sponsor">
          Prev
        </button>
        <span className="min-w-[160px] text-center font-mono text-[12px] uppercase tracking-[0.06em] text-muted" aria-live="polite">
          {cards[current]?.sponsor?.name ?? `${tierLabel[cards[current]?.tier ?? 'title']} · open`}
        </span>
        <button onClick={() => step(1)} className="btn btn-ghost h-11 px-5 text-[14px]" aria-label="Next sponsor">
          Next
        </button>
      </div>
    </div>
  );
}

function useViewportWidth() {
  const [vw, setVw] = useState(() => (typeof window === 'undefined' ? 1440 : window.innerWidth));
  useEffect(() => {
    let t = 0;
    const on = () => {
      clearTimeout(t);
      t = window.setTimeout(() => setVw(window.innerWidth), 150);
    };
    window.addEventListener('resize', on);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', on);
    };
  }, []);
  return vw;
}

// ─────────────────────────────────────────────────────────────
//  Rotating ring: cards travel round a circle, left to right
//  (or the other way), pausing on hover.
// ─────────────────────────────────────────────────────────────
function Ring({ items, reverse, label }: { items: Card[]; reverse?: boolean; label: string }) {
  const mobile = useMediaQuery('(max-width: 639px)');
  const reduce = prefersReducedMotion();
  const vw = useViewportWidth();
  const w = mobile ? 168 : 232;
  const h = Math.round(w * 0.68);
  const gap = mobile ? 18 : 26;
  // the ring is as wide as the screen, so its front arc runs edge to edge like the other sections
  const want = Math.max(mobile ? 230 : 380, vw * (mobile ? 0.62 : 0.64));
  const slots = Math.max(10, items.length, Math.round((2 * Math.PI * want) / (w + gap)));
  const list = useMemo(() => {
    let out = items;
    while (out.length < slots) out = [...out, ...items];
    return out.slice(0, slots);
  }, [items, slots]);
  const r = Math.max(want, ((w + gap) * list.length) / (2 * Math.PI));
  return (
    <div className="group relative" aria-label={label} role="list">
      <div
        className="relative -mx-[var(--edge)] h-[200px] overflow-hidden sm:h-[260px]"
        style={{
          perspective: '1600px',
          maskImage: 'linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)',
          WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)',
        }}
      >
        <div
          className="absolute left-1/2 top-1/2"
          style={{
            transformStyle: 'preserve-3d',
            // tilt so the arc reads as a ring, then lift it back so the front cards sit in the middle of the band
            transform: `translateY(${-Math.round(r * Math.sin((5 * Math.PI) / 180))}px) translateZ(-${r}px) rotateX(-5deg)`,
          }}
        >
          <div
            className="ring-spin"
            style={{
              transformStyle: 'preserve-3d',
              animation: reduce ? 'none' : `ring-spin ${list.length * 4.2}s linear infinite ${reverse ? 'reverse' : ''}`,
            }}
          >
            {list.map((c, i) => {
              const color = tierColor[c.tier];
              return (
                <div
                  key={`${c.key}-${i}`}
                  role="listitem"
                  className="absolute flex flex-col items-center justify-center rounded-[18px] border border-line px-4 pb-2.5 pt-3.5 text-center [backface-visibility:hidden]"
                  style={{
                    width: w,
                    height: h,
                    left: -w / 2,
                    top: -h / 2,
                    transform: `rotateY(${(360 / list.length) * i}deg) translateZ(${r}px)`,
                    background: `linear-gradient(180deg, color-mix(in oklab, ${color} 10%, var(--surface)), color-mix(in oklab, var(--bg) 85%, transparent))`,
                  }}
                >
                  {c.sponsor ? (
                    <>
                      <div className="grid min-h-0 w-full flex-1 place-items-center">
                        <LogoFace s={c.sponsor} eager />
                      </div>
                      {c.sponsor.logo_url && <span className="mt-1.5 max-w-full truncate font-mono text-[10px] uppercase tracking-[0.08em] text-muted">{c.sponsor.name}</span>}
                    </>
                  ) : (
                    <span className="text-[13px] leading-tight text-muted">
                      <span className="block font-mono text-[10px] uppercase tracking-[0.08em]" style={{ color }}>
                        {tierLabel[c.tier]}
                      </span>
                      Slot open
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SponsorTiers({ sponsors }: { sponsors: Sponsor[] }) {
  return (
    <div className="space-y-10">
      {(Object.keys(tierLabel) as SponsorTier[]).map((t) => {
        const list = sponsors.filter((s) => s.tier === t);
        if (!list.length) return null;
        return (
          <div key={t} data-reveal>
            <h3 className="eyebrow mb-4">{tierLabel[t]}</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {list.map((s) => (
                <a key={s.id} href={s.website ?? undefined} target="_blank" rel="noreferrer" className="glass card-lift grid h-28 place-items-center rounded-[20px] px-6">
                  <LogoFace s={s} />
                </a>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Sponsors() {
  const { sponsors, sponsorEmail, current } = useSite();
  const pool = sponsors.filter((s) => !s.edition_id || s.edition_id === current?.id);

  const featured: Card[] = useMemo(() => {
    const got: Card[] = FEATURED_TIERS.flatMap((t) => pool.filter((s) => s.tier === t).map((s) => ({ key: s.id, tier: t, sponsor: s })));
    // fill open slots so the fan always has cards on both sides
    const open = FEATURED_TIERS.filter((t) => !got.some((c) => c.tier === t)).map((t) => ({ key: `open-${t}`, tier: t, sponsor: null }));
    let out = [...got, ...open];
    let k = 0;
    while (out.length < 7) out = [...out, ...[...got, ...open].map((c) => ({ ...c, key: `${c.key}-r${k++}` }))];
    return out;
  }, [pool]);

  const ringA: Card[] = pool.filter((s) => s.tier === 'sponsor').map((s) => ({ key: s.id, tier: s.tier, sponsor: s }));
  const ringB: Card[] = pool.filter((s) => s.tier === 'partner' || s.tier === 'community').map((s) => ({ key: s.id, tier: s.tier, sponsor: s }));
  const open = (t: SponsorTier, k: number): Card[] =>
    Array.from({ length: k }, (_, i) => ({
      key: `o-${t}-${i}`,
      tier: t,
      sponsor: null,
    }));

  const [form, setForm] = useState<{ open: boolean; tier?: RequestTier }>({
    open: false,
  });
  const closeForm = useCallback(() => setForm((f) => ({ ...f, open: false })), []);

  return (
    <Section id="sponsors" tag="Sponsors & partners">
      <div className="grid grid-cols-1 items-end gap-6 lg:grid-cols-12">
        <h2 data-reveal className="h-section lg:col-span-7">
          {pool.length ? 'Backed by people who build.' : 'Put your name on the next big idea.'}
        </h2>
        <div data-reveal className="lg:col-span-5 lg:justify-self-end">
          <p className="max-w-[42ch] text-[16px] text-muted">
            Each edition is shaped by one industry partner and carried by its sponsors. Slots for {current?.title ?? 'the next edition'} are open.
          </p>
          <button type="button" onClick={() => setForm({ open: true })} className="btn btn-primary mt-6">
            Become a partner <Arrow />
          </button>
          <p className="mt-3 font-mono text-[12px] text-muted">{sponsorEmail}</p>
        </div>
      </div>

      <div data-reveal className="mt-12">
        <FeaturedSlider cards={featured} onOpenSlot={(t) => setForm({ open: true, tier: t })} />
      </div>

      <div className="mt-20 space-y-4">
        <p data-reveal className="eyebrow text-center">
          Sponsors
        </p>
        <div data-reveal>
          <Ring items={ringA.length ? ringA : open('sponsor', 4)} label="Sponsors" />
        </div>
        <p data-reveal className="eyebrow pt-6 text-center">
          Industry & community partners
        </p>
        <div data-reveal>
          <Ring items={ringB.length ? ringB : [...open('partner', 2), ...open('community', 2)]} reverse label="Partners" />
        </div>
      </div>
      <PartnerForm open={form.open} initialTier={form.tier} onClose={closeForm} />
    </Section>
  );
}
