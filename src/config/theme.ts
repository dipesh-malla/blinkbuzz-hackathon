// The look of the site, set from Admin → Settings → Appearance and stored in the
// `settings` table under the key "theme" (JSON). Everything here is applied at
// runtime through CSS variables, so a change goes live without a redeploy.
//
//   colours  – start from a ready-made palette, mix in another, override any colour
//   fonts    – a built-in pairing or any Google Font by name
//   radius   – sharp / medium / round corners
import { DEFAULT_PALETTE, palettes, setActivePalette, type Palette } from './palettes';

// ── Colours ────────────────────────────────────────────────────────────────
export const COLOR_KEYS = ['bg', 'bg2', 'surface', 'ink', 'muted', 'accent', 'accent2', 'hot', 'accentInk', 'border'] as const;
export type ColorKey = (typeof COLOR_KEYS)[number];
export type ThemeColors = Record<ColorKey, string>;

export const COLOR_INFO: Record<ColorKey, { label: string; hint: string; group: 'base' | 'text' | 'accent' }> = {
  bg: { label: 'Background', hint: 'The page itself', group: 'base' },
  bg2: { label: 'Deep background', hint: 'Nebula behind the 3D scenes', group: 'base' },
  surface: { label: 'Cards & panels', hint: 'Solid boxes, menus, forms', group: 'base' },
  border: { label: 'Borders', hint: 'Hairlines around cards', group: 'base' },
  ink: { label: 'Main text', hint: 'Headings and body', group: 'text' },
  muted: { label: 'Soft text', hint: 'Descriptions, captions', group: 'text' },
  accent: { label: 'Accent 1', hint: 'Links, focus, brain neurons', group: 'accent' },
  accent2: { label: 'Accent 2', hint: 'Gradients and light', group: 'accent' },
  hot: { label: 'Highlight', hint: 'Main button, current edition', group: 'accent' },
  accentInk: { label: 'Text on buttons', hint: 'Text on the main button', group: 'accent' },
};

export type Radius = 'sharp' | 'medium' | 'round';

export type Theme = {
  base: string; // starting palette id
  mixAccents?: string; // optional: take the accent colours from another palette
  colors?: Partial<ThemeColors>; // individual overrides (hex)
  borderAlpha?: number; // 0.06–0.4
  font: string; // FONT_PRESETS id or 'custom'
  heading?: string; // Google Font family for 'custom'
  body?: string;
  radius: Radius;
};

export const DEFAULT_THEME: Theme = { base: DEFAULT_PALETTE, font: 'grotesk', radius: 'medium' };

