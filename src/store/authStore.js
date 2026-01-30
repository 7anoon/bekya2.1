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
    console.log('authStore: Quick load starting...');
    
    try {
      // Don't set loading state to avoid UI blocking
      // set({ loading: true });
      
      // Quick load without timeouts for immediate response
      console.log('authStore: Checking session...');
      const { data: { session } } = await supabase.auth.getSession();
      console.log('authStore: Session:', session ? 'FOUND' : 'NOT FOUND');
      
      if (!session) {
        console.log('authStore: No session, setting null user');
        set({ user: null, profile: null });
        return;
      }
      
      console.log('authStore: Getting user...');
      const { data: { user } } = await supabase.auth.getUser();
      console.log('authStore: User:', user ? user.id : 'NULL');
      
      if (user) {
        console.log('authStore: Getting profile...');
        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          
          console.log('authStore: Profile:', profile ? 'FOUND' : 'NOT FOUND');
          
          if (profile) {
            console.log('authStore: Setting user and profile');
            set({ user, profile });
          } else {
            console.log('authStore: Creating minimal profile');
            const minimalProfile = {
              id: user.id,
              username: user.email.split('@')[0],
              email: user.email,
              role: 'user'
            };
            set({ user, profile: minimalProfile });
          }
        } catch (profileError) {
          console.log('authStore: Profile error, creating minimal profile');
          const minimalProfile = {
            id: user.id,
            username: user.email.split('@')[0],
            email: user.email,
            role: 'user'
          };
          set({ user, profile: minimalProfile });
        }
      } else {
        console.log('authStore: No user found');
        set({ user: null, profile: null });
      }
      
    } catch (error) {
      console.error('authStore: Quick load error:', error.message);
      set({ user: null, profile: null });
    } finally {
      console.log('authStore: Quick load complete');
    }
  }
}));
