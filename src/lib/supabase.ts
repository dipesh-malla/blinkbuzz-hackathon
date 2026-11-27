import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// Every request goes straight to the server: the browser must never answer a
// read from its cache, or the admin keeps showing a photo that was just
// deleted (or misses one that was just added). Requests also give up after
// 20 s so a stalled connection can be retried instead of hanging forever.
const freshFetch: typeof fetch = (input, init = {}) =>
  fetch(input, {
    ...init,
    cache: 'no-store',
    signal: init.signal ?? (typeof AbortSignal !== 'undefined' && 'timeout' in AbortSignal ? AbortSignal.timeout(20000) : undefined),
  });

// The anon key is safe in the browser: Row Level Security in
// supabase/schema.sql decides what each visitor may read or write.
export const supabase: SupabaseClient | null = url && key ? createClient(url, key, { global: { fetch: freshFetch } }) : null;

export const isDemo = !supabase;

export const MEDIA_BUCKET = 'media';
