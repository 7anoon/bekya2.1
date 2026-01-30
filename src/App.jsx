import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { supabase } from './lib/supabase';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Home from './pages/Home';
import Browse from './pages/Browse';
import AddProduct from './pages/AddProduct';

// Splash Screen Component
function SplashScreen({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [textIndex, setTextIndex] = useState(0);

  const messages = [
    { icon: '🛒', text: 'بيكيا', subtitle: 'الحاجة القديمة لسه ليها قيمة' },
    { icon: '💎', text: 'جودة عالية', subtitle: 'منتجات مفحوصة بعناية' },
    { icon: '🚀', text: 'بيع سريع', subtitle: 'وصول لآلاف المشترين' },
    { icon: '✨', text: 'تجربة فريدة', subtitle: 'تصميم عصري وسهل' }
  ];

  useEffect(() => {
    const duration = 8000;
    const interval = 50;
    const steps = duration / interval;
    const increment = 100 / steps;

    const progressTimer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressTimer);
          setTimeout(() => {
            if (onComplete) onComplete();
          }, 500);
          return 100;
        }
        return prev + increment;
      });
    }, interval);

    const textTimer = setInterval(() => {
      setTextIndex(prev => (prev + 1) % messages.length);
    }, 2000);

    return () => {
      clearInterval(progressTimer);
      clearInterval(textTimer);
    };
  }, [onComplete]);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ fontSize: '60px', marginBottom: '40px' }} className="splash-logo">{messages[textIndex].icon}</div>
        <h1 style={{ fontSize: '56px', fontWeight: '900', marginBottom: '16px' }} className="netflix-shimmer splash-fade-in">{messages[textIndex].text}</h1>
        <p style={{ fontSize: '20px', color: '#d1d5db', marginBottom: '60px' }} className="splash-fade-in-delay">{messages[textIndex].subtitle}</p>
        <div style={{ maxWidth: '400px', margin: '0 auto' }}>
          <div style={{ width: '100%', height: '6px', background: 'rgba(107, 124, 89, 0.2)', borderRadius: '10px', overflow: 'hidden', marginBottom: '12px' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #6b7c59 0%, #8b7355 100%)', borderRadius: '10px', transition: 'width 0.3s ease' }} />
          </div>
          <p style={{ fontSize: '14px', color: '#9ca3af', fontWeight: '600' }}>{Math.round(progress)}%</p>
        </div>
      </div>
    </div>
  );
}

// Onboarding Component
function Onboarding({ onComplete }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    { icon: '📸', title: 'صور منتجك', description: 'التقط صور واضحة لمنتجك من زوايا مختلفة. كل صورة تزيد من فرص البيع!', color: '#6b7c59' },
    { icon: '🤖', title: 'الذكاء الاصطناعي يساعدك', description: 'نظامنا الذكي يقترح السعر المناسب ويحلل حالة المنتج تلقائياً', color: '#8b7355' },
    { icon: '✅', title: 'موافقة سريعة', description: 'فريقنا يراجع منتجك بسرعة ويوافق عليه في أقل من 24 ساعة', color: '#10b981' },
    { icon: '💰', title: 'ابدأ البيع', description: 'منتجك يظهر لآلاف المشترين. استقبل العروض وابدأ التفاوض!', color: '#f59e0b' }
  ];

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: '#0a0e27', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9998 }}>
      <button style={{ position: 'absolute', top: '40px', left: '40px', background: 'rgba(107, 124, 89, 0.2)', color: '#d1d5db', border: 'none', padding: '12px 24px', borderRadius: '20px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }} onClick={onComplete}>تخطي</button>
      <div style={{ textAlign: 'center', padding: '40px', maxWidth: '600px' }}>
        <div style={{ fontSize: '100px', marginBottom: '40px' }}>{slides[currentSlide].icon}</div>
        <h1 style={{ fontSize: '48px', fontWeight: '900', color: '#f9fafb', marginBottom: '24px' }}>{slides[currentSlide].title}</h1>
        <p style={{ fontSize: '20px', color: '#d1d5db', lineHeight: '1.8', marginBottom: '60px' }}>{slides[currentSlide].description}</p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '40px' }}>
          {slides.map((_, index) => (
            <div key={index} style={{ width: index === currentSlide ? '40px' : '12px', height: '12px', borderRadius: index === currentSlide ? '6px' : '50%', background: index === currentSlide ? slides[currentSlide].color : 'rgba(107, 124, 89, 0.3)', cursor: 'pointer', transition: 'all 0.3s ease' }} onClick={() => setCurrentSlide(index)} />
          ))}
        </div>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
          {currentSlide > 0 && (
            <button style={{ padding: '16px 32px', background: 'rgba(107, 124, 89, 0.2)', color: '#d1d5db', border: '2px solid rgba(107, 124, 89, 0.3)', borderRadius: '50px', fontSize: '16px', fontWeight: '700', cursor: 'pointer' }} onClick={() => setCurrentSlide(currentSlide - 1)}>السابق</button>
          )}
          <button style={{ padding: '16px 48px', background: `linear-gradient(135deg, ${slides[currentSlide].color} 0%, ${slides[currentSlide].color}dd 100%)`, color: 'white', border: 'none', borderRadius: '50px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', flex: currentSlide === 0 ? 1 : 'initial' }} onClick={() => currentSlide < slides.length - 1 ? setCurrentSlide(currentSlide + 1) : onComplete()}>
            {currentSlide === slides.length - 1 ? 'ابدأ الآن' : 'التالي'}
          </button>
        </div>
      </div>
    </div>
  );
}
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import ManageOffers from './pages/ManageOffers';
import Notifications from './pages/Notifications';
import ProductDetails from './pages/ProductDetails';
import Navbar from './components/Navbar';

