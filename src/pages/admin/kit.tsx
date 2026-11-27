import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { supabase, MEDIA_BUCKET } from '../../lib/supabase';
import { useSite } from '../../lib/store';

/** Load + reload a table, ordered. */
export function useTable<T>(table: string, order = 'sort') {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { reload: reloadSite } = useSite();
  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase!.from(table).select('*').order(order);
    if (error) setError(error.message);
    setRows((data ?? []) as T[]);
    setLoading(false);
  }, [table, order]);
  useEffect(() => {
    load();
  }, [load]);
  const refresh = async () => {
    await load();
    reloadSite();
  };
  return { rows, setRows, loading, error, refresh, setError };
}

export async function saveRow(table: string, row: Record<string, unknown>) {
  const { id, ...rest } = row;
  const q = id ? supabase!.from(table).update(rest).eq('id', id as string) : supabase!.from(table).insert(rest);
  const { error } = await q;
  if (error) throw error;
}

/** Deletes one row and confirms it is gone (an empty result means nothing was deleted). */
export async function deleteRow(table: string, id: string) {
  const { data, error } = await supabase!.from(table).delete().eq('id', id).select('id');
  if (error) throw error;
  if (!data?.length) throw new Error('Nothing was deleted. Your login may have expired: sign out and in again.');
}

/** Removes a file we uploaded to our own storage bucket (ignored for outside links). */
export async function removeStoredFile(url: string) {
  const marker = `/storage/v1/object/public/${MEDIA_BUCKET}/`;
  const i = url.indexOf(marker);
  if (i === -1) return;
  await supabase!.storage.from(MEDIA_BUCKET).remove([decodeURIComponent(url.slice(i + marker.length))]);
}

export async function uploadFile(file: File, folder: string): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase!.storage.from(MEDIA_BUCKET).upload(path, file, { cacheControl: '31536000', upsert: false });
  if (error) throw error;
  return supabase!.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
}

export function Panel({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5 md:p-6">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="text-[20px] font-medium tracking-[-0.015em]">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

export function F({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <label className={`block ${wide ? 'sm:col-span-2' : ''}`}>
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

export function ErrorLine({ msg }: { msg: string | null }) {
  return msg ? <p className="mt-3 text-[14px] text-[#ff6b6b]">{msg}</p> : null;
}

/** Edit a list of small objects (timeline, prizes, winners). */
export function Repeater<T extends Record<string, string>>({
  value,
  onChange,
  fields,
  blank,
}: {
  value: T[];
  onChange: (v: T[]) => void;
  fields: { key: keyof T & string; label: string; placeholder?: string }[];
  blank: T;
}) {
  return (
    <div className="space-y-2">
      {value.map((row, i) => (
        <div key={i} className="flex flex-col gap-2 sm:flex-row">
          {fields.map((f) => (
            <input
              key={f.key}
              className="field h-11"
              placeholder={f.placeholder ?? f.label}
              aria-label={f.label}
              value={row[f.key] ?? ''}
              onChange={(e) => onChange(value.map((r, j) => (j === i ? { ...r, [f.key]: e.target.value } : r)))}
            />
          ))}
          <button type="button" className="btn btn-ghost h-11 shrink-0 px-4 text-[13px]" onClick={() => onChange(value.filter((_, j) => j !== i))}>
            Remove
          </button>
        </div>
      ))}
      <button type="button" className="text-[14px] text-accent hover:underline" onClick={() => onChange([...value, { ...blank }])}>
        + Add row
      </button>
    </div>
  );
}
