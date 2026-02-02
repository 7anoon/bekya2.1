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
    set({ error: null, isLoading: true });
    
    // Timeout handler
    const timeoutId = setTimeout(() => {
      throw new Error('انتهت مهلة الاتصال. تأكد من اتصالك بالإنترنت وحاول مرة أخرى');
    }, 15000);
    
    try {
      // Validate inputs
      if (!username || username.length < 3) {
        throw new Error('اسم المستخدم يجب أن يكون 3 أحرف على الأقل');
      }
      if (!email || !email.includes('@')) {
        throw new Error('البريد الإلكتروني غير صحيح');
      }
      if (!password || password.length < 6) {
        throw new Error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      }
      if (!phone || phone.length < 11) {
        throw new Error('رقم الهاتف غير صحيح');
      }

      // Check if username is already taken
      const { data: existingUser, error: checkError } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .maybeSingle();

      if (checkError && !checkError.message.includes('No rows')) {
        throw new Error('خطأ في التحقق من اسم المستخدم. حاول مرة أخرى');
      }

      if (existingUser) {
        throw new Error('اسم المستخدم موجود بالفعل. اختر اسماً آخر');
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { 
            username,
            location,
            phone
          },
          emailRedirectTo: window.location.origin + '/bekya2.1/'
        }
      });

      if (error) {
        if (error.message.includes('already registered')) {
          throw new Error('البريد الإلكتروني مسجل بالفعل');
        }
        if (error.message.includes('User already registered')) {
          throw new Error('البريد الإلكتروني مسجل بالفعل');
        }
        if (error.status === 422) {
          throw new Error('البيانات غير صحيحة. تأكد من صحة البريد الإلكتروني وكلمة المرور');
        }
        throw new Error(`خطأ في التسجيل: ${error.message}`);
      }

      // Check if email confirmation is required
      if (data.user && !data.session) {
        // Email confirmation required
        throw new Error('تم إرسال رسالة تأكيد إلى بريدك الإلكتروني. يرجى تأكيد البريد أولاً');
      }

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
          throw new Error('تم إنشاء الحساب لكن حدث خطأ في حفظ البيانات. تواصل مع الدعم');
        }
      }

      clearTimeout(timeoutId);
      set({ isLoading: false });
      return data;
    } catch (err) {
      clearTimeout(timeoutId);
      logError('Sign up error:', err);
      const errorMessage = err.message || 'حدث خطأ غير متوقع. حاول مرة أخرى';
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  signIn: async (username, password) => {
    set({ error: null, isLoading: true });
    
    console.log('authStore.signIn: Starting...');
    
    // Timeout handler
    const timeoutId = setTimeout(() => {
      console.error('authStore.signIn: Timeout!');
      set({ isLoading: false });
      throw new Error('انتهت مهلة الاتصال. تأكد من اتصالك بالإنترنت');
    }, 15000);
    
    try {
      // Validate inputs
      if (!username || username.trim().length === 0) {
        clearTimeout(timeoutId);
        set({ isLoading: false });
        throw new Error('أدخل اسم المستخدم أو البريد الإلكتروني');
      }
      if (!password || password.length === 0) {
        clearTimeout(timeoutId);
        set({ isLoading: false });
        throw new Error('أدخل كلمة المرور');
      }

      console.log('authStore.signIn: Checking if email or username...');
      
      // Check if input is email or username
      const isEmail = username.includes('@');
      let email = username;
      
      if (!isEmail) {
        console.log('authStore.signIn: Looking up email for username:', username);
        
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('email')
            .eq('username', username.trim())
            .single();

          console.log('authStore.signIn: Profile lookup result:', { profile, error: profileError });

          if (profileError) {
            console.error('Profile lookup error:', profileError);
            if (profileError.message?.includes('fetch')) {
              throw new Error('مشكلة في الاتصال بالخادم. تأكد من اتصالك بالإنترنت');
            }
            throw new Error('اسم المستخدم غير موجود. تأكد من كتابته بشكل صحيح');
          }
          
          if (!profile) {
            throw new Error('اسم المستخدم غير موجود. تأكد من كتابته بشكل صحيح');
          }
          
          email = profile.email;
        } catch (lookupError) {
          clearTimeout(timeoutId);
          set({ isLoading: false });
          throw lookupError;
        }
      }
      
      console.log('authStore.signIn: Attempting sign in with email:', email);
      
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      console.log('authStore.signIn: Auth result:', { 
        hasUser: !!authData?.user, 
        hasSession: !!authData?.session,
        error: authError 
      });

      if (authError) {
        console.error('authStore.signIn: Auth error:', authError);
        clearTimeout(timeoutId);
        set({ isLoading: false });
        
        if (authError.message?.includes('Invalid login credentials')) {
          throw new Error('كلمة المرور غير صحيحة');
        }
        if (authError.message?.includes('Email not confirmed')) {
          throw new Error('يجب تأكيد البريد الإلكتروني أولاً');
        }
        if (authError.message?.includes('fetch') || authError.message?.includes('network')) {
          throw new Error('مشكلة في الاتصال بالخادم. تأكد من اتصالك بالإنترنت');
        }
        throw new Error('خطأ في تسجيل الدخول. حاول مرة أخرى');
      }

      if (!authData?.user) {
        clearTimeout(timeoutId);
        set({ isLoading: false });
        throw new Error('فشل تسجيل الدخول. حاول مرة أخرى');
      }
      
      console.log('authStore.signIn: Fetching user profile...');
      
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      console.log('authStore.signIn: Profile fetch result:', { 
        hasProfile: !!userProfile, 
        error: profileError 
      });

      if (profileError) {
        logError('Profile fetch error:', profileError);
        // Continue anyway with basic user data
      }
      
      clearTimeout(timeoutId);
      
      console.log('authStore.signIn: Setting user state...');
      set({ user: authData.user, profile: userProfile, isLoading: false });
      
      console.log('authStore.signIn: Success! User:', authData.user.id);
      return authData;
      
    } catch (err) {
      clearTimeout(timeoutId);
      console.error('authStore.signIn: Caught error:', err);
      const errorMessage = err.message || 'حدث خطأ غير متوقع. حاول مرة أخرى';
      set({ error: errorMessage, isLoading: false });
      throw err;
    }
  },

  signOut: async () => {
    set({ error: null });
    try {
      // Clear local state first
      set({ user: null, profile: null });
      
      // Clear all Supabase data from localStorage
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('sb-')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Try to sign out from Supabase (ignore errors if session missing)
      await supabase.auth.signOut().catch(() => {
        // Ignore session missing errors
      });
      
    } catch (err) {
      logError('Sign out error:', err);
      // Still clear local state even if Supabase signOut fails
      set({ user: null, profile: null });
    }
  },

  loadUser: async () => {
    set({ error: null, isLoading: true });
    
    try {
      // Add small delay on mobile for session to load properly
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      // Timeout for slow connections
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('timeout')), 10000)
      );
      
      // Use getSession instead of getUser for faster response
      const sessionPromise = supabase.auth.getSession();
      
      const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]);
      
      if (!session?.user) {
        set({ user: null, profile: null, isLoading: false });
        return;
      }
      
      // Set user immediately from session
      set({ user: session.user, isLoading: false });
      
      // Load profile in background with retry
      let retries = 3;
      let profile = null;
      
      while (retries > 0 && !profile) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (!error) {
            profile = data;
          } else {
            retries--;
            if (retries > 0) await new Promise(r => setTimeout(r, 1000));
          }
        } catch (err) {
          retries--;
          if (retries > 0) await new Promise(r => setTimeout(r, 1000));
        }
      }
      
      set({ profile: profile || { id: session.user.id, email: session.user.email, role: 'user' } });
      
    } catch (error) {
      if (error.message === 'timeout') {
        logError('Session load timeout - continuing without session');
      }
      set({ user: null, profile: null, isLoading: false });
    }
  }
}));
