import { useMemo, useState } from 'react';
import type { Edition, Registration } from '../../lib/types';
import { deleteRow, ErrorLine, Panel, useTable } from './kit';

function toCsv(rows: Registration[], editions: Edition[]) {
  const maxM = Math.max(1, ...rows.map((r) => r.members.length));
  const head = ['Submitted', 'Edition', 'Team', 'School', 'District', 'Guardian', 'Guardian phone'];
  for (let i = 1; i <= maxM; i++) head.push(`M${i} name`, `M${i} grade`, `M${i} email`, `M${i} phone`);
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = rows.map((r) => {
    const cells = [
      r.created_at ? new Date(r.created_at).toLocaleString('en-GB') : '',
      editions.find((e) => e.id === r.edition_id)?.title ?? '',
      r.team_name,
      r.school,
      r.district,
      r.guardian_name,
      r.guardian_phone,
    ];
    for (let i = 0; i < maxM; i++) {
      const m = r.members[i];
      cells.push(m?.name ?? '', m?.grade ?? '', m?.email ?? '', m?.phone ?? '');
    }
    return cells.map(esc).join(',');
  });
  // BOM so Excel opens UTF-8 (Nepali names) correctly
  return '﻿' + [head.map(esc).join(','), ...lines].join('\r\n');
}

export default function RegistrationsAdmin() {
  const { rows, refresh, error } = useTable<Registration>('registrations', 'created_at');
  const { rows: editions } = useTable<Edition>('editions', 'number');
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  const shown = useMemo(
    () =>
      rows
        .filter((r) => filter === 'all' || r.edition_id === filter)
        .filter((r) => {
          if (!q) return true;
          const s = `${r.team_name} ${r.school} ${r.members.map((m) => m.name + m.email).join(' ')}`.toLowerCase();
          return s.includes(q.toLowerCase());
        })
        .reverse(),
    [rows, filter, q],
  );
  const people = shown.reduce((n, r) => n + r.members.length, 0);

  const download = () => {
    const blob = new Blob([toCsv(shown, editions)], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `registrations-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <Panel
      title={`Registrations · ${shown.length} teams · ${people} students`}
      action={
        <button className="btn btn-primary h-10 px-4 text-[14px]" onClick={download} disabled={!shown.length}>
          Export for Excel
        </button>
      }
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <select className="field h-11 sm:max-w-[220px]" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All editions</option>
          {editions.map((e) => (
            <option key={e.id} value={e.id}>
              {e.title}
            </option>
          ))}
        </select>
        <input className="field h-11" placeholder="Search team, school, name or email" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <ErrorLine msg={error || msg} />
      <div className="-mx-5 overflow-x-auto md:-mx-6">
        <table className="w-full min-w-[760px] text-left text-[14px]">
          <thead className="text-muted">
            <tr className="border-b border-line">
              {['Team', 'School', 'Members', 'Guardian', 'Submitted', ''].map((h) => (
                <th key={h} className="px-5 py-3 font-normal md:px-6">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.id} className="border-b border-line align-top">
                <td className="px-5 py-3 font-medium md:px-6">{r.team_name}</td>
                <td className="px-5 py-3 md:px-6">
                  {r.school}
                  <div className="text-muted">{r.district}</div>
                </td>
                <td className="px-5 py-3 md:px-6">
                  {r.members.map((m, i) => (
                    <div key={i}>
                      {m.name} <span className="text-muted">· {m.grade} · {m.phone}</span>
                    </div>
                  ))}
                </td>
                <td className="px-5 py-3 md:px-6">
                  {r.guardian_name ?? <span className="text-muted">Not needed</span>}
                  {r.guardian_phone && <div className="text-muted">{r.guardian_phone}</div>}
                </td>
                <td className="px-5 py-3 text-muted md:px-6">{r.created_at ? new Date(r.created_at).toLocaleDateString('en-GB') : ''}</td>
                <td className="px-5 py-3 md:px-6">
                  <button
                    className="text-muted hover:text-ink"
                    onClick={async () => {
                      if (!confirm(`Delete the registration for ${r.team_name}? This can’t be undone.`)) return;
                      try {
                        await deleteRow('registrations', r.id!);
                        refresh();
                      } catch (x) {
                        setMsg((x as Error).message);
                      }
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {!shown.length && (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-muted">
                  No registrations yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
