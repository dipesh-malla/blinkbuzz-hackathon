import { lazy, Suspense, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Arrow, Section } from '../components/ui';
import { useSite } from '../lib/store';
import { hasWebGL, useInView, useMediaQuery, usePalette } from '../hooks/usePalette';
import type { Edition } from '../lib/types';

const OrbitSystem = lazy(() => import('../components/three/OrbitSystem'));

const statusText: Record<Edition['status'], string> = {
  planned: 'Planned',
  upcoming: 'Next up',
  live: 'Live now',
  completed: 'Completed',
};

export default function Editions() {
  const { editions } = useSite();
  const palette = usePalette();
  const navigate = useNavigate();
  const stage = useRef<HTMLDivElement>(null);
  const inView = useInView(stage);
  const mobile = useMediaQuery('(max-width: 767px)');
  const [gl] = useState(hasWebGL);
  const [active, setActive] = useState<string | null>(null);

  const open = (e: Edition) => navigate(`/edition/${e.slug}`);
  const done = editions.filter((e) => e.status === 'completed').length;

  return (
    <Section id="orbit" tag="Every edition">
      <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <h2 data-reveal className="h-section">
            Every edition
            <br />
            adds a planet.
          </h2>
          <p data-reveal className="mt-5 max-w-[42ch] text-[17px] text-muted">
            The glowing planet is the next edition. Outlined ones are planned. Open any of them for its venue, dates, problem,
            winners and photos.
          </p>

          <ul data-reveal className="mt-10 border-t border-line" onMouseLeave={() => setActive(null)}>
            {editions.map((e) => {
              const isActive = active === e.id;
              const hot = e.status === 'upcoming' || e.status === 'live';
              return (
                <li key={e.id} className="border-b border-line">
                  <button
                    onClick={() => open(e)}
                    onMouseEnter={() => setActive(e.id)}
                    onFocus={() => setActive(e.id)}
                    onBlur={() => setActive(null)}
                    className="focus-ring group grid w-full grid-cols-[48px_1fr_auto] items-center gap-4 py-4 text-left"
                  >
                    <span className={`font-mono text-[14px] ${hot ? 'text-accent' : 'text-muted'}`}>{String(e.number).padStart(2, '0')}</span>
                    <span className="min-w-0">
                      <span className="block truncate text-[18px] font-medium tracking-[-0.01em]">
                        {e.industry ? `${e.title} · ${e.industry}` : e.title}
                      </span>
                      <span className="block truncate text-[14px] text-muted">
                        {statusText[e.status]}
                        {e.venue ? ` · ${e.venue}` : ''}
                      </span>
                    </span>
                    <Arrow className={`transition-transform duration-300 ${isActive ? 'translate-x-1 text-accent' : 'text-muted'}`} />
                  </button>
                </li>
              );
            })}
          </ul>
          <p data-reveal className="mt-4 font-mono text-[12px] uppercase tracking-[0.08em] text-muted">
            {editions.length} editions on the map · {done} completed
          </p>
        </div>

        <div
          ref={stage}
          data-reveal
          className="glass relative order-first aspect-square w-full overflow-hidden rounded-[28px] bg-[radial-gradient(70%_60%_at_50%_45%,color-mix(in_oklab,var(--accent2)_22%,transparent),transparent_75%)] lg:order-none lg:col-span-7"
        >
          {gl ? (
            <Suspense fallback={null}>
              <OrbitSystem
                palette={palette}
                mode="editions"
                editions={editions}
                active={active}
                onHover={setActive}
                onSelect={open}
                running={inView}
                lowPower={mobile}
              />
            </Suspense>
          ) : (
            <div className="grid h-full place-items-center text-muted">Open an edition from the list.</div>
          )}
          <span className="pointer-events-none absolute bottom-4 left-5 font-mono text-[11px] uppercase tracking-[0.08em] text-muted">
            {mobile ? 'Tap a planet' : 'Hover a planet · click to open'}
          </span>
        </div>
      </div>
    </Section>
  );
}
