// Swappable colour palettes. Add one here, then pick it in
// src/config/site.ts (default) or Admin → Settings (live, no redeploy).
export type Palette = {
  id: string;
  label: string;
  bg: string; // page ground
  bg2: string; // deeper nebula tone used by 3D backgrounds
  surface: string; // solid panels
  glass: string; // frosted panel fill (rgba)
  line: string; // hairlines and borders
  ink: string; // main text
  muted: string; // secondary text
  accent: string; // primary glow: links, focus, neurons
  accent2: string; // second glow: gradients, light
  hot: string; // the loud one: main button, current edition
  accentInk: string; // text on top of the button gradient
  scheme: 'dark' | 'light';
};

export const palettes: Record<string, Palette> = {
  'neural-night': {
    id: 'neural-night',
    label: 'Neural night (cyan · violet · magenta)',
    bg: '#06071a',
    bg2: '#0c0a2e',
    surface: '#0e1030',
    glass: 'rgba(148, 163, 255, 0.07)',
    line: 'rgba(160, 170, 255, 0.16)',
    ink: '#eef1ff',
    muted: '#9aa0c8',
    accent: '#22e4ff',
    accent2: '#8b5cff',
    hot: '#ff3df2',
    accentInk: '#ffffff',
    scheme: 'dark',
  },
  'aurora-teal': {
    id: 'aurora-teal',
    label: 'Aurora (teal · blue · lime)',
    bg: '#04121a',
    bg2: '#072433',
    surface: '#0a1e2a',
    glass: 'rgba(120, 230, 255, 0.07)',
    line: 'rgba(120, 220, 255, 0.16)',
    ink: '#e9fbff',
    muted: '#8fb3bf',
    accent: '#2af5d2',
    accent2: '#2f7bff',
    hot: '#c6ff3d',
    accentInk: '#04121a',
    scheme: 'dark',
  },
  'solar-flare': {
    id: 'solar-flare',
    label: 'Solar flare (orange · pink · gold)',
    bg: '#120610',
    bg2: '#2a0a22',
    surface: '#1d0b19',
    glass: 'rgba(255, 160, 200, 0.07)',
    line: 'rgba(255, 170, 210, 0.16)',
    ink: '#fff1f6',
    muted: '#c59aae',
    accent: '#ff8a3d',
    accent2: '#ff2e7e',
    hot: '#ffd23d',
    accentInk: '#1a0610',
    scheme: 'dark',
  },
};

export const DEFAULT_PALETTE = 'neural-night';

export function applyPalette(id: string) {
  const p = palettes[id] ?? palettes[DEFAULT_PALETTE];
  const root = document.documentElement;
  const set = (k: string, v: string) => root.style.setProperty(k, v);
  set('--bg', p.bg);
  set('--bg2', p.bg2);
  set('--surface', p.surface);
  set('--glass', p.glass);
  set('--line', p.line);
  set('--ink', p.ink);
  set('--muted', p.muted);
  set('--accent', p.accent);
  set('--accent2', p.accent2);
  set('--hot', p.hot);
  set('--accent-ink', p.accentInk);
  root.style.colorScheme = p.scheme;
  root.dataset.palette = p.id;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', p.bg);
  window.dispatchEvent(new CustomEvent('palette-change', { detail: p }));
  return p;
}

export function currentPalette(): Palette {
  const id = document.documentElement.dataset.palette ?? DEFAULT_PALETTE;
  return palettes[id] ?? palettes[DEFAULT_PALETTE];
}
