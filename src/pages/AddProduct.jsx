import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';

export default function AddProduct() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    weight: ''
  });
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 10) {
      setError('يمكنك رفع 10 صور كحد أقصى');
      return;
    }
    setImages(files);
    setError('');
  };

  const uploadImages = async () => {
    const uploadedUrls = [];
    
    for (let i = 0; i < images.length; i++) {
      const file = images[i];
      const fileName = `${user.id}/${Date.now()}_${i}.jpg`;
      
      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(`فشل رفع الصورة ${i + 1}: ${uploadError.message}`);
      }

      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(fileName);

      uploadedUrls.push(publicUrl);
    }

    return uploadedUrls;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.category) {
      setError('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    if (images.length === 0) {
      setError('يرجى رفع صورة واحدة على الأقل');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // رفع الصور
      const imageUrls = await uploadImages();
      
      // إنشاء المنتج بحالة pending للمراجعة من الأدمن
      const productData = {
        user_id: user.id,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        images: imageUrls,
        status: 'pending' // في انتظار موافقة الأدمن
      };
      
      // إضافة الوزن فقط إذا تم إدخاله
      if (formData.weight && formData.weight > 0) {
        productData.weight = parseFloat(formData.weight);
      }
      
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert(productData)
        .select()
        .single();

      if (productError) throw productError;

      // إرسال إشعار للأدمن
      const { data: admins } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'admin');

      if (admins && admins.length > 0) {
        const notifications = admins.map(admin => ({
          user_id: admin.id,
          product_id: product.id,
          message: `منتج جديد يحتاج مراجعة: ${formData.title}`,
          type: 'new_product'
        }));

        await supabase.from('notifications').insert(notifications);
      }

      alert('تم إرسال المنتج للمراجعة. سيتم التواصل معك قريباً');
      navigate('/profile');
      
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'حدث خطأ أثناء إضافة المنتج');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="card" style={styles.card}>
        <h1 style={styles.title}>إضافة منتج جديد</h1>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>اسم المنتج *</label>
            <input
              type="text"
              className="input"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="مثال: هاتف آيفون 12"
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>الفئة *</label>
            <select
              className="input"
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              required
            >
              <option value="">اختر نوع المنتج</option>
              <option value="electronics">إلكترونيات</option>
              <option value="furniture">أثاث</option>
              <option value="clothes">ملابس</option>
              <option value="books">كتب</option>
              <option value="toys">ألعاب</option>
              <option value="appliances">أجهزة منزلية</option>
              <option value="sports">رياضة</option>
              <option value="jewelry">مجوهرات وإكسسوارات</option>
              <option value="other">أخرى</option>
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>تفاصيل المنتج *</label>
            <textarea
              className="input"
              rows="5"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="اكتب وصف تفصيلي للمنتج، حالته، مميزاته..."
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>الوزن (كجم) - اختياري</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              className="input"
              value={formData.weight}
              onChange={(e) => setFormData({...formData, weight: e.target.value})}
              placeholder="مثال: 0.5"
            />
            <small style={styles.hint}>أدخل الوزن التقريبي للمنتج بالكيلوجرام (اختياري)</small>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>صور المنتج * (حتى 10 صور)</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              style={styles.fileInput}
              required
            />
            {images.length > 0 && (
              <p style={styles.imageCount}>تم اختيار {images.length} صورة</p>
            )}
            <small style={styles.hint}>التقط صور واضحة من جميع الجوانب</small>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={styles.submitBtn}
          >
            {loading ? 'جاري الإرسال...' : 'إرسال للمراجعة'}
          </button>
        </form>

        <div style={styles.note}>
          <p>📝 ملاحظة: سيتم مراجعة المنتج من قبل الإدارة وتحديد السعر المناسب</p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  card: {
    maxWidth: '600px',
    margin: '0 auto'
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
    gap: '20px'
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  label: {
    fontWeight: '600',
    color: '#374151',
    fontSize: '16px'
  },
  fileInput: {
    padding: '8px',
    border: '2px dashed #d1d5db',
    borderRadius: '8px',
    cursor: 'pointer'
  },
  imageCount: {
    color: '#10b981',
    fontWeight: '600',
    fontSize: '14px'
  },
  hint: {
    fontSize: '13px',
    color: '#6b7280',
    marginTop: '4px'
  },
  submitBtn: {
    width: '100%',
    padding: '14px',
    fontSize: '18px',
    fontWeight: '600'
  },
  note: {
    marginTop: '20px',
    padding: '16px',
    background: '#eff6ff',
    borderRadius: '8px',
    border: '1px solid #3b82f6',
    textAlign: 'center',
    color: '#1e40af',
    fontSize: '14px'
  }
};
