import { createClient } from '@supabase/supabase-js';

const url         = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? '';
const anonKey     = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? anonKey;

// Cliente público (anon) — componentes client-side
export const supabase = createClient(url, anonKey);

// Cliente admin (service_role) — exclusivo para API Routes en el servidor
export const supabaseAdmin = createClient(url, serviceKey, {
  auth: { persistSession: false },
});
