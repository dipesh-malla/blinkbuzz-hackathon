import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { RequestStatus, SponsorRequest } from '../../lib/types';
import { interestLabel } from '../../components/PartnerForm';
import { deleteRow, ErrorLine, Panel, useTable } from './kit';

const statusLabel: Record<RequestStatus, string> = { new: 'New', contacted: 'Contacted', accepted: 'Accepted', declined: 'Declined' };
const statusColor: Record<RequestStatus, string> = { new: 'var(--accent)', contacted: '#ffcf5a', accepted: '#3dffa8', declined: 'var(--muted)' };

function toCsv(rows: SponsorRequest[]) {
  const head = ['Received', 'Status', 'Company', 'Contact', 'Email', 'Phone', 'Website', 'Interested in', 'Message'];
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = rows.map((r) =>
    [r.created_at ? new Date(r.created_at).toLocaleString('en-GB') : '', statusLabel[r.status ?? 'new'], r.company, r.contact_name, r.email, r.phone, r.website, interestLabel[r.tier_interest], r.message]
      .map(esc)
      .join(','),
  );
  return '﻿' + [head.map(esc).join(','), ...lines].join('\r\n');
}

/** Where new-request emails go. Stored in private_settings (admins only, never public). */
function NotifyEmail() {
  const [value, setValue] = useState('');
  const [saved, setSaved] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [configured, setConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    supabase!
      .from('private_settings')
      .select('value')
      .eq('key', 'notifyEmail')
      .maybeSingle()
      .then(({ data }) => {
        setValue(data?.value ?? '');
        setSaved(data?.value ?? '');
      });
    supabase!.functions
      .invoke('notify-partner-request', { body: { check: true } })
      .then(({ data }) => setConfigured(!!data?.configured))
      .catch(() => setConfigured(false));
  }, []);

  const list = value.split(/[,;\s]+/).filter(Boolean);
  const ok = list.every((e) => /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(e));

  const save = async () => {
    if (!ok) return setMsg('Check the email address.');
    setMsg(null);
    const v = list.join(', ');
    const { error } = v
      ? await supabase!.from('private_settings').upsert({ key: 'notifyEmail', value: v })
      : await supabase!.from('private_settings').delete().eq('key', 'notifyEmail');
    if (error) return setMsg(error.message);
    setValue(v);
    setSaved(v);
    setMsg('Saved.');
  };

  return (
    <div className="mb-5 rounded-xl border border-line bg-bg/60 p-4">
      <label className="block">
        <span className="label">Email me new partner requests (separate several with commas)</span>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input className="field h-11" type="text" inputMode="email" placeholder="team@blinkbuzz.com" value={value} onChange={(e) => setValue(e.target.value)} />
          <button className="btn btn-primary h-11 shrink-0 px-5 text-[14px]" onClick={save} disabled={value === saved}>
            Save
          </button>
        </div>
      </label>
      <p className="mt-2 text-[13px] text-muted">
        {configured === null
          ? 'Checking email setup…'
          : configured
            ? saved
              ? `Each new request is emailed to ${saved}. Reply to that email to answer the sender directly.`
              : 'Email sending is ready: add an address above to start getting requests by email.'
            : 'Email sending isn’t switched on yet (the RESEND_API_KEY secret is missing). Requests still save here.'}
      </p>
      {msg && <p className={`mt-1 text-[13px] ${msg === 'Saved.' ? 'text-accent' : 'text-[#ff6b6b]'}`}>{msg}</p>}
    </div>
  );
}

