import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';

export default function InventoryManagement() {
  const { profile } = useAuthStore();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = {
    all: 'كل الفئات',
    furniture: 'أثاث',
    clothes: 'ملابس',
    books: 'كتب',
    toys: 'ألعاب',
    appliances: 'أجهزة منزلية',
    sports: 'رياضة',
    jewelry: 'مجوهرات وإكسسوارات',
    other: 'أخرى'
  };

  useEffect(() => {
    if (profile?.role !== 'admin') {
      navigate('/');
      return;
    }
    loadProducts();
  }, [profile, navigate]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          profiles (username, phone, location)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error('Error loading products:', err);
      alert('حدث خطأ في تحميل المنتجات');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryStats = () => {
    const stats = {};
    Object.keys(categories).forEach(cat => {
      if (cat === 'all') return;
      stats[cat] = {
        total: products.filter(p => p.category === cat).length,
        approved: products.filter(p => p.category === cat && p.status === 'approved').length,
        pending: products.filter(p => p.category === cat && p.status === 'pending').length
      };
    });
    return stats;
  };

  const getFilteredProducts = () => {
    let filtered = products;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const getStatusText = (status) => {
    const statusMap = {
      pending: 'قيد المراجعة',
      approved: 'معتمد',
      rejected: 'مرفوض',
      awaiting_seller: 'في انتظار البائع'
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

  const categoryStats = getCategoryStats();
  const filteredProducts = getFilteredProducts();

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

  return (
    <div className="container">
      <div style={styles.header}>
        <h1 style={styles.title}>إدارة المخزون</h1>
      </div>

      {/* إحصائيات عامة */}
      <div style={styles.statsGrid}>
        <div className="card" style={styles.statCard}>
          <div style={styles.statIcon}>📦</div>
          <div style={styles.statValue}>{products.length}</div>
          <div style={styles.statLabel}>إجمالي المنتجات</div>
        </div>
        <div className="card" style={styles.statCard}>
          <div style={styles.statIcon}>✅</div>
          <div style={styles.statValue}>
            {products.filter(p => p.status === 'approved').length}
          </div>
          <div style={styles.statLabel}>منتجات معتمدة</div>
        </div>
        <div className="card" style={styles.statCard}>
          <div style={styles.statIcon}>⏳</div>
          <div style={styles.statValue}>
            {products.filter(p => p.status === 'pending').length}
          </div>
          <div style={styles.statLabel}>في انتظار المراجعة</div>
        </div>
        <div className="card" style={styles.statCard}>
          <div style={styles.statIcon}>❌</div>
          <div style={styles.statValue}>
            {products.filter(p => p.status === 'rejected').length}
          </div>
          <div style={styles.statLabel}>منتجات مرفوضة</div>
        </div>
      </div>

      {/* إحصائيات الفئات */}
      <div className="card" style={styles.categoriesCard}>
        <h2 style={styles.sectionTitle}>إحصائيات الفئات</h2>
        <div style={styles.categoriesGrid}>
          {Object.entries(categoryStats).map(([cat, stats]) => (
            <div key={cat} style={styles.categoryItem}>
              <div style={styles.categoryHeader}>
                <span style={styles.categoryName}>{categories[cat]}</span>
                <span style={styles.categoryTotal}>{stats.total}</span>
              </div>
              <div style={styles.categoryStats}>
                <span style={{...styles.categoryBadge, background: '#10b98120', color: '#10b981'}}>
                  معتمد: {stats.approved}
                </span>
                <span style={{...styles.categoryBadge, background: '#f59e0b20', color: '#f59e0b'}}>
                  معلق: {stats.pending}
                </span>
              </div>
              {stats.approved < 3 && (
                <div style={styles.lowStockWarning}>
                  ⚠️ مخزون منخفض - يحتاج تجديد
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* فلاتر البحث */}
      <div className="card" style={styles.filtersCard}>
        <div style={styles.filtersRow}>
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>الفئة:</label>
            <select
              className="input"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={styles.filterSelect}
            >
              {Object.entries(categories).map(([key, value]) => (
                <option key={key} value={key}>{value}</option>
              ))}
            </select>
          </div>

          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>بحث:</label>
            <input
              type="text"
              className="input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث عن منتج..."
              style={styles.searchInput}
            />
          </div>
        </div>
      </div>

      {/* قائمة المنتجات */}
      <div style={styles.productsSection}>
        <h2 style={styles.subtitle}>
          المنتجات ({filteredProducts.length})
        </h2>
        
        {filteredProducts.length === 0 ? (
          <div className="card" style={styles.empty}>
            <p>لا توجد منتجات</p>
          </div>
        ) : (
          <div style={styles.productsList}>
            {filteredProducts.map((product) => (
              <div 
                key={product.id} 
                className="card" 
                style={styles.productCard}
                onClick={() => navigate(`/product/${product.id}`)}
              >
                <div style={styles.productLayout}>
                  {/* صورة المنتج */}
                  {product.images && product.images.length > 0 && (
                    <div style={styles.productImage}>
                      <img 
                        src={product.images[0]} 
                        alt={product.title}
                        style={styles.image}
                        onError={(e) => {
                          e.target.src = 'https://placehold.co/150x150/e2e8f0/64748b?text=No+Image';
                        }}
                      />
                    </div>
                  )}

                  {/* معلومات المنتج */}
                  <div style={styles.productInfo}>
                    <div style={styles.productHeader}>
                      <h3 style={styles.productTitle}>{product.title}</h3>
                      <span 
                        style={{
                          ...styles.statusBadge,
                          background: getStatusColor(product.status) + '20',
                          color: getStatusColor(product.status)
                        }}
                      >
                        {getStatusText(product.status)}
                      </span>
                    </div>

                    <p style={styles.productDesc}>{product.description}</p>

                    <div style={styles.productDetails}>
                      <span>الفئة: {categories[product.category]}</span>
                      <span>الحالة: {product.condition}</span>
                      {product.final_price && (
                        <span>السعر: {product.final_price} جنيه</span>
                      )}
                    </div>

                    {product.profiles && (
                      <div style={styles.sellerInfo}>
                        <span>البائع: {product.profiles.username}</span>
                        <span>📍 {product.profiles.location}</span>
                      </div>
                    )}

                    <div style={styles.productActions}>
                      <button
                        className="btn"
                        style={styles.editBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/edit-product/${product.id}`);
                        }}
                      >
                        ✏️ تعديل
                      </button>
                      <button
                        className="btn"
                        style={styles.viewBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/product/${product.id}`);
                        }}
                      >
                        👁️ عرض
                      </button>
                    </div>
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
  header: {
    marginBottom: '30px'
  },
  title: {
    fontSize: '32px',
    color: '#2d2d2d',
    margin: 0,
    fontWeight: '600'
  },
  loading: {
    textAlign: 'center',
    padding: '80px 20px',
    color: '#9ca3af'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '30px'
  },
  statCard: {
    padding: '24px',
    textAlign: 'center'
  },
  statIcon: {
    fontSize: '40px',
    marginBottom: '12px'
  },
  statValue: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#2d2d2d',
    marginBottom: '8px'
  },
  statLabel: {
    fontSize: '14px',
    color: '#7a7a7a',
    fontWeight: '500'
  },
  categoriesCard: {
    padding: '32px',
    marginBottom: '30px'
  },
  sectionTitle: {
    fontSize: '24px',
    color: '#2d2d2d',
    marginBottom: '24px',
    fontWeight: '600'
  },
  categoriesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px'
  },
  categoryItem: {
    padding: '20px',
    background: 'rgba(107, 124, 89, 0.05)',
    borderRadius: '12px',
    border: '1px solid rgba(107, 124, 89, 0.1)'
  },
  categoryHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },
  categoryName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#2d2d2d'
  },
  categoryTotal: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#6b7c59'
  },
  categoryStats: {
    display: 'flex',
    gap: '8px',
    marginBottom: '8px'
  },
  categoryBadge: {
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600'
  },
  lowStockWarning: {
    marginTop: '12px',
    padding: '8px',
    background: '#fef3c7',
    color: '#92400e',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    textAlign: 'center'
  },
  filtersCard: {
    padding: '24px',
    marginBottom: '30px'
  },
  filtersRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px'
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  filterLabel: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#2d2d2d'
  },
  filterSelect: {
    padding: '10px'
  },
  searchInput: {
    padding: '10px'
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
    padding: '20px',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  },
  productLayout: {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap'
  },
  productImage: {
    flex: '0 0 150px',
    height: '150px'
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: '12px'
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
  statusBadge: {
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
    gap: '16px',
    flexWrap: 'wrap',
    fontSize: '13px',
    color: '#6b7280',
    marginBottom: '12px',
    paddingBottom: '12px',
    borderBottom: '1px solid #e5e7eb'
  },
  sellerInfo: {
    display: 'flex',
    gap: '16px',
    fontSize: '13px',
    color: '#6b7280',
    marginBottom: '12px'
  },
  productActions: {
    display: 'flex',
    gap: '12px'
  },
  editBtn: {
    background: '#3b82f6',
    color: 'white',
    borderRadius: '20px',
    padding: '8px 16px',
    fontSize: '14px'
  },
  viewBtn: {
    background: '#6b7c59',
    color: 'white',
    borderRadius: '20px',
    padding: '8px 16px',
    fontSize: '14px'
  }
};
