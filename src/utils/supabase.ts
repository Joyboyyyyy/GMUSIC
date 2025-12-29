import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Supabase configuration - replace with your actual values
// These should be in your .env or app.config.js
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

let supabase: any = null;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[Supabase] Missing Supabase URL or Anon Key. Please configure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY');
} else {
  // Create Supabase client
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: undefined, // We'll use our own storage
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
}

export { supabase };

/**
 * Get current Supabase user ID
 * @returns User ID from Supabase Auth session (null if not authenticated)
 */
export async function getSupabaseUserId(): Promise<string | null> {
  if (!supabase) {
    return null;
  }
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  } catch (error) {
    console.error('[Supabase] Error getting user ID:', error);
    return null;
  }
}

