import { supabase, isDemo } from './supabase';
import { demoEditions, demoFaqs, demoMedia, demoSponsors, demoTracks } from './demo';
import type { Edition, Faq, Media, Registration, Settings, Sponsor, SponsorRequest, Track } from './types';

export async function getEditions(): Promise<Edition[]> {
  if (!supabase) return demoEditions;
  const { data, error } = await supabase.from('editions').select('*').order('number');
  if (error) throw error;
  return data as Edition[];
}

export async function getSponsors(): Promise<Sponsor[]> {
  if (!supabase) return demoSponsors;
  const { data, error } = await supabase.from('sponsors').select('*').order('sort');
  if (error) throw error;
  return data as Sponsor[];
}

export async function getMedia(): Promise<Media[]> {
  if (!supabase) return demoMedia;
  const { data, error } = await supabase.from('media').select('*').order('sort');
  if (error) throw error;
  return data as Media[];
}

export async function getTracks(): Promise<Track[]> {
  if (!supabase) return demoTracks;
  const { data, error } = await supabase.from('tracks').select('*').order('sort');
  if (error) throw error;
  return data as Track[];
}

export async function getFaqs(): Promise<Faq[]> {
  if (!supabase) return demoFaqs;
  const { data, error } = await supabase.from('faqs').select('*').order('sort');
  if (error) throw error;
  return data as Faq[];
}

export async function getSettings(): Promise<Settings> {
  if (!supabase) return {};
  const { data } = await supabase.from('settings').select('key,value');
  const out: Record<string, string> = {};
  (data ?? []).forEach((r: { key: string; value: string }) => (out[r.key] = r.value));
  return out as Settings;
}

const wait = (ms: number) => new Promise((res) => setTimeout(res, ms));

/** A random UUID v4, also on older browsers without crypto.randomUUID. */
export function newId(): string {
  const c: Crypto = globalThis.crypto;
  if (typeof c.randomUUID === 'function') return c.randomUUID();
  const b = c.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/**
 * Saves a registration in one go, even on a shaky connection.
 * The row gets its id here in the browser, so if a request times out after
 * the server already saved it, the retry hits "already exists" and is
 * treated as success: never a lost registration, never a duplicate.
 */
export async function submitRegistration(r: Registration): Promise<void> {
  if (isDemo || !supabase) {
    // Preview mode: pretend to save so the flow can be tested.
    await wait(700);
    console.info('[demo] registration', r);
    return;
  }
  const row = { ...r, id: r.id ?? newId() };
  let last = 'Something went wrong. Please try again.';
  for (let attempt = 1; attempt <= 4; attempt++) {
    const { error, status } = await supabase.from('registrations').insert(row);
    if (!error) return;
    if (error.code === '23505') return; // saved by an earlier attempt
    // retry only what a retry can fix: no connection, timeouts, server hiccups
    const retryable = status === 0 || status === 408 || status === 429 || status >= 500;
    if (error.code === '42501') last = 'Registration for this edition is closed.';
    else last = retryable ? 'The connection dropped. Please check your internet and press Submit again.' : error.message;
    if (!retryable || attempt === 4) break;
    await wait(600 * attempt);
  }
  throw new Error(last);
}

/** Saves a "Become a partner" request, then asks the server to email the team (best effort). */
export async function submitSponsorRequest(r: SponsorRequest): Promise<void> {
  if (isDemo || !supabase) {
    await wait(700);
    console.info('[demo] partner request', r);
    return;
  }
  const row = { ...r, id: r.id ?? newId(), status: 'new', notified_at: null };
  let last = 'Something went wrong. Please try again.';
  let saved = false;
  for (let attempt = 1; attempt <= 4; attempt++) {
    const { error, status } = await supabase.from('sponsor_requests').insert(row);
    if (!error || error.code === '23505') {
      saved = true;
      break;
    }
    const retryable = status === 0 || status === 408 || status === 429 || status >= 500;
    last = retryable ? 'The connection dropped. Please check your internet and send again.' : error.code === '23514' ? 'Please check the details: a field is too short or the email looks wrong.' : error.message;
    if (!retryable || attempt === 4) break;
    await wait(600 * attempt);
  }
  if (!saved) throw new Error(last);
  // the email is a bonus: the request is already saved, so never fail the form over it
  supabase.functions.invoke('notify-partner-request', { body: { id: row.id } }).catch(() => {});
}

export function youtubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/);
  return m ? m[1] : null;
}

export function formatDate(iso: string | null, fallback = 'To be announced') {
  if (!iso) return fallback;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function feeLabel(fee: number) {
  return fee > 0 ? `NPR ${fee.toLocaleString('en-IN')}` : 'Free';
}

export function teamLabel(min: number, max: number) {
  if (max <= 1) return 'Individual';
  return min === max ? `${min} members` : `${min}–${max} members`;
}
