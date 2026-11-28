import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { getEditions, getFaqs, getMedia, getSettings, getSponsors, getTracks } from './data';
import type { Edition, Faq, Media, Settings, Sponsor, Track } from './types';
import { site } from '../config/site';
import { applyTheme, parseTheme } from '../config/theme';

type SiteData = {
  loading: boolean;
  error: string | null;
  editions: Edition[];
  current: Edition | null;
  sponsors: Sponsor[];
  media: Media[];
  faqs: Faq[];
  tracks: Track[];
  settings: Settings;
  brand: string;
  headline: string;
  tagline: string;
  contactEmail: string;
  sponsorEmail: string;
  logoUrl: string;
  reload: () => Promise<void>;
};

const Ctx = createContext<SiteData | null>(null);

// Stale-while-revalidate: the last data we saw is kept in localStorage, so a returning
// visitor sees the full page instantly while fresh data loads quietly in the background.
const CACHE_KEY = 'bb-data-v1';
type Snapshot = Pick<SiteData, 'editions' | 'sponsors' | 'media' | 'faqs' | 'tracks' | 'settings'>;
function readCache(): Snapshot | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as Snapshot & { v?: number };
    return Array.isArray(v.editions) ? v : null;
  } catch {
    return null;
  }
}
function writeCache(s: Snapshot) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(s));
  } catch {
    /* storage full or private mode */
  }
}

export function SiteDataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Omit<SiteData, 'reload' | 'brand' | 'headline' | 'tagline' | 'contactEmail' | 'sponsorEmail' | 'logoUrl' | 'current'>>(() => {
    const cached = readCache();
    return cached
      ? { loading: false, error: null, ...cached }
      : { loading: true, error: null, editions: [], sponsors: [], media: [], faqs: [], tracks: [], settings: {} };
  });

  const load = useCallback(async () => {
    try {
      const [editions, sponsors, media, faqs, tracks, settings] = await Promise.all([
        getEditions(),
        getSponsors(),
        getMedia(),
        getFaqs(),
        getTracks(),
        getSettings(),
      ]);
      const theme = parseTheme(settings, site.palette);
      applyTheme(theme);
      try {
        localStorage.setItem('bb-theme', JSON.stringify(theme)); // next visit starts in the right colours
      } catch {
        /* private mode */
      }
      setState({ loading: false, error: null, editions, sponsors, media, faqs, tracks, settings });
      writeCache({ editions, sponsors, media, faqs, tracks, settings });
    } catch (e) {
      // keep showing cached data if we have it; only report the error on an empty page
      setState((s) => {
        if (!s.editions.length) applyTheme(parseTheme({}, site.palette));
        return { ...s, loading: false, error: s.editions.length ? null : (e as Error).message };
      });
    }
  }, []);

  useEffect(() => {
    let cached: string | undefined;
    try {
      cached = localStorage.getItem('bb-theme') ?? undefined;
    } catch {
      /* private mode */
    }
    applyTheme(parseTheme({ theme: cached }, site.palette));
    load();
  }, [load]);

  const current =
    state.editions.find((e) => e.is_current) ??
    state.editions.find((e) => e.status !== 'completed' && e.status !== 'planned') ??
    state.editions[0] ??
    null;

  const value: SiteData = {
    ...state,
    current,
    brand: state.settings.brand || site.brand,
    headline: state.settings.headline || site.headline,
    tagline: state.settings.tagline || site.tagline,
    contactEmail: state.settings.contactEmail || site.contactEmail,
    sponsorEmail: state.settings.sponsorEmail || site.sponsorEmail,
    logoUrl: state.settings.logoUrl || '',
    reload: load,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSite() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useSite outside provider');
  return v;
}
