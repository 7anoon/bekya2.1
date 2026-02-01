import { createClient } from '@supabase/supabase-js';
import { log, logError } from './utils';

// Hardcoded values for Netlify (temporary fix)
const supabaseUrl = 'https://kxuvoovqvtwhtxjnnboo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4dXZvb3ZxdnR3aHR4am5uYm9vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5Mjc1MzUsImV4cCI6MjA4NDUwMzUzNX0.4jLdfrpRlBwzfvPdYpnQQM_n48HYEYkRnrIooUasrXw';

// Log config for debugging
log('Supabase Config:', {
  url: supabaseUrl,
  hasKey: !!supabaseAnonKey
});

// Enhanced client with retry logic
let supabaseClient = null;

// Function to create client with error handling
function createSupabaseClient() {
  try {
    // Create client with enhanced error handling and timeout
    const client = createClient(supabaseUrl, supabaseAnonKey, {
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
      },
      global: {
        headers: {
          'x-client-info': 'bekya-app'
        }
      },
      db: {
        schema: 'public'
      },
      // زيادة الـ timeout للـ requests
      realtime: {
        timeout: 30000
      }
    });
    
    // Add connection health check with error handling
    try {
      client.auth.onAuthStateChange((event, session) => {
        log('Auth state change:', event, session?.user?.id);
      });
    } catch (error) {
      logError('Failed to set up auth state change listener:', error);
    }
    
    return client;
  } catch (error) {
    logError('Failed to create Supabase client:', error);
    throw error;
  }
}

// Initialize client with retry logic
function initializeClient() {
  if (supabaseClient) return supabaseClient;
  
  try {
    supabaseClient = createSupabaseClient();
    log('Supabase client created successfully');
    return supabaseClient;
  } catch (error) {
    logError('Failed to initialize Supabase client:', error);
    throw error;
  }
}

// Export the client
export const supabase = initializeClient();
