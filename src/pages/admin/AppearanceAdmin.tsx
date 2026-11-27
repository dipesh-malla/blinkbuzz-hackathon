import { useEffect, useMemo, useRef, useState } from 'react';
import { palettes } from '../../config/palettes';
import {
  COLOR_INFO,
  COLOR_KEYS,
  DEFAULT_THEME,
  FONT_PRESETS,
  GOOGLE_FONT_IDEAS,
  applyTheme,
  contrast,
  loadGoogleFont,
  resolveColors,
  type ColorKey,
  type Radius,
  type Theme,
  type ThemeColors,
} from '../../config/theme';
import { Panel } from './kit';

export type SavedPalette = { name: string; colors: ThemeColors; borderAlpha: number };

const groups: { id: 'base' | 'text' | 'accent'; title: string }[] = [
  { id: 'base', title: 'Backgrounds' },
  { id: 'text', title: 'Text' },
  { id: 'accent', title: 'Accents & buttons' },
];

/** Contrast checks shown next to the colours (WCAG: 4.5 for text, 3 for large text and shapes). */
function checks(c: ThemeColors) {
  const out: { level: 'bad' | 'warn'; text: string }[] = [];
  const t = contrast(c.ink, c.bg);
  if (t < 4.5) out.push({ level: 'bad', text: `Main text on the background is hard to read (${t.toFixed(1)}:1, needs 4.5).` });
  const m = contrast(c.muted, c.bg);
  if (m < 4.5) out.push({ level: m < 3 ? 'bad' : 'warn', text: `Soft text on the background is faint (${m.toFixed(1)}:1, aim for 4.5).` });
  const s = contrast(c.ink, c.surface);
  if (s < 4.5) out.push({ level: 'bad', text: `Text on cards is hard to read (${s.toFixed(1)}:1).` });
  const b = Math.min(contrast(c.accentInk, c.hot), contrast(c.accentInk, c.accent2));
  if (b < 3) out.push({ level: 'warn', text: `Text on the main button is low contrast (${b.toFixed(1)}:1). Try white or a dark colour.` });
  const a = contrast(c.accent, c.bg);
  if (a < 3) out.push({ level: 'warn', text: `Accent 1 blends into the background (${a.toFixed(1)}:1); links and focus rings may be hard to see.` });
  return out;
}

function Swatch({ k, value, overridden, onChange, onReset }: { k: ColorKey; value: string; overridden: boolean; onChange: (v: string) => void; onReset: () => void }) {
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  const info = COLOR_INFO[k];
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-bg/40 p-2.5">
      <label className="relative h-10 w-10 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-line" style={{ background: value }} title={`Pick ${info.label}`}>
        <input type="color" className="absolute inset-0 h-full w-full cursor-pointer opacity-0" value={value} onChange={(e) => onChange(e.target.value)} aria-label={info.label} />
      </label>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-medium">{info.label}</p>
        <p className="truncate text-[12px] text-muted">{info.hint}</p>
      </div>
      <input
        className="field h-9 w-[92px] px-2 font-mono text-[13px] uppercase"
        value={text}
        maxLength={7}
        onChange={(e) => {
          const v = e.target.value.startsWith('#') ? e.target.value : `#${e.target.value}`;
          setText(v);
          if (/^#[0-9a-f]{6}$/i.test(v)) onChange(v.toLowerCase());
        }}
        aria-label={`${info.label} hex`}
      />
      <button
        type="button"
        onClick={onReset}
        disabled={!overridden}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted hover:text-ink disabled:opacity-0"
        title="Back to the palette colour"
        aria-label={`Reset ${info.label}`}
      >
        ↺
      </button>
    </div>
  );
}

