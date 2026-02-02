import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

export default function EditProfile() {
  const navigate = useNavigate();
  const { profile, loadUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: profile?.username || '',
    phone: profile?.phone || '',
    location: profile?.location || ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.username || !formData.phone || !formData.location) {
      alert('يجب ملء جميع الحقول');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: formData.username,
          phone: formData.phone,
          location: formData.location
        })
        .eq('id', profile.id);

      if (error) throw error;

      // تحديث البيانات في الـ store
      await loadUser();

      alert('تم تحديث الملف الشخصي بنجاح!');
      navigate('/profile');
    } catch (err) {
      console.error('Error updating profile:', err);
      alert('حدث خطأ في تحديث الملف الشخصي: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div style={styles.header}>
        <h1 style={styles.title}>تعديل الملف الشخصي</h1>
        <button 
          className="btn"
          onClick={() => navigate('/profile')}
          style={styles.backBtn}
        >
          ← رجوع
        </button>
      </div>

      <div className="card" style={styles.formCard}>
        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>اسم المستخدم *</label>
            <input
              type="text"
              className="input"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>رقم الهاتف *</label>
            <input
              type="tel"
              className="input"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              placeholder="01xxxxxxxxx"
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>الموقع *</label>
            <input
              type="text"
              className="input"
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
              placeholder="مثال: القاهرة"
              required
            />
          </div>

          <div style={styles.infoBox}>
            <p style={styles.infoText}>
              <strong>ملاحظة:</strong> البريد الإلكتروني لا يمكن تعديله
            </p>
            <p style={styles.emailText}>
              البريد الحالي: {profile?.email}
            </p>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={styles.submitBtn}
            disabled={loading}
          >
            {loading ? 'جاري الحفظ...' : 'حفظ التعديلات'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
    flexWrap: 'wrap',
    gap: '16px'
  },
  title: {
    fontSize: '32px',
    color: '#000000',
    margin: 0,
    fontWeight: '600'
  },
  backBtn: {
    background: '#8b7355',
    color: 'white',
    borderRadius: '20px'
  },
  formCard: {
    maxWidth: '600px',
    margin: '0 auto',
    padding: '40px'
  },
  field: {
    marginBottom: '24px'
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '600',
    color: '#000000',
    fontSize: '14px'
  },
  infoBox: {
    background: 'rgba(107, 124, 89, 0.1)',
    padding: '20px',
    borderRadius: '16px',
    marginBottom: '24px',
    border: '1px solid rgba(107, 124, 89, 0.2)'
  },
  infoText: {
    fontSize: '14px',
    color: '#000000',
    marginBottom: '8px',
    fontWeight: '500'
  },
  emailText: {
    fontSize: '14px',
    color: '#6b7c59',
    fontWeight: '600'
  },
  submitBtn: {
    width: '100%',
    padding: '14px',
    fontSize: '16px'
  }
};