// ── tiny colour helpers ───────────────────────────────────────────────────
export function toHex(c: string): string {
  if (c.startsWith('#')) return c.length === 4 ? '#' + [...c.slice(1)].map((x) => x + x).join('') : c.slice(0, 7);
  const m = c.match(/rgba?\(([^)]+)\)/);
  if (!m) return '#000000';
  const [r, g, b] = m[1].split(',').map((x) => parseFloat(x));
  return '#' + [r, g, b].map((x) => Math.round(x).toString(16).padStart(2, '0')).join('');
}
export function alphaOf(c: string): number {
  const m = c.match(/rgba\([^)]*,\s*([\d.]+)\)/);
  return m ? parseFloat(m[1]) : 1;
}
export function rgba(hex: string, a: number) {
  const h = toHex(hex);
  const n = parseInt(h.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}
function lum(hex: string) {
  const n = parseInt(toHex(hex).slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}
/** WCAG contrast ratio between two colours (1–21). */
export function contrast(a: string, b: string) {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

/** The colours a palette starts with, in the editable shape. */
export function paletteColors(p: Palette): ThemeColors {
  return {
    bg: p.bg,
    bg2: p.bg2,
    surface: p.surface,
    ink: p.ink,
    muted: p.muted,
    accent: p.accent,
    accent2: p.accent2,
    hot: p.hot,
    accentInk: p.accentInk,
    border: toHex(p.line),
  };
}

/** Base palette → mixed accents → individual overrides. */
export function resolveColors(t: Theme): { colors: ThemeColors; borderAlpha: number } {
  const base = palettes[t.base] ?? palettes[DEFAULT_PALETTE];
  const out = paletteColors(base);
  const mix = t.mixAccents ? palettes[t.mixAccents] : null;
  if (mix) {
    out.accent = mix.accent;
    out.accent2 = mix.accent2;
    out.hot = mix.hot;
    out.accentInk = mix.accentInk;
  }
  for (const k of COLOR_KEYS) {
    const v = t.colors?.[k];
    if (v && /^#[0-9a-f]{6}$/i.test(v)) out[k] = v;
  }
  return { colors: out, borderAlpha: t.borderAlpha ?? alphaOf(base.line) };
}

export function resolvePalette(t: Theme): Palette {
  const base = palettes[t.base] ?? palettes[DEFAULT_PALETTE];
  const { colors: c, borderAlpha } = resolveColors(t);
  return {
    ...base,
    id: t.colors || t.mixAccents ? 'custom' : base.id,
    bg: c.bg,
    bg2: c.bg2,
    surface: c.surface,
    ink: c.ink,
    muted: c.muted,
    accent: c.accent,
    accent2: c.accent2,
    hot: c.hot,
    accentInk: c.accentInk,
    line: rgba(c.border, borderAlpha),
    glass: rgba(c.border, Math.max(0.04, borderAlpha * 0.45)),
    scheme: lum(c.bg) > 0.4 ? 'light' : 'dark',
  };
}

// ── Fonts ─────────────────────────────────────────────────────────────────
export type FontPreset = { id: string; label: string; note: string; heading: string; body: string; load?: () => Promise<unknown> };

export const FONT_PRESETS: FontPreset[] = [
  {
    id: 'grotesk',
    label: 'Space Grotesk + DM Sans',
    note: 'Default. Techy headings, very readable text.',
    heading: 'Space Grotesk Variable',
    body: 'DM Sans Variable',
    // loaded up front in index.css
  },
  {
    id: 'friendly',
    label: 'Outfit + Work Sans',
    note: 'Rounder and friendlier.',
    heading: 'Outfit Variable',
    body: 'Work Sans Variable',
    load: () => Promise.all([import('@fontsource-variable/outfit'), import('@fontsource-variable/work-sans')]),
  },
  {
    id: 'scifi',
    label: 'Exo 2 + DM Sans',
    note: 'Stronger sci-fi feel in the headings.',
    heading: 'Exo 2 Variable',
    body: 'DM Sans Variable',
    load: () => import('@fontsource-variable/exo-2'),
  },
  {
    id: 'original',
    label: 'Instrument Sans',
    note: 'The first version of the site.',
    heading: 'Instrument Sans Variable',
    body: 'Instrument Sans Variable',
    load: () => import('@fontsource-variable/instrument-sans'),
  },
];

/** Suggestions for the custom font boxes (any Google Font name works). */
export const GOOGLE_FONT_IDEAS = [
  'Inter',
  'Manrope',
  'Sora',
  'Syne',
  'Unbounded',
  'Plus Jakarta Sans',
  'Urbanist',
  'Lexend',
  'Poppins',
  'Montserrat',
  'Rubik',
  'Chakra Petch',
  'Orbitron',
  'Bricolage Grotesque',
  'Figtree',
  'Onest',
  'IBM Plex Sans',
  'Archivo',
  'Red Hat Display',
  'Mukta',
];

const loaded = new Set<string>();
/** Loads a Google Font by family name (tries weights 300–700, falls back to the default weight). */
export function loadGoogleFont(family: string): Promise<void> {
  const name = family.trim();
  if (!name || loaded.has(name) || typeof document === 'undefined') return Promise.resolve();
  loaded.add(name);
  const enc = encodeURIComponent(name).replace(/%20/g, '+');
  return new Promise((resolve) => {
    const add = (href: string, onError?: () => void) => {
      const l = document.createElement('link');
      l.rel = 'stylesheet';
      l.href = href;
      l.dataset.font = name;
      l.onload = () => resolve();
      l.onerror = () => (onError ? onError() : resolve());
      document.head.appendChild(l);
    };
    add(`https://fonts.googleapis.com/css2?family=${enc}:wght@300;400;500;600;700&display=swap`, () => add(`https://fonts.googleapis.com/css2?family=${enc}&display=swap`));
  });
}

const stack = (f: string) => `'${f.replace(/'/g, '')}', ui-sans-serif, system-ui, sans-serif`;

export function themeFonts(t: Theme): { heading: string; body: string } {
  if (t.font === 'custom') {
    const def = FONT_PRESETS[0];
    return { heading: t.heading?.trim() || def.heading, body: t.body?.trim() || def.body };
  }
  const p = FONT_PRESETS.find((x) => x.id === t.font) ?? FONT_PRESETS[0];
  return { heading: p.heading, body: p.body };
}

// ── Apply ─────────────────────────────────────────────────────────────────
const RADIUS: Record<Radius, { k: string; btn: string }> = {
  sharp: { k: '0.32', btn: '10px' },
  medium: { k: '1', btn: '999px' },
  round: { k: '1.3', btn: '999px' },
};

export function applyTheme(t: Theme) {
  const root = document.documentElement;
  setActivePalette(resolvePalette(t));

  const { heading, body } = themeFonts(t);
  if (t.font === 'custom') {
    const isPreset = (f: string) => FONT_PRESETS.some((p) => p.heading === f || p.body === f);
    if (!isPreset(heading)) loadGoogleFont(heading);
    if (!isPreset(body)) loadGoogleFont(body);
  } else {
    FONT_PRESETS.find((p) => p.id === t.font)?.load?.();
  }
  root.style.setProperty('--font-heading', stack(heading));
  root.style.setProperty('--font-body', stack(body));

  const r = RADIUS[t.radius] ?? RADIUS.medium;
  root.style.setProperty('--rk', r.k);
  root.style.setProperty('--btn-r', r.btn);
}

/** Reads the stored theme (falls back to the older single "palette" setting). */
export function parseTheme(settings: { theme?: string; palette?: string }, fallbackPalette: string): Theme {
  let t: Partial<Theme> = {};
  try {
    if (settings.theme) t = JSON.parse(settings.theme);
  } catch {
    /* ignore a broken value */
  }
  return {
    ...DEFAULT_THEME,
    base: settings.palette && !settings.theme ? settings.palette : fallbackPalette,
    ...t,
  };
}
