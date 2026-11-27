import { useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import Nav from '../components/Nav';
import Footer from '../sections/Footer';
import DecryptedText from '../components/reactbits/DecryptedText';
import { Arrow, Fact, Section, useReveal } from '../components/ui';
import { useSite } from '../lib/store';
import { feeLabel, formatDate, teamLabel } from '../lib/data';
import { FlipGallery, VideoGrid } from '../sections/Gallery';
import { SponsorTiers } from '../sections/Sponsors';
import { prefersReducedMotion, useSmoothScroll } from '../hooks/useSmoothScroll';

const statusText = { planned: 'Planned', upcoming: 'Next up', live: 'Live now', completed: 'Completed' } as const;

export default function EditionPage() {
  useSmoothScroll();
  const { slug } = useParams();
  const { editions, media, sponsors, loading } = useSite();
  const head = useReveal<HTMLDivElement>();
  const line = useRef<HTMLSpanElement>(null);
  const list = useRef<HTMLOListElement>(null);
  const e = editions.find((x) => x.slug === slug);

  useGSAP(
    () => {
      if (!line.current || !list.current || prefersReducedMotion()) return;
      gsap.fromTo(line.current, { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: list.current, start: 'top 75%', end: 'bottom 55%', scrub: 0.5 } });
    },
    { dependencies: [e?.id, loading] },
  );

  if (loading) return <div className="grid min-h-svh place-items-center text-muted">Loading…</div>;
  if (!e)
    return (
      <>
        <Nav />
        <div className="wrap grid min-h-svh place-items-center text-center">
          <div>
            <p className="h-section">No edition here.</p>
            <Link to="/#orbit" className="btn btn-ghost mt-8">
              See all editions
            </Link>
          </div>
        </div>
      </>
    );

  const photos = media.filter((m) => m.edition_id === e.id && m.kind === 'image');
  const videos = media.filter((m) => m.edition_id === e.id && m.kind === 'video');
  const sp = sponsors.filter((s) => s.edition_id === e.id);
  const num = String(e.number).padStart(2, '0');
  const planned = e.status === 'planned';
  const dates = e.starts_at ? `${formatDate(e.starts_at)}${e.ends_at && e.ends_at !== e.starts_at ? ` – ${formatDate(e.ends_at)}` : ''}` : 'To be announced';

  return (
    <>
      <Nav />
      <main className="relative">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[90svh] bg-[radial-gradient(60%_60%_at_75%_20%,color-mix(in_oklab,var(--accent2)_30%,transparent),transparent_70%),radial-gradient(40%_40%_at_15%_10%,color-mix(in_oklab,var(--accent)_16%,transparent),transparent_70%)]" aria-hidden />
        <div ref={head} className="wrap relative pb-16 pt-[calc(var(--nav-h)+48px)]">
          <Link data-reveal to="/#orbit" className="link-draw font-mono text-[12px] uppercase tracking-[0.06em] text-muted">
            ← All editions
          </Link>
          <div className="mt-10 grid grid-cols-1 gap-12 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <div data-reveal className="flex items-center gap-3">
                <span className="glass rounded-full px-3 py-1 font-mono text-[11px] uppercase tracking-[0.06em]" style={{ color: planned ? 'var(--muted)' : 'var(--accent)' }}>
                  {statusText[e.status]}
                </span>
                {e.registration_open && <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-hot">Registration open</span>}
              </div>
              <span data-reveal className={`mt-6 block text-[clamp(120px,17vw,250px)] font-medium leading-[0.8] tracking-[-0.07em] tabular-nums ${planned ? 'text-muted/50' : 'grad-text'}`}>
                {num}
              </span>
              <h1 data-reveal className="h-section mt-8">
                {e.title}
                {e.industry ? <span className="text-muted"> · {e.industry}</span> : null}
              </h1>
              <div data-reveal className="mt-5 max-w-[58ch] text-[17px] text-muted">
                {e.problem ? (
                  <p className="whitespace-pre-line text-ink">{e.problem}</p>
                ) : planned ? (
                  <p>This edition is planned. Its industry, audience and dates are announced once the partner is confirmed.</p>
                ) : (
                  <p>
                    The industry and the problem stay sealed until reveal day:{' '}
                    <DecryptedText text="every team sees it at once" animateOn="inViewHover" sequential speed={40} className="font-mono text-[15px] text-ink" encryptedClassName="font-mono text-[15px] text-accent" />
                    .
                  </p>
                )}
              </div>
              {e.registration_open && (
                <Link data-reveal to="/#register" className="btn btn-primary mt-9">
                  Register your team <Arrow />
                </Link>
              )}
            </div>
            <div data-reveal className="glass self-end rounded-[28px] bg-bg/40 px-6 py-3 lg:col-span-5">
              <dl>
                <Fact k="Who can join" v={e.audience} />
                <Fact k="Venue" v={e.venue ?? 'To be announced'} />
                <Fact k="Dates" v={dates} />
                <Fact k="Team size" v={teamLabel(e.team_min, e.team_max)} />
                <Fact k="Entry" v={feeLabel(e.fee_npr)} />
                <div className="flex items-baseline justify-between gap-6 py-3.5">
                  <dt className="text-[14px] text-muted">Registration</dt>
                  <dd className="text-right text-[15px] font-medium">{e.registration_open ? (e.registration_closes ? `Open until ${formatDate(e.registration_closes)}` : 'Open') : 'Closed'}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {!planned && (
          <Section id="schedule" tag="How this edition runs">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
              <ol ref={list} className="relative lg:col-span-7">
                <span className="absolute bottom-3 left-[7px] top-3 w-px bg-line" aria-hidden />
                <span ref={line} className="absolute bottom-3 left-[7px] top-3 w-px origin-top bg-[linear-gradient(180deg,var(--accent),var(--accent2),var(--hot))]" aria-hidden />
                {(e.timeline.length ? e.timeline : [{ date: 'TBA', label: 'Timeline announced soon' }]).map((t, i) => (
                  <li key={i} data-reveal={i} className="relative pb-10 pl-10 last:pb-0">
                    <span className="absolute left-0 top-1.5 h-[15px] w-[15px] rounded-full border border-accent bg-bg" aria-hidden>
                      <span className="absolute inset-[4px] rounded-full bg-accent shadow-[0_0_10px_var(--accent)]" />
                    </span>
                    <span className="font-mono text-[12px] uppercase tracking-[0.06em] text-muted">
                      Step {i + 1} · {t.date && t.date !== 'TBA' ? formatDate(t.date, t.date) : 'Date soon'}
                    </span>
                    <p className="mt-1 text-[22px] font-medium tracking-[-0.015em]">{t.label}</p>
                  </li>
                ))}
              </ol>
              <div data-reveal className="glass h-fit rounded-[26px] p-6 lg:col-span-5">
                <h3 className="eyebrow">Prizes</h3>
                {e.prizes.length ? (
                  <ul className="mt-4 divide-y divide-line">
                    {e.prizes.map((p) => (
                      <li key={p.place} className="flex items-baseline justify-between gap-4 py-3">
                        <span className="text-[15px] text-muted">{p.place}</span>
                        <span className="text-right text-[18px] font-medium">{p.reward}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-[15px] text-muted">Prizes are announced together with the industry partner.</p>
                )}
              </div>
            </div>
          </Section>
        )}

        {e.winners.length > 0 && (
          <Section id="winners" tag="Winners">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {e.winners.map((w, i) => (
                <div key={i} data-reveal={i} className="glass rounded-[24px] p-6">
                  <p className="font-mono text-[12px] uppercase tracking-[0.06em] text-accent">{w.place}</p>
                  <p className="mt-10 text-[24px] font-medium tracking-[-0.02em]">{w.project}</p>
                  <p className="mt-1 text-muted">by {w.team}</p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {(photos.length > 0 || videos.length > 0) && (
          <Section id="photos" tag="Photos and films">
            <div className="space-y-12">
              {photos.length > 0 && <FlipGallery images={photos} />}
              <VideoGrid videos={videos} />
            </div>
          </Section>
        )}

        {sp.length > 0 && (
          <Section id="edition-sponsors" tag="Sponsors of this edition">
            <SponsorTiers sponsors={sp} />
          </Section>
        )}
      </main>
      <Footer />
    </>
  );
}
