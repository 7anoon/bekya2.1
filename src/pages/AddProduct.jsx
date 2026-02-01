import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import ImageLightbox from '../components/ImageLightbox';

export default function AddProduct() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    weight: ''
  });
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const validateImage = (file) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (!validTypes.includes(file.type)) {
      return 'الصورة يجب أن تكون من نوع JPG, PNG, أو WebP';
    }
    
    if (file.size > maxSize) {
      return 'حجم الصورة يجب أن يكون أقل من 5 ميجابايت';
    }
    
    return null;
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    processImageFiles(files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    processImageFiles(files);
  };

  const processImageFiles = (files) => {
    if (files.length + images.length > 10) {
      setError('يمكنك رفع 10 صور كحد أقصى');
      return;
    }

    const validFiles = [];
    const previews = [];
    let hasError = false;

    files.forEach(file => {
      const error = validateImage(file);
      if (error) {
        setError(error);
        hasError = true;
        return;
      }
      
      validFiles.push(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        previews.push({ file, preview: e.target.result });
        if (previews.length === validFiles.length) {
          setImages(prev => [...prev, ...validFiles]);
          setImagePreviews(prev => [...prev, ...previews]);
        }
      };
      reader.readAsDataURL(file);
    });

    if (!hasError) {
      setError('');
    }
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const openLightbox = (index) => {
    setLightboxIndex(index);
    setShowLightbox(true);
  };

  const closeLightbox = () => {
    setShowLightbox(false);
  };

  const uploadImages = async () => {
    const uploadedUrls = [];
    
    for (let i = 0; i < images.length; i++) {
      const file = images[i];
      const fileName = `${user.id}/${Date.now()}_${i}_${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(`فشل رفع الصورة ${i + 1}: ${uploadError.message}`);
      }

      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(fileName);

      uploadedUrls.push(publicUrl);
      
      // Update progress
      setUploadProgress(Math.round(((i + 1) / images.length) * 100));
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
                  
            {/* Drag and Drop Area */}
            <div 
              style={{
                ...styles.dropZone,
                ...(isDragging ? styles.dropZoneDragging : {})
              }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div style={styles.dropZoneContent}>
                <div style={styles.uploadIcon}>📷</div>
                <p style={styles.dropZoneText}>
                  {isDragging ? 'أفلت الصور هنا' : 'اسحب وأفلت الصور هنا أو انقر للاختيار'}
                </p>
                <p style={styles.dropZoneSubtext}>
                  JPG, PNG, WebP حتى 5MB لكل صورة
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                style={{ display: 'none' }}
              />
            </div>
          
            {/* Image Previews */}
            {imagePreviews.length > 0 && (
              <div style={styles.imagePreviewContainer}>
                <div style={styles.imagePreviewGrid}>
                  {imagePreviews.map((preview, index) => (
                    <div key={index} style={styles.imagePreviewItem}>
                      <img 
                        src={preview.preview} 
                        alt={`معاينة ${index + 1}`}
                        style={styles.imagePreviewThumb}
                        onClick={() => openLightbox(index)}
                      />
                      <button
                        type="button"
                        style={styles.removeImageBtn}
                        onClick={() => removeImage(index)}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                <p style={styles.imageCount}>{imagePreviews.length} صورة محددة</p>
              </div>
            )}
          
            {/* Upload Progress */}
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div style={styles.progressContainer}>
                <div style={styles.progressBar}> 
                  <div 
                    style={{
                      ...styles.progressFill,
                      width: `${uploadProgress}%`
                    }}
                  />
                </div>
                <p style={styles.progressText}>جاري رفع الصور... {uploadProgress}%</p>
              </div>
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

        {/* Lightbox Modal */}
        {showLightbox && (
          <ImageLightbox
            images={imagePreviews.map(p => p.preview)}
            initialIndex={lightboxIndex}
            onClose={closeLightbox}
          />
        )}
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
    color: '#f9fafb',
    fontWeight: '700'
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
    color: '#e5e7eb',
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
    color: '#9ca3af',
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
    background: 'rgba(107, 124, 89, 0.1)',
    borderRadius: '8px',
    border: '1px solid rgba(107, 124, 89, 0.3)',
    textAlign: 'center',
    color: '#d1d5db',
    fontSize: '14px'
  },
  dropZone: {
    border: '2px dashed #d1d5db',
    borderRadius: '12px',
    padding: '40px 20px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    backgroundColor: 'rgba(31, 41, 55, 0.5)',
    marginBottom: '20px'
  },
  dropZoneDragging: {
    borderColor: '#6b7c59',
    backgroundColor: 'rgba(107, 124, 89, 0.1)',
    transform: 'scale(1.02)'
  },
  dropZoneContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px'
  },
  uploadIcon: {
    fontSize: '48px',
    opacity: '0.7'
  },
  dropZoneText: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#e5e7eb',
    margin: '0'
  },
  dropZoneSubtext: {
    fontSize: '14px',
    color: '#9ca3af',
    margin: '0'
  },
  imagePreviewContainer: {
    marginTop: '20px'
  },
  imagePreviewGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
    gap: '12px',
    marginBottom: '12px'
  },
  imagePreviewItem: {
    position: 'relative',
    borderRadius: '8px',
    overflow: 'hidden',
    border: '2px solid rgba(107, 124, 89, 0.3)',
    transition: 'all 0.2s ease'
  },
  imagePreviewThumb: {
    width: '100%',
    height: '120px',
    objectFit: 'cover',
    cursor: 'pointer',
    display: 'block'
  },
  removeImageBtn: {
    position: 'absolute',
    top: '8px',
    left: '8px',
    background: 'rgba(239, 68, 68, 0.9)',
    border: 'none',
    borderRadius: '50%',
    width: '28px',
    height: '28px',
    color: 'white',
    fontSize: '16px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease'
  },
  progressContainer: {
    marginTop: '20px'
  },
  progressBar: {
    height: '8px',
    backgroundColor: 'rgba(31, 41, 55, 0.5)',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '8px'
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6b7c59',
    transition: 'width 0.3s ease'
  },
  progressText: {
    textAlign: 'center',
    color: '#6b7c59',
    fontWeight: '600',
    margin: '0'
  }
};
