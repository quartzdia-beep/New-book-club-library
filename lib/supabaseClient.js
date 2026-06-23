/* lib/supabaseClient.js – robust client with safe stub */
import { createClient } from '@supabase/supabase-js';

// ----- Grab environment variables -----
const rawUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim();
const rawKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').trim();

// ----- Helper: No‑op async that mimics Supabase responses -----
const noop = async () => ({ data: [], error: null });

let supabase;

// ----- Browser: real client (only when we have both values) -----
if (typeof window !== 'undefined' && rawUrl && rawKey) {
  supabase = createClient(rawUrl, rawKey);
} else {
  // ----- Server / build: safe stub -----
  supabase = {
    from: () => ({
      select: noop,
      insert: noop,
      upsert: noop,
    }),
  };
}

export { supabase };
