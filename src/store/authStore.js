import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { log, logError } from '../lib/utils';

export const useAuthStore = create((set) => ({
  user: null,
  profile: null,
  error: null,
  isLoading: true, // Add loading state

  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setError: (error) => set({ error }),

  signUp: async (username, email, password, location, phone) => {
    set({ error: null });
    try {
      // Check if username is already taken
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .maybeSingle();

      if (existingUser) {
        throw new Error('اسم المستخدم موجود بالفعل');
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { 
            username,
            location,
            phone
          }
        }
      });

      if (error) throw error;

      // Create profile manually if trigger doesn't work
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            username,
            email,
            location,
            phone,
            role: 'user'
          }, { onConflict: 'id' });

        if (profileError) {
          logError('Profile creation error:', profileError);
        }
      }

      return data;
    } catch (err) {
      logError('Sign up error:', err);
      set({ error: err.message });
      throw err;
    }
  },

  signIn: async (username, password) => {
    set({ error: null });
    
    try {
      // Check if input is email or username
      const isEmail = username.includes('@');
      let email = username;
      
      if (!isEmail) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('email')
          .eq('username', username)
          .single();

        if (profileError || !profile) {
          throw new Error('اسم المستخدم غير موجود');
        }
        email = profile.email;
      }
      
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        if (authError.message?.includes('Invalid')) {
          throw new Error('كلمة المرور غير صحيحة');
        }
        throw new Error('خطأ في تسجيل الدخول');
      }

      if (!authData?.user) {
        throw new Error('فشل تسجيل الدخول');
      }
      
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();
      
      set({ user: authData.user, profile: userProfile });
      return authData;
      
    } catch (err) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  signOut: async () => {
    set({ error: null });
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      set({ user: null, profile: null });
    } catch (err) {
      logError('Sign out error:', err);
      set({ error: err.message });
      throw err;
    }
  },

  loadUser: async () => {
    set({ error: null });
    
    try {
      // Add small delay on mobile for session to load properly
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      // Use getSession instead of getUser for faster response
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        set({ user: null, profile: null, isLoading: false });
        return;
      }
      
      // Set user immediately from session
      set({ user: session.user, isLoading: false });
      
      // Load profile in background
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      set({ profile: profile || { id: session.user.id, email: session.user.email, role: 'user' } });
      
    } catch (error) {
      set({ user: null, profile: null, isLoading: false });
    }
  }
}));
