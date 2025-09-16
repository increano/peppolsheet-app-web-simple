import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Client-side Supabase client
export const supabase: SupabaseClient = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
  auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
  },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);

export const createSupabaseClient = () => supabase;