export default function AppearanceAdmin({
  theme,
  onChange,
  saved,
  onSaved,
}: {
  theme: Theme;
  onChange: (t: Theme) => void;
  saved: SavedPalette[];
  onSaved: (list: SavedPalette[]) => void;
}) {
  const { colors, borderAlpha } = useMemo(() => resolveColors(theme), [theme]);
  const warnings = useMemo(() => checks(colors), [colors]);
  const [name, setName] = useState('');
  const [fontsReady, setFontsReady] = useState(0);
  const set = (patch: Partial<Theme>) => onChange({ ...theme, ...patch });

  // live preview on the whole admin page
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // load every built-in font once so the samples render in their own face
  useEffect(() => {
    Promise.all(FONT_PRESETS.map((p) => p.load?.())).then(() => setFontsReady((n) => n + 1));
  }, []);

  // custom Google fonts: load as the admin types (debounced)
  const timer = useRef(0);
  useEffect(() => {
    if (theme.font !== 'custom') return;
    clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      Promise.all([theme.heading, theme.body].filter(Boolean).map((f) => loadGoogleFont(f!))).then(() => setFontsReady((n) => n + 1));
    }, 500);
  }, [theme.font, theme.heading, theme.body]);

  const setColor = (k: ColorKey, v: string) => set({ colors: { ...theme.colors, [k]: v } });
  const resetColor = (k: ColorKey) => {
    const next = { ...theme.colors };
    delete next[k];
    set({ colors: next });
  };

  const savePalette = () => {
    const n = name.trim() || `My palette ${saved.length + 1}`;
    onSaved([...saved.filter((s) => s.name !== n), { name: n, colors, borderAlpha }]);
    setName('');
  };

  return (
    <div className="space-y-6">
      <Panel title="Colours">
        <p className="-mt-2 mb-4 text-[14px] text-muted">
          1 · Start from a palette. 2 · Optionally borrow another palette’s accents. 3 · Fine-tune any single colour. Changes preview live on this page; press Save settings to publish.
        </p>

        <p className="label">Start from</p>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {Object.values(palettes).map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => set({ base: p.id, colors: {}, mixAccents: undefined, borderAlpha: undefined })}
              className={`rounded-xl border p-2.5 text-left transition-colors ${theme.base === p.id && !Object.keys(theme.colors ?? {}).length && !theme.mixAccents ? 'border-accent' : 'border-line hover:border-ink/50'}`}
            >
              <div className="flex h-10 overflow-hidden rounded-lg">
                {[p.bg, p.surface, p.accent, p.accent2, p.hot].map((c, i) => (
                  <span key={i} className="flex-1" style={{ background: c }} />
                ))}
              </div>
              <p className="mt-2 truncate text-[13px]">{p.label}</p>
            </button>
          ))}
          {saved.map((s) => (
            <div key={s.name} className="group relative">
              <button
                type="button"
                onClick={() => set({ colors: { ...s.colors }, borderAlpha: s.borderAlpha, mixAccents: undefined })}
                className="w-full rounded-xl border border-dashed border-line p-2.5 text-left hover:border-ink/50"
              >
                <div className="flex h-10 overflow-hidden rounded-lg">
                  {[s.colors.bg, s.colors.surface, s.colors.accent, s.colors.accent2, s.colors.hot].map((c, i) => (
                    <span key={i} className="flex-1" style={{ background: c }} />
                  ))}
                </div>
                <p className="mt-2 truncate text-[13px]">★ {s.name}</p>
              </button>
              <button
                type="button"
                className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-bg/80 text-[12px] text-muted opacity-0 hover:text-ink group-hover:opacity-100"
                onClick={() => confirm(`Delete the saved palette “${s.name}”?`) && onSaved(saved.filter((x) => x.name !== s.name))}
                aria-label={`Delete ${s.name}`}
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="label">Borrow accent colours from</span>
            <select className="field" value={theme.mixAccents ?? ''} onChange={(e) => set({ mixAccents: e.target.value || undefined })}>
              <option value="">Keep this palette’s accents</option>
              {Object.values(palettes)
                .filter((p) => p.id !== theme.base)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
            </select>
          </label>
          <label className="block">
            <span className="label">Border strength · {Math.round(borderAlpha * 100)}%</span>
            <input type="range" min={6} max={40} value={Math.round(borderAlpha * 100)} onChange={(e) => set({ borderAlpha: +e.target.value / 100 })} className="mt-3 w-full accent-[var(--accent)]" />
          </label>
        </div>

        <div className="mt-6 space-y-5">
          {groups.map((g) => (
            <div key={g.id}>
              <p className="label">{g.title}</p>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {COLOR_KEYS.filter((k) => COLOR_INFO[k].group === g.id).map((k) => (
                  <Swatch key={k} k={k} value={colors[k]} overridden={!!theme.colors?.[k]} onChange={(v) => setColor(k, v)} onReset={() => resetColor(k)} />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 space-y-2" aria-live="polite">
          {warnings.length ? (
            warnings.map((w) => (
              <p key={w.text} className={`rounded-lg px-3 py-2 text-[13px] ${w.level === 'bad' ? 'bg-[#ff5c7a]/12 text-[#ff8da2]' : 'bg-[#ffcf5a]/10 text-[#ffd77a]'}`}>
                {w.level === 'bad' ? '✕' : '!'} {w.text}
              </p>
            ))
          ) : (
            <p className="rounded-lg bg-[#3dffa8]/10 px-3 py-2 text-[13px] text-[#7dffc2]">✓ All text passes the readability check.</p>
          )}
        </div>

        <div className="mt-5 flex flex-col gap-2 border-t border-line pt-5 sm:flex-row">
          <input className="field h-11" placeholder="Name this combination, e.g. Edition 02 night" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} />
          <button type="button" className="btn btn-ghost h-11 shrink-0 px-5 text-[14px]" onClick={savePalette}>
            Save as my palette
          </button>
        </div>
      </Panel>

      <Panel title="Fonts">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2" data-ready={fontsReady}>
          {FONT_PRESETS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => set({ font: f.id })}
              className={`rounded-xl border p-4 text-left transition-colors ${theme.font === f.id ? 'border-accent' : 'border-line hover:border-ink/50'}`}
            >
              <p className="text-[26px] font-semibold leading-tight tracking-[-0.03em]" style={{ fontFamily: `'${f.heading}'` }}>
                Next ideas get wired
              </p>
              <p className="mt-1.5 text-[14px] text-muted" style={{ fontFamily: `'${f.body}'` }}>
                Teams of 2–4 build answers to one real problem.
              </p>
              <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.08em] text-muted">
                {f.label}
                {f.id === DEFAULT_THEME.font ? ' · default' : ''}
              </p>
            </button>
          ))}
          <div className={`rounded-xl border p-4 md:col-span-2 ${theme.font === 'custom' ? 'border-accent' : 'border-line'}`}>
            <label className="flex items-center gap-2 text-[14px] font-medium">
              <input type="radio" checked={theme.font === 'custom'} onChange={() => set({ font: 'custom', heading: theme.heading || 'Sora', body: theme.body || 'Inter' })} />
              Choose any Google Font
            </label>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="label">Headings</span>
                <input className="field" list="gfonts" placeholder="e.g. Sora" value={theme.heading ?? ''} onChange={(e) => set({ font: 'custom', heading: e.target.value })} />
              </label>
              <label className="block">
                <span className="label">Body text</span>
                <input className="field" list="gfonts" placeholder="e.g. Inter" value={theme.body ?? ''} onChange={(e) => set({ font: 'custom', body: e.target.value })} />
              </label>
              <datalist id="gfonts">
                {GOOGLE_FONT_IDEAS.map((f) => (
                  <option key={f} value={f} />
                ))}
              </datalist>
            </div>
            {theme.font === 'custom' && (
              <div className="mt-4 rounded-lg bg-bg/50 p-4">
                <p className="text-[28px] font-semibold leading-tight tracking-[-0.03em]" style={{ fontFamily: `'${theme.heading}', sans-serif` }}>
                  Where Nepal’s next ideas get wired.
                </p>
                <p className="mt-2 text-[15px] text-muted" style={{ fontFamily: `'${theme.body}', sans-serif` }}>
                  Type the exact name from fonts.google.com. If the sample doesn’t change, check the spelling.
                </p>
              </div>
            )}
          </div>
        </div>
      </Panel>

      <Panel title="Corners">
        <div className="grid grid-cols-3 gap-3">
          {(
            [
              ['sharp', 'Sharp', 6],
              ['medium', 'Medium', 18],
              ['round', 'Round', 26],
            ] as [Radius, string, number][]
          ).map(([id, label, r]) => (
            <button
              key={id}
              type="button"
              onClick={() => set({ radius: id })}
              className={`rounded-xl border p-3 text-left transition-colors ${theme.radius === id ? 'border-accent' : 'border-line hover:border-ink/50'}`}
            >
              <div className="h-14 border border-line bg-surface" style={{ borderRadius: r }} />
              <div className="mt-2 h-7 w-20 bg-[var(--hot)]/80" style={{ borderRadius: id === 'sharp' ? 6 : 999 }} />
              <p className="mt-2 text-[13px]">{label}</p>
            </button>
          ))}
        </div>
      </Panel>
    </div>
  );
}

/** A small live sample of the site's parts in the current theme. */
export function ThemePreview() {
  return (
    <div className="space-y-4">
      <p className="label">Live preview</p>
      <div className="relative overflow-hidden rounded-[calc(26px*var(--rk))] border border-line bg-bg p-6">
        <span className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full opacity-40 blur-3xl" style={{ background: 'var(--accent2)' }} />
        <p className="tag relative">Sponsors &amp; partners</p>
        <h3 className="relative mt-3 text-[34px] font-semibold leading-[1.02] tracking-[-0.035em]" style={{ fontFamily: 'var(--font-heading)' }}>
          Next ideas get <span className="grad-text">wired.</span>
        </h3>
        <p className="lead relative mt-3 text-[15px]">Each edition is shaped by one industry partner and carried by its sponsors.</p>
        <div className="relative mt-5 flex flex-wrap gap-3">
          <span className="btn btn-primary h-11 px-5 text-[14px]">Register your team</span>
          <span className="btn btn-ghost h-11 px-5 text-[14px]">How it works</span>
        </div>
        <div className="glass relative mt-6 rounded-[calc(22px*var(--rk))] p-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted">Track 01</p>
          <p className="mt-1 text-[24px] font-semibold tracking-[-0.02em] text-accent" style={{ fontFamily: 'var(--font-heading)' }}>
            AI
          </p>
          <p className="body-sm mt-1">Build things that think.</p>
          <input className="field mt-4 h-11" placeholder="Team name" readOnly />
        </div>
      </div>
    </div>
  );
}
