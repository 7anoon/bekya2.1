import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

export default function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    condition: '',
    weight: '',
    suggested_price: '',
    choice_type: 'sell',
    recycle_idea: ''
  });
  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      // التحقق من الصلاحيات - الأدمن فقط يمكنه التعديل
      if (profile.role !== 'admin') {
        alert('ليس لديك صلاحية لتعديل المنتجات. التعديل متاح للإدارة فقط');
        navigate('/profile');
        return;
      }

      setFormData({
        title: data.title || '',
        description: data.description || '',
        category: data.category || '',
        condition: data.condition || '',
        weight: data.weight || '',
        suggested_price: data.suggested_price || '',
        choice_type: data.choice_type || 'sell',
        recycle_idea: data.recycle_idea || ''
      });
      setExistingImages(data.images || []);
      setLoading(false);
    } catch (err) {
      console.error('Error loading product:', err);
      alert('حدث خطأ في تحميل المنتج');
      navigate('/profile');
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    if (existingImages.length + newImages.length + files.length > 5) {
      alert('الحد الأقصى 5 صور');
      return;
    }

    setNewImages([...newImages, ...files]);
    
    // معاينة الصور الجديدة
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeExistingImage = (index) => {
    setExistingImages(existingImages.filter((_, i) => i !== index));
  };

  const removeNewImage = (index) => {
    setNewImages(newImages.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const uploadImages = async (files) => {
    const uploadedUrls = [];
    
    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      uploadedUrls.push(publicUrl);
    }

    return uploadedUrls;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.description) {
      alert('يجب إدخال العنوان والوصف');
      return;
    }

    if (existingImages.length + newImages.length === 0) {
      alert('يجب إضافة صورة واحدة على الأقل');
      return;
    }

    if (formData.choice_type === 'sell' && !formData.suggested_price) {
      alert('يجب إدخال السعر المقترح');
      return;
    }

    setUploading(true);

    try {
      // رفع الصور الجديدة
      let newImageUrls = [];
      if (newImages.length > 0) {
        newImageUrls = await uploadImages(newImages);
      }

      // دمج الصور القديمة مع الجديدة
      const allImages = [...existingImages, ...newImageUrls];

      // تحديث المنتج
      const updateData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        condition: formData.condition,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        images: allImages,
        choice_type: formData.choice_type
      };

      // إضافة الحقول حسب نوع الاختيار
      if (formData.choice_type === 'sell') {
        updateData.suggested_price = parseFloat(formData.suggested_price);
        updateData.recycle_idea = null;
      } else {
        updateData.recycle_idea = formData.recycle_idea;
        updateData.suggested_price = null;
      }

      const { error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      alert('تم تحديث المنتج بنجاح!');
      navigate('/profile');
    } catch (err) {
      console.error('Error updating product:', err);
      alert('حدث خطأ في تحديث المنتج: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div style={styles.loading}>جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={styles.header}>
        <h1 style={styles.title}>تعديل المنتج</h1>
        <button 
          className="btn"
          onClick={() => navigate(-1)}
          style={styles.backBtn}
        >
          ← رجوع
        </button>
      </div>

      <div className="card" style={styles.formCard}>
        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>عنوان المنتج *</label>
            <input
              type="text"
              className="input"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>الوصف *</label>
            <textarea
              className="input"
              rows="4"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              required
            />
          </div>

          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>الفئة *</label>
              <select
                className="input"
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                required
              >
                <option value="">اختر الفئة</option>
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
              <label style={styles.label}>الحالة *</label>
              <select
                className="input"
                value={formData.condition}
                onChange={(e) => setFormData({...formData, condition: e.target.value})}
                required
              >
                <option value="">اختر الحالة</option>
                <option value="جديد">جديد</option>
                <option value="مستعمل - ممتاز">مستعمل - ممتاز</option>
                <option value="مستعمل - جيد">مستعمل - جيد</option>
                <option value="مستعمل - مقبول">مستعمل - مقبول</option>
              </select>
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>الوزن (كجم) - اختياري</label>
            <input
              type="number"
              step="0.1"
              className="input"
              value={formData.weight}
              onChange={(e) => setFormData({...formData, weight: e.target.value})}
              placeholder="مثال: 2.5"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>نوع العملية *</label>
            <div style={styles.radioGroup}>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  value="sell"
                  checked={formData.choice_type === 'sell'}
                  onChange={(e) => setFormData({...formData, choice_type: e.target.value})}
                />
                <span>بيع</span>
              </label>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  value="recycle"
                  checked={formData.choice_type === 'recycle'}
                  onChange={(e) => setFormData({...formData, choice_type: e.target.value})}
                />
                <span>إعادة تدوير</span>
              </label>
            </div>
          </div>

          {formData.choice_type === 'sell' ? (
            <div style={styles.field}>
              <label style={styles.label}>السعر المقترح (جنيه) *</label>
              <input
                type="number"
                className="input"
                value={formData.suggested_price}
                onChange={(e) => setFormData({...formData, suggested_price: e.target.value})}
                max="500"
                required
              />
            </div>
          ) : (
            <div style={styles.field}>
              <label style={styles.label}>فكرة إعادة التدوير</label>
              <textarea
                className="input"
                rows="3"
                value={formData.recycle_idea}
                onChange={(e) => setFormData({...formData, recycle_idea: e.target.value})}
                placeholder="اكتب فكرتك لإعادة استخدام هذا المنتج..."
              />
            </div>
          )}

          {/* الصور الموجودة */}
          {existingImages.length > 0 && (
            <div style={styles.field}>
              <label style={styles.label}>الصور الحالية</label>
              <div style={styles.imagesGrid}>
                {existingImages.map((img, index) => (
                  <div key={index} style={styles.imagePreview}>
                    <img src={img} alt={`صورة ${index + 1}`} style={styles.previewImg} />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(index)}
                      style={styles.removeBtn}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* الصور الجديدة */}
          {imagePreviews.length > 0 && (
            <div style={styles.field}>
              <label style={styles.label}>صور جديدة</label>
              <div style={styles.imagesGrid}>
                {imagePreviews.map((preview, index) => (
                  <div key={index} style={styles.imagePreview}>
                    <img src={preview} alt={`صورة جديدة ${index + 1}`} style={styles.previewImg} />
                    <button
                      type="button"
                      onClick={() => removeNewImage(index)}
                      style={styles.removeBtn}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* إضافة صور جديدة */}
          {(existingImages.length + newImages.length) < 5 && (
            <div style={styles.field}>
              <label style={styles.label}>
                إضافة صور جديدة (الحد الأقصى {5 - existingImages.length - newImages.length} صور)
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                style={styles.fileInput}
                className="input"
              />
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={styles.submitBtn}
            disabled={uploading}
          >
            {uploading ? 'جاري الحفظ...' : 'حفظ التعديلات'}
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
  loading: {
    textAlign: 'center',
    padding: '60px',
    fontSize: '18px',
    color: '#7a7a7a'
  },
  formCard: {
    padding: '32px'
  },
  field: {
    marginBottom: '24px'
  },
  row: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px'
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '600',
    color: '#000000',
    fontSize: '14px'
  },
  radioGroup: {
    display: 'flex',
    gap: '24px'
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '500'
  },
  imagesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: '16px'
  },
  imagePreview: {
    position: 'relative',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '2px solid #e5e7eb'
  },
  previewImg: {
    width: '100%',
    height: '150px',
    objectFit: 'cover'
  },
  removeBtn: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    background: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    width: '28px',
    height: '28px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  fileInput: {
    padding: '12px',
    cursor: 'pointer'
  },
  submitBtn: {
    width: '100%',
    padding: '14px',
    fontSize: '16px'
  }
};
