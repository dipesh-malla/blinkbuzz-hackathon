import { useState } from 'react';
import type { Sponsor, SponsorTier } from '../lib/types';

/**
 * A fixed-size "plate" that any sponsor logo sits on, so logos never spill out of a card.
 *
 * Logos come in every shape: wide wordmarks (often 3:1 to 8:1), square marks (1:1) and the odd
 * tall one. Fitting each to the same box makes wide logos look tiny and square ones huge, so we
 * size them by aspect ratio instead (the "logo soup" approach): every logo gets roughly the same
 * visual area, wide ones spread out and tall ones stay short, then everything is clamped to fit.
 */

export type LogoBg = 'light' | 'dark' | 'none';

const plateBg: Record<LogoBg, string> = {
  light: 'linear-gradient(180deg, #ffffff, #eef0f7)',
  dark: 'linear-gradient(180deg, color-mix(in oklab, var(--surface) 90%, #fff 4%), var(--bg))',
  none: 'transparent',
};

const partnerTiers: SponsorTier[] = ['partner', 'community'];

/** "Food & Beverage sponsor", "Health partner"…, or the plain tier name when no category is set. */
export function sponsorKind(s: Pick<Sponsor, 'tier' | 'category'>, tierLabel: Record<SponsorTier, string>) {
  const c = s.category?.trim();
  if (!c) return tierLabel[s.tier];
  if (/\b(sponsor|partner)s?$/i.test(c)) return c;
  return `${c} ${partnerTiers.includes(s.tier) ? 'partner' : 'sponsor'}`;
}

export default function LogoPlate({
  s,
  w,
  h,
  eager,
  radius = 14,
  className = '',
}: {
  s: Pick<Sponsor, 'name' | 'logo_url' | 'logo_bg'>;
  w: number;
  h: number;
  eager?: boolean;
  radius?: number;
  className?: string;
}) {
  const [ar, setAr] = useState<number | null>(null);
  const bg = (s.logo_bg ?? 'light') as LogoBg;
  const pad = Math.round(Math.min(w, h) * 0.12);
  const aw = w - pad * 2;
  const ah = h - pad * 2;

  let lw = aw;
  let lh = ah;
  if (ar) {
    const area = aw * ah * 0.7; // target visual area
    lw = Math.sqrt(area * ar);
    lh = lw / ar;
    const k = Math.min(1, aw / lw, ah / lh);
    lw *= k;
    lh *= k;
  }

  return (
    <div
      className={`relative shrink-0 overflow-hidden ${bg === 'light' ? 'shadow-[inset_0_0_0_1px_rgba(0,0,0,.06)]' : bg === 'dark' ? 'border border-line' : ''} ${className}`}
      style={{ width: w, height: h, borderRadius: `calc(${radius}px * var(--rk))`, background: plateBg[bg] }}
    >
      {s.logo_url ? (
        <img
          src={s.logo_url}
          alt={s.name}
          // rings sit in 3D space where lazy-loading can wait forever, so those load eagerly
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          draggable={false}
          onLoad={(e) => {
            const i = e.currentTarget;
            if (i.naturalWidth && i.naturalHeight) setAr(i.naturalWidth / i.naturalHeight);
          }}
          className="absolute left-1/2 top-1/2 max-w-none -translate-x-1/2 -translate-y-1/2 object-contain transition-opacity duration-300"
          style={{ width: Math.round(lw), height: Math.round(lh), opacity: ar ? 1 : 0 }}
        />
      ) : (
        <span
          className="absolute inset-0 grid place-items-center px-3 text-center font-semibold leading-tight tracking-[-0.02em]"
          style={{ fontSize: Math.max(15, Math.min(30, h * 0.24)), color: bg === 'light' ? '#0b0d1f' : 'var(--ink)' }}
        >
          {s.name}
        </span>
      )}
    </div>
  );
}
