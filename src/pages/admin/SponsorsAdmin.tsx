import { useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';
import PartnerRequests from './PartnerRequests';
import type { Edition, Sponsor, SponsorRequest } from '../../lib/types';
import { tierLabel } from '../../sections/Sponsors';
import { deleteRow, ErrorLine, F, Panel, saveRow, shrinkImage, uploadFile, useTable } from './kit';

const empty: Partial<Sponsor> = {
  name: '',
  logo_url: null,
  website: null,
  tier: 'partner',
  edition_id: null,
  sort: 0,
};

export default function SponsorsAdmin() {
  const { rows, refresh, error } = useTable<Sponsor>('sponsors');
  const { rows: editions } = useTable<Edition>('editions', 'number');
  const [edit, setEdit] = useState<Partial<Sponsor> | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [fromRequest, setFromRequest] = useState<string | null>(null);
  const [reqVersion, setReqVersion] = useState(0);
  const formRef = useRef<HTMLDivElement>(null);

  // prefill the normal sponsor form from a partner request; it is marked accepted once saved
  const addFromRequest = (r: SponsorRequest) => {
    setMsg(null);
    setFromRequest(r.id ?? null);
    setEdit({
      ...empty,
      name: r.company,
      website: r.website,
      tier: r.tier_interest === 'not-sure' ? 'sponsor' : r.tier_interest,
      sort: rows.length,
    });
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const save = async () => {
    if (!edit?.name) return setMsg('Name is required.');
    setBusy(true);
    setMsg(null);
    try {
      await saveRow('sponsors', { ...edit, website: edit.website || null });
      if (fromRequest) {
        await supabase!.from('sponsor_requests').update({ status: 'accepted' }).eq('id', fromRequest);
        setReqVersion((v) => v + 1);
      }
      setFromRequest(null);
      setEdit(null);
      refresh();
    } catch (e) {
      setMsg((e as Error).message);
    }
    setBusy(false);
  };

  return (
    <div className="space-y-6">
      <PartnerRequests key={reqVersion} onAddAsSponsor={addFromRequest} />
      <div ref={formRef} className="grid scroll-mt-24 grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel
          title="Sponsors & partners"
          action={
            <button
              className="btn btn-primary h-10 px-4 text-[14px]"
              onClick={() => {
                setFromRequest(null);
                setEdit({ ...empty, sort: rows.length });
              }}
            >
              Add sponsor
            </button>
          }
        >
          <ErrorLine msg={error} />
          <ul className="divide-y divide-line">
            {rows.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid h-10 w-16 shrink-0 place-items-center rounded-lg bg-bg">
                    {s.logo_url ? <img src={s.logo_url} alt="" className="max-h-8 max-w-14 object-contain" /> : <span className="text-[11px] text-muted">no logo</span>}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{s.name}</p>
                    <p className="truncate text-[13px] text-muted">
                      {tierLabel[s.tier]} · {editions.find((e) => e.id === s.edition_id)?.title ?? 'Whole series'}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button className="btn btn-ghost h-9 px-3 text-[13px]" onClick={() => setEdit(s)}>
                    Edit
                  </button>
                  <button
                    className="btn btn-ghost h-9 px-3 text-[13px]"
                    onClick={async () => {
                      if (!confirm(`Remove ${s.name}?`)) return;
                      await deleteRow('sponsors', s.id).catch((x) => setMsg(x.message));
                      refresh();
                    }}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
            {!rows.length && <li className="py-6 text-muted">No sponsors yet. The site shows open sponsor slots until you add one.</li>}
          </ul>
        </Panel>

        {edit && (
          <Panel
            title={edit.id ? `Edit ${edit.name}` : 'New sponsor'}
            action={
              <button
                className="text-[14px] text-muted hover:text-ink"
                onClick={() => {
                  setEdit(null);
                  setFromRequest(null);
                }}
              >
                Cancel
              </button>
            }
          >
            {fromRequest && (
              <p className="mb-4 rounded-lg border border-line bg-bg/60 px-3 py-2 text-[13px] text-muted">
                Filled in from a partner request. Add their logo, check the details and save; the request is then marked accepted.
              </p>
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <F label="Name">
                <input className="field" value={edit.name ?? ''} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
              </F>
              <F label="Website">
                <input className="field" type="url" placeholder="https://" value={edit.website ?? ''} onChange={(e) => setEdit({ ...edit, website: e.target.value })} />
              </F>
              <F label="Tier">
                <select
                  className="field"
                  value={edit.tier}
                  onChange={(e) =>
                    setEdit({
                      ...edit,
                      tier: e.target.value as Sponsor['tier'],
                    })
                  }
                >
                  {Object.entries(tierLabel).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </F>
              <F label="Edition">
                <select className="field" value={edit.edition_id ?? ''} onChange={(e) => setEdit({ ...edit, edition_id: e.target.value || null })}>
                  <option value="">Whole series</option>
                  {editions.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.title}
                    </option>
                  ))}
                </select>
              </F>
              <F label="Order (lower first)">
                <input className="field" type="number" value={edit.sort ?? 0} onChange={(e) => setEdit({ ...edit, sort: +e.target.value })} />
              </F>
              <F label="Logo (SVG or transparent PNG)">
                <input
                  className="field pt-2.5"
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    setBusy(true);
                    try {
                      setEdit({
                        ...edit,
                        logo_url: await uploadFile(await shrinkImage(f, 800), 'logos'),
                      });
                    } catch (x) {
                      setMsg((x as Error).message);
                    }
                    setBusy(false);
                  }}
                />
              </F>
            </div>
            {edit.logo_url && <img src={edit.logo_url} alt="" className="mt-4 h-12 rounded bg-bg object-contain p-2" />}
            <ErrorLine msg={msg} />
            <div className="mt-6 flex justify-end">
              <button className="btn btn-primary" onClick={save} disabled={busy}>
                {busy ? 'Working…' : 'Save sponsor'}
              </button>
            </div>
          </Panel>
        )}
      </div>
    </div>
  );
}
