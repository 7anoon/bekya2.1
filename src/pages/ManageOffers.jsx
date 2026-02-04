import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';

export default function ManageOffers() {
  const { profile } = useAuthStore();
  const navigate = useNavigate();
  const [offers, setOffers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    discount_percentage: '',
    category: '',
    target_location: '',
    end_date: '',
    product_name: ''
  });
  const [uploading, setUploading] = useState(false);
  const [products, setProducts] = useState([]);

  const getCategoryName = (category) => {
    const names = {
      furniture: 'أثاث',
      clothes: 'ملابس',
      books: 'كتب',
      toys: 'ألعاب',
      other: 'أخرى'
    };
    return names[category] || category;
  };

  useEffect(() => {
    if (profile?.role !== 'admin') {
      navigate('/');
      return;
    }
    loadOffers();
    loadProducts();
  }, [profile, navigate]);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, title, price, status')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error('Error loading products:', err);
    }
  };

  const loadOffers = async () => {
    try {
      const { data, error } = await supabase
        .from('offers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOffers(data || []);
    } catch (err) {
      console.error('Error loading offers:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description) {
      alert('يجب إدخال العنوان والوصف');
      return;
    }

    if (!formData.discount_percentage || formData.discount_percentage <= 0) {
      alert('يجب إدخال نسبة الخصم');
      return;
    }

    // التحقق من أن التاريخ ليس في الماضي
    if (formData.end_date) {
      const selectedDate = new Date(formData.end_date);
      const now = new Date();
      
      if (selectedDate < now) {
        alert('لا يمكن اختيار تاريخ في الماضي. يرجى اختيار تاريخ في المستقبل.');
        return;
      }
    }

    setUploading(true);

    try {
      if (editingOffer) {
        // تحديث عرض موجود
        const { error } = await supabase
          .from('offers')
          .update({
            title: formData.title,
            description: formData.description,
            discount_percentage: formData.discount_percentage ? parseInt(formData.discount_percentage) : null,
            category: formData.category || null,
            target_location: formData.target_location || null,
            end_date: formData.end_date || null,
            product_name: formData.product_name || null
          })
          .eq('id', editingOffer.id);

        if (error) throw error;
        alert('تم تحديث العرض بنجاح!');
      } else {
        // إضافة عرض جديد
        const { data: offer, error } = await supabase
          .from('offers')
          .insert({
            title: formData.title,
            description: formData.description,
            discount_percentage: formData.discount_percentage ? parseInt(formData.discount_percentage) : null,
            category: formData.category || null,
            target_location: formData.target_location || null,
            end_date: formData.end_date || null,
            product_name: formData.product_name || null,
            created_by: profile.id
          })
          .select()
          .single();

        if (error) throw error;

        // إرسال إشعارات للمستخدمين
        await sendOfferNotifications(offer);
        alert('تم إضافة العرض بنجاح!');
      }

      setShowForm(false);
      setEditingOffer(null);
      setFormData({
        title: '',
        description: '',
        discount_percentage: '',
        category: '',
        target_location: '',
        end_date: '',
        product_name: ''
      });
      loadOffers();
    } catch (err) {
      console.error('Error saving offer:', err);
      alert('حدث خطأ في حفظ العرض: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const sendOfferNotifications = async (offer) => {
    try {
      let query = supabase.from('profiles').select('id');
      
      // إذا كان العرض لمنطقة معينة
      if (offer.target_location) {
        query = query.eq('location', offer.target_location);
      }

      const { data: users } = await query;

      if (users && users.length > 0) {
        const notifications = users.map(user => ({
          user_id: user.id,
          message: `عرض جديد: ${offer.title}`,
          type: 'offer'
        }));

        await supabase.from('notifications').insert(notifications);
      }
    } catch (err) {
      console.error('Error sending notifications:', err);
    }
  };

  const toggleOfferStatus = async (offerId, currentStatus) => {
    try {
      const { data, error } = await supabase
        .from('offers')
        .update({ is_active: !currentStatus })
        .eq('id', offerId)
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      alert(currentStatus ? 'تم إيقاف العرض بنجاح' : 'تم تفعيل العرض بنجاح');
      loadOffers();
    } catch (err) {
      console.error('Error toggling offer:', err);
      alert(`حدث خطأ في تحديث العرض: ${err.message}`);
    }
  };

  const handleEditOffer = (offer) => {
    setEditingOffer(offer);
    setFormData({
      title: offer.title,
      description: offer.description,
      discount_percentage: offer.discount_percentage || '',
      category: offer.category || '',
      target_location: offer.target_location || '',
      end_date: offer.end_date ? new Date(offer.end_date).toISOString().slice(0, 16) : '',
      product_name: offer.product_name || ''
    });
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setShowForm(false);
    setEditingOffer(null);
    setFormData({
      title: '',
      description: '',
      discount_percentage: '',
      category: '',
      target_location: '',
      end_date: '',
      product_id: ''
    });
  };

  const deleteOffer = async (offerId) => {
    if (!confirm('هل أنت متأكد من حذف هذا العرض؟')) return;

    try {
      const { error } = await supabase
        .from('offers')
        .delete()
        .eq('id', offerId);

      if (error) throw error;
      loadOffers();
    } catch (err) {
      console.error('Error deleting offer:', err);
      alert('حدث خطأ في حذف العرض');
    }
  };

  return (
    <div className="container">
      <div style={styles.header}>
        <h1 style={styles.title}>إدارة العروض</h1>
        <button 
          className="btn btn-primary"
          onClick={() => {
            if (showForm) {
              handleCancelEdit();
            } else {
              setShowForm(true);
            }
          }}
        >
          {showForm ? 'إلغاء' : '+ إضافة عرض جديد'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={styles.formCard}>
          <h2 style={styles.formTitle}>{editingOffer ? 'تعديل العرض' : 'عرض جديد'}</h2>
          <form onSubmit={handleSubmit}>
            <div style={styles.field}>
              <label style={styles.label}>عنوان العرض *</label>
              <input
                type="text"
                className="input"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="مثال: خصم 50% على الأثاث"
                required
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>وصف العرض *</label>
              <textarea
                className="input"
                rows="3"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="تفاصيل العرض..."
                required
              />
            </div>

            <div style={styles.row}>
              <div style={styles.field}>
                <label style={styles.label}>نسبة الخصم % *</label>
                <input
                  type="number"
                  className="input"
                  value={formData.discount_percentage}
                  onChange={(e) => setFormData({...formData, discount_percentage: e.target.value})}
                  placeholder="50"
                  min="1"
                  max="100"
                  required
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>الفئة المستهدفة (اختياري)</label>
                <select
                  className="input"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                >
                  <option value="">كل الفئات</option>
                  <option value="furniture">أثاث</option>
                  <option value="clothes">ملابس</option>
                  <option value="books">كتب</option>
                  <option value="toys">ألعاب</option>
                  <option value="other">أخرى</option>
                </select>
              </div>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>المنطقة المستهدفة (اختياري)</label>
              <input
                type="text"
                className="input"
                value={formData.target_location}
                onChange={(e) => setFormData({...formData, target_location: e.target.value})}
                placeholder="اتركه فارغاً لكل المناطق"
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>اسم المنتج المستهدف (اختياري)</label>
              <input
                type="text"
                className="input"
                placeholder="اكتب اسم المنتج أو اتركه فارغاً لكل المنتجات"
                value={formData.product_name || ''}
                onChange={(e) => setFormData({...formData, product_name: e.target.value})}
              />
              <small style={{color: '#6b7280', fontSize: '13px', marginTop: '4px', display: 'block'}}>
                اكتب اسم منتج معين لتطبيق العرض عليه فقط، أو اتركه فارغاً لتطبيق العرض على كل المنتجات
              </small>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>تاريخ انتهاء العرض (اختياري)</label>
              <input
                type="datetime-local"
                className="input"
                value={formData.end_date}
                onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                min={new Date().toISOString().slice(0, 16)}
              />
              <small style={{color: '#6b7280', fontSize: '13px', marginTop: '4px', display: 'block'}}>
                يجب اختيار تاريخ في المستقبل
              </small>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={styles.submitBtn}
              disabled={uploading}
            >
              {uploading ? 'جاري الحفظ...' : editingOffer ? 'حفظ التعديلات' : 'نشر العرض'}
            </button>
          </form>
        </div>
      )}

      <div style={styles.offersList}>
        {offers.length === 0 ? (
          <div className="card" style={styles.empty}>
            <p>لا توجد عروض حالياً</p>
          </div>
        ) : (
          offers.map((offer) => (
            <div key={offer.id} className="card" style={styles.offerCard}>
              {offer.image && (
                <img src={offer.image} alt={offer.title} style={styles.offerImage} />
              )}
              
              <div style={styles.offerContent}>
                <div style={styles.offerHeader}>
                  <h3 style={styles.offerTitle}>{offer.title}</h3>
                  <span style={{
                    ...styles.statusBadge,
                    background: offer.is_active ? '#6b7c59' : '#8b7355'
                  }}>
                    {offer.is_active ? 'نشط' : 'متوقف'}
                  </span>
                </div>

                <p style={styles.offerDesc}>{offer.description}</p>

                <div style={styles.offerDetails}>
                  {offer.discount_percentage && (
                    <span style={styles.discountBadge}>
                      خصم {offer.discount_percentage}%
                    </span>
                  )}
                  {offer.category && (
                    <span style={styles.categoryBadge}>
                      {getCategoryName(offer.category)}
                    </span>
                  )}
                  {offer.target_location && (
                    <span style={styles.locationBadge}>
                      {offer.target_location}
                    </span>
                  )}
                  {offer.end_date && (
                    <span style={styles.dateBadge}>
                      ينتهي: {new Date(offer.end_date).toLocaleDateString('ar-EG')}
                    </span>
                  )}
                </div>

                <div style={styles.offerActions}>
                  <button
                    className="btn"
                    style={{
                      background: '#3b82f6',
                      color: 'white',
                      borderRadius: '20px'
                    }}
                    onClick={() => handleEditOffer(offer)}
                  >
                    تعديل
                  </button>
                  <button
                    className="btn"
                    style={{
                      background: offer.is_active ? '#8b7355' : '#6b7c59',
                      color: 'white',
                      borderRadius: '20px'
                    }}
                    onClick={() => toggleOfferStatus(offer.id, offer.is_active)}
                  >
                    {offer.is_active ? 'إيقاف' : 'تفعيل'}
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => deleteOffer(offer.id)}
                  >
                    حذف
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
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
    color: '#2d2d2d',
    margin: 0,
    fontWeight: '600'
  },
  formCard: {
    marginBottom: '40px',
    padding: '32px'
  },
  formTitle: {
    fontSize: '24px',
    color: '#2d2d2d',
    marginBottom: '24px',
    fontWeight: '600'
  },
  field: {
    marginBottom: '20px',
    flex: 1
  },
  row: {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap'
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '500',
    color: '#5d5d5d',
    fontSize: '14px'
  },
  submitBtn: {
    width: '100%',
    padding: '12px'
  },
  offersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  empty: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#6b7280'
  },
  offerCard: {
    display: 'flex',
    gap: '24px',
    flexWrap: 'wrap',
    padding: '24px'
  },
  offerImage: {
    width: '220px',
    height: '220px',
    objectFit: 'cover',
    borderRadius: '16px',
    flexShrink: 0
  },
  offerContent: {
    flex: 1,
    minWidth: '300px'
  },
  offerHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px',
    gap: '16px',
    flexWrap: 'wrap'
  },
  offerTitle: {
    fontSize: '22px',
    fontWeight: '600',
    color: '#2d2d2d',
    margin: 0,
    flex: '1',
    minWidth: '200px'
  },
  statusBadge: {
    padding: '8px 16px',
    borderRadius: '20px',
    color: 'white',
    fontSize: '13px',
    fontWeight: '500',
    whiteSpace: 'nowrap',
    flexShrink: 0
  },
  offerDesc: {
    color: '#7a7a7a',
    marginBottom: '20px',
    lineHeight: '1.7',
    fontSize: '15px'
  },
  offerDetails: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    marginBottom: '16px'
  },
  discountBadge: {
    background: 'rgba(139, 115, 85, 0.1)',
    color: '#8b7355',
    padding: '8px 16px',
    borderRadius: '16px',
    fontSize: '14px',
    fontWeight: '600'
  },
  categoryBadge: {
    background: 'rgba(107, 124, 89, 0.1)',
    color: '#556b2f',
    padding: '8px 16px',
    borderRadius: '16px',
    fontSize: '14px',
    fontWeight: '500'
  },
  locationBadge: {
    background: 'rgba(107, 124, 89, 0.1)',
    color: '#556b2f',
    padding: '8px 16px',
    borderRadius: '16px',
    fontSize: '14px',
    fontWeight: '500'
  },
  dateBadge: {
    background: 'rgba(139, 115, 85, 0.1)',
    color: '#8b7355',
    padding: '8px 16px',
    borderRadius: '16px',
    fontSize: '14px',
    fontWeight: '500'
  },
  offerActions: {
    display: 'flex',
    gap: '12px'
  }
};
