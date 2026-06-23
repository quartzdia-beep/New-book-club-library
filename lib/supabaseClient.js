// supabaseClient.js – safe client creation with resilient stub
import { createClient } from '@supabase/supabase-js';

// Trim env vars (may be undefined in the build environment)
const rawUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim();
const rawKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').trim();

let supabase = null;
if (typeof window !== 'undefined' && rawUrl && rawKey) {
  // Browser – real client
  supabase = createClient(rawUrl, rawKey);
} else {
  // Server‑side / build – stub that mimics the limited API we use
  const noop = async () => ({ data: [], error: null });
  supabase = {
    from: () => ({
      select: noop,
      insert: noop,
      upsert: noop,
    }),
  };
}

export { supabase };
