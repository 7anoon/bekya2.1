import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export const useAuthStore = create((set) => ({
  user: null,
  profile: null,
  loading: true,

  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),

  signUp: async (username, email, password, location, phone) => {
    try {
      // تحقق إن الـ username مش مستخدم
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
          console.error('Profile creation error:', profileError);
        }
      }

      return data;
    } catch (err) {
      console.error('Sign up error:', err);
      throw err;
    }
  },

  signIn: async (username, password) => {
    try {
      console.log('Attempting login for username:', username);
      
      // Check Supabase connection first
      const { data: health } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      
      console.log('Database connection test:', health);
      
      // جرب تجيب الـ email من profiles
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('username', username)
        .maybeSingle();

      if (profileError) {
        console.error('Profile error:', profileError);
        throw new Error('خطأ في الاتصال بقاعدة البيانات: ' + profileError.message);
      }

      if (!profile) {
        throw new Error('اسم المستخدم غير موجود');
      }

      console.log('Found email:', profile.email);
      
      // جرب تسجل الدخول
      const { data, error } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password
      });

      if (error) {
        console.error('Auth error:', error);
        if (error.message.includes('Invalid')) {
          throw new Error('كلمة المرور غير صحيحة');
        }
        throw new Error('خطأ في تسجيل الدخول: ' + error.message);
      }

      console.log('Login successful:', data);
      return data;
    } catch (err) {
      console.error('Sign in error:', err);
      throw err;
    }
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    set({ user: null, profile: null });
  },

  loadUser: async () => {
    const startTime = Date.now();
    console.log('Starting loadUser...');
    
    try {
      set({ loading: true });
      
      // Set max 5 second timeout for entire process
      const overallTimeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Overall timeout (5s)')), 5000)
      );
      
      const loadProcess = async () => {
        // Check session (2s timeout)
        console.log('Checking session...');
        const sessionPromise = supabase.auth.getSession();
        const sessionTimeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session timeout')), 2000)
        );
        
        const { data: { session } } = await Promise.race([sessionPromise, sessionTimeout]);
        console.log('Current session:', session);
        
        if (!session) {
          console.log('No session found');
          return { user: null, profile: null };
        }
        
        // Get user (2s timeout)
        console.log('Getting user info...');
        const userPromise = supabase.auth.getUser();
        const userTimeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('User timeout')), 2000)
        );
        
        const { data: { user } } = await Promise.race([userPromise, userTimeout]);
        console.log('Current user:', user);
        
        if (user) {
          console.log('Getting profile...');
          // Profile request (2s timeout)
          const profilePromise = supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          
          const profileTimeout = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Profile timeout')), 2000)
          );
          
          try {
            const result = await Promise.race([profilePromise, profileTimeout]);
            const profile = result.data;
            const error = result.error;

            console.log('Profile data:', profile);
            console.log('Profile error:', error);

            if (profile) {
              return { user, profile };
            } else {
              console.warn('No profile found, creating minimal profile');
              const minimalProfile = {
                id: user.id,
                username: user.email.split('@')[0],
                email: user.email,
                role: 'user'
              };
              return { user, profile: minimalProfile };
            }
          } catch (profileError) {
            console.warn('Profile timeout, creating minimal profile');
            const minimalProfile = {
              id: user.id,
              username: user.email.split('@')[0],
              email: user.email,
              role: 'user'
            };
            return { user, profile: minimalProfile };
          }
        }
        
        return { user: null, profile: null };
      };
      
      // Race between load process and overall timeout
      const { user, profile } = await Promise.race([loadProcess(), overallTimeout]);
      
      const loadTime = Date.now() - startTime;
      console.log(`Load completed in ${loadTime}ms`);
      
      set({ user, profile, loading: false });
      
    } catch (error) {
      const loadTime = Date.now() - startTime;
      console.error(`Load failed after ${loadTime}ms:`, error.message || error);
      set({ user: null, profile: null, loading: false });
    }
  }
}));
