// Runs after `vite build`. GitHub Pages only knows real files, so a deep link like
// /edition/edition-01 would otherwise be served by 404.html with a 404 status, and
// search engines skip 404 pages. This script:
//   1. writes dist/edition/<slug>/index.html for every edition (real 200 pages, each
//      with its own title, description, canonical link and share card),
//   2. writes dist/sitemap.xml,
//   3. writes dist/404.html (app fallback, marked noindex).
// Editions come from Supabase when the keys are set (as in the GitHub Action), else the demo list.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const SITE = (process.env.VITE_SITE_URL || 'https://www.blinkbuzz.com.np').replace(/\/$/, '');
const base = (process.env.VITE_BASE || '/').replace(/\/?$/, '/');
const html = readFileSync('dist/index.html', 'utf8');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

let editions = [
  { slug: 'edition-01', title: 'Edition 01', venue: 'TechSpire College, Kathmandu', audience: 'High school students, any stream', status: 'upcoming' },
  { slug: 'edition-02', title: 'Edition 02', venue: null, audience: 'To be announced', status: 'planned' },
  { slug: 'edition-03', title: 'Edition 03', venue: null, audience: 'To be announced', status: 'planned' },
];
const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;
if (url && key) {
  try {
    const r = await fetch(`${url}/rest/v1/editions?select=slug,title,industry,venue,audience,starts_at,status&order=number`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(15000),
    });
    if (r.ok) {
      const rows = await r.json();
      if (Array.isArray(rows) && rows.length) editions = rows;
    } else console.warn(`seo-build: editions request failed (${r.status}), using the demo list`);
  } catch (e) {
    console.warn('seo-build: could not reach Supabase, using the demo list:', e.message);
  }
}

/** Replace the head tags that differ per page. */
function page({ title, description, path, robots = 'index, follow, max-image-preview:large' }) {
  const href = SITE + path;
  return html
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/(<meta\s+name="description"\s+content=")[^"]*(")/, `$1${esc(description)}$2`)
    .replace(/(<meta name="robots" content=")[^"]*(")/, `$1${robots}$2`)
    .replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${href}$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${href}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${esc(title)}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${esc(description)}$2`)
    .replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${esc(title)}$2`)
    .replace(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${esc(description)}$2`);
}

const today = new Date().toISOString().slice(0, 10);
const urls = [{ loc: `${SITE}/`, priority: '1.0', changefreq: 'weekly' }];

for (const e of editions) {
  if (!e.slug || !/^[a-z0-9-]+$/i.test(e.slug)) continue;
  const name = `${e.title}${e.industry ? ` · ${e.industry}` : ''}`;
  const when = e.starts_at ? `, ${new Date(e.starts_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}` : '';
  const who = e.audience && !/^to be announced$/i.test(e.audience) ? ` For ${e.audience.charAt(0).toLowerCase()}${e.audience.slice(1)}.` : '';
  const tba = !e.venue && !e.starts_at ? ' Date and venue to be announced.' : !e.starts_at ? ' Date to be announced.' : '';
  const description = `BlinkBuzz Hackathon ${name}${e.venue ? ` at ${e.venue}` : ''}${when}.${who}${tba} One real industry problem, one day to build the answer.`;
  const path = `/edition/${e.slug}/`; // GitHub Pages serves folders with a trailing slash
  mkdirSync(`dist/edition/${e.slug}`, { recursive: true });
  writeFileSync(`dist/edition/${e.slug}/index.html`, page({ title: `${name} | BlinkBuzz Hackathon Nepal`, description, path }));
  urls.push({ loc: SITE + path, priority: e.status === 'planned' ? '0.5' : '0.8', changefreq: 'weekly' });
}

writeFileSync(
  'dist/sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `  <url><loc>${u.loc}</loc><lastmod>${today}</lastmod><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`)
    .join('\n')}\n</urlset>\n`,
);

writeFileSync('dist/404.html', page({ title: 'Page not found | BlinkBuzz Hackathon', description: 'This page does not exist.', path: '/404', robots: 'noindex, nofollow' }));

console.log(`seo-build: ${urls.length} URLs in sitemap.xml (base ${base})`);
