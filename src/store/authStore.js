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
      log('Username:', username);
      
      // Check if input is email or username
      const isEmail = username.includes('@');
      let email = username;
      
      if (!isEmail) {
        // Try to get email from profiles
        log('Looking up email for username:', username);
        
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('email')
          .eq('username', username)
          .maybeSingle();

        log('Profile lookup result:', { profile, error: profileError });

        if (profileError) {
          logError('Profile query error:', profileError);
          set({ loading: false, error: 'خطأ في الاتصال بقاعدة البيانات' });
          throw new Error('خطأ في الاتصال بقاعدة البيانات: ' + profileError.message);
        }

        if (!profile) {
          logError('No profile found for username:', username);
          set({ loading: false, error: 'اسم المستخدم غير موجود' });
          throw new Error('اسم المستخدم غير موجود');
        }

        email = profile.email;
        log('Found email:', email);
      }
      
      // Try to sign in
      log('Attempting auth with email:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password
      });

      log('Auth result:', { data: data?.user?.id, error });

      if (error) {
        logError('Auth error:', error);
        set({ loading: false, error: error.message });
        if (error.message.includes('Invalid')) {
          throw new Error('كلمة المرور غير صحيحة');
        }
        throw new Error('خطأ في تسجيل الدخول: ' + error.message);
      }

      log('Login successful! User ID:', data.user.id);
      
      // Load profile immediately
      log('Loading profile...');
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();
      
      log('Profile fetch result:', { profile: profile?.username, error: profileError });
      
      if (profileError) {
        logError('Profile fetch error:', profileError);
        // Set user without profile
        set({ user: data.user, profile: null, loading: false });
      } else {
        log('Profile loaded successfully:', profile.username);
        log('User role:', profile.role);
        // Set both user and profile
        set({ user: data.user, profile, loading: false });
      }
      
      log('=== SIGN IN COMPLETE ===');
      return data;
    } catch (err) {
      logError('=== SIGN IN ERROR ===');
      logError('Error:', err);
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
