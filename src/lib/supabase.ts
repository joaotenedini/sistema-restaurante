import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Please click the "Connect to Supabase" button in the top right to set up your database connection.'
  );
}

// Regular client for non-admin operations
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Helper function to check admin PIN
export async function checkAdminPin(pin: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .rpc('check_admin_pin', { pin_to_check: pin });
    
    if (error) throw error;
    return data || false;
  } catch (error) {
    console.error('Error checking admin PIN:', error);
    return false;
  }
}