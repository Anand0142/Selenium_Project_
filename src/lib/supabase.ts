import { createClient } from '@supabase/supabase-js';

// Your Supabase URL and anon key (replace with your own values)
const supabaseUrl = 'https://vjmlbzcssyywmeapaxds.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqbWxiemNzc3l5d21lYXBheGRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5ODMzNDUsImV4cCI6MjA2MDU1OTM0NX0.dHdMxjhT9MjRDVpzoIiOo6zD23iF45YIZH9iACD4ZwY';

// Initialize Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Export auth for convenience
export const auth = supabase.auth;

// Helper function to get the current user
export const getCurrentUser = async () => {
  const { data } = await supabase.auth.getUser();
  return data?.user || null;
};

// Helper function to get user profile from signup table
export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('Signup')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
  
  return data;
};