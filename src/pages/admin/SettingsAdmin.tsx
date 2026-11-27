import { useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { applyTheme, parseTheme, type Theme } from '../../config/theme';
import AppearanceAdmin, { ThemePreview, type SavedPalette } from './AppearanceAdmin';
import { site } from '../../config/site';
import { useSite } from '../../lib/store';
import { ErrorLine, F, Panel, shrinkImage, uploadFile } from './kit';
import { Logo } from '../../components/Nav';
import { CURVE_PRESETS } from '../../components/CurvedGallery';

const keys = ['logoUrl', 'galleryStyle', 'brand', 'headline', 'tagline', 'contactEmail', 'sponsorEmail'] as const;

export default function SettingsAdmin() {
  const { settings, reload } = useSite();
  const [v, setV] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [theme, setTheme] = useState<Theme>(() => parseTheme(settings, site.palette));
  const [saved, setSaved] = useState<SavedPalette[]>([]);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setTheme(parseTheme(settings, site.palette));
    try {
      setSaved(settings.savedPalettes ? JSON.parse(settings.savedPalettes) : []);
    } catch {
      setSaved([]);
    }
    setDirty(false);
  }, [settings]);

  // leaving this tab without saving puts the published look back
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  useEffect(() => () => applyTheme(parseTheme(settingsRef.current, site.palette)), []);

  useEffect(() => {
    setV({
      logoUrl: settings.logoUrl ?? '',
      galleryStyle: settings.galleryStyle ?? 'classic',
      brand: settings.brand ?? site.brand,
      headline: settings.headline ?? site.headline,
      tagline: settings.tagline ?? site.tagline,
      contactEmail: settings.contactEmail ?? site.contactEmail,
      sponsorEmail: settings.sponsorEmail ?? site.sponsorEmail,
    });
  }, [settings]);

  const save = async () => {
    setMsg(null);
    setOk(false);
    const rows = [
      ...keys.map((k) => ({ key: k, value: v[k] ?? '' })),
      { key: 'theme', value: JSON.stringify(theme) },
      { key: 'palette', value: theme.base }, // kept for older versions of the site
      { key: 'savedPalettes', value: JSON.stringify(saved) },
    ];
    const { error } = await supabase!.from('settings').upsert(rows);
    if (error) return setMsg(error.message);
    setOk(true);
    setDirty(false);
    reload();
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="lg:col-span-2">
        <h2 className="mb-1 text-[22px] font-semibold tracking-[-0.02em]">Appearance</h2>
        <p className="mb-5 text-[14px] text-muted">Colours, fonts and corners for the whole site. {dirty ? 'You have unsaved changes.' : ''}</p>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <AppearanceAdmin
            theme={theme}
            onChange={(t) => {
              setTheme(t);
              setDirty(true);
            }}
            saved={saved}
            onSaved={(l) => {
              setSaved(l);
              setDirty(true);
            }}
          />
          <div className="sticky top-24 self-start">
            <ThemePreview />
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className="btn btn-ghost h-10 px-4 text-[13px]"
                onClick={() => {
                  setTheme(parseTheme(settings, site.palette));
                  setDirty(false);
                }}
                disabled={!dirty}
              >
                Undo changes
              </button>
              <button
                type="button"
                className="btn btn-ghost h-10 px-4 text-[13px]"
                onClick={() => {
                  setTheme({ base: site.palette, font: 'grotesk', radius: 'medium' });
                  setDirty(true);
                }}
              >
                Reset to default look
              </button>
            </div>
          </div>
        </div>
      </div>

      <Panel title="Gallery">
        <div>
          <F label="Default perspective (visitors can still switch)">
            <select className="field" value={v.galleryStyle ?? 'classic'} onChange={(e) => setV({ ...v, galleryStyle: e.target.value })}>
              {CURVE_PRESETS.map((p, i) => (
                <option key={p.id} value={p.id}>
                  {String(i + 1).padStart(2, '0')} · {p.label}
                </option>
              ))}
            </select>
          </F>
        </div>
      </Panel>

      <Panel title="Brand & contact">
        <div className="grid grid-cols-1 gap-4">
          <div className="flex items-center justify-between gap-4 rounded-xl border border-line bg-bg/50 p-4">
            <Logo brand={v.brand || site.brand} src={v.logoUrl ?? ''} />
            <div className="flex shrink-0 gap-2">
              <label className="btn btn-ghost h-10 cursor-pointer px-4 text-[13px]">
                Upload logo mark
                <input
                  type="file"
                  accept="image/png,image/svg+xml,image/webp"
                  className="sr-only"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    try {
                      const url = await uploadFile(await shrinkImage(f, 256), 'brand');
                      setV((old) => ({ ...old, logoUrl: url }));
                    } catch (x) {
                      setMsg((x as Error).message);
                    }
                  }}
                />
              </label>
              {v.logoUrl && (
                <button type="button" className="btn btn-ghost h-10 px-4 text-[13px]" onClick={() => setV((old) => ({ ...old, logoUrl: '' }))}>
                  Use built-in mark
                </button>
              )}
            </div>
          </div>
          <p className="-mt-2 text-[13px] text-muted">The built-in “B” mark follows your colours. Upload a square PNG or SVG (transparent background) to use your own file instead; save to publish.</p>
          <F label="Brand name (“BlinkBuzz” shows as BLINK BUZZ in brand colours)">
            <input className="field" value={v.brand ?? ''} maxLength={20} onChange={(e) => setV({ ...v, brand: e.target.value })} />
          </F>
          <F label="Hero headline (the last two words get the gradient)">
            <input className="field" value={v.headline ?? ''} maxLength={60} onChange={(e) => setV({ ...v, headline: e.target.value })} />
          </F>
          <F label="Tagline">
            <textarea className="field" rows={2} value={v.tagline ?? ''} onChange={(e) => setV({ ...v, tagline: e.target.value })} />
          </F>
          <F label="Contact email">
            <input className="field" type="email" value={v.contactEmail ?? ''} onChange={(e) => setV({ ...v, contactEmail: e.target.value })} />
          </F>
          <F label="Sponsor email">
            <input className="field" type="email" value={v.sponsorEmail ?? ''} onChange={(e) => setV({ ...v, sponsorEmail: e.target.value })} />
          </F>
        </div>
      </Panel>

      <div className="glass sticky bottom-4 z-20 flex items-center justify-end gap-4 rounded-2xl p-3 lg:col-span-2">
        <ErrorLine msg={msg} />
        {dirty && !ok && <span className="text-[14px] text-muted">Unsaved appearance changes</span>}
        {ok && !dirty && <span className="text-[14px] text-accent">Saved. Live for every visitor.</span>}
        <button className="btn btn-primary" onClick={save}>
          Save settings
        </button>
      </div>
    </div>
  );
}
