import { useEffect, useState } from 'react';
import type { Edition } from '../lib/types';

/** Start of an edition as a real moment in time (dates are entered in Nepal time, UTC+05:45). */
export function editionStart(e: Pick<Edition, 'starts_at' | 'start_time'> | null): number | null {
  if (!e?.starts_at) return null;
  const time = (e.start_time || '09:00').slice(0, 5);
  const t = Date.parse(`${e.starts_at}T${time}:00+05:45`);
  return Number.isNaN(t) ? null : t;
}
export function editionEnd(e: Pick<Edition, 'starts_at' | 'ends_at'> | null): number | null {
  const d = e?.ends_at || e?.starts_at;
  if (!d) return null;
  const t = Date.parse(`${d}T23:59:59+05:45`);
  return Number.isNaN(t) ? null : t;
}

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * "Hackathon begins in" with days, hours, minutes, seconds.
 * Renders nothing until a start date is set; switches to "Happening now" during the event
 * and disappears after it. Only the seconds tick, so it costs almost nothing.
 */
export default function Countdown({ edition, className = '' }: { edition: Edition; className?: string }) {
  const start = editionStart(edition);
  const end = editionEnd(edition);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!start) return;
    // tick on the second boundary so all four numbers change together
    let id = 0;
    const tick = () => {
      setNow(Date.now());
      id = window.setTimeout(tick, 1000 - (Date.now() % 1000) + 5);
    };
    id = window.setTimeout(tick, 1000 - (Date.now() % 1000) + 5);
    return () => clearTimeout(id);
  }, [start]);

  if (!start || edition.show_countdown === false) return null;
  if (end && now > end) return null;

  if (now >= start) {
    return (
      <div className={`inline-flex items-center gap-3 rounded-2xl border border-hot/50 bg-hot/10 px-4 py-3 ${className}`} role="status">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-hot opacity-70" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-hot" />
        </span>
        <span className="font-mono text-[12.5px] uppercase tracking-[0.12em] text-ink">{edition.title} is happening now</span>
      </div>
    );
  }

  const s = Math.max(0, Math.floor((start - now) / 1000));
  const parts: [number, string][] = [
    [Math.floor(s / 86400), 'Days'],
    [Math.floor((s % 86400) / 3600), 'Hours'],
    [Math.floor((s % 3600) / 60), 'Minutes'],
    [s % 60, 'Seconds'],
  ];
  const label = `${edition.title} begins in ${parts.map(([v, l]) => `${v} ${l.toLowerCase()}`).join(', ')}`;

  return (
    <div className={className} role="timer" aria-label={label}>
      <p className="flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.14em] text-ink/80">
        <svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
          <circle cx="8" cy="8" r="6.3" />
          <path d="M8 4.6V8l2.3 1.5" />
        </svg>
        Hackathon begins in
      </p>
      <div className="mt-3 grid max-w-[440px] grid-cols-4 gap-2 sm:gap-3" aria-hidden>
        {parts.map(([v, l], i) => (
          <div key={l} className="cd-box rounded-[calc(16px*var(--rk))] border border-line px-1 py-2.5 text-center sm:py-3">
            <span className={`block text-[clamp(24px,2.6vw,36px)] font-semibold leading-none tabular-nums tracking-[-0.02em] ${i === 3 ? 'text-accent' : 'text-ink'}`} style={{ fontFamily: 'var(--font-heading)' }}>
              {i === 0 ? v : pad(v)}
            </span>
            <span className="mt-1.5 block font-mono text-[10.5px] uppercase tracking-[0.12em] text-muted sm:text-[11px]">{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
