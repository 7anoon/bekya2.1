import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

export default function UserProducts() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // التحقق من أن المستخدم أدمن
    if (profile?.role !== 'admin') {
      navigate('/');
      return;
    }
    loadUserAndProducts();
  }, [userId, profile, navigate]);

  const loadUserAndProducts = async () => {
    try {
      setLoading(true);

      // جلب معلومات المستخدم
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError) throw userError;
      setUser(userData);

      // جلب منتجات المستخدم
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;
      setProducts(productsData || []);
    } catch (err) {
      console.error('Error loading data:', err);
      alert('حدث خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryName = (category) => {
    const categories = {
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

  const getStatusText = (status) => {
    const statusMap = {
      pending: 'قيد المراجعة',
      approved: 'تم الموافقة',
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
      <div className="container">
        <div style={styles.loading}>
          <div className="spinner"></div>
          <p>جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container">
        <div className="card" style={styles.error}>
          <h2>المستخدم غير موجود</h2>
          <button className="btn btn-primary" onClick={() => navigate('/admin/users')}>
            العودة لإدارة المستخدمين
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <button 
        className="btn" 
        onClick={() => navigate('/admin/users')}
        style={styles.backBtn}
      >
        ← رجوع لإدارة المستخدمين
      </button>

      <div className="card" style={styles.userCard}>
        <h1 style={styles.title}>منتجات {user.username}</h1>
        
        <div style={styles.userInfo}>
          <div style={styles.infoRow}>
            <span style={styles.label}>البريد الإلكتروني:</span>
            <span style={styles.value}>{user.email}</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.label}>الموقع:</span>
            <span style={styles.value}>{user.location}</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.label}>رقم الهاتف:</span>
            <span style={styles.value}>{user.phone}</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.label}>عدد المنتجات:</span>
            <span style={styles.value}>{products.length}</span>
          </div>
        </div>
      </div>

      <div style={styles.productsSection}>
        <h2 style={styles.subtitle}>المنتجات ({products.length})</h2>
        
        {products.length === 0 ? (
          <div className="card" style={styles.empty}>
            <p>لا توجد منتجات لهذا المستخدم</p>
          </div>
        ) : (
          <div style={styles.productsList}>
            {products.map((product) => (
              <div 
                key={product.id} 
                className="card" 
                style={styles.productCard}
                onClick={() => navigate(`/product/${product.id}`)}
              >
                <div style={styles.productLayout}>
                  {/* صور المنتج */}
                  {product.images && product.images.length > 0 && (
                    <div style={styles.productImages}>
                      <img 
                        src={product.images[0]} 
                        alt={product.title}
                        style={styles.productImage}
                        loading="lazy"
                        onError={(e) => {
                          e.target.src = 'https://placehold.co/180x180/e2e8f0/64748b?text=Image+Not+Found';
                        }}
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
                        {product.choice_type === 'recycle' 
                          ? 'إعادة تدوير' 
                          : product.final_price 
                            ? `السعر: ${product.final_price} جنيه` 
                            : product.suggested_price 
                              ? `السعر المقترح: ${product.suggested_price} جنيه` 
                              : 'في انتظار التسعير'}
                      </span>
                    </div>

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
  backBtn: {
    marginBottom: '20px'
  },
  loading: {
    textAlign: 'center',
    padding: '80px 20px',
    color: '#9ca3af'
  },
  error: {
    textAlign: 'center',
    padding: '60px 20px'
  },
  userCard: {
    marginBottom: '40px',
    padding: '32px'
  },
  title: {
    fontSize: '32px',
    color: '#2d2d2d',
    marginBottom: '24px',
    fontWeight: '600'
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px',
    background: 'rgba(107, 124, 89, 0.05)',
    borderRadius: '12px'
  },
  label: {
    fontWeight: '600',
    color: '#5d5d5d',
    fontSize: '14px'
  },
  value: {
    color: '#2d2d2d',
    fontWeight: '500'
  },
  productsSection: {
    marginTop: '40px'
  },
  subtitle: {
    fontSize: '24px',
    color: '#2d2d2d',
    marginBottom: '24px',
    fontWeight: '600'
  },
  empty: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#6b7280'
  },
  productsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  productCard: {
    transition: 'all 0.3s ease',
    padding: '20px',
    cursor: 'pointer'
  },
  productLayout: {
    display: 'flex',
    gap: '20px',
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
    borderRadius: '12px'
  },
  imageCount: {
    position: 'absolute',
    bottom: '8px',
    right: '8px',
    background: 'rgba(0, 0, 0, 0.7)',
    color: 'white',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
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
    marginBottom: '12px',
    gap: '12px'
  },
  productTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#2d2d2d'
  },
  status: {
    padding: '6px 14px',
    borderRadius: '16px',
    fontSize: '12px',
    fontWeight: '500',
    whiteSpace: 'nowrap'
  },
  productDesc: {
    color: '#7a7a7a',
    marginBottom: '12px',
    lineHeight: '1.6',
    fontSize: '14px'
  },
  productDetails: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    flexWrap: 'wrap',
    fontSize: '13px',
    color: '#6b7280',
    paddingTop: '12px',
    borderTop: '1px solid #e5e7eb'
  },
  rejection: {
    marginTop: '12px',
    padding: '12px',
    background: '#fee2e2',
    color: '#991b1b',
    borderRadius: '12px',
    fontSize: '13px'
  }
};
