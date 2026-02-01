import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { log, logError } from '../lib/utils';

export const useAuthStore = create((set) => ({
  user: null,
  profile: null,
  error: null,

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
      set({ error: err.message });
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
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        set({ user: null, profile: null });
        return;
      }
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        set({ user: null, profile: null });
        return;
      }
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      set({ user, profile: profile || { id: user.id, email: user.email, role: 'user' } });
      
    } catch (error) {
      set({ user: null, profile: null });
    }
  }
}));