export default function PartnerRequests({ onAddAsSponsor }: { onAddAsSponsor: (r: SponsorRequest) => void }) {
  const { rows, setRows, error } = useTable<SponsorRequest & { id: string }>('sponsor_requests', 'created_at');
  const [filter, setFilter] = useState<'all' | RequestStatus>('all');
  const [q, setQ] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const shown = useMemo(
    () =>
      rows
        .filter((r) => filter === 'all' || r.status === filter)
        .filter((r) => !q || `${r.company} ${r.contact_name} ${r.email} ${r.phone ?? ''}`.toLowerCase().includes(q.toLowerCase()))
        .slice()
        .reverse(),
    [rows, filter, q],
  );
  const fresh = rows.filter((r) => r.status === 'new').length;

  const setStatus = async (id: string, status: RequestStatus) => {
    const before = rows;
    setRows(rows.map((r) => (r.id === id ? { ...r, status } : r)));
    const { error } = await supabase!.from('sponsor_requests').update({ status }).eq('id', id);
    if (error) {
      setRows(before);
      setMsg(error.message);
    }
  };

  const download = () => {
    const blob = new Blob([toCsv(shown)], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `partner-requests-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <Panel
      title={`Partner requests · ${rows.length}${fresh ? ` · ${fresh} new` : ''}`}
      action={
        <button className="btn btn-ghost h-10 px-4 text-[14px]" onClick={download} disabled={!shown.length}>
          Export for Excel
        </button>
      }
    >
      <NotifyEmail />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <select className="field h-11 sm:max-w-[200px]" value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)}>
          <option value="all">All requests</option>
          {Object.entries(statusLabel).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <input className="field h-11" placeholder="Search company, name, email or phone" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <ErrorLine msg={error || msg} />
      <div className="-mx-5 overflow-x-auto md:-mx-6">
        <table className="w-full min-w-[820px] text-left text-[14px]">
          <thead className="text-muted">
            <tr className="border-b border-line">
              {['Company', 'Contact', 'Interested in', 'Received', 'Status', ''].map((h) => (
                <th key={h} className="px-5 py-3 font-normal md:px-6">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => {
              const st = r.status ?? 'new';
              const isOpen = openId === r.id;
              return (
                <tr key={r.id} className="border-b border-line align-top">
                  <td className="px-5 py-3 md:px-6">
                    <button className="text-left font-medium hover:text-accent" onClick={() => setOpenId(isOpen ? null : r.id)} aria-expanded={isOpen}>
                      {r.company}
                    </button>
                    {r.website && (
                      <a className="block max-w-[220px] truncate text-muted hover:text-ink" href={r.website} target="_blank" rel="noreferrer">
                        {r.website.replace(/^https?:\/\/(www\.)?/, '')}
                      </a>
                    )}
                    {isOpen && r.message && <p className="mt-2 max-w-[42ch] whitespace-pre-wrap text-[13px] text-muted">{r.message}</p>}
                    {!isOpen && r.message && (
                      <button className="mt-1 text-[12px] text-accent hover:underline" onClick={() => setOpenId(r.id)}>
                        Read message
                      </button>
                    )}
                  </td>
                  <td className="px-5 py-3 md:px-6">
                    {r.contact_name}
                    <a className="block text-muted hover:text-ink" href={`mailto:${r.email}?subject=${encodeURIComponent('BlinkBuzz partnership')}`}>
                      {r.email}
                    </a>
                    {r.phone && (
                      <a className="block text-muted hover:text-ink" href={`tel:${r.phone.replace(/\s/g, '')}`}>
                        {r.phone}
                      </a>
                    )}
                  </td>
                  <td className="px-5 py-3 md:px-6">{interestLabel[r.tier_interest]}</td>
                  <td className="px-5 py-3 text-muted md:px-6">{r.created_at ? new Date(r.created_at).toLocaleDateString('en-GB') : ''}</td>
                  <td className="px-5 py-3 md:px-6">
                    <select
                      className="field h-9 w-[130px] py-0 text-[13px]"
                      style={{ color: statusColor[st] }}
                      value={st}
                      onChange={(e) => setStatus(r.id, e.target.value as RequestStatus)}
                      aria-label={`Status for ${r.company}`}
                    >
                      {Object.entries(statusLabel).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-3 md:px-6">
                    <div className="flex flex-col items-start gap-1.5">
                      <button className="whitespace-nowrap text-accent hover:underline" onClick={() => onAddAsSponsor(r)}>
                        Add as sponsor
                      </button>
                      <button
                        className="text-muted hover:text-ink"
                        onClick={async () => {
                          if (!confirm(`Delete the request from ${r.company}? This can’t be undone.`)) return;
                          const before = rows;
                          setRows(rows.filter((x) => x.id !== r.id));
                          try {
                            await deleteRow('sponsor_requests', r.id);
                          } catch (x) {
                            setRows(before);
                            setMsg((x as Error).message);
                          }
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!shown.length && (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-muted">
                  {rows.length ? 'No requests match.' : 'No partner requests yet. They appear here when someone uses “Become a partner” on the site.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
