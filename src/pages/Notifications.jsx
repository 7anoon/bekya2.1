import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export default function Notifications() {
  const { profile } = useAuthStore();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadNotifications();
    
    // الاستماع للإشعارات الجديدة باستخدام Supabase Realtime
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${profile.id}`
        },
        (payload) => {
          // إضافة الإشعار الجديد إلى القائمة
          setNotifications(prev => [payload.new, ...prev]);
          // تشغيل صوت الإشعار
          playNotificationSound();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const playNotificationSound = () => {
    try {
      const audio = new Audio('/notification-sound.mp3');
      audio.play().catch(e => console.log('Sound play failed:', e));
    } catch (e) {
      console.log('Sound playback error:', e);
    }
  };

  const loadNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*, products(title, images, final_price)')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotifications(data || []);
    } catch (err) {
      console.error('Error loading notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      // تحديث قاعدة البيانات
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);
      
      if (error) throw error;
      
      // تحديث الحالة المحلية فوراً
      setNotifications(prevNotifications => 
        prevNotifications.map(notif => 
          notif.id === notificationId 
            ? { ...notif, read: true }
            : notif
        )
      );
      
      // إطلاق حدث لتحديث Navbar
      window.dispatchEvent(new Event('notificationsUpdated'));
      
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      // تحديث قاعدة البيانات
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', profile.id)
        .eq('read', false);
      
      if (error) {
        console.error('Database error:', error);
        throw error;
      }
      
      // تحديث الحالة المحلية فوراً
      setNotifications(prevNotifications => 
        prevNotifications.map(notif => ({
          ...notif,
          read: true
        }))
      );
      
      // إطلاق حدث لتحديث Navbar
      window.dispatchEvent(new Event('notificationsUpdated'));
      
      // رسالة نجاح
      alert('تم تعليم جميع الإشعارات كمقروءة ✓');
      
    } catch (err) {
      console.error('Error marking all as read:', err);
      alert('حدث خطأ في تعليم الإشعارات');
    }
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    if (notification.product_id) {
      navigate(`/product/${notification.product_id}`);
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      new_product: '🆕',
      product_approved: '✅',
      product_rejected: '❌',
      price_negotiation: '🤝',
      price_rejected: '⚠️',
      price_update: '💰',
      negotiation: '🤝',
      approved: '✅',
      rejected: '❌',
      offer: '🎉'
    };
    return icons[type] || '📢';
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diffMs = now - notifDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    return `منذ ${diffDays} يوم`;
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="container">
      <div style={styles.header}>
        <h1 style={styles.title}>الإشعارات</h1>
        {unreadCount > 0 && (
          <button 
            className="btn"
            onClick={markAllAsRead}
            style={styles.markAllBtn}
          >
            ✓ تعليم الكل كمقروء ({unreadCount})
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="card" style={styles.empty}>
          <p>لا توجد إشعارات</p>
        </div>
      ) : (
        <div style={styles.notificationsList}>
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className="card"
              style={{
                ...styles.notificationCard,
                ...(notification.read ? {} : styles.unreadCard)
              }}
              onClick={() => handleNotificationClick(notification)}
            >
              <div style={styles.notificationContent}>
                <div style={styles.iconContainer}>
                  <span style={styles.icon}>
                    {getNotificationIcon(notification.type)}
                  </span>
                </div>
                
                <div style={styles.notificationBody}>
                  <p style={styles.message}>{notification.message}</p>
                  
                  {notification.products && (
                    <div style={styles.productPreview}>
                      {notification.products.images && notification.products.images[0] && (
                        <img 
                          src={notification.products.images[0]} 
                          alt={notification.products.title}
                          style={styles.productImage}
                        />
                      )}
                      <div>
                        <p style={styles.productTitle}>{notification.products.title}</p>
                        {notification.products.final_price && (
                          <p style={styles.productPrice}>
                            {notification.products.final_price} جنيه
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <span style={styles.time}>
                    {getTimeAgo(notification.created_at)}
                  </span>
                </div>

                {!notification.read && (
                  <div style={styles.unreadDot}></div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    flexWrap: 'wrap',
    gap: '16px'
  },
  title: {
    fontSize: '32px',
    color: '#10b981',
    margin: 0
  },
  markAllBtn: {
    fontSize: '14px',
    background: '#10b981',
    color: 'white',
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '600',
    transition: 'all 0.3s',
    whiteSpace: 'nowrap'
  },
  empty: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#6b7280'
  },
  notificationsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  notificationCard: {
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    position: 'relative'
  },
  unreadCard: {
    background: '#f0fdf4',
    borderLeft: '4px solid #10b981'
  },
  notificationContent: {
    display: 'flex',
    gap: '16px',
    alignItems: 'flex-start'
  },
  iconContainer: {
    flex: '0 0 50px',
    height: '50px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f3f4f6',
    borderRadius: '50%'
  },
  icon: {
    fontSize: '24px'
  },
  notificationBody: {
    flex: '1'
  },
  message: {
    fontSize: '16px',
    color: '#1f2937',
    marginBottom: '8px',
    lineHeight: '1.5'
  },
  productPreview: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    padding: '12px',
    background: 'white',
    borderRadius: '8px',
    marginBottom: '8px'
  },
  productImage: {
    width: '60px',
    height: '60px',
    objectFit: 'cover',
    borderRadius: '6px'
  },
  productTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '4px'
  },
  productPrice: {
    fontSize: '14px',
    color: '#10b981',
    fontWeight: '600'
  },
  time: {
    fontSize: '12px',
    color: '#9ca3af'
  },
  unreadDot: {
    width: '10px',
    height: '10px',
    background: '#10b981',
    borderRadius: '50%',
    position: 'absolute',
    top: '24px',
    right: '24px'
  }
};
