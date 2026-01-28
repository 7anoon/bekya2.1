import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useProductStore } from '../store/productStore';

export default function Profile() {
  const { profile } = useAuthStore();
  const { fetchUserProducts, acceptNegotiation, rejectNegotiation } = useProductStore();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const getCategoryName = (category) => {
    const categories = {
      electronics: 'إلكترونيات',
      furniture: 'أثاث',
      clothes: 'ملابس',
      books: 'كتب',
      toys: 'ألعاب',
      appliances: 'أجهزة منزلية',
      sports: 'رياضة',
      jewelry: 'مجوهرات وإكسسوارات',
      other: 'أخرى'
    };
    return categories[category] || category;
  };

  useEffect(() => {
    loadUserProducts();
  }, []);

  const loadUserProducts = async () => {
    try {
      const data = await fetchUserProducts(profile.id);
      setProducts(data);
    } catch (err) {
      console.error('Error loading products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptNegotiation = async (productId) => {
    if (confirm('هل تريد قبول عرض السعر الجديد؟')) {
      try {
        await acceptNegotiation(productId);
        alert('تم قبول العرض! سيتم عرض منتجك للبيع');
        loadUserProducts();
      } catch (err) {
        alert('خطأ في قبول العرض');
      }
    }
  };

  const handleRejectNegotiation = async (productId) => {
    if (confirm('هل تريد رفض عرض السعر؟ سيتم إرسال طلبك للإدارة للتفاوض مرة أخرى')) {
      try {
        await rejectNegotiation(productId);
        alert('سيتم مراجعة طلبك من قبل الإدارة');
        // إعادة تحميل المنتجات للرجوع للصفحة
        loadUserProducts();
      } catch (err) {
        alert('خطأ في رفض العرض');
      }
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      pending: 'قيد المراجعة',
      approved: 'تم الموافقة',
      rejected: 'مرفوض',
      awaiting_seller: 'في انتظار موافقتك'
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

  return (
    <div className="container">
      {/* Premium Stats Cards */}
      <div style={styles.statsGrid}>
        <div className="stats-card">
          <div className="icon-3d">👤</div>
          <div style={{marginTop: '16px'}}>
            <div className="stats-number">{products.length}</div>
            <div className="stats-label">منتجاتي</div>
          </div>
        </div>
        
        <div className="stats-card">
          <div className="icon-3d">✅</div>
          <div style={{marginTop: '16px'}}>
            <div className="stats-number">{products.filter(p => p.status === 'approved').length}</div>
            <div className="stats-label">تم الموافقة</div>
          </div>
        </div>
        
        <div className="stats-card">
          <div className="icon-3d">⏳</div>
          <div style={{marginTop: '16px'}}>
            <div className="stats-number">{products.filter(p => p.status === 'pending').length}</div>
            <div className="stats-label">قيد المراجعة</div>
          </div>
        </div>
      </div>

      <div className="glow-divider"></div>

      <div className="card" style={styles.profileCard}>
        <h1 style={styles.title} className="netflix-shimmer">
          <span className="icon-3d" style={{marginLeft: '16px'}}>👤</span>
          الملف الشخصي
        </h1>
        
        <div style={styles.info}>
          <div style={styles.infoRow}>
            <span style={styles.label}>اسم المستخدم:</span>
            <span style={styles.value}>{profile.username}</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.label}>البريد الإلكتروني:</span>
            <span style={styles.value}>{profile.email}</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.label}>الموقع:</span>
            <span style={styles.value}>{profile.location}</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.label}>رقم الهاتف:</span>
            <span style={styles.value}>{profile.phone}</span>
          </div>
        </div>
      </div>

      <div style={styles.productsSection}>
        <h2 style={styles.subtitle}>منتجاتي ({products.length})</h2>
        
        {products.length === 0 ? (
          <div style={styles.empty}>
            <p>لم تقم بإضافة أي منتجات بعد</p>
          </div>
        ) : (
          <div style={styles.productsList}>
            {products.map((product) => (
              <div key={product.id} className="card" style={styles.productCard}>
                <div style={styles.productLayout}>
                  {/* صور المنتج */}
                  {product.images && product.images.length > 0 && (
                    <div style={styles.productImages}>
                      <img 
                        src={product.images[0]} 
                        alt={product.title}
                        style={styles.productImage}
                      />
                      {product.images.length > 1 && (
                        <div style={styles.imageCount}>
                          +{product.images.length - 1}
                        </div>
                      )}
                    </div>
                  )}

                  {/* معلومات المنتج */}
                  <div style={styles.productInfo}>
                    <div style={styles.productHeader}>
                      <h3 style={styles.productTitle}>{product.title}</h3>
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
                    
                    <p style={styles.productDesc}>{product.description}</p>
                    
                    <div style={styles.productDetails}>
                      {product.category && <span>الفئة: {getCategoryName(product.category)}</span>}
                      {product.weight && <span>الوزن: {product.weight} كجم</span>}
                      {product.condition && <span>الحالة: {product.condition}</span>}
                      <span>
                        {product.choice_type === 'recycle' ? 'إعادة تدوير' : product.suggested_price ? `${product.suggested_price} جنيه` : 'في انتظار التسعير'}
                      </span>
                    </div>

                    {product.choice_type === 'recycle' && product.recycle_idea && (
                      <div style={styles.recycleInfo}>
                        <strong>💡 فكرة إعادة التدوير:</strong>
                        <p>{product.recycle_idea}</p>
                      </div>
                    )}

                    {/* عرض التفاوض */}
                    {product.status === 'awaiting_seller' && product.negotiated_price && (
                      <div style={styles.negotiationOffer}>
                        <h4 style={styles.negotiationTitle}>🤝 عرض سعر جديد من الإدارة</h4>
                        <div style={styles.priceComparison}>
                          <div>
                            <span style={styles.priceLabel}>السعر المقترح منك:</span>
                            <span style={styles.oldPrice}>{product.suggested_price} جنيه</span>
                          </div>
                          <div>
                            <span style={styles.priceLabel}>العرض الجديد:</span>
                            <span style={styles.newPrice}>{product.negotiated_price} جنيه</span>
                          </div>
                        </div>
                        {product.negotiation_note && (
                          <p style={styles.negotiationNote}>
                            <strong>ملاحظة:</strong> {product.negotiation_note}
                          </p>
                        )}
                        <div style={styles.negotiationActions}>
                          <button
                            className="btn btn-primary"
                            onClick={() => handleAcceptNegotiation(product.id)}
                          >
                            قبول العرض
                          </button>
                          <button
                            className="btn btn-danger"
                            onClick={() => handleRejectNegotiation(product.id)}
                          >
                            رفض العرض
                          </button>
                        </div>
                      </div>
                    )}

                    {product.rejection_reason && (
                      <div style={styles.rejection}>
                        <strong>سبب الرفض:</strong> {product.rejection_reason}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '24px',
    marginBottom: '40px'
  },
  profileCard: {
    marginBottom: '40px',
    padding: '40px'
  },
  title: {
    fontSize: '36px',
    color: '#f9fafb',
    marginBottom: '32px',
    fontWeight: '800',
    display: 'flex',
    alignItems: 'center'
  },
  info: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '16px',
    background: 'rgba(107, 124, 89, 0.04)',
    borderRadius: '16px',
    border: '1px solid rgba(107, 124, 89, 0.08)'
  },
  label: {
    fontWeight: '500',
    color: '#7a7a7a',
    fontSize: '14px'
  },
  value: {
    color: '#2d2d2d',
    fontWeight: '500'
  },
  productsSection: {
    marginTop: '48px'
  },
  subtitle: {
    fontSize: '28px',
    color: '#2d2d2d',
    marginBottom: '32px',
    fontWeight: '600'
  },
  empty: {
    textAlign: 'center',
    padding: '60px',
    color: '#999',
    fontSize: '16px'
  },
  productsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  productCard: {
    transition: 'all 0.3s ease',
    padding: '24px'
  },
  productLayout: {
    display: 'flex',
    gap: '24px',
    flexWrap: 'wrap'
  },
  productImages: {
    position: 'relative',
    flex: '0 0 180px',
    height: '180px'
  },
  productImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: '16px'
  },
  imageCount: {
    position: 'absolute',
    bottom: '12px',
    right: '12px',
    background: 'rgba(107, 124, 89, 0.9)',
    backdropFilter: 'blur(8px)',
    color: 'white',
    padding: '6px 12px',
    borderRadius: '16px',
    fontSize: '13px',
    fontWeight: '500'
  },
  productInfo: {
    flex: '1',
    minWidth: '280px'
  },
  productHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    gap: '12px'
  },
  productTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#2d2d2d'
  },
  status: {
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '500',
    whiteSpace: 'nowrap'
  },
  productDesc: {
    color: '#7a7a7a',
    marginBottom: '16px',
    lineHeight: '1.6',
    fontSize: '15px'
  },
  productDetails: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '16px',
    flexWrap: 'wrap',
    fontSize: '14px',
    color: '#5d5d5d',
    paddingTop: '16px',
    borderTop: '1px solid rgba(107, 124, 89, 0.1)'
  },
  rejection: {
    marginTop: '16px',
    padding: '16px',
    background: 'rgba(139, 115, 85, 0.08)',
    color: '#8b7355',
    borderRadius: '16px',
    fontSize: '14px',
    border: '1px solid rgba(139, 115, 85, 0.2)'
  },
  recycleInfo: {
    marginTop: '16px',
    padding: '16px',
    background: 'rgba(107, 124, 89, 0.08)',
    color: '#556b2f',
    borderRadius: '16px',
    fontSize: '14px',
    border: '1px solid rgba(107, 124, 89, 0.2)'
  },
  negotiationOffer: {
    marginTop: '16px',
    padding: '20px',
    background: 'rgba(107, 124, 89, 0.06)',
    borderRadius: '20px',
    border: '1px solid rgba(107, 124, 89, 0.15)'
  },
  negotiationTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#2d2d2d',
    marginBottom: '16px'
  },
  priceComparison: {
    display: 'flex',
    justifyContent: 'space-around',
    marginBottom: '16px',
    gap: '20px',
    flexWrap: 'wrap'
  },
  priceLabel: {
    display: 'block',
    fontSize: '13px',
    color: '#999',
    marginBottom: '6px',
    fontWeight: '500'
  },
  oldPrice: {
    display: 'block',
    fontSize: '18px',
    fontWeight: '500',
    color: '#b0b0b0',
    textDecoration: 'line-through'
  },
  newPrice: {
    display: 'block',
    fontSize: '22px',
    fontWeight: '600',
    color: '#6b7c59'
  },
  negotiationNote: {
    background: 'white',
    padding: '14px',
    borderRadius: '12px',
    fontSize: '14px',
    marginBottom: '16px',
    color: '#5d5d5d',
    lineHeight: '1.6'
  },
  negotiationActions: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap'
  }
};
