import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { log, logError, isAbortError, retryRequest } from '../lib/utils';

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
      // تحقق إن الـ username مش مستخدم
      const { data: existingUser } = await retryRequest(() =>
        supabase
          .from('profiles')
          .select('username')
          .eq('username', username)
          .maybeSingle()
      );

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

      // لو الـ trigger مشتغلش، اعمل profile يدوي
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
      log('Attempting login for username:', username);
      
      // جرب تجيب الـ email من profiles مع retry
      const { data: profile, error: profileError } = await retryRequest(() =>
        supabase
          .from('profiles')
          .select('email')
          .eq('username', username)
          .maybeSingle()
      );

      if (profileError) {
        logError('Profile error:', profileError);
        if (isAbortError(profileError)) {
          throw new Error('انتهت مهلة الاتصال. حاول مرة أخرى');
        }
        throw new Error('خطأ في الاتصال بقاعدة البيانات');
      }

      if (!profile) {
        throw new Error('اسم المستخدم غير موجود');
      }

      log('Found email:', profile.email);
      
      // جرب تسجل الدخول
      const { data, error } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password
      });

      if (error) {
        logError('Auth error:', error);
        if (error.message.includes('Invalid')) {
          throw new Error('كلمة المرور غير صحيحة');
        }
        if (isAbortError(error)) {
          throw new Error('انتهت مهلة تسجيل الدخول. حاول مرة أخرى');
        }
        throw new Error('خطأ في تسجيل الدخول');
      }

      log('Login successful');
      set({ loading: false });
      return data;
    } catch (err) {
      logError('Sign in error:', err);
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
        if (isAbortError(sessionError)) {
          log('Session check aborted');
          set({ user: null, profile: null, loading: false });
          return;
        }
        throw sessionError;
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
        if (isAbortError(userError)) {
          log('User check aborted');
          set({ user: null, profile: null, loading: false });
          return;
        }
        throw userError;
      }
      
      log('User:', user ? user.id : 'NULL');
      
      if (user) {
        log('Getting profile...');
        try {
          const { data: profile, error: profileError } = await retryRequest(() =>
            supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .single()
          );
          
          if (profileError) throw profileError;
          
          log('Profile:', profile ? 'FOUND' : 'NOT FOUND');
          
          if (profile) {
            log('Setting user and profile');
            set({ user, profile, loading: false });
          } else {
            log('Creating minimal profile');
            const minimalProfile = {
              id: user.id,
              username: user.email.split('@')[0],
              email: user.email,
              role: 'user'
            };
            set({ user, profile: minimalProfile, loading: false });
          }
        } catch (profileError) {
          if (isAbortError(profileError)) {
            log('Profile fetch aborted');
            set({ user: null, profile: null, loading: false });
            return;
          }
          log('Profile error, creating minimal profile');
          const minimalProfile = {
            id: user.id,
            username: user.email.split('@')[0],
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
      if (isAbortError(error)) {
        log('Request aborted');
        set({ user: null, profile: null, loading: false });
        return;
      }
      logError('Load error:', error);
      set({ user: null, profile: null, loading: false, error: error.message });
    }
  }
}));
