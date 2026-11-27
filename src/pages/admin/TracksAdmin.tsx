import { useState } from 'react';
import type { Track, TrackVisual } from '../../lib/types';
import TrackViz from '../../components/TrackViz';
import { deleteRow, ErrorLine, F, Panel, saveRow, useTable } from './kit';

const visuals: { id: TrackVisual; label: string }[] = [
  { id: 'neural', label: 'Neural network' },
  { id: 'candles', label: 'Market candles' },
  { id: 'pulse', label: 'Heartbeat' },
  { id: 'arm', label: 'Robot arm' },
  { id: 'chain', label: 'Linked blocks' },
  { id: 'orbit', label: 'Orbit' },
  { id: 'idea', label: 'Idea → business (bulb to growth)' },
  { id: 'rocket', label: 'Startup launch (rocket)' },
  { id: 'leaf', label: 'Agri / sustainability (sprout)' },
  { id: 'shield', label: 'Cybersecurity (shield & lock)' },
  { id: 'cloud', label: 'Cloud & data (syncing)' },
  { id: 'book', label: 'EdTech (book & cap)' },
  { id: 'cart', label: 'E-commerce (cart & parcels)' },
  { id: 'globe', label: 'Travel / global (globe & plane)' },
  { id: 'bolt', label: 'Energy (bolt & battery)' },
  { id: 'people', label: 'Social impact (people network)' },
];

export default function TracksAdmin() {
  const { rows, refresh, error } = useTable<Track>('tracks');
  const [edit, setEdit] = useState<Partial<Track> | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const save = async () => {
    if (!edit?.name) return setMsg('Name is required.');
    try {
      await saveRow('tracks', edit);
      setEdit(null);
      refresh();
    } catch (e) {
      setMsg((e as Error).message);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Panel
        title="Tracks (light up the hero brain)"
        action={
          <button
            className="btn btn-primary h-10 px-4 text-[14px]"
            disabled={rows.length >= 6}
            onClick={() => setEdit({ name: '', blurb: '', color: '#22e4ff', visual: 'neural', sort: rows.length + 1 })}
          >
            Add track
          </button>
        }
      >
        <p className="mb-4 text-[13px] text-muted">Up to 6. Order decides which part of the brain each one lights: 1 front, 2 crown, 3 sides, 4 back, 5 upper sides, 6 base.</p>
        <ErrorLine msg={error || msg} />
        <ul className="divide-y divide-line">
          {rows.map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-3 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: t.color, boxShadow: `0 0 10px ${t.color}` }} />
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {t.sort}. {t.name}
                  </p>
                  <p className="truncate text-[13px] text-muted">{t.blurb}</p>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <button className="btn btn-ghost h-9 px-3 text-[13px]" onClick={() => setEdit(t)}>
                  Edit
                </button>
                <button
                  className="btn btn-ghost h-9 px-3 text-[13px]"
                  onClick={async () => {
                    if (!confirm(`Remove the ${t.name} track?`)) return;
                    await deleteRow('tracks', t.id).catch((x) => setMsg(x.message));
                    refresh();
                  }}
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      </Panel>

      {edit && (
        <Panel title={edit.id ? `Edit ${edit.name}` : 'New track'} action={<button className="text-[14px] text-muted hover:text-ink" onClick={() => setEdit(null)}>Cancel</button>}>
          <div className="grid gap-4 sm:grid-cols-2">
            <F label="Name">
              <input className="field" maxLength={14} value={edit.name ?? ''} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
            </F>
            <F label="Order (1–6)">
              <input className="field" type="number" min={1} max={6} value={edit.sort ?? 1} onChange={(e) => setEdit({ ...edit, sort: +e.target.value })} />
            </F>
            <F label="One line about it" wide>
              <input className="field" maxLength={90} value={edit.blurb ?? ''} onChange={(e) => setEdit({ ...edit, blurb: e.target.value })} />
            </F>
            <F label="Glow colour">
              <div className="flex gap-2">
                <input type="color" className="h-12 w-14 shrink-0 cursor-pointer rounded-xl border border-line bg-transparent p-1" value={edit.color ?? '#22e4ff'} onChange={(e) => setEdit({ ...edit, color: e.target.value })} />
                <input className="field" value={edit.color ?? ''} onChange={(e) => setEdit({ ...edit, color: e.target.value })} />
              </div>
            </F>
            <F label="Graphic">
              <select className="field" value={edit.visual} onChange={(e) => setEdit({ ...edit, visual: e.target.value as TrackVisual })}>
                {visuals.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label}
                  </option>
                ))}
              </select>
            </F>
          </div>
          <div className="mt-5 h-[110px] rounded-xl border border-line p-3">
            <TrackViz visual={(edit.visual ?? 'neural') as TrackVisual} color={edit.color ?? '#22e4ff'} />
          </div>
          <div className="mt-6 flex justify-end">
            <button className="btn btn-primary" onClick={save}>
              Save track
            </button>
          </div>
        </Panel>
      )}
    </div>
  );
}
