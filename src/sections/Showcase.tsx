import { Link } from 'react-router-dom';
import { Section } from '../components/ui';
import { useSite } from '../lib/store';

/** Winning projects from past editions. Hidden until an edition has winners. */
export default function Showcase() {
  const { editions, tracks } = useSite();
  const items = editions.flatMap((e) => e.winners.map((w, i) => ({ e, w, i })));
  if (!items.length) return null;

  return (
    <Section id="showcase" tag="Winning projects">
      <h2 data-reveal className="h-section">
        Answers that <span className="grad-text">won the room.</span>
      </h2>
      <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.slice(0, 9).map(({ e, w, i }, k) => {
          const color = tracks[k % Math.max(1, tracks.length)]?.color ?? 'var(--accent)';
          return (
            <Link
              key={`${e.id}-${i}`}
              to={`/edition/${e.slug}`}
              data-reveal={k % 3}
              className="glass card-lift group relative flex min-h-[260px] flex-col justify-between overflow-hidden rounded-[26px] p-6"
            >
              <span className="pointer-events-none absolute -bottom-20 -right-20 h-56 w-56 rounded-full opacity-25 blur-3xl transition-opacity group-hover:opacity-45" style={{ background: color }} aria-hidden />
              <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.06em]">
                <span style={{ color }}>{w.place}</span>
                <span className="text-muted">
                  {e.title}
                  {e.industry ? ` · ${e.industry}` : ''}
                </span>
              </div>
              <div className="relative">
                <p className="text-[26px] font-medium leading-tight tracking-[-0.025em]">{w.project}</p>
                <p className="mt-2 text-[15px] text-muted">by {w.team}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </Section>
  );
}
