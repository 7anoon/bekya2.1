import { createClient } from '@supabase/supabase-js';
import { log } from './utils';

// Production values from user
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://kxuvovqvwtwhtxjnnboo.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4dXZvb3ZxdnR3aHR4am5uYm9vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5Mjc1MzUsImV4cCI6MjA4NDUwMzUzNX0.4jLdfrpRlBwzfvPdYpnQQM_n48HYEYkRnrIooUasrXw';

// Log config for debugging
log('Supabase Config:', {
  url: supabaseUrl,
  hasKey: !!supabaseAnonKey && supabaseAnonKey !== 'your-anon-key'
});

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // استخدام localStorage بدل sessionStorage عشان الـ session يفضل محفوظ
    storage: window.localStorage,
    // الـ session يفضل محفوظ حتى لو قفلتي المتصفح
    persistSession: true,
    // تحديث الـ token تلقائياً قبل ما ينتهي
    autoRefreshToken: true,
    // اكتشاف الـ session تلقائياً لما تفتحي المتصفح
    detectSessionInUrl: true,
    // مدة الـ session (30 يوم)
    storageKey: 'bekya-auth-token'
  }
});
