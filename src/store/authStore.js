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
    set({ error: null });
    
    try {
      log('=== SIGN IN START ===');
      log('Input:', username);
      
      // Check if input is email or username
      const isEmail = username.includes('@');
      let email = username;
      
      if (!isEmail) {
        // Try to get email from profiles
        log('Looking up email for username...');
        
        // Add retry logic for profile lookup
        let profile = null;
        let profileError = null;
        
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            const result = await supabase
              .from('profiles')
              .select('email')
              .eq('username', username)
              .single();
            
            profile = result.data;
            profileError = result.error;
            
            if (!profileError || profileError.code !== 'PGRST116') {
              break;
            }
            
            if (attempt < 3) {
              log(`Profile lookup attempt ${attempt} failed, retrying...`);
              await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
          } catch (e) {
            profileError = e;
            if (attempt < 3) {
              log(`Profile lookup attempt ${attempt} failed with exception, retrying...`);
              await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
          }
        }

        log('Profile lookup:', { found: !!profile, error: !!profileError });

        if (profileError && profileError.code !== 'PGRST116') {
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
      
      // Try to sign in with retry logic
      log('Attempting auth...');
      let authData = null;
      let authError = null;
      
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const result = await supabase.auth.signInWithPassword({
            email,
            password
          });
          
          authData = result.data;
          authError = result.error;
          
          if (!authError) {
            break;
          }
          
          if (attempt < 3) {
            log(`Auth attempt ${attempt} failed, retrying...`);
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          }
        } catch (e) {
          authError = e;
          if (attempt < 3) {
            log(`Auth attempt ${attempt} failed with exception, retrying...`);
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          }
        }
      }

      log('Auth result:', { success: !!authData?.user, error: !!authError });

      if (authError) {
        logError('Auth error:', authError);
        
        if (authError.message?.includes('Invalid')) {
          throw new Error('كلمة المرور غير صحيحة');
        }
        if (authError.message?.includes('AbortError')) {
          throw new Error('خطأ في الاتصال بالخادم. يرجى التحقق من الاتصال بالإنترنت وإعادة المحاولة');
        }
        throw new Error('خطأ في تسجيل الدخول');
      }

      if (!authData?.user) {
        throw new Error('فشل تسجيل الدخول');
      }

      log('Login successful! User ID:', authData.user.id);
      
      // Load profile with retry logic
      log('Loading profile...');
      let userProfile = null;
      let profileError = null;
      
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const result = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single();
          
          userProfile = result.data;
          profileError = result.error;
          
          if (!profileError || profileError.code !== 'PGRST116') {
            break;
          }
          
          if (attempt < 3) {
            log(`Profile load attempt ${attempt} failed, retrying...`);
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          }
        } catch (e) {
          profileError = e;
          if (attempt < 3) {
            log(`Profile load attempt ${attempt} failed with exception, retrying...`);
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          }
        }
      }
      
      if (profileError && profileError.code !== 'PGRST116') {
        logError('Profile fetch error:', profileError);
        // Set user without full profile
        set({ 
          user: authData.user, 
          profile: {
            id: authData.user.id,
            email: authData.user.email,
            username: authData.user.email?.split('@')[0],
            role: 'user'
          }
        });
      } else {
        log('Profile loaded:', userProfile?.username, 'Role:', userProfile?.role);
        set({ user: authData.user, profile: userProfile });
      }
      
      log('=== SIGN IN COMPLETE ===');
      return authData;
      
    } catch (err) {
      logError('=== SIGN IN ERROR ===', err);
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
    log('Starting loadUser...');
    set({ error: null });
    
    try {
      log('Checking session...');
      
      // Add retry logic for session check
      let sessionData = null;
      let sessionError = null;
      
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const result = await supabase.auth.getSession();
          sessionData = result.data;
          sessionError = result.error;
          
          if (!sessionError) {
            break;
          }
          
          if (attempt < 3) {
            log(`Session check attempt ${attempt} failed, retrying...`);
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          }
        } catch (e) {
          sessionError = e;
          if (attempt < 3) {
            log(`Session check attempt ${attempt} failed with exception, retrying...`);
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          }
        }
      }
      
      if (sessionError) {
        logError('Session error:', sessionError);
        set({ user: null, profile: null });
        return;
      }
      
      const session = sessionData?.session;
      log('Session:', session ? 'FOUND' : 'NOT FOUND');
      
      if (!session) {
        log('No session, setting null user');
        set({ user: null, profile: null });
        return;
      }
      
      log('Getting user...');
      
      // Add retry logic for user check
      let userData = null;
      let userError = null;
      
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const result = await supabase.auth.getUser();
          userData = result.data;
          userError = result.error;
          
          if (!userError) {
            break;
          }
          
          if (attempt < 3) {
            log(`User check attempt ${attempt} failed, retrying...`);
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          }
        } catch (e) {
          userError = e;
          if (attempt < 3) {
            log(`User check attempt ${attempt} failed with exception, retrying...`);
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          }
        }
      }
      
      if (userError) {
        logError('User error:', userError);
        set({ user: null, profile: null });
        return;
      }
      
      const user = userData?.user;
      log('User:', user ? user.id : 'NULL');
      
      if (user) {
        log('Getting profile...');
        
        // Add retry logic for profile fetch
        let profile = null;
        let profileError = null;
        
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            const result = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .single();
            
            profile = result.data;
            profileError = result.error;
            
            if (!profileError || profileError.code !== 'PGRST116') {
              break;
            }
            
            if (attempt < 3) {
              log(`Profile fetch attempt ${attempt} failed, retrying...`);
              await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
          } catch (e) {
            profileError = e;
            if (attempt < 3) {
              log(`Profile fetch attempt ${attempt} failed with exception, retrying...`);
              await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
          }
        }
        
        if (profileError && profileError.code !== 'PGRST116') {
          logError('Profile error:', profileError);
          // Create minimal profile as fallback
          const minimalProfile = {
            id: user.id,
            username: user.email?.split('@')[0] || 'user',
            email: user.email,
            role: 'user'
          };
          set({ user, profile: minimalProfile });
          return;
        }
        
        log('Profile loaded:', profile ? 'FOUND' : 'NOT FOUND');
        
        if (profile) {
          log('Profile role:', profile.role);
          set({ user, profile });
        } else {
          const minimalProfile = {
            id: user.id,
            username: user.email?.split('@')[0] || 'user',
            email: user.email,
            role: 'user'
          };
          set({ user, profile: minimalProfile });
        }
      } else {
        log('No user found');
        set({ user: null, profile: null });
      }
      
    } catch (error) {
      logError('Load error:', error);
      set({ user: null, profile: null, error: error.message });
    }
  }
}));
