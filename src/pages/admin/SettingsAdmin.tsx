import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { palettes, applyPalette } from '../../config/palettes';
import { site } from '../../config/site';
import { useSite } from '../../lib/store';
import { ErrorLine, F, Panel } from './kit';
import { CURVE_PRESETS } from '../../components/CurvedGallery';

const keys = ['palette', 'galleryStyle', 'brand', 'headline', 'tagline', 'contactEmail', 'sponsorEmail'] as const;

export default function SettingsAdmin() {
  const { settings, reload } = useSite();
  const [v, setV] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    setV({
      palette: settings.palette ?? site.palette,
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
    const rows = keys.map((k) => ({ key: k, value: v[k] ?? '' }));
    const { error } = await supabase!.from('settings').upsert(rows);
    if (error) return setMsg(error.message);
    setOk(true);
    reload();
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Panel title="Colour palette">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Object.values(palettes).map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setV({ ...v, palette: p.id });
                applyPalette(p.id); // live preview
              }}
              className={`rounded-xl border p-3 text-left transition-colors ${v.palette === p.id ? 'border-accent' : 'border-line hover:border-ink'}`}
            >
              <div className="flex h-12 overflow-hidden rounded-lg">
                {[p.bg, p.accent, p.accent2, p.hot].map((c) => (
                  <span key={c} className="flex-1" style={{ background: c }} />
                ))}
              </div>
              <p className="mt-2 text-[14px]">{p.label}</p>
            </button>
          ))}
        </div>
        <p className="mt-3 text-[13px] text-muted">Click to preview. Save to publish it for every visitor. New palettes are added in src/config/palettes.ts.</p>
        <div className="mt-6 border-t border-line pt-5">
          <F label="Gallery: default perspective (visitors can still switch)">
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
          <F label="Brand name">
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

      <div className="flex items-center justify-end gap-4 lg:col-span-2">
        <ErrorLine msg={msg} />
        {ok && <span className="text-[14px] text-accent">Saved. Live for every visitor.</span>}
        <button className="btn btn-primary" onClick={save}>
          Save settings
        </button>
      </div>
    </div>
  );
}
