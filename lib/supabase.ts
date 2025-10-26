import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// Construct Supabase URL from environment variables
const supabaseUrl = process.env.SUBSTRATE_RA_HOST
  ? `https://${process.env.SUBSTRATE_RA_HOST}`
  : '';

const supabaseServiceKey = process.env.SUBSTRATE_RA_SERVICE_ROLE_KEY || '';

console.log('Supabase Config:', {
  host: process.env.SUBSTRATE_RA_HOST,
  url: supabaseUrl,
  hasServiceKey: !!supabaseServiceKey,
  serviceKeyLength: supabaseServiceKey?.length || 0
});

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables:', {
    SUBSTRATE_RA_HOST: process.env.SUBSTRATE_RA_HOST,
    hasServiceKey: !!process.env.SUBSTRATE_RA_SERVICE_ROLE_KEY
  });
  throw new Error('Missing Supabase environment variables. Please check SUBSTRATE_RA_HOST and SUBSTRATE_RA_SERVICE_ROLE_KEY.');
}

// Create Supabase client with service role key (bypasses RLS)
export const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
