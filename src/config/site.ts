// ─────────────────────────────────────────────────────────────
//  Site-wide defaults. Anything also editable in Admin → Settings
//  overrides these at runtime.
// ─────────────────────────────────────────────────────────────
export const site = {
  brand: 'BlinkBuzz',
  company: 'BlinkBuzz',
  seriesName: 'BlinkBuzz Hackathon',
  headline: 'Where Nepal’s next ideas get wired.',
  tagline:
    'A hackathon series by BlinkBuzz. Every edition, one real industry brings one real problem, and students spend the day building answers to it.',
  palette: 'neural-night',
  contactEmail: 'hello@blinkbuzz.example',
  sponsorEmail: 'partners@blinkbuzz.example',
  location: 'Kathmandu, Nepal',
  socials: [
    { label: 'Instagram', href: 'https://instagram.com/' },
    { label: 'Facebook', href: 'https://facebook.com/' },
    { label: 'LinkedIn', href: 'https://linkedin.com/' },
  ],
};

export type SiteSettings = typeof site;
