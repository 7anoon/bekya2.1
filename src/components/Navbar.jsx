import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Navbar() {
  const { profile, signOut } = useAuthStore();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  // Debug: طباعة معلومات الـ profile
  useEffect(() => {
    console.log('=== Navbar Profile Debug ===');
    console.log('Profile:', profile);
    console.log('Profile Role:', profile?.role);
    console.log('Is Admin?', profile?.role === 'admin');
    console.log('========================');
  }, [profile]);

  useEffect(() => {
    if (profile?.id) {
      // طلب إذن الإشعارات من المتصفح
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
      
      loadUnreadCount();
      
      // الاستماع للإشعارات الجديدة والتحديثات في الوقت الفعلي
      const channel = supabase
        .channel('notifications-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${profile.id}`
          },
          (payload) => {
            console.log('إشعار جديد:', payload);
            // تشغيل الصوت مع كل إشعار جديد
            playNotificationSound();
            
            // رسالة مخصصة حسب نوع الإشعار
            const message = payload.new?.message || 'لديك إشعار جديد!';
            showBrowserNotification(message);
            
            // تحديث العدد
            loadUnreadCount();
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${profile.id}`
          },
          (payload) => {
            console.log('إشعار تم تحديثه:', payload);
            // تحديث العدد عند تعليم الإشعارات كمقروءة
            loadUnreadCount();
          }
        )
        .subscribe();
      
      // الاستماع لحدث تحديث الإشعارات (عند القراءة)
      const handleNotificationsUpdate = () => {
        loadUnreadCount();
      };
      window.addEventListener('notificationsUpdated', handleNotificationsUpdate);
      
      return () => {
        channel.unsubscribe();
        window.removeEventListener('notificationsUpdated', handleNotificationsUpdate);
      };
    }
  }, [profile]);

  const loadUnreadCount = async () => {
    if (!profile?.id) return;
    
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.id)
        .eq('read', false);

      if (!error) {
        console.log('Unread count updated:', count); // للتأكد
        setUnreadCount(count || 0);
      }
    } catch (err) {
      console.error('Error loading unread count:', err);
    }
  };



  const showBrowserNotification = (message = 'لديك إشعار جديد! منتج جديد متاح في منطقتك') => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('بيكيا - إشعار جديد', {
        body: message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'bekya-notification',
        requireInteraction: false
      });
    }
  };

  const playNotificationSound = () => {
    try {
      // محاولة تشغيل ملف صوت (إذا كان موجود)
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.5;
      
      audio.play().catch(() => {
        // إذا فشل تشغيل الملف، استخدم Web Audio API
        playGeneratedSound();
      });
      
    } catch (err) {
      // إذا حدث خطأ، استخدم Web Audio API
      playGeneratedSound();
    }
  };

  const playGeneratedSound = () => {
    try {
      // إنشاء صوت إشعار بسيط باستخدام Web Audio API
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // نغمة 1 (دينج)
      const oscillator1 = audioContext.createOscillator();
      const gainNode1 = audioContext.createGain();
      
      oscillator1.connect(gainNode1);
      gainNode1.connect(audioContext.destination);
      
      oscillator1.frequency.value = 800; // تردد النغمة
      oscillator1.type = 'sine'; // نوع الموجة
      
      gainNode1.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
      
      oscillator1.start(audioContext.currentTime);
      oscillator1.stop(audioContext.currentTime + 0.15);
      
      // نغمة 2 (دونج - بعد 0.1 ثانية)
      setTimeout(() => {
        const oscillator2 = audioContext.createOscillator();
        const gainNode2 = audioContext.createGain();
        
        oscillator2.connect(gainNode2);
        gainNode2.connect(audioContext.destination);
        
        oscillator2.frequency.value = 1000;
        oscillator2.type = 'sine';
        
        gainNode2.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
        
        oscillator2.start(audioContext.currentTime);
        oscillator2.stop(audioContext.currentTime + 0.15);
      }, 100);
      
    } catch (err) {
      console.error('Error playing generated sound:', err);
    }
  };

  const handleSignOut = async () => {
    console.log('Logout button clicked!');
    try {
      await signOut();
      console.log('Logout successful, navigating to login...');
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Don't show alert, just navigate to login anyway
      navigate('/login');
    }
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <nav style={styles.nav}>
      <div className="container" style={styles.container}>
        <Link to="/" style={styles.logo}>
          بيكيا 🛒
        </Link>
        
        <div style={styles.rightSection}>
          {/* Notification Bell - Always Visible */}
          <Link to="/notifications" style={styles.notificationLink}>
            <span style={styles.bellIcon}>🔔</span>
            {unreadCount > 0 && (
              <span style={styles.badge}>{unreadCount}</span>
            )}
          </Link>
          
          {/* Hamburger Menu Button for Mobile */}
          <button 
            onClick={toggleMenu} 
            className="navbar-hamburger"
            style={styles.hamburger}
            aria-label="القائمة"
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
        
        <div 
          className={`navbar-menu ${menuOpen ? 'menu-open' : 'menu-closed'}`}
          style={styles.menu}
        >
          <Link to="/" style={styles.link} onClick={() => setMenuOpen(false)}>الرئيسية</Link>
          <Link to="/add-product" style={styles.link} onClick={() => setMenuOpen(false)}>إضافة منتج</Link>
          <Link to="/profile" style={styles.link} onClick={() => setMenuOpen(false)}>حسابي</Link>
          {profile?.role === 'admin' && (
            <>
              <Link to="/admin" style={styles.link} onClick={() => setMenuOpen(false)}>لوحة الإدارة</Link>
              <Link to="/admin/offers" style={styles.link} onClick={() => setMenuOpen(false)}>إدارة العروض</Link>
            </>
          )}
          <button 
            onClick={handleSignOut} 
            style={styles.logoutBtn}
            type="button"
          >
            تسجيل خروج
          </button>
        </div>
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    background: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    boxShadow: '0 2px 20px rgba(31, 38, 135, 0.1)',
    marginBottom: '32px',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    borderBottom: '1px solid rgba(107, 124, 89, 0.1)'
  },
  container: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 28px',
    position: 'relative'
  },
  logo: {
    fontSize: '28px',
    fontWeight: '800',
    background: 'linear-gradient(135deg, #6b7c59 0%, #556b2f 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    textDecoration: 'none',
    zIndex: 101,
    letterSpacing: '-0.5px',
    transition: 'all 0.3s ease'
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
    zIndex: 101
  },
  hamburger: {
    display: 'none',
    fontSize: '28px',
    background: 'none',
    border: 'none',
    color: '#6b7c59',
    cursor: 'pointer',
    padding: '8px',
    zIndex: 101,
    transition: 'all 0.3s ease'
  },
  menu: {
    display: 'flex',
    gap: '28px',
    alignItems: 'center'
  },
  link: {
    color: '#718096',
    textDecoration: 'none',
    fontWeight: '600',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    whiteSpace: 'nowrap',
    fontSize: '15px',
    position: 'relative',
    padding: '8px 0'
  },
  notificationLink: {
    position: 'relative',
    color: '#718096',
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    padding: '10px',
    transition: 'all 0.3s ease',
    borderRadius: '12px'
  },
  bellIcon: {
    fontSize: '22px'
  },
  badge: {
    position: 'absolute',
    top: '2px',
    right: '2px',
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    color: 'white',
    borderRadius: '50%',
    width: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    fontWeight: '700',
    border: '2px solid white',
    boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)',
    animation: 'pulse 2s ease-in-out infinite'
  },
  logoutBtn: {
    padding: '10px 24px',
    background: 'linear-gradient(135deg, #8b7355 0%, #6d5a42 100%)',
    color: 'white',
    borderRadius: '20px',
    fontWeight: '600',
    whiteSpace: 'nowrap',
    fontSize: '14px',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 4px 12px rgba(139, 115, 85, 0.3)',
    border: 'none'
  }
};

// Add media query styles
if (typeof window !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    .navbar-hamburger {
      display: none;
    }
    
    @media (max-width: 768px) {
      .navbar-hamburger {
        display: block !important;
      }
      
      .navbar-menu {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: rgba(17, 24, 39, 0.98);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(107, 124, 89, 0.2);
        flex-direction: column;
        padding: 16px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        gap: 12px !important;
        align-items: stretch !important;
        transition: all 0.3s ease;
      }
      
      .navbar-menu.menu-closed {
        display: none !important;
      }
      
      .navbar-menu.menu-open {
        display: flex !important;
      }
      
      .navbar-menu a,
      .navbar-menu button {
        width: 100%;
        text-align: center;
        padding: 12px !important;
        display: block;
      }
    }
  `;
  document.head.appendChild(style);
}
