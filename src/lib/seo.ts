import { useEffect } from 'react';

/** Public address of the site; used for canonical links, share cards and structured data. */
export const SITE_URL = ((import.meta.env.VITE_SITE_URL as string | undefined) || 'https://www.blinkbuzz.com.np').replace(/\/$/, '');
export const OG_IMAGE = `${SITE_URL}/og-image.png`;

type Seo = {
  title: string;
  description: string;
  path: string; // e.g. "/" or "/edition/edition-01"
  image?: string;
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | null; // page-specific structured data
};

function meta(attr: 'name' | 'property', key: string, value: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = value;
}

function link(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
}

/** Keeps the page title, description, canonical URL, share cards and robots tag in sync with the route. */
export function useSeo({ title, description, path, image = OG_IMAGE, noindex, jsonLd }: Seo) {
  const ld = jsonLd ? JSON.stringify(jsonLd) : '';
  useEffect(() => {
    const url = SITE_URL + (path === '/' ? '/' : path);
    document.title = title;
    meta('name', 'description', description);
    meta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large');
    link('canonical', url);
    meta('property', 'og:title', title);
    meta('property', 'og:description', description);
    meta('property', 'og:url', url);
    meta('property', 'og:image', image);
    meta('name', 'twitter:title', title);
    meta('name', 'twitter:description', description);
    meta('name', 'twitter:image', image);

    let script: HTMLScriptElement | null = null;
    if (ld) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      script.dataset.page = 'true';
      script.textContent = ld;
      document.head.appendChild(script);
    }
    return () => script?.remove();
  }, [title, description, path, image, noindex, ld]);
}
