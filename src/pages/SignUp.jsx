import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function SignUp() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    location: '',
    phone: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuthStore();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    console.log('Starting signup with:', {
      username: formData.username,
      email: formData.email,
      location: formData.location,
      phone: formData.phone
    });

    try {
      const result = await signUp(
        formData.username,
        formData.email,
        formData.password,
        formData.location,
        formData.phone
      );
      
      console.log('Signup result:', result);
      
      if (result && result.user) {
        console.log('Signup successful, redirecting...');
        // Use window.location for reliable navigation after signup
        window.location.href = '/bekya2.1/';
      } else {
        console.error('No user in result');
        setError('حدث خطأ في التسجيل. حاول مرة أخرى');
        setLoading(false);
      }
    } catch (err) {
      console.error('Signup error:', err);
      setError(err.message || 'خطأ في التسجيل');
      setLoading(false);
    }
  };

  return (
    <div style={styles.container} className="signup-container">
      <div style={styles.leftSide} className="signup-left-side">
        <div style={styles.brandContainer}>
          <h1 style={styles.brandTitle}>بيكيا بتناديك! 🛒</h1>
          <p style={styles.brandSubtitle}>انضم لمجتمعنا اليوم</p>
          <p style={styles.brandDescription}>
            ابدأ رحلتك في بيع وشراء المنتجات<br/>
            مع أفضل الأسعار وأسهل الطرق
          </p>
        </div>
      </div>
      
      <div className="card signup-card" style={styles.card}>
        {/* Mobile Brand Header */}
        <div className="mobile-brand-header">
          <h1 style={styles.mobileBrandTitle}>بيكيا بتناديك! 🛒</h1>
        </div>
        
        <h1 style={styles.title} className="signup-title">إنشاء حساب جديد</h1>
        
        {error && <div style={styles.error}>{error}</div>}
        
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>اسم المستخدم</label>
            <input
              type="text"
              name="username"
              className="input"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>البريد الإلكتروني</label>
            <input
              type="email"
              name="email"
              className="input"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>كلمة المرور</label>
            <input
              type="password"
              name="password"
              className="input"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>الموقع / المنطقة</label>
            <input
              type="text"
              name="location"
              className="input"
              value={formData.location}
              onChange={handleChange}
              placeholder="مثال: القاهرة - مدينة نصر"
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>رقم الهاتف</label>
            <input
              type="tel"
              name="phone"
              className="input"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={styles.submitBtn}
            disabled={loading}
          >
            {loading ? 'جاري التسجيل...' : 'تسجيل'}
          </button>
        </form>

        <p style={styles.footer}>
          لديك حساب بالفعل؟ <Link to="/login" style={styles.link}>سجل دخول</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'stretch',
    padding: '0'
  },
  leftSide: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px'
  },
  brandContainer: {
    maxWidth: '600px'
  },
  brandTitle: {
    fontSize: '72px !important',
    fontWeight: '900 !important',
    color: '#000000 !important',
    marginBottom: '20px',
    textShadow: 'none !important',
    fontFamily: "'Cairo', 'Segoe UI', sans-serif",
    lineHeight: '1.2',
    WebkitTextFillColor: '#000000'
  },
  brandSubtitle: {
    fontSize: '32px',
    color: '#1a1a1a',
    marginBottom: '16px',
    fontWeight: '700'
  },
  brandDescription: {
    fontSize: '22px',
    color: '#2d2d2d',
    lineHeight: '1.8',
    fontWeight: '500'
  },
  card: {
    maxWidth: '550px',
    width: '100%',
    minHeight: '100vh',
    padding: '60px 50px',
    borderRadius: '0',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    overflowY: 'auto'
  },
  title: {
    fontSize: '28px',
    marginBottom: '24px',
    textAlign: 'center',
    color: '#10b981'
  },
  error: {
    background: '#fee2e2',
    color: '#dc2626',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '16px',
    textAlign: 'center'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  label: {
    fontWeight: '600',
    color: '#374151'
  },
  submitBtn: {
    width: '100%',
    marginTop: '8px'
  },
  footer: {
    marginTop: '20px',
    textAlign: 'center',
    color: '#6b7280'
  },
  link: {
    color: '#10b981',
    fontWeight: '600',
    textDecoration: 'none'
  },
  mobileBrandTitle: {
    fontSize: '36px',
    fontWeight: '900',
    color: '#000000',
    textAlign: 'center',
    marginBottom: '0',
    display: 'none'
  }
};

// Add responsive CSS
if (typeof window !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    .mobile-brand-header {
      display: none;
    }
    
    @media (max-width: 768px) {
      .signup-container {
        flex-direction: column !important;
        padding: 0 !important;
      }
      
      .signup-left-side {
        display: none !important;
      }
      
      .mobile-brand-header {
        display: block !important;
        background: linear-gradient(135deg, #1e4d3d 0%, #2d6a4f 50%, #40916c 100%);
        padding: 40px 20px;
        margin: -30px -20px 30px -20px;
        border-radius: 16px 16px 0 0;
      }
      
      .mobile-brand-header h1 {
        display: block !important;
        color: #ffffff !important;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
      }
      
      .signup-card {
        max-width: 100% !important;
        min-height: auto !important;
        padding: 30px 20px !important;
        border-radius: 16px !important;
        margin: 20px;
      }
      
      .signup-title {
        font-size: 24px !important;
      }
    }
    
    @media (max-width: 480px) {
      .mobile-brand-header {
        padding: 30px 16px;
        margin: -20px -16px 20px -16px;
      }
      
      .mobile-brand-header h1 {
        font-size: 28px !important;
      }
      
      .signup-card {
        padding: 20px 16px !important;
        margin: 16px;
      }
      
      .signup-title {
        font-size: 22px !important;
      }
    }
  `;
  document.head.appendChild(style);
}
