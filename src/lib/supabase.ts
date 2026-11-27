import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// The anon key is safe in the browser: Row Level Security in
// supabase/schema.sql decides what each visitor may read or write.
export const supabase: SupabaseClient | null = url && key ? createClient(url, key) : null;

export const isDemo = !supabase;

export const MEDIA_BUCKET = 'media';
