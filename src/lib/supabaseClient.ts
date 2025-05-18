import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vjmlbzcssyywmeapaxds.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqbWxiemNzc3l5d21lYXBheGRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5ODMzNDUsImV4cCI6MjA2MDU1OTM0NX0.dHdMxjhT9MjRDVpzoIiOo6zD23iF45YIZH9iACD4ZwY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);