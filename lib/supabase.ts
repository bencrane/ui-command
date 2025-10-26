import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// Construct Supabase URL from environment variables
const supabaseUrl = process.env.SUBSTRATE_RA_HOST
  ? `https://${process.env.SUBSTRATE_RA_HOST}`
  : '';

const supabaseServiceKey = process.env.SUBSTRATE_RA_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables. Please check SUBSTRATE_RA_HOST and SUBSTRATE_RA_SERVICE_ROLE_KEY.');
}

// Create Supabase client with service role key (bypasses RLS)
export const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