function App() {
  const { user, profile, loading, loadUser } = useAuthStore();
  const [showSplash, setShowSplash] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  useEffect(() => {
    let mounted = true;
    console.log('App: Component mounted, initializing...');
    
    const initApp = async () => {
      try {
        console.log('App: Loading user data...');
        await loadUser();
        console.log('App: User data loaded');
        
        if (mounted) {
          const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
          console.log('App: Onboarding status:', hasSeenOnboarding);
          // Show onboarding only for new users who haven't seen it
          if (!hasSeenOnboarding && !user) {
            console.log('App: Showing onboarding');
            setShowOnboarding(true);
          }
          // Mark initial load as done immediately
          setInitialLoadDone(true);
        }
      } catch (error) {
        console.error('App: Init error:', error);
        // Even on error, mark as loaded to avoid infinite loading
        if (mounted) {
          setInitialLoadDone(true);
        }
      } finally {
        if (mounted) {
          console.log('App: Initialization complete');
          setInitialLoadDone(true);
        }
      }
    };

    initApp();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('App: Auth state changed:', _event, session?.user?.id);
      if (mounted) {
        loadUser();
      }
    });

    return () => {
      console.log('App: Component unmounting, cleaning up...');
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadUser, user]);

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  if (showOnboarding) {
    return <Onboarding onComplete={() => { localStorage.setItem('hasSeenOnboarding', 'true'); setShowOnboarding(false); }} />;
  }

  // Remove loading screen entirely - show app content immediately
  // The app will handle loading states internally if needed

  // Debug info
  console.log('App State:', { user: !!user, profile: !!profile, loading, showSplash, showOnboarding });
  
  // If user is logged in but we're still showing login page, force redirect
  if (user && window.location.hash === '#/login') {
    console.log('User logged in but on login page, redirecting...');
    window.location.hash = '#/';
  }

  return (
    <BrowserRouter basename="/bekya2.1">
      {user && <Navbar />}
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        <Route path="/signup" element={!user ? <SignUp /> : <Navigate to="/" />} />
        <Route path="/" element={user ? <Home /> : <Navigate to="/login" />} />
        <Route path="/browse" element={user ? <Browse /> : <Navigate to="/login" />} />
        <Route path="/add-product" element={user ? <AddProduct /> : <Navigate to="/login" />} />
        <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
        <Route path="/notifications" element={user ? <Notifications /> : <Navigate to="/login" />} />
        <Route path="/product/:id" element={user ? <ProductDetails /> : <Navigate to="/login" />} />
        <Route 
          path="/admin" 
          element={user && profile?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/" />} 
        />
        <Route 
          path="/admin/offers" 
          element={user && profile?.role === 'admin' ? <ManageOffers /> : <Navigate to="/" />} 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
