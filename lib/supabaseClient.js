// supabaseClient.js – add console logs and trim env vars
import { createClient } from '@supabase/supabase-js';

// Trim any stray whitespace and log values for debugging
const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

console.log('🔑 Supabase URL (trimmed):', rawUrl.trim());
console.log('🔑 Supabase ANON KEY (first 8 chars):', rawKey.trim().slice(0, 8));

const supabaseUrl = rawUrl.trim();
const supabaseAnonKey = rawKey.trim();

if (!supabaseUrl) {
  console.error('❗ Supabase URL is missing or empty. Check .env.local');
}
if (!supabaseAnonKey) {
  console.error('❗ Supabase anon key is missing or empty. Check .env.local');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
