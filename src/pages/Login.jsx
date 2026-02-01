import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, loadUser } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('=== LOGIN ATTEMPT ===');
      console.log('Username:', username);
      console.log('Password length:', password.length);
      
      const result = await signIn(username, password);
      
      console.log('=== LOGIN SUCCESS ===');
      console.log('Result:', result);
      console.log('Navigating to home...');
      
      // Wait a bit before navigating to ensure state is updated
      setTimeout(() => {
        navigate('/');
      }, 500);
      
    } catch (err) {
      console.error('=== LOGIN ERROR ===');
      console.error('Error:', err);
      console.error('Error message:', err.message);
      console.error('Error stack:', err.stack);
      
      setError(err.message || 'خطأ في تسجيل الدخول');
      setLoading(false);
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

          {error && (
            <div style={styles.error}>{error}</div>
          )}

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.field}>
              <label style={styles.label}>اسم المستخدم</label>
              <input
                type="text"
                className="input"
                style={styles.input}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
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
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary"
              style={styles.button}
              disabled={loading}
            >
              {loading ? 'جاري التسجيل...' : 'تسجيل الدخول'}
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
