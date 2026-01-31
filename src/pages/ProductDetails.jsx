import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { useProductStore } from '../store/productStore';
import ImageLightbox from '../components/ImageLightbox';
import './ProductDetails.css';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const { approveProduct, rejectProduct, negotiateProduct } = useProductStore();
  const [product, setProduct] = useState(null);
  const [seller, setSeller] = useState(null);
  const [activeOffer, setActiveOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showNegotiationModal, setShowNegotiationModal] = useState(false);
  const [negotiationPrice, setNegotiationPrice] = useState('');
  const [negotiationNote, setNegotiationNote] = useState('');

  useEffect(() => {
    loadProductDetails();
  }, [id]);

  const loadProductDetails = async () => {
    try {
      // جلب تفاصيل المنتج
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (productError) throw productError;

      // البحث عن عرض نشط يطابق فئة المنتج
      const { data: offers } = await supabase
        .from('offers')
        .select('*')
        .eq('is_active', true)
        .eq('category', productData.category);

      let matchingOffer = null;
      if (offers && offers.length > 0) {
        // اختيار أول عرض نشط ولم ينتهي
        matchingOffer = offers.find(offer => 
          offer.discount_percentage && 
          (!offer.end_date || new Date(offer.end_date) > new Date())
        );
      }

      setActiveOffer(matchingOffer);

      // إذا كان المستخدم أدمن، يجيب معلومات البائع الحقيقي
      // إذا كان مستخدم عادي، يجيب معلومات الأدمن
      let contactData;
      if (profile?.role === 'admin') {
        // جلب معلومات البائع الحقيقي للأدمن
        const { data: sellerData, error: sellerError } = await supabase
          .from('profiles')
          .select('username, phone, location, email')
          .eq('id', productData.user_id)
          .single();

        if (sellerError) throw sellerError;
        contactData = sellerData;
      } else {
        // جلب معلومات الأدمن للمستخدمين العاديين
        const { data: adminData, error: adminError } = await supabase
          .from('profiles')
          .select('username, phone, location, email')
          .eq('role', 'admin')
          .limit(1)
          .single();

        if (adminError) throw adminError;
        contactData = adminData;
      }

      setProduct(productData);
      setSeller(contactData);
    } catch (err) {
      console.error('Error loading product:', err);
      alert('خطأ في تحميل تفاصيل المنتج');
    } finally {
      setLoading(false);
    }
  };

  const openLightbox = (index) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
  };

  const handleApprove = async (price) => {
    if (!confirm('هل تريد الموافقة على هذا المنتج؟')) return;
    
    try {
      await approveProduct(product.id, price);
      alert('تم الموافقة على المنتج');
      navigate('/admin');
    } catch (err) {
      alert('خطأ في الموافقة على المنتج');
    }
  };

  const handleReject = async () => {
    const reason = prompt('سبب الرفض:');
    if (!reason) return;
    
    try {
      await rejectProduct(product.id, reason);
      alert('تم رفض المنتج');
      navigate('/admin');
    } catch (err) {
      alert('خطأ في رفض المنتج');
    }
  };

  const handleNegotiate = () => {
    setNegotiationPrice(product.suggested_price || product.negotiated_price || '');
    setNegotiationNote('');
    setShowNegotiationModal(true);
  };

  const handleSendNegotiation = async () => {
    if (!negotiationPrice || negotiationPrice <= 0) {
      alert('يجب إدخال سعر صحيح');
      return;
    }

    try {
      await negotiateProduct(product.id, negotiationPrice, negotiationNote);
      alert('تم إرسال عرض التفاوض للبائع');
      setShowNegotiationModal(false);
      loadProductDetails();
    } catch (err) {
      alert('خطأ في إرسال عرض التفاوض');
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      pending: 'قيد المراجعة',
      approved: 'متاح للبيع',
      rejected: 'مرفوض',
      awaiting_seller: 'في انتظار موافقة البائع'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    const colorMap = {
      pending: '#f59e0b',
      approved: '#10b981',
      rejected: '#ef4444',
      awaiting_seller: '#3b82f6'
    };
    return colorMap[status] || '#6b7280';
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container">
        <div className="card" style={styles.error}>
          <h2>المنتج غير موجود</h2>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            العودة للرئيسية
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <button 
        className="btn" 
        onClick={() => navigate(-1)}
        style={styles.backBtn}
      >
        ← رجوع
      </button>

      <div className="card" style={styles.productCard}>
        {/* معرض الصور */}
        {product.images && product.images.length > 0 && (
          <div style={styles.imageGallery}>
            <div style={styles.mainImage}>
              <img
                src={product.images[0]}
                alt={product.title}
                style={styles.mainImg}
                onClick={() => openLightbox(0)}
                loading="lazy"
                onError={(e) => {
                  e.target.src = 'https://placehold.co/400x300/e2e8f0/64748b?text=Main+Image+Not+Found';
                }}
              />
            </div>
            {product.images.length > 1 && (
              <div style={styles.thumbnails}>
                {product.images.map((img, index) => (
                  <img
                    key={index}
                    src={img}
                    alt={`${product.title} ${index + 1}`}
                    style={styles.thumbnail}
                    onClick={() => openLightbox(index)}
                    loading="lazy"
                    onError={(e) => {
                      e.target.src = 'https://placehold.co/100x100/e2e8f0/64748b?text=Thumb+Not+Found';
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* تفاصيل المنتج */}
        <div style={styles.details}>
          <div style={styles.header}>
            <h1 style={styles.title}>{product.title}</h1>
            <span
              style={{
                ...styles.status,
                background: getStatusColor(product.status) + '20',
                color: getStatusColor(product.status)
              }}
            >
              {getStatusText(product.status)}
            </span>
          </div>

          <p className="product-description">{product.description}</p>

          {/* معلومات السعر */}
          <div style={styles.priceSection}>
            {product.choice_type === 'recycle' ? (
              <div style={styles.recycleBox}>
                <h3 style={styles.recycleTitle}>♻️ إعادة تدوير</h3>
                {product.recycle_idea && (
                  <p style={styles.recycleIdea}>{product.recycle_idea}</p>
                )}
              </div>
            ) : (
              <>
                {activeOffer && product.final_price ? (
                  <div style={styles.offerPriceBox}>
                    <div style={styles.offerBanner}>
                      🎉 عرض خاص: خصم {activeOffer.discount_percentage}%
                    </div>
                    <div style={styles.offerTitle}>{activeOffer.title}</div>
                    {activeOffer.description && (
                      <p style={styles.offerDesc}>{activeOffer.description}</p>
                    )}
                    <div style={styles.priceComparison}>
                      <div style={styles.oldPriceBox}>
                        <span style={styles.priceLabel}>السعر الأصلي:</span>
                        <span style={styles.oldPriceValue}>{product.final_price} جنيه</span>
                      </div>
                      <div style={styles.newPriceBox}>
                        <span style={styles.priceLabel}>السعر بعد الخصم:</span>
                        <span style={styles.newPriceValue}>
                          {Math.round(product.final_price * (1 - activeOffer.discount_percentage / 100))} جنيه
                        </span>
                      </div>
                    </div>
                    <div style={styles.savings}>
                      وفر {Math.round(product.final_price * (activeOffer.discount_percentage / 100))} جنيه! 💰
                    </div>
                    {activeOffer.end_date && (
                      <div style={styles.offerEndDate}>
                        ⏰ العرض ينتهي: {new Date(activeOffer.end_date).toLocaleDateString('ar-EG')}
                      </div>
                    )}
                  </div>
                ) : product.final_price ? (
                  <div style={styles.priceBox}>
                    <span style={styles.priceLabel} className="price-label">السعر النهائي:</span>
                    <span style={styles.finalPrice}>{product.final_price} جنيه</span>
                  </div>
                ) : product.negotiated_price ? (
                  <div style={styles.priceBox}>
                    <span style={styles.priceLabel}>السعر المقترح:</span>
                    <span style={styles.negotiatedPrice}>{product.negotiated_price} جنيه</span>
                  </div>
                ) : (
                  <div style={styles.priceBox}>
                    <span style={styles.priceLabel}>السعر المقترح:</span>
                    <span style={styles.suggestedPrice}>{product.suggested_price} جنيه</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* معلومات إضافية */}
          <div style={styles.infoGrid}>
            <div style={styles.infoItem}>
              <span className="info-label">الحالة:</span>
              <span className="info-value">{product.condition}</span>
            </div>
            <div style={styles.infoItem}>
              <span className="info-label">الفئة:</span>
              <span className="info-value">
                {product.category === 'electronics' && 'إلكترونيات'}
                {product.category === 'furniture' && 'أثاث'}
                {product.category === 'clothes' && 'ملابس'}
                {product.category === 'books' && 'كتب'}
                {product.category === 'toys' && 'ألعاب'}
                {product.category === 'other' && 'أخرى'}
              </span>
            </div>
            {product.original_price && (
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>السعر الأصلي:</span>
                <span style={styles.infoValue}>{product.original_price} جنيه</span>
              </div>
            )}
            {product.discount_percentage && (
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>نسبة الخصم:</span>
                <span style={styles.infoValue}>{product.discount_percentage}%</span>
              </div>
            )}
          </div>

          {/* معلومات التواصل */}
          {seller && (
            <div style={styles.sellerSection}>
              <h3 className="section-title">
                {profile?.role === 'admin' ? 'معلومات البائع' : 'معلومات التواصل (بيكيا)'}
              </h3>
              <div style={styles.sellerInfo}>
                <div style={styles.sellerItem}>
                  <span className="seller-label">👤 الاسم:</span>
                  <span className="seller-value">{seller.username}</span>
                </div>
                <div style={styles.sellerItem}>
                  <span className="seller-label">📍 الموقع:</span>
                  <span className="seller-value">{seller.location}</span>
                </div>
                {product.status === 'approved' && (
                  <>
                    <div style={styles.sellerItem}>
                      <span className="seller-label">📞 الهاتف:</span>
                      <span className="seller-value">{seller.phone}</span>
                    </div>
                    <div style={styles.sellerItem}>
                      <span className="seller-label">📧 البريد:</span>
                      <span className="seller-value">{seller.email}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ملاحظات التفاوض */}
          {product.negotiation_note && (
            <div style={styles.noteSection}>
              <h3 className="section-title">ملاحظة الإدارة</h3>
              <p style={styles.note}>{product.negotiation_note}</p>
            </div>
          )}

          {/* سبب الرفض */}
          {product.rejection_reason && (
            <div style={styles.rejectionSection}>
              <h3 className="section-title">سبب الرفض</h3>
              <p style={styles.rejection}>{product.rejection_reason}</p>
            </div>
          )}

          {/* أزرار التفاوض للأدمن فقط */}
          {profile?.role === 'admin' && product.status === 'pending' && product.choice_type === 'sell' && (
            <div style={styles.adminActions}>
              <h3 className="section-title">إجراءات الإدارة</h3>
              <div style={styles.actionButtons}>
                <button
                  className="btn btn-primary"
                  onClick={() => handleApprove(product.suggested_price)}
                  style={styles.actionBtn}
                >
                  موافقة ({product.suggested_price} جنيه)
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={handleNegotiate}
                  style={styles.actionBtn}
                >
                  تفاوض
                </button>
                <button
                  className="btn btn-danger"
                  onClick={handleReject}
                  style={styles.actionBtn}
                >
                  رفض
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal التفاوض */}
      {showNegotiationModal && (
        <div style={styles.modal}>
          <div className="card" style={styles.modalContent}>
            <h3 style={styles.modalTitle}>التفاوض على السعر</h3>
            <p>المنتج: {product.title}</p>
            <p>السعر المقترح: {product.suggested_price} جنيه</p>
            
            <div style={styles.field}>
              <label style={styles.label}>عرض السعر الجديد:</label>
              <input
                type="number"
                className="input"
                value={negotiationPrice}
                onChange={(e) => setNegotiationPrice(e.target.value)}
                max="500"
                placeholder="أدخل السعر المناسب"
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>ملاحظة للبائع (اختياري):</label>
              <textarea
                className="input"
                rows="3"
                value={negotiationNote}
                onChange={(e) => setNegotiationNote(e.target.value)}
                placeholder="مثال: السعر مرتفع قليلاً بسبب حالة المنتج"
              />
            </div>

            <div style={styles.modalActions}>
              <button
                className="btn btn-primary"
                onClick={handleSendNegotiation}
              >
                إرسال العرض للبائع
              </button>
              <button
                className="btn"
                style={{ background: '#10b981', color: 'white' }}
                onClick={() => {
                  setShowNegotiationModal(false);
                  handleApprove(negotiationPrice);
                }}
              >
                موافقة مباشرة
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setShowNegotiationModal(false)}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox للصور */}
      {lightboxOpen && product.images && (
        <ImageLightbox
          images={product.images}
          currentIndex={currentImageIndex}
          onClose={() => setLightboxOpen(false)}
          onNext={() => setCurrentImageIndex((currentImageIndex + 1) % product.images.length)}
          onPrev={() => setCurrentImageIndex((currentImageIndex - 1 + product.images.length) % product.images.length)}
        />
      )}
    </div>
  );
}

const styles = {
  backBtn: {
    marginBottom: '20px'
  },
  productCard: {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '40px'
  },
  imageGallery: {
    marginBottom: '30px'
  },
  mainImage: {
    width: '100%',
    height: '500px',
    marginBottom: '24px',
    borderRadius: '24px',
    overflow: 'hidden',
    cursor: 'pointer',
    background: '#f5f5f0'
  },
  mainImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  thumbnails: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
    gap: '16px'
  },
  thumbnail: {
    width: '100%',
    height: '120px',
    objectFit: 'cover',
    borderRadius: '16px',
    cursor: 'pointer',
    border: '2px solid transparent',
    transition: 'all 0.3s ease',
    background: '#f5f5f0'
  },
  details: {
    display: 'flex',
    flexDirection: 'column',
    gap: '32px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap'
  },
  title: {
    fontSize: '36px',
    fontWeight: '600',
    color: '#2d2d2d',
    margin: 0,
    lineHeight: '1.3'
  },
  status: {
    padding: '10px 20px',
    borderRadius: '24px',
    fontSize: '14px',
    fontWeight: '500'
  },
  description: {
    fontSize: '17px',
    lineHeight: '1.8',
    color: '#000000',
    fontWeight: '500'
  },
  priceSection: {
    padding: '32px',
    background: 'rgba(107, 124, 89, 0.05)',
    borderRadius: '24px',
    border: '1px solid rgba(107, 124, 89, 0.1)'
  },
  priceBox: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  priceLabel: {
    fontSize: '18px',
    color: '#000000',
    fontWeight: '600'
  },
  finalPrice: {
    fontSize: '32px',
    fontWeight: '600',
    color: '#6b7c59'
  },
  negotiatedPrice: {
    fontSize: '28px',
    fontWeight: '600',
    color: '#8b7355'
  },
  suggestedPrice: {
    fontSize: '28px',
    fontWeight: '600',
    color: '#8b7355'
  },
  recycleBox: {
    textAlign: 'center',
    padding: '20px'
  },
  recycleTitle: {
    fontSize: '26px',
    color: '#6b7c59',
    marginBottom: '16px',
    fontWeight: '600'
  },
  recycleIdea: {
    fontSize: '16px',
    color: '#7a7a7a',
    lineHeight: '1.8'
  },
  offerPriceBox: {
    background: 'rgba(139, 115, 85, 0.08)',
    padding: '28px',
    borderRadius: '24px',
    border: '2px solid rgba(139, 115, 85, 0.2)'
  },
  offerBanner: {
    background: '#8b7355',
    color: 'white',
    padding: '12px 24px',
    borderRadius: '20px',
    fontSize: '17px',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: '16px'
  },
  offerTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#5d5d5d',
    marginBottom: '8px',
    textAlign: 'center'
  },
  offerDesc: {
    fontSize: '14px',
    color: '#7a7a7a',
    marginBottom: '16px',
    textAlign: 'center'
  },
  priceComparison: {
    display: 'flex',
    justifyContent: 'space-around',
    gap: '20px',
    marginBottom: '16px',
    flexWrap: 'wrap'
  },
  oldPriceBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px'
  },
  oldPriceValue: {
    fontSize: '20px',
    color: '#9ca3af',
    textDecoration: 'line-through',
    fontWeight: '600'
  },
  newPriceBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px'
  },
  newPriceValue: {
    fontSize: '32px',
    fontWeight: '600',
    color: '#6b7c59'
  },
  savings: {
    background: '#6b7c59',
    color: 'white',
    padding: '14px',
    borderRadius: '16px',
    textAlign: 'center',
    fontSize: '17px',
    fontWeight: '600',
    marginBottom: '12px'
  },
  offerEndDate: {
    textAlign: 'center',
    fontSize: '14px',
    color: '#92400e',
    fontWeight: '600'
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px'
  },
  infoItem: {
    padding: '20px',
    background: 'rgba(107, 124, 89, 0.15)',
    borderRadius: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    border: '1px solid rgba(107, 124, 89, 0.2)'
  },
  infoLabel: {
    fontSize: '13px',
    color: '#000000',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  infoValue: {
    fontSize: '17px',
    color: '#000000',
    fontWeight: '600'
  },
  sellerSection: {
    padding: '28px',
    background: 'rgba(107, 124, 89, 0.15)',
    borderRadius: '24px',
    border: '1px solid rgba(107, 124, 89, 0.25)'
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#000000',
    marginBottom: '20px'
  },
  sellerInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  sellerItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '14px',
    background: 'rgba(255, 255, 255, 0.8)',
    borderRadius: '16px'
  },
  sellerLabel: {
    fontSize: '14px',
    color: '#000000',
    fontWeight: '600'
  },
  sellerValue: {
    fontSize: '15px',
    color: '#000000',
    fontWeight: '600'
  },
  noteSection: {
    padding: '28px',
    background: 'rgba(139, 115, 85, 0.06)',
    borderRadius: '24px',
    border: '1px solid rgba(139, 115, 85, 0.15)'
  },
  note: {
    fontSize: '16px',
    color: '#5d5d5d',
    lineHeight: '1.7'
  },
  rejectionSection: {
    padding: '20px',
    background: '#fee2e2',
    borderRadius: '12px',
    border: '2px solid #ef4444'
  },
  rejection: {
    fontSize: '16px',
    color: '#991b1b',
    lineHeight: '1.6'
  },
  adminActions: {
    padding: '28px',
    background: 'rgba(107, 124, 89, 0.08)',
    borderRadius: '24px',
    border: '1px solid rgba(107, 124, 89, 0.2)'
  },
  actionButtons: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    marginTop: '16px'
  },
  actionBtn: {
    flex: '1',
    minWidth: '150px'
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  modalContent: {
    maxWidth: '500px',
    width: '90%',
    maxHeight: '90vh',
    overflow: 'auto'
  },
  modalTitle: {
    fontSize: '22px',
    marginBottom: '20px',
    color: '#2d2d2d',
    fontWeight: '600'
  },
  field: {
    marginTop: '16px',
    marginBottom: '16px'
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '600',
    color: '#374151'
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '20px',
    flexWrap: 'wrap'
  },
  error: {
    textAlign: 'center',
    padding: '60px 20px'
  }
};
