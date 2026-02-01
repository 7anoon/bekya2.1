import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { log, logError, retryRequest, isAbortError } from '../lib/utils';

export const useAuthStore = create((set) => ({
  user: null,
  profile: null,
  loading: true,
  error: null,

  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  signUp: async (username, email, password, location, phone) => {
    set({ loading: true, error: null });
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

      set({ loading: false });
      return data;
    } catch (err) {
      logError('Sign up error:', err);
      set({ loading: false, error: err.message });
      throw err;
    }
  },

  signIn: async (username, password) => {
    set({ loading: true, error: null });
    
    try {
      log('=== SIGN IN START ===');
      log('Input:', username);
      
      // Check if input is email or username
      const isEmail = username.includes('@');
      let email = username;
      
      if (!isEmail) {
        // Try to get email from profiles
        log('Looking up email for username...');
        
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('email')
          .eq('username', username)
          .single();

        log('Profile lookup:', { found: !!profile, error: !!profileError });

        if (profileError) {
          logError('Profile query error:', profileError);
          set({ loading: false });
          throw new Error('خطأ في البحث عن المستخدم');
        }

        if (!profile || !profile.email) {
          logError('No profile found');
          set({ loading: false });
          throw new Error('اسم المستخدم غير موجود');
        }

        email = profile.email;
        log('Found email:', email);
      }
      
      // Try to sign in
      log('Attempting auth...');
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      log('Auth result:', { success: !!data?.user, error: !!authError });

      if (authError) {
        logError('Auth error:', authError);
        set({ loading: false });
        
        if (authError.message.includes('Invalid')) {
          throw new Error('كلمة المرور غير صحيحة');
        }
        throw new Error('خطأ في تسجيل الدخول');
      }

      if (!data?.user) {
        set({ loading: false });
        throw new Error('فشل تسجيل الدخول');
      }

      log('Login successful! User ID:', data.user.id);
      
      // Load profile
      log('Loading profile...');
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();
      
      if (profileError) {
        logError('Profile fetch error:', profileError);
        // Set user without full profile
        set({ 
          user: data.user, 
          profile: {
            id: data.user.id,
            email: data.user.email,
            username: data.user.email?.split('@')[0],
            role: 'user'
          },
          loading: false 
        });
      } else {
        log('Profile loaded:', userProfile.username, 'Role:', userProfile.role);
        set({ user: data.user, profile: userProfile, loading: false });
      }
      
      log('=== SIGN IN COMPLETE ===');
      return data;
      
    } catch (err) {
      logError('=== SIGN IN ERROR ===', err);
      set({ loading: false, error: err.message });
      throw err;
    }
  },

  signOut: async () => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      set({ user: null, profile: null, loading: false });
    } catch (err) {
      logError('Sign out error:', err);
      set({ loading: false, error: err.message });
      throw err;
    }
  },

  loadUser: async () => {
    log('Starting loadUser...');
    set({ loading: true, error: null });
    
    try {
      log('Checking session...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        logError('Session error:', sessionError);
        set({ user: null, profile: null, loading: false });
        return;
      }
      
      log('Session:', session ? 'FOUND' : 'NOT FOUND');
      
      if (!session) {
        log('No session, setting null user');
        set({ user: null, profile: null, loading: false });
        return;
      }
      
      log('Getting user...');
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        logError('User error:', userError);
        set({ user: null, profile: null, loading: false });
        return;
      }
      
      log('User:', user ? user.id : 'NULL');
      
      if (user) {
        log('Getting profile...');
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profileError) {
          logError('Profile error:', profileError);
          // Create minimal profile as fallback
          const minimalProfile = {
            id: user.id,
            username: user.email?.split('@')[0] || 'user',
            email: user.email,
            role: 'user'
          };
          set({ user, profile: minimalProfile, loading: false });
          return;
        }
        
        log('Profile loaded:', profile ? 'FOUND' : 'NOT FOUND');
        
        if (profile) {
          log('Profile role:', profile.role);
          set({ user, profile, loading: false });
        } else {
          const minimalProfile = {
            id: user.id,
            username: user.email?.split('@')[0] || 'user',
            email: user.email,
            role: 'user'
          };
          set({ user, profile: minimalProfile, loading: false });
        }
      } else {
        log('No user found');
        set({ user: null, profile: null, loading: false });
      }
      
    } catch (error) {
      logError('Load error:', error);
      set({ user: null, profile: null, loading: false, error: error.message });
    }
  }
}));
