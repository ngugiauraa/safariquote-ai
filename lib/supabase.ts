import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL in .env.local");
}
if (!supabaseAnonKey) {
  console.error("❌ Missing NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local");
}
if (!supabaseServiceKey) {
  console.error("❌ Missing SUPABASE_SERVICE_ROLE_KEY in .env.local");
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);

export const supabaseAdmin = createClient(
  supabaseUrl || '',
  supabaseServiceKey || ''
);