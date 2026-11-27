import { useState } from 'react';
import type { Edition } from '../../lib/types';
import { deleteRow, ErrorLine, F, Panel, Repeater, saveRow, useTable } from './kit';
import { supabase } from '../../lib/supabase';

const blank = (n: number): Partial<Edition> => ({
  slug: `edition-${String(n).padStart(2, '0')}`,
  number: n,
  title: `Edition ${String(n).padStart(2, '0')}`,
  industry: null,
  problem: null,
  audience: 'To be announced',
  venue: null,
  starts_at: null,
  ends_at: null,
  registration_closes: null,
  registration_open: false,
  status: 'planned',
  team_min: 2,
  team_max: 4,
  fee_npr: 0,
  prizes: [],
  timeline: [],
  winners: [],
  is_current: false,
});

export default function EditionsAdmin() {
  const { rows, refresh, error } = useTable<Edition>('editions', 'number');
  const [edit, setEdit] = useState<Partial<Edition> | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!edit) return;
    setBusy(true);
    setMsg(null);
    try {
      // only one edition can be "current"
      if (edit.is_current) {
        await supabase!.from('editions').update({ is_current: false }).neq('id', edit.id ?? '00000000-0000-0000-0000-000000000000');
      }
      const clean = { ...edit } as Record<string, unknown>;
      ['industry', 'problem', 'venue', 'starts_at', 'ends_at', 'registration_closes'].forEach((k) => {
        if (clean[k] === '') clean[k] = null;
      });
      await saveRow('editions', clean);
      setEdit(null);
      await refresh();
    } catch (e) {
      setMsg((e as Error).message);
    }
    setBusy(false);
  };

  if (edit) {
    const set = (p: Partial<Edition>) => setEdit({ ...edit, ...p });
    return (
      <Panel
        title={edit.id ? `Edit ${edit.title}` : 'New edition'}
        action={
          <button className="text-[14px] text-muted hover:text-ink" onClick={() => setEdit(null)}>
            Cancel
          </button>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <F label="Number">
            <input className="field" type="number" value={edit.number ?? 1} onChange={(e) => set({ number: +e.target.value })} />
          </F>
          <F label="Title">
            <input className="field" value={edit.title ?? ''} onChange={(e) => set({ title: e.target.value })} />
          </F>
          <F label="URL slug (edition-02)">
            <input className="field" value={edit.slug ?? ''} onChange={(e) => set({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })} />
          </F>
          <F label="Status">
            <select className="field" value={edit.status} onChange={(e) => set({ status: e.target.value as Edition['status'] })}>
              <option value="planned">Planned (outlined planet)</option>
              <option value="upcoming">Upcoming</option>
              <option value="live">Live</option>
              <option value="completed">Completed</option>
            </select>
          </F>
          <F label="Industry (empty = still sealed)">
            <input className="field" value={edit.industry ?? ''} onChange={(e) => set({ industry: e.target.value })} />
          </F>
          <F label="Who can join">
            <input className="field" value={edit.audience ?? ''} onChange={(e) => set({ audience: e.target.value })} />
          </F>
          <F label="Problem statement (empty = encrypted until reveal)" wide>
            <textarea className="field" rows={4} value={edit.problem ?? ''} onChange={(e) => set({ problem: e.target.value })} />
          </F>
          <F label="Venue">
            <input className="field" value={edit.venue ?? ''} onChange={(e) => set({ venue: e.target.value })} />
          </F>
          <F label="Registration closes">
            <input className="field" type="datetime-local" value={edit.registration_closes?.slice(0, 16) ?? ''} onChange={(e) => set({ registration_closes: e.target.value ? new Date(e.target.value).toISOString() : null })} />
          </F>
          <F label="Starts">
            <input className="field" type="date" value={edit.starts_at ?? ''} onChange={(e) => set({ starts_at: e.target.value })} />
          </F>
          <F label="Ends">
            <input className="field" type="date" value={edit.ends_at ?? ''} onChange={(e) => set({ ends_at: e.target.value })} />
          </F>
          <F label="Min team size">
            <input className="field" type="number" min={1} value={edit.team_min ?? 1} onChange={(e) => set({ team_min: Math.max(1, +e.target.value) })} />
          </F>
          <F label="Max team size (1 = individual)">
            <input className="field" type="number" min={1} value={edit.team_max ?? 1} onChange={(e) => set({ team_max: Math.max(1, +e.target.value) })} />
          </F>
          <F label="Entry fee in NPR (0 = free)">
            <input className="field" type="number" min={0} value={edit.fee_npr ?? 0} onChange={(e) => set({ fee_npr: Math.max(0, +e.target.value) })} />
          </F>
          <div className="flex flex-col justify-end gap-3">
            <label className="flex items-center gap-3">
              <input type="checkbox" className="h-5 w-5 accent-[var(--accent)]" checked={!!edit.registration_open} onChange={(e) => set({ registration_open: e.target.checked })} />
              Registration open
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" className="h-5 w-5 accent-[var(--accent)]" checked={!!edit.is_current} onChange={(e) => set({ is_current: e.target.checked })} />
              Current edition (shown on the home page)
            </label>
          </div>
          <F label="Timeline (date as YYYY-MM-DD or TBA)" wide>
            <Repeater value={(edit.timeline ?? []) as { date: string; label: string }[]} onChange={(v) => set({ timeline: v })} blank={{ date: 'TBA', label: '' }} fields={[{ key: 'date', label: 'Date' }, { key: 'label', label: 'What happens' }]} />
          </F>
          <F label="Prizes" wide>
            <Repeater value={(edit.prizes ?? []) as { place: string; reward: string }[]} onChange={(v) => set({ prizes: v })} blank={{ place: '', reward: '' }} fields={[{ key: 'place', label: 'Place', placeholder: 'Winner' }, { key: 'reward', label: 'Reward', placeholder: 'NPR 50,000' }]} />
          </F>
          <F label="Winners (after the event)" wide>
            <Repeater value={(edit.winners ?? []) as { place: string; team: string; project: string }[]} onChange={(v) => set({ winners: v })} blank={{ place: '', team: '', project: '' }} fields={[{ key: 'place', label: 'Place' }, { key: 'team', label: 'Team' }, { key: 'project', label: 'Project' }]} />
          </F>
        </div>
        <ErrorLine msg={msg} />
        <div className="mt-6 flex justify-end">
          <button className="btn btn-primary" onClick={save} disabled={busy}>
            {busy ? 'Saving…' : 'Save edition'}
          </button>
        </div>
      </Panel>
    );
  }

  return (
    <Panel
      title="Editions"
      action={
        <button className="btn btn-primary h-10 px-4 text-[14px]" onClick={() => setEdit(blank((rows.at(-1)?.number ?? 0) + 1))}>
          New edition
        </button>
      }
    >
      <ErrorLine msg={error || msg} />
      <ul className="divide-y divide-line">
        {rows.map((e) => (
          <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div>
              <p className="font-medium">
                {e.title} {e.is_current && <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-[12px] text-accent-ink">current</span>}
              </p>
              <p className="text-[14px] text-muted">
                {e.status} · {e.industry ?? 'industry sealed'} · registration {e.registration_open ? 'open' : 'closed'}
              </p>
            </div>
            <div className="flex gap-2">
              <button className="btn btn-ghost h-9 px-4 text-[14px]" onClick={() => setEdit(e)}>
                Edit
              </button>
              <button
                className="btn btn-ghost h-9 px-4 text-[14px]"
                onClick={async () => {
                  if (!confirm(`Delete ${e.title}? Its photos and registrations are deleted too.`)) return;
                  try {
                    await deleteRow('editions', e.id);
                    refresh();
                  } catch (x) {
                    setMsg((x as Error).message);
                  }
                }}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
