import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { getEditions, getFaqs, getMedia, getSettings, getSponsors, getTracks } from './data';
import type { Edition, Faq, Media, Settings, Sponsor, Track } from './types';
import { site } from '../config/site';
import { applyPalette } from '../config/palettes';

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
  reload: () => Promise<void>;
};

const Ctx = createContext<SiteData | null>(null);

export function SiteDataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Omit<SiteData, 'reload' | 'brand' | 'headline' | 'tagline' | 'contactEmail' | 'sponsorEmail' | 'current'>>({
    loading: true,
    error: null,
    editions: [],
    sponsors: [],
    media: [],
    faqs: [],
    tracks: [],
    settings: {},
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
      applyPalette(settings.palette ?? site.palette);
      setState({ loading: false, error: null, editions, sponsors, media, faqs, tracks, settings });
    } catch (e) {
      applyPalette(site.palette);
      setState((s) => ({ ...s, loading: false, error: (e as Error).message }));
    }
  }, []);

  useEffect(() => {
    applyPalette(site.palette);
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
    reload: load,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSite() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useSite outside provider');
  return v;
}
