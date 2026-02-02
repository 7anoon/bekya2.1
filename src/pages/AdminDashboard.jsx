import { useEffect, useState } from 'react';
import { useProductStore } from '../store/productStore';
import { supabase } from '../lib/supabase';
import ImageLightbox from '../components/ImageLightbox';

export default function AdminDashboard() {
  const [pendingProducts, setPendingProducts] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [negotiationPrice, setNegotiationPrice] = useState('');
  const [negotiationNote, setNegotiationNote] = useState('');
  const [lightboxImages, setLightboxImages] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [userRole, setUserRole] = useState(null);
  const { fetchPendingProducts, approveProduct, rejectProduct, negotiateProduct } = useProductStore();

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

  const getStatusText = (product) => {
    // إذا البائع وافق على العرض - نتحقق من negotiation_note
    if (product.status === 'pending' && product.final_price && product.negotiation_note?.includes('البائع وافق')) {
      return '🎉 البائع وافق - يحتاج موافقتك النهائية';
    }
    
    // إذا كان البائع رفض عرض التفاوض
    if (product.seller_rejected_negotiation) {
      return '🔴 البائع رفض السعر';
    }
    
    // إذا كان العميل رفض السعر الأولي من الـ AI
    if (product.rejected_initial_price) {
      return '❌ رفض السعر';
    }
    
    const statusMap = {
      pending: '⏳ طلب جديد',
      approved: '✅ تم القبول',
      rejected: '❌ مرفوض نهائياً',
      awaiting_seller: '⏰ في انتظار رد البائع'
    };
    return statusMap[product.status] || product.status;
  };

  const getStatusStyle = (product) => {
    const baseStyle = {
      ...styles.statusBadge
    };

    // إذا البائع وافق - لون أخضر مميز
    if (product.status === 'pending' && product.final_price && product.negotiation_note?.includes('البائع وافق')) {
      return {
        ...baseStyle,
        background: '#10b981',
        color: '#ffffff',
        border: '3px solid #059669',
        fontWeight: 'bold',
        fontSize: '14px',
        animation: 'pulse 2s infinite'
      };
    }

    // إذا البائع رفض عرض التفاوض - لون أحمر غامق
    if (product.seller_rejected_negotiation) {
      return {
        ...baseStyle,
        background: '#dc2626',
        color: '#ffffff',
        border: '3px solid #991b1b',
        fontWeight: 'bold',
        fontSize: '14px',
        animation: 'pulse 2s infinite'
      };
    }

    // إذا رفض السعر الأولي، لون أحمر مميز
    if (product.rejected_initial_price) {
      return {
        ...baseStyle,
        background: '#fee2e2',
        color: '#dc2626',
        border: '2px solid #ef4444',
        fontWeight: 'bold'
      };
    }

    const statusStyles = {
      pending: {
        background: '#fef3c7',
        color: '#000000',
        border: '2px solid #f59e0b'
      },
      approved: {
        background: '#f0fdf4',
        color: '#166534',
        border: '2px solid #10b981'
      },
      rejected: {
        background: '#fee2e2',
        color: '#991b1b',
        border: '2px solid #ef4444'
      },
      awaiting_seller: {
        background: '#eff6ff',
        color: '#000000',
        border: '2px solid #3b82f6'
      }
    };

    return { ...baseStyle, ...statusStyles[product.status] };
  };

  useEffect(() => {
    let mounted = true;
    let timeoutId = null;
    
    const loadDataSafely = async () => {
      try {
        // Timeout fallback
        timeoutId = setTimeout(() => {
          if (mounted) {
            console.error('Loading timeout - forcing stop');
            setPendingProducts([]);
            setAllUsers([]);
          }
        }, 15000);
        
        if (mounted) {
          await loadData();
        }
      } catch (error) {
        console.error('Error in loadDataSafely:', error);
      } finally {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      }
    };
    
    loadDataSafely();
    
    return () => {
      mounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  const loadData = async () => {
    try {
      console.log('Starting to load data...');
      
      // التحقق من دور المستخدم
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Error getting user:', userError);
        throw userError;
      }
      
      if (!user) {
        console.error('No user found');
        alert('يجب تسجيل الدخول أولاً');
        window.location.href = '/login';
        return;
      }
      
      console.log('User found:', user.id);
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (profileError) {
        console.error('Error fetching profile:', profileError);
        throw profileError;
      }
      
      console.log('User role:', profile?.role);
      setUserRole(profile?.role);
      
      if (profile?.role !== 'admin') {
        console.error('User is not admin');
        alert('ليس لديك صلاحية الوصول لهذه الصفحة');
        window.location.href = '/';
        return;
      }
      
      console.log('User is admin, fetching products...');
      const products = await fetchPendingProducts();
      console.log('Fetched products:', products?.length || 0, 'products');
      setPendingProducts(products || []);

      console.log('Fetching users...');
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (usersError) {
        console.error('Error fetching users:', usersError);
      } else {
        console.log('Fetched users:', users?.length || 0, 'users');
        setAllUsers(users || []);
      }
      
      console.log('Data loaded successfully');
    } catch (err) {
      // تجاهل AbortError لأنه طبيعي لما الـ component يختفي
      if (err.name === 'AbortError') {
        console.log('Request was aborted (component unmounted)');
        return;
      }
      
      console.error('Error loading data:', err);
      
      // عرض رسالة خطأ واضحة للمستخدم
      const errorMessage = err.message || 'حدث خطأ غير معروف';
      alert('حدث خطأ في تحميل البيانات: ' + errorMessage);
      
      // تعيين قيم فارغة
      setPendingProducts([]);
      setAllUsers([]);
    } finally {
    }
  };

  const handleApprove = async (productId, price) => {
    try {
      await approveProduct(productId, price);
      alert('تم الموافقة على المنتج');
      loadData();
      setSelectedProduct(null);
    } catch (err) {
      alert('خطأ في الموافقة على المنتج');
    }
  };

  const handleReject = async (productId, reason) => {
    try {
      await rejectProduct(productId, reason);
      alert('تم رفض المنتج');
      loadData();
      setSelectedProduct(null);
    } catch (err) {
      alert('خطأ في رفض المنتج');
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج نهائياً؟ لا يمكن التراجع عن هذا الإجراء.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      alert('تم حذف المنتج بنجاح');
      loadData();
    } catch (err) {
      console.error('Error deleting product:', err);
      alert('خطأ في حذف المنتج: ' + err.message);
    }
  };

  const handleNegotiate = (product) => {
    setSelectedProduct(product);
    setNegotiationPrice(product.suggested_price);
    setNegotiationNote('');
  };

  const handleSendNegotiation = async () => {
    if (!negotiationPrice || negotiationPrice <= 0) {
      alert('يجب إدخال سعر صحيح');
      return;
    }

    try {
      await negotiateProduct(selectedProduct.id, negotiationPrice, negotiationNote);
      alert('تم إرسال عرض التفاوض للبائع');
      loadData();
      setSelectedProduct(null);
      setNegotiationNote('');
    } catch (err) {
      alert('خطأ في إرسال عرض التفاوض');
    }
  };

  return (
    <div className="container">
      <h1 style={styles.title}>لوحة الإدارة</h1>

      {/* روابط سريعة */}
      <div style={styles.quickLinks}>
        <a href="/admin/inventory" className="card" style={styles.linkCard}>
          <div style={styles.linkIcon}>📦</div>
          <div style={styles.linkTitle}>إدارة المخزون</div>
          <div style={styles.linkDesc}>متابعة المنتجات والفئات</div>
        </a>
        <a href="/admin/offers" className="card" style={styles.linkCard}>
          <div style={styles.linkIcon}>🎁</div>
          <div style={styles.linkTitle}>إدارة العروض</div>
          <div style={styles.linkDesc}>إضافة وتعديل العروض</div>
        </a>
        <a href="/admin/users" className="card" style={styles.linkCard}>
          <div style={styles.linkIcon}>👥</div>
          <div style={styles.linkTitle}>إدارة المستخدمين</div>
          <div style={styles.linkDesc}>عرض وإدارة المستخدمين</div>
        </a>
      </div>

      <div style={styles.stats}>
        <div className="card" style={styles.statCard}>
          <h3 style={styles.statNumber}>{pendingProducts.length}</h3>
          <p style={styles.statLabel}>منتجات قيد المراجعة</p>
        </div>
        <div className="card" style={styles.statCard}>
          <h3 style={styles.statNumber}>{allUsers.length}</h3>
          <p style={styles.statLabel}>إجمالي المستخدمين</p>
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.subtitle}>المنتجات قيد المراجعة</h2>
        
        {pendingProducts.length === 0 ? (
          <div style={styles.empty}>لا توجد منتجات قيد المراجعة</div>
        ) : (
          <div style={styles.productsList}>
            {pendingProducts.map((product) => (
              <div key={product.id} className="card" style={styles.productCard}>
                <div style={styles.productImages}>
                  {product.images.slice(0, 4).map((img, idx) => (
                    <img 
                      key={idx}
                      src={img} 
                      alt={`صورة ${idx + 1}`}
                      style={styles.productImage}
                      onClick={() => {
                        setLightboxImages(product.images);
                        setLightboxIndex(idx);
                      }}
                    />
                  ))}
                </div>

                <div style={styles.productInfo}>
                  <div style={styles.productHeader}>
                    <h3 style={styles.productTitle}>{product.title}</h3>
                    <span style={getStatusStyle(product)}>
                      {getStatusText(product)}
                    </span>
                  </div>
                  <p style={styles.productDesc}>{product.description}</p>
                  
                  {/* تحذير إذا البائع رفض السعر */}
                  {product.seller_rejected_negotiation && (
                    <div style={styles.rejectionWarning}>
                      <strong>⚠️ تنبيه:</strong> البائع رفض عرض التفاوض السابق ويحتاج تفاوض جديد
                      {product.negotiation_note && (
                        <p style={styles.rejectionNote}>{product.negotiation_note}</p>
                      )}
                    </div>
                  )}
                  
                  {/* رسالة إذا البائع وافق */}
                  {product.status === 'pending' && product.final_price && product.negotiation_note?.includes('البائع وافق') && (
                    <div style={styles.acceptanceNotice}>
                      <strong>✅ البائع وافق على العرض!</strong>
                      <p>السعر المتفق عليه: <span style={styles.agreedPrice}>{product.final_price} جنيه</span></p>
                      <p style={styles.noticeText}>يحتاج موافقتك النهائية لنشر المنتج في التطبيق</p>
                    </div>
                  )}
                  
                  <div style={styles.productDetails}>
                    {product.category && (
                      <div style={styles.detailRow}>
                        <span style={styles.detailLabel}>الفئة:</span>
                        <span style={styles.sellerData}>{getCategoryName(product.category)}</span>
                      </div>
                    )}
                    {product.weight && (
                      <div style={styles.detailRow}>
                        <span style={styles.detailLabel}>الوزن:</span>
                        <span style={styles.sellerData}>{product.weight} كجم</span>
                      </div>
                    )}
                    {product.condition && (
                      <div style={styles.detailRow}>
                        <span style={styles.detailLabel}>الحالة:</span>
                        <span style={styles.sellerData}>{product.condition}</span>
                      </div>
                    )}
                    {product.original_price && (
                      <div style={styles.detailRow}>
                        <span style={styles.detailLabel}>السعر الأصلي:</span>
                        <span>{product.original_price} جنيه</span>
                      </div>
                    )}
                    {product.suggested_price && (
                      <div style={styles.detailRow}>
                        <span style={styles.detailLabel}>السعر المقترح:</span>
                        <span style={styles.priceHighlight}>{product.suggested_price} جنيه</span>
                      </div>
                    )}
                    {product.discount_percentage && (
                      <div style={styles.detailRow}>
                        <span style={styles.detailLabel}>نسبة التخفيض:</span>
                        <span style={styles.discountBadge}>{product.discount_percentage}%</span>
                      </div>
                    )}
                    {product.choice_type && (
                      <div style={styles.detailRow}>
                        <span style={styles.detailLabel}>نوع الطلب:</span>
                        <span>{product.choice_type === 'recycle' ? 'إعادة تدوير' : 'بيع'}</span>
                      </div>
                    )}
                  </div>

                  <div style={styles.sellerInfo}>
                    <h4 style={styles.sellerTitle}>معلومات البائع</h4>
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>الاسم:</span>
                      <span style={styles.sellerData}>{product.profiles?.username}</span>
                    </div>
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>البريد:</span>
                      <span style={styles.sellerData}>{product.profiles?.email}</span>
                    </div>
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>الهاتف:</span>
                      <span style={styles.sellerData}>{product.profiles?.phone}</span>
                    </div>
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>الموقع:</span>
                      <span style={styles.sellerData}>{product.profiles?.location}</span>
                    </div>
                  </div>

                  {(!product.choice_type || product.choice_type === 'sell') && (
                    <div style={styles.actions}>
                      <button
                        className="btn btn-primary"
                        onClick={() => {
                          const price = prompt('أدخل السعر المناسب للمنتج (بالجنيه):');
                          if (price && price > 0) {
                            handleApprove(product.id, price);
                          }
                        }}
                      >
                        موافقة وتحديد السعر
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={() => handleNegotiate(product)}
                      >
                        تفاوض
                      </button>
                      <button
                        className="btn"
                        style={{ background: '#3b82f6', color: 'white' }}
                        onClick={() => window.location.href = `/bekya2.1/edit-product/${product.id}`}
                      >
                        تعديل
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => {
                          const reason = prompt('سبب الرفض:');
                          if (reason) handleReject(product.id, reason);
                        }}
                      >
                        رفض
                      </button>
                      <button
                        className="btn"
                        style={{ background: '#dc2626', color: 'white' }}
                        onClick={() => handleDeleteProduct(product.id)}
                      >
                        حذف نهائي
                      </button>
                    </div>
                  )}

                  {product.choice_type === 'recycle' && (
                    <div style={styles.recycleNote}>
                      <p><strong>فكرة إعادة التدوير:</strong></p>
                      <p>{product.recycle_idea}</p>
                      <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                        <button
                          className="btn btn-primary"
                          onClick={() => handleApprove(product.id, 0)}
                        >
                          موافقة على إعادة التدوير
                        </button>
                        <button
                          className="btn"
                          style={{ background: '#3b82f6', color: 'white' }}
                          onClick={() => window.location.href = `/bekya2.1/edit-product/${product.id}`}
                        >
                          تعديل
                        </button>
                        <button
                          className="btn"
                          style={{ background: '#dc2626', color: 'white' }}
                          onClick={() => handleDeleteProduct(product.id)}
                        >
                          حذف نهائي
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedProduct && (
        <div style={styles.modal}>
          <div className="card" style={styles.modalContent}>
            <h3 style={styles.modalTitle}>التفاوض على السعر</h3>
            <p>المنتج: {selectedProduct.title}</p>
            {selectedProduct.suggested_price && (
              <p>السعر المقترح السابق: {selectedProduct.suggested_price} جنيه</p>
            )}
            
            <div style={styles.field}>
              <label style={styles.label}>عرض السعر:</label>
              <input
                type="number"
                className="input"
                value={negotiationPrice}
                onChange={(e) => setNegotiationPrice(e.target.value)}
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
                onClick={() => handleApprove(selectedProduct.id, negotiationPrice)}
              >
                موافقة مباشرة
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setSelectedProduct(null)}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {lightboxImages && (
        <ImageLightbox 
          images={lightboxImages}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxImages(null)}
        />
      )}
    </div>
  );
}

const styles = {
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '60vh',
    gap: '20px'
  },
  loadingText: {
    fontSize: '18px',
    color: '#6b7280',
    marginTop: '16px'
  },
  refreshButton: {
    marginTop: '12px'
  },
  title: {
    fontSize: '32px',
    color: '#10b981',
    marginBottom: '30px'
  },
  quickLinks: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '40px'
  },
  linkCard: {
    padding: '24px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textDecoration: 'none',
    display: 'block'
  },
  linkIcon: {
    fontSize: '48px',
    marginBottom: '12px'
  },
  linkTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#2d2d2d',
    marginBottom: '8px'
  },
  linkDesc: {
    fontSize: '14px',
    color: '#7a7a7a'
  },
  stats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '40px'
  },
  statCard: {
    textAlign: 'center',
    padding: '30px'
  },
  statNumber: {
    fontSize: '36px',
    color: '#10b981',
    marginBottom: '8px'
  },
  statLabel: {
    color: '#6b7280',
    fontSize: '16px'
  },
  section: {
    marginBottom: '40px'
  },
  subtitle: {
    fontSize: '24px',
    color: '#374151',
    marginBottom: '20px'
  },
  empty: {
    textAlign: 'center',
    padding: '40px',
    color: '#6b7280'
  },
  productsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  productCard: {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap'
  },
  productImages: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '8px',
    flex: '0 0 300px'
  },
  productImage: {
    width: '100%',
    height: '140px',
    objectFit: 'cover',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'transform 0.3s, box-shadow 0.3s'
  },
  productInfo: {
    flex: '1',
    minWidth: '300px'
  },
  productHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    gap: '12px',
    flexWrap: 'wrap'
  },
  productTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0
  },
  statusBadge: {
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '600',
    whiteSpace: 'nowrap'
  },
  productDesc: {
    color: '#6b7280',
    marginBottom: '16px'
  },
  rejectionWarning: {
    background: '#fee2e2',
    border: '2px solid #dc2626',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '16px',
    color: '#991b1b',
    fontWeight: '600'
  },
  rejectionNote: {
    marginTop: '8px',
    fontSize: '14px',
    fontWeight: 'normal',
    color: '#7f1d1d'
  },
  acceptanceNotice: {
    background: '#f0fdf4',
    border: '3px solid #10b981',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '16px',
    color: '#166534',
    fontWeight: '600'
  },
  agreedPrice: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#10b981'
  },
  noticeText: {
    marginTop: '8px',
    fontSize: '14px',
    fontWeight: 'normal',
    color: '#166534'
  },
  productDetails: {
    background: 'rgba(107, 124, 89, 0.1)',
    border: '1px solid rgba(107, 124, 89, 0.2)',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '16px'
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px'
  },
  detailLabel: {
    fontWeight: '600',
    color: '#d1d5db'
  },
  priceHighlight: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#10b981'
  },
  discountBadge: {
    background: '#fef3c7',
    color: '#92400e',
    padding: '2px 8px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600'
  },
  sellerInfo: {
    background: 'rgba(139, 115, 85, 0.1)',
    border: '1px solid rgba(139, 115, 85, 0.2)',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '16px'
  },
  sellerTitle: {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '12px',
    color: '#f9fafb'
  },
  sellerData: {
    color: '#d1d5db',
    fontWeight: '500'
  },
  actions: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap'
  },
  recycleNote: {
    background: 'rgba(107, 124, 89, 0.15)',
    padding: '16px',
    borderRadius: '8px',
    border: '2px solid rgba(107, 124, 89, 0.4)'
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
    width: '90%'
  },
  modalTitle: {
    fontSize: '20px',
    marginBottom: '16px',
    color: '#10b981'
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
    marginTop: '20px'
  }
};
