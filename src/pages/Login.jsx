import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import ErrorMessage from '../components/ErrorMessage';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      console.log('=== LOGIN ATTEMPT ===');
      console.log('Username:', username);
      console.log('Window location:', window.location.href);
      
      // Check if Supabase is configured
      if (!import.meta.env.VITE_SUPABASE_URL && !window.location.href.includes('localhost')) {
        throw new Error('خطأ في إعدادات الموقع. تواصل مع الدعم الفني');
      }
      
      // Try login
      const result = await signIn(username, password);
      
      console.log('=== LOGIN SUCCESS ===');
      console.log('User ID:', result?.user?.id);
      
      // Small delay to ensure state is updated
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Navigate to home
      console.log('Navigating to home...');
      window.location.href = '/';
      
    } catch (err) {
      console.error('=== LOGIN ERROR ===');
      console.error('Error:', err);
      console.error('Error message:', err.message);
      
      // Show user-friendly error
      let errorMsg = err.message || 'خطأ في تسجيل الدخول';
      
      // Check for common issues
      if (err.message?.includes('fetch')) {
        errorMsg = 'مشكلة في الاتصال بالخادم. تأكد من اتصالك بالإنترنت';
      } else if (err.message?.includes('network')) {
        errorMsg = 'خطأ في الشبكة. حاول مرة أخرى';
      }
      
      setError(errorMsg);
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div className="card" style={styles.card}>
          <div style={styles.header}>
            <h1 style={styles.logo}>بيكيا 🛒</h1>
            <p style={styles.tagline}>الحاجة القديمة لسه ليها قيمة</p>
          </div>

          <h2 style={styles.title}>تسجيل الدخول</h2>

          <ErrorMessage 
            error={error} 
            onRetry={() => handleSubmit({ preventDefault: () => {} })}
            onDismiss={() => setError('')}
          />

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.field}>
              <label style={styles.label}>اسم المستخدم أو البريد الإلكتروني</label>
              <input
                type="text"
                className="input"
                style={styles.input}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder=""
                autoComplete="off"
                required
                disabled={isLoading}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>كلمة المرور</label>
              <input
                type="password"
                className="input"
                style={styles.input}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary"
              style={styles.button}
              disabled={isLoading}
            >
              {isLoading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
            </button>
          </form>

          <div style={styles.footer}>
            <p style={styles.footerText}>
              ليس لديك حساب؟{' '}
              <Link to="/signup" style={styles.link}>
                سجل الآن
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px'
  },
  content: {
    width: '100%',
    maxWidth: '450px'
  },
  card: {
    padding: '48px 40px'
  },
  header: {
    textAlign: 'center',
    marginBottom: '40px'
  },
  logo: {
    fontSize: '48px',
    fontWeight: '900',
    marginBottom: '12px',
    background: 'linear-gradient(135deg, #6b7c59 0%, #8b7355 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  },
  tagline: {
    fontSize: '16px',
    color: '#9ca3af'
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#f9fafb',
    marginBottom: '32px',
    textAlign: 'center'
  },
  error: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '8px',
    padding: '12px 16px',
    marginBottom: '24px',
    color: '#fca5a5',
    fontSize: '14px',
    textAlign: 'center'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#e5e7eb'
  },
  input: {
    width: '100%'
  },
  button: {
    width: '100%',
    marginTop: '8px'
  },
  footer: {
    marginTop: '32px',
    paddingTop: '24px',
    borderTop: '1px solid rgba(107, 124, 89, 0.2)',
    textAlign: 'center'
  },
  footerText: {
    fontSize: '14px',
    color: '#9ca3af'
  },
  link: {
    color: '#6b7c59',
    fontWeight: '600',
    textDecoration: 'none',
    transition: 'color 0.3s ease'
  }
};
