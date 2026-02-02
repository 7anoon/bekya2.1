import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

export default function SetAdminRole() {
  const { user } = useAuthStore();
  const [status, setStatus] = useState('checking');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const setAdminRole = async () => {
      if (!user) {
        setStatus('error');
        setMessage('يجب تسجيل الدخول أولاً');
        return;
      }

      try {
        setStatus('updating');
        setMessage('جاري تحديث الصلاحيات...');
        
        const { data, error } = await supabase
          .from('profiles')
          .update({ role: 'admin' })
          .eq('id', user.id)
          .select();

        if (error) {
          setStatus('error');
          setMessage(`خطأ: ${error.message}`);
          return;
        }

        setStatus('success');
        setMessage('تم تعيين الصلاحيات كمدير بنجاح! سيتم إعادة توجيهك...');
        
        // Reload the user data
        setTimeout(() => {
          window.location.href = '/admin';
        }, 2000);
        
      } catch (err) {
        setStatus('error');
        setMessage(`خطأ غير متوقع: ${err.message}`);
      }
    };

    setAdminRole();
  }, [user]);

  const getStatusStyle = () => {
    switch (status) {
      case 'success': return { color: '#10b981', background: '#f0fdf4' };
      case 'error': return { color: '#ef4444', background: '#fee2e2' };
      case 'updating': return { color: '#f59e0b', background: '#fef3c7' };
      default: return { color: '#6b7280', background: '#f3f4f6' };
    }
  };

  return (
    <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <div className="card" style={{ padding: '40px', textAlign: 'center', maxWidth: '500px', ...getStatusStyle() }}>
        <h2 style={{ marginBottom: '16px' }}>
          {status === 'checking' && 'التحقق من الصلاحيات'}
          {status === 'updating' && 'تحديث الصلاحيات'}
          {status === 'success' && 'تم التحديث بنجاح'}
          {status === 'error' && 'حدث خطأ'}
        </h2>
        <p style={{ fontSize: '18px', marginBottom: '24px' }}>{message}</p>
        
        {status === 'error' && (
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button 
              className="btn btn-primary" 
              onClick={() => window.location.reload()}
            >
              إعادة المحاولة
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={() => window.location.href = '/'}
            >
              العودة للرئيسية
            </button>
          </div>
        )}
      </div>
    </div>
  );
}