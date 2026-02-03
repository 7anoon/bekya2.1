import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';

export default function StockTracking() {
  const { profile } = useAuthStore();
  const navigate = useNavigate();
  const [categories, setCategories] = useState({});
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const categoryNames = {
    furniture: 'أثاث',
    clothes: 'ملابس',
    books: 'كتب',
    toys: 'ألعاب',
    appliances: 'أجهزة منزلية',
    sports: 'رياضة',
    jewelry: 'مجوهرات وإكسسوارات',
    other: 'أخرى'
  };

  const MIN_STOCK = 5; // الحد الأدنى للمخزون

  useEffect(() => {
    if (profile?.role !== 'admin') {
      navigate('/');
      return;
    }
    
    loadStockData();

    // الاستماع للتغييرات في الوقت الفعلي
    const channel = supabase
      .channel('stock-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products'
        },
        (payload) => {
          console.log('تغيير في المنتجات:', payload);
          loadStockData();
        }
      )
      .subscribe();

    // تحديث كل 30 ثانية
    const interval = setInterval(() => {
      loadStockData();
    }, 30000);

    return () => {
      channel.unsubscribe();
      clearInterval(interval);
    };
  }, [profile, navigate]);

  const loadStockData = async () => {
    try {
      setLoading(true);

      // جلب كل المنتجات
      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Database error:', error);
        // Handle specific 404 errors
        if (error.code === '42P01' || error.message.includes('does not exist')) {
          alert('⚠️ جدول المنتجات غير موجود. يرجى تشغيل ملف final-migration.sql في Supabase SQL Editor');
        } else {
          alert('حدث خطأ في تحميل البيانات: ' + error.message);
        }
        return;
      }

      // تنظيم البيانات حسب الفئات
      const categorizedData = {};
      
      Object.keys(categoryNames).forEach(cat => {
        const categoryProducts = products.filter(p => p.category === cat);
        
        categorizedData[cat] = {
          name: categoryNames[cat],
          total: categoryProducts.length,
          available: categoryProducts.filter(p => p.status === 'approved').length,
          pending: categoryProducts.filter(p => p.status === 'pending').length,
          sold: categoryProducts.filter(p => p.status === 'sold').length,
          rejected: categoryProducts.filter(p => p.status === 'rejected').length,
          products: categoryProducts
        };
      });

      setCategories(categorizedData);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error loading stock data:', err);
      alert('حدث خطأ في تحميل البيانات: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getLowStockCategories = () => {
    return Object.entries(categories)
      .filter(([_, data]) => data.available < MIN_STOCK)
      .sort((a, b) => a[1].available - b[1].available);
  };

  const getStockStatus = (available) => {
    if (available === 0) return { text: 'نفذ المخزون', color: '#dc2626', icon: '🔴' };
    if (available < 3) return { text: 'مخزون حرج', color: '#ef4444', icon: '⚠️' };
    if (available < MIN_STOCK) return { text: 'مخزون منخفض', color: '#f59e0b', icon: '⚡' };
    return { text: 'مخزون جيد', color: '#10b981', icon: '✅' };
  };

  const getTotalStats = () => {
    const total = Object.values(categories).reduce((sum, cat) => sum + cat.total, 0);
    const available = Object.values(categories).reduce((sum, cat) => sum + cat.available, 0);
    const sold = Object.values(categories).reduce((sum, cat) => sum + cat.sold, 0);
    const pending = Object.values(categories).reduce((sum, cat) => sum + cat.pending, 0);
    
    return { total, available, sold, pending };
  };

  if (loading && Object.keys(categories).length === 0) {
    return (
      <div className="container">
        <div style={styles.loading}>
          <div className="spinner"></div>
          <p>جاري التحميل...</p>
        </div>
      </div>
    );
  }

  const lowStockCategories = getLowStockCategories();
  const stats = getTotalStats();

  return (
    <div className="container">
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>متابعة المخزون والمبيعات</h1>
          <p style={styles.lastUpdate}>
            آخر تحديث: {lastUpdate.toLocaleTimeString('ar-EG')}
          </p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={loadStockData}
          disabled={loading}
        >
          {loading ? '⏳ جاري التحديث...' : '🔄 تحديث'}
        </button>
      </div>

      {/* إحصائيات عامة */}
      <div style={styles.statsGrid}>
        <div className="card" style={styles.statCard}>
          <div style={styles.statIcon}>📦</div>
          <div style={styles.statValue}>{stats.total}</div>
          <div style={styles.statLabel}>إجمالي المنتجات</div>
        </div>
        <div className="card" style={{...styles.statCard, borderLeft: '4px solid #10b981'}}>
          <div style={styles.statIcon}>✅</div>
          <div style={{...styles.statValue, color: '#10b981'}}>{stats.available}</div>
          <div style={styles.statLabel}>متاح للبيع</div>
        </div>
        <div className="card" style={{...styles.statCard, borderLeft: '4px solid #3b82f6'}}>
          <div style={styles.statIcon}>💰</div>
          <div style={{...styles.statValue, color: '#3b82f6'}}>{stats.sold}</div>
          <div style={styles.statLabel}>تم البيع</div>
        </div>
        <div className="card" style={{...styles.statCard, borderLeft: '4px solid #f59e0b'}}>
          <div style={styles.statIcon}>⏳</div>
          <div style={{...styles.statValue, color: '#f59e0b'}}>{stats.pending}</div>
          <div style={styles.statLabel}>قيد المراجعة</div>
        </div>
      </div>

      {/* تنبيهات المخزون المنخفض */}
      {lowStockCategories.length > 0 && (
        <div className="card" style={styles.alertCard}>
          <h2 style={styles.alertTitle}>⚠️ تنبيهات المخزون</h2>
          <div style={styles.alertsList}>
            {lowStockCategories.map(([cat, data]) => {
              const status = getStockStatus(data.available);
              return (
                <div key={cat} style={styles.alertItem}>
                  <div style={styles.alertInfo}>
                    <span style={styles.alertIcon}>{status.icon}</span>
                    <div>
                      <div style={styles.alertCategory}>{data.name}</div>
                      <div style={{...styles.alertStatus, color: status.color}}>
                        {status.text} - متاح: {data.available} منتج
                      </div>
                    </div>
                  </div>
                  <button
                    className="btn"
                    style={{...styles.actionBtn, background: status.color}}
                    onClick={() => navigate('/admin')}
                  >
                    إضافة منتج
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* جدول الفئات */}
      <div className="card" style={styles.tableCard}>
        <h2 style={styles.sectionTitle}>تفاصيل الفئات</h2>
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeader}>
                <th style={styles.th}>الفئة</th>
                <th style={styles.th}>الإجمالي</th>
                <th style={styles.th}>متاح</th>
                <th style={styles.th}>تم البيع</th>
                <th style={styles.th}>قيد المراجعة</th>
                <th style={styles.th}>مرفوض</th>
                <th style={styles.th}>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(categories).map(([cat, data]) => {
                const status = getStockStatus(data.available);
                return (
                  <tr key={cat} style={styles.tableRow}>
                    <td style={styles.td}>
                      <strong>{data.name}</strong>
                    </td>
                    <td style={styles.td}>{data.total}</td>
                    <td style={{...styles.td, fontWeight: '600', color: '#10b981'}}>
                      {data.available}
                    </td>
                    <td style={{...styles.td, color: '#3b82f6'}}>{data.sold}</td>
                    <td style={{...styles.td, color: '#f59e0b'}}>{data.pending}</td>
                    <td style={{...styles.td, color: '#ef4444'}}>{data.rejected}</td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.statusBadge,
                        background: status.color + '20',
                        color: status.color
                      }}>
                        {status.icon} {status.text}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* تفاصيل كل فئة */}
      <div style={styles.categoriesSection}>
        <h2 style={styles.sectionTitle}>تفاصيل المنتجات حسب الفئة</h2>
        <div style={styles.categoriesGrid}>
          {Object.entries(categories).map(([cat, data]) => {
            const status = getStockStatus(data.available);
            return (
              <div key={cat} className="card" style={styles.categoryCard}>
                <div style={styles.categoryHeader}>
                  <h3 style={styles.categoryTitle}>{data.name}</h3>
                  <span style={{
                    ...styles.categoryBadge,
                    background: status.color,
                    color: 'white'
                  }}>
                    {status.icon} {data.available}
                  </span>
                </div>

                <div style={styles.categoryStats}>
                  <div style={styles.statItem}>
                    <span style={styles.statItemLabel}>الإجمالي:</span>
                    <span style={styles.statItemValue}>{data.total}</span>
                  </div>
                  <div style={styles.statItem}>
                    <span style={styles.statItemLabel}>متاح:</span>
                    <span style={{...styles.statItemValue, color: '#10b981'}}>{data.available}</span>
                  </div>
                  <div style={styles.statItem}>
                    <span style={styles.statItemLabel}>مباع:</span>
                    <span style={{...styles.statItemValue, color: '#3b82f6'}}>{data.sold}</span>
                  </div>
                </div>

                {data.available < MIN_STOCK && (
                  <div style={{...styles.warningBox, background: status.color + '15', borderColor: status.color}}>
                    {status.icon} يحتاج إضافة منتجات جديدة
                  </div>
                )}

                <button
                  className="btn"
                  style={styles.viewBtn}
                  onClick={() => navigate('/browse')}
                >
                  عرض المنتجات
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '30px',
    flexWrap: 'wrap',
    gap: '16px'
  },
  title: {
    fontSize: '32px',
    color: '#000000',
    margin: 0,
    fontWeight: '600',
    marginBottom: '8px'
  },
  lastUpdate: {
    fontSize: '14px',
    color: '#6b7280',
    fontWeight: '500'
  },
  loading: {
    textAlign: 'center',
    padding: '80px 20px',
    color: '#000000'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '30px'
  },
  statCard: {
    padding: '24px',
    textAlign: 'center',
    transition: 'all 0.3s ease'
  },
  statIcon: {
    fontSize: '40px',
    marginBottom: '12px'
  },
  statValue: {
    fontSize: '36px',
    fontWeight: '700',
    color: '#000000',
    marginBottom: '8px'
  },
  statLabel: {
    fontSize: '14px',
    color: '#000000',
    fontWeight: '500'
  },
  alertCard: {
    padding: '24px',
    marginBottom: '30px',
    background: '#fef3c7',
    border: '2px solid #f59e0b'
  },
  alertTitle: {
    fontSize: '20px',
    color: '#92400e',
    marginBottom: '20px',
    fontWeight: '600'
  },
  alertsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  alertItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    background: 'white',
    borderRadius: '12px',
    gap: '16px',
    flexWrap: 'wrap'
  },
  alertInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  alertIcon: {
    fontSize: '24px'
  },
  alertCategory: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#000000',
    marginBottom: '4px'
  },
  alertStatus: {
    fontSize: '14px',
    fontWeight: '500'
  },
  actionBtn: {
    color: 'white',
    borderRadius: '20px',
    padding: '8px 20px',
    fontSize: '14px',
    fontWeight: '600',
    border: 'none',
    cursor: 'pointer'
  },
  tableCard: {
    padding: '24px',
    marginBottom: '30px'
  },
  sectionTitle: {
    fontSize: '24px',
    color: '#000000',
    marginBottom: '20px',
    fontWeight: '600'
  },
  tableWrapper: {
    overflowX: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  tableHeader: {
    background: 'rgba(107, 124, 89, 0.1)',
    borderBottom: '2px solid rgba(107, 124, 89, 0.3)'
  },
  th: {
    padding: '16px',
    textAlign: 'right',
    fontWeight: '600',
    color: '#000000',
    fontSize: '14px'
  },
  tableRow: {
    borderBottom: '1px solid #e5e7eb',
    transition: 'background 0.2s ease'
  },
  td: {
    padding: '16px',
    fontSize: '14px',
    color: '#000000'
  },
  statusBadge: {
    padding: '6px 12px',
    borderRadius: '16px',
    fontSize: '12px',
    fontWeight: '600',
    display: 'inline-block'
  },
  categoriesSection: {
    marginTop: '40px'
  },
  categoriesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px'
  },
  categoryCard: {
    padding: '20px'
  },
  categoryHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  categoryTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#000000',
    margin: 0
  },
  categoryBadge: {
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '16px',
    fontWeight: '700'
  },
  categoryStats: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '16px'
  },
  statItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px',
    background: 'rgba(107, 124, 89, 0.05)',
    borderRadius: '8px'
  },
  statItemLabel: {
    fontSize: '14px',
    color: '#000000',
    fontWeight: '500'
  },
  statItemValue: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#000000'
  },
  warningBox: {
    padding: '12px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: '12px',
    border: '2px solid'
  },
  viewBtn: {
    width: '100%',
    background: '#6b7c59',
    color: 'white',
    borderRadius: '20px',
    padding: '10px',
    fontSize: '14px',
    fontWeight: '600'
  }
};
