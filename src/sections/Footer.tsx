import { Link, useLocation, useNavigate } from 'react-router-dom';
import { site } from '../config/site';
import { useSite } from '../lib/store';
import { scrollToId } from '../hooks/useSmoothScroll';
import { Mark } from '../components/Nav';

export default function Footer() {
  const { brand, contactEmail, sponsorEmail } = useSite();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const go = (id: string) => (pathname === '/' ? scrollToId(id) : navigate(`/#${id}`));

  return (
    <footer className="relative overflow-hidden border-t border-line pt-16">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[70%] bg-[radial-gradient(60%_70%_at_50%_100%,color-mix(in_oklab,var(--accent2)_28%,transparent),transparent_70%)]" aria-hidden />
      <div className="wrap relative">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <div className="flex items-center gap-3">
              <Mark size={34} />
              <p className="text-[22px] font-medium tracking-[-0.02em]">{site.seriesName}</p>
            </div>
            <p className="mt-3 max-w-[38ch] text-[15px] text-muted">{site.location}. One real industry problem, every edition.</p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:col-span-7">
            <div>
              <p className="eyebrow">Contact</p>
              <ul className="mt-4 space-y-2 text-[15px]">
                <li>
                  <a className="link-draw break-all" href={`mailto:${contactEmail}`}>
                    {contactEmail}
                  </a>
                </li>
                <li>
                  <a className="link-draw break-all" href={`mailto:${sponsorEmail}`}>
                    {sponsorEmail}
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="eyebrow">Follow</p>
              <ul className="mt-4 space-y-2 text-[15px]">
                {site.socials.map((s) => (
                  <li key={s.label}>
                    <a className="link-draw" href={s.href} target="_blank" rel="noreferrer">
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="eyebrow">Event</p>
              <ul className="mt-4 space-y-2 text-[15px]">
                <li>
                  <button className="link-draw" onClick={() => go('register')}>
                    Register
                  </button>
                </li>
                <li>
                  <button className="link-draw" onClick={() => go('faq')}>
                    FAQ
                  </button>
                </li>
                <li>
                  <Link className="link-draw text-muted" to="/admin">
                    Organiser login
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="wrap relative mt-16" aria-hidden>
        <p className="select-none whitespace-nowrap text-center text-[clamp(64px,17.5vw,300px)] font-semibold leading-[0.8] tracking-[-0.06em] text-transparent [-webkit-text-stroke:1px_color-mix(in_oklab,var(--ink)_22%,transparent)]">
          {brand}
        </p>
      </div>
      <div className="wrap relative flex flex-col gap-2 border-t border-line py-6 text-[13px] text-muted sm:flex-row sm:justify-between">
        <span>
          © {new Date().getFullYear()} {site.company}. All rights reserved.
        </span>
        <span>Made in Kathmandu</span>
      </div>
    </footer>
  );
}
