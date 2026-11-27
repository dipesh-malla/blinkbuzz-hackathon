import { supabase, isDemo } from './supabase';
import { demoEditions, demoFaqs, demoMedia, demoSponsors, demoTracks } from './demo';
import type { Edition, Faq, Media, Registration, Settings, Sponsor, Track } from './types';

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

export async function submitRegistration(r: Registration): Promise<void> {
  if (isDemo || !supabase) {
    // Preview mode: pretend to save so the flow can be tested.
    await new Promise((res) => setTimeout(res, 700));
    console.info('[demo] registration', r);
    return;
  }
  const { error } = await supabase.from('registrations').insert(r);
  if (error) throw error;
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
