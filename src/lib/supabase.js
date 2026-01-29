import { createClient } from '@supabase/supabase-js';

// Production values from user
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://kxuvovqvwtwhtxjnnboo.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4dXZvb3ZxdnR3aHR4am5uYm9vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5Mjc1MzUsImV4cCI6MjA4NDUwMzUzNX0.4jLdfrpRlBwzfvPdYpnQQM_n48HYEYkRnrIooUasrXw';

// Log config for debugging
console.log('Supabase Config:', {
  url: supabaseUrl,
  hasKey: !!supabaseAnonKey && supabaseAnonKey !== 'your-anon-key'
});

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
