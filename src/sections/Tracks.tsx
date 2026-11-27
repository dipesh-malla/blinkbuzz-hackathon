import { Section } from '../components/ui';
import TrackViz from '../components/TrackViz';
import { useSite } from '../lib/store';

/** Column spans so every row is filled on tablet (2 cols) and desktop (4 cols), whatever the number of tracks. */
function spans(n: number, i: number): string {
  if (i === 0) return n === 1 ? 'sm:col-span-2 lg:col-span-4' : n === 2 ? 'sm:col-span-2 lg:col-span-2' : 'sm:col-span-2 lg:col-span-2 lg:row-span-2';
  const out: string[] = [];
  // tablet: big card takes the first row, the rest go two by two; a lone last card stretches
  if ((n - 1) % 2 === 1 && i === n - 1) out.push('sm:col-span-2');
  // desktop
  if (n === 2 || n === 3) out.push('lg:col-span-2');
  else if (n === 4) out.push(i === 1 ? 'lg:col-span-2' : 'lg:col-span-1');
  else {
    const after = n - 5; // cards beyond the 2x2 block
    const k = i - 5; // index among them (negative = inside the block)
    const r = after % 4;
    if (k >= 0 && r && k >= after - r) out.push(r === 1 ? 'lg:col-span-4' : r === 2 ? 'lg:col-span-2' : k === after - 1 ? 'lg:col-span-2' : 'lg:col-span-1');
    else out.push('lg:col-span-1');
  }
  return out.join(' ');
}

const words = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight'];

export default function Tracks() {
  const { tracks } = useSite();
  if (!tracks.length) return null;
  const count = words[tracks.length] ?? String(tracks.length);

  return (
    <Section id="tracks" tag="Tracks">
      <div className="grid grid-cols-1 items-end gap-6 lg:grid-cols-12">
        <h2 data-reveal className="h-section lg:col-span-7">
          {count} fields. <span className="grad-text">One brain.</span>
        </h2>
        <p data-reveal className="max-w-[46ch] text-[16px] text-muted lg:col-span-5 lg:justify-self-end">
          Each edition brings its problem from one industry. These are the fields we build in; every one lights its own part of the brain above.
        </p>
      </div>

      <div className="mt-14 grid grid-flow-row-dense grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tracks.map((t, i) => {
          const big = i === 0;
          const solo = tracks.length === 1;
          return (
            <article
              key={t.id}
              data-reveal={i % 4}
              className={`glass card-lift group relative flex flex-col overflow-hidden rounded-[26px] p-6 md:p-7 ${spans(tracks.length, i)} ${solo ? 'lg:grid lg:grid-cols-2 lg:gap-10' : ''}`}
              style={{ ['--t' as string]: t.color }}
            >
              <span
                className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-25 blur-3xl transition-opacity duration-500 group-hover:opacity-45"
                style={{ background: t.color }}
                aria-hidden
              />
              <div className="relative flex flex-col">
                <div className="relative flex items-start justify-between gap-4">
                  <div>
                    <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-muted">Track {String(i + 1).padStart(2, '0')}</span>
                    <h3
                      className={`mt-2 font-medium tracking-[-0.03em] ${big ? 'text-[clamp(34px,3.6vw,52px)]' : 'text-[26px]'}`}
                      style={{
                        color: t.color,
                        textShadow: `0 0 30px ${t.color}55`,
                      }}
                    >
                      {t.name}
                    </h3>
                  </div>
                  <span
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line text-ink/70 transition-colors group-hover:border-[var(--t)] group-hover:text-ink ${solo ? 'lg:hidden' : ''}`}
                    aria-hidden
                  >
                    <svg viewBox="0 0 16 16" width="12" height="12">
                      <path d="M5 11L11 5M6 5h5v5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </div>
                <p className={`relative mt-3 text-muted ${big ? 'max-w-[40ch] text-[17px]' : 'text-[15px]'}`}>{t.blurb}</p>
              </div>
              <div className={`relative mt-auto pt-6 ${solo ? 'min-h-[260px] lg:mt-0 lg:pt-0' : big ? 'min-h-[200px] flex-1' : 'h-[120px]'}`}>
                <TrackViz visual={t.visual} color={t.color} />
              </div>
            </article>
          );
        })}
      </div>
    </Section>
  );
}
