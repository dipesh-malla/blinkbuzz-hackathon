import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { scrollToId, stopScroll } from '../hooks/useSmoothScroll';
import { useSite } from '../lib/store';

const links = [
  { id: 'how', label: 'How it works' },
  { id: 'tracks', label: 'Tracks' },
  { id: 'orbit', label: 'Editions' },
  { id: 'gallery', label: 'Gallery' },
  { id: 'sponsors', label: 'Sponsors' },
  { id: 'faq', label: 'FAQ' },
];

/**
 * BlinkBuzz mark: the brand "B" (a bowl over a ring) with the orange spark in its eye.
 * Colours follow the theme: the letterform uses the main text colour, the spark the accent.
 * If an admin uploads a logo file (Settings → Brand), that image is used instead.
 */
export function Mark({ size = 30, src }: { size?: number; src?: string }) {
  const site = useSite();
  const logoUrl = src ?? site.logoUrl;
  if (logoUrl) return <img src={logoUrl} alt="" width={size} height={size} className="object-contain" style={{ width: size, height: size }} />;
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} fill="none" aria-hidden>
      <rect x="6.6" y="2" width="4.8" height="16" fill="var(--ink)" />
      <path d="M9 4.4 H14.4 C18.3 4.4 20.6 6.8 20.6 9.7 C20.6 12.6 18.6 14.8 15.6 14.8" stroke="var(--ink)" strokeWidth="4.8" />
      <circle cx="16" cy="21.8" r="7" stroke="var(--ink)" strokeWidth="4.8" />
      <circle cx="16" cy="21.8" r="2.2" fill="var(--accent)" />
    </svg>
  );
}

/** "BLINK BUZZ" in the brand colours; any other brand name is set plainly. */
export function Wordmark({ brand, className = '' }: { brand: string; className?: string }) {
  const m = brand.trim().match(/^(blink)\s*(buzz)$/i);
  if (!m)
    return <span className={`text-[18px] font-semibold tracking-[-0.025em] ${className}`}>{brand}</span>;
  return (
    <span style={{ fontFamily: "var(--font-heading)" }} className={`text-[19px] font-bold uppercase leading-none tracking-[0.01em] ${className}`}>
      <span className="text-accent">Blink</span> <span>Buzz</span>
    </span>
  );
}

export function Logo({ brand, src }: { brand: string; src?: string }) {
  return (
    <span className="flex items-center gap-2.5">
      <Mark src={src} />
      <Wordmark brand={brand} />
    </span>
  );
}

export default function Nav() {
  const { brand, current } = useSite();
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const onHome = pathname === '/';

  useEffect(() => {
    const on = () => setSolid(window.scrollY > 24);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  useEffect(() => {
    stopScroll(open);
    document.body.style.overflow = open ? 'hidden' : '';
  }, [open]);

  const go = (id: string) => {
    setOpen(false);
    if (onHome) scrollToId(id);
    else navigate(`/#${id}`);
  };

  const regOpen = current?.registration_open;

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div
        className={`absolute inset-0 transition-[background-color,border-color,backdrop-filter] duration-300 ${
          solid || open ? 'border-b border-line bg-[color-mix(in_oklab,var(--bg)_94%,transparent)]' : 'border-b border-transparent'
        }`}
        aria-hidden
      />
      <nav className="wrap relative flex h-[var(--nav-h)] items-center justify-between gap-6" aria-label="Main">
        <Link to="/" className="focus-ring rounded-md" onClick={() => setOpen(false)} aria-label={`${brand} home`}>
          <Logo brand={brand} />
        </Link>

        <ul className="hidden items-center gap-7 xl:flex">
          {links.map((l) => (
            <li key={l.id}>
              <button onClick={() => go(l.id)} className="link-draw focus-ring text-[14px] text-ink/80 transition-colors hover:text-ink">
                {l.label}
              </button>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          <button onClick={() => go('register')} className="btn btn-ghost hidden h-11 px-5 text-[14px] sm:inline-flex">
            {regOpen ? 'Register' : 'Get notified'}
            <span className="grid h-6 w-6 place-items-center rounded-full bg-ink/10" aria-hidden>
              <svg viewBox="0 0 16 16" width="11" height="11">
                <path d="M5 11L11 5M6 5h5v5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </button>
          <button
            className="focus-ring grid h-11 w-11 place-items-center rounded-full border border-line bg-ink/5 xl:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            <span className="relative block h-3 w-4">
              <span className={`absolute left-0 h-px w-4 bg-ink transition-all duration-300 ${open ? 'top-1.5 rotate-45' : 'top-0'}`} />
              <span className={`absolute left-0 h-px w-4 bg-ink transition-all duration-300 ${open ? 'top-1.5 -rotate-45' : 'top-3'}`} />
            </span>
          </button>
        </div>
      </nav>

      <div
        id="mobile-menu"
        className={`fixed inset-x-0 bottom-0 top-[var(--nav-h)] bg-bg transition-[opacity,visibility] duration-300 xl:hidden ${
          open ? 'visible opacity-100' : 'invisible opacity-0'
        }`}
      >
        <ul className="wrap flex flex-col pt-4">
          {links.map((l, i) => (
            <li key={l.id} className="border-b border-line">
              <button onClick={() => go(l.id)} className="flex w-full items-baseline justify-between py-5 text-left text-[26px] font-medium tracking-[-0.02em]">
                {l.label}
                <span className="eyebrow">0{i + 1}</span>
              </button>
            </li>
          ))}
          <li className="pt-8">
            <button onClick={() => go('register')} className="btn btn-primary w-full">
              {regOpen ? 'Register your team' : 'Get notified'}
            </button>
          </li>
        </ul>
      </div>
    </header>
  );
}
