import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';

export default function SalesRecord() {
  const { profile } = useAuthStore();
  const navigate = useNavigate();
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    product_id: '',
    buyer_name: '',
    buyer_phone: '',
    sale_price: '',
    sale_date: new Date().toISOString().slice(0, 16),
    notes: ''
  });

  useEffect(() => {
    if (profile?.role !== 'admin') {
      navigate('/');
      return;
    }
    loadData();
  }, [profile, navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // جلب المنتجات المعتمدة
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, title, final_price, category')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;
      setProducts(productsData || []);

      // جلب المبيعات من جدول products (المنتجات المباعة)
      const { data: salesData, error: salesError } = await supabase
        .from('products')
        .select(`
          id,
          title,
          final_price,
          category,
          buyer_name,
          buyer_phone,
          sale_date,
          sale_notes,
          created_at
        `)
        .eq('status', 'sold')
        .order('sale_date', { ascending: false });

      if (salesError) throw salesError;
      setSales(salesData || []);
    } catch (err) {
      console.error('Error loading data:', err);
      alert('حدث خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.product_id || !formData.buyer_name || !formData.sale_price) {
      alert('يجب إدخال المنتج واسم المشتري والسعر');
      return;
    }

    try {
      // تحديث المنتج ليصبح مباع
      const { error } = await supabase
        .from('products')
        .update({
          status: 'sold',
          buyer_name: formData.buyer_name,
          buyer_phone: formData.buyer_phone || null,
          sale_price: parseFloat(formData.sale_price),
          sale_date: formData.sale_date || new Date().toISOString(),
          sale_notes: formData.notes || null
        })
        .eq('id', formData.product_id);

      if (error) throw error;

      alert('تم تسجيل عملية البيع بنجاح!');
      setShowForm(false);
      setFormData({
        product_id: '',
        buyer_name: '',
        buyer_phone: '',
        sale_price: '',
        sale_date: new Date().toISOString().slice(0, 16),
        notes: ''
      });
      loadData();
    } catch (err) {
      console.error('Error saving sale:', err);
      alert('حدث خطأ في حفظ عملية البيع: ' + err.message);
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

  const getTotalSales = () => {
    return sales.reduce((sum, sale) => sum + parseFloat(sale.sale_price || sale.final_price || 0), 0);
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

  return (
    <div className="container">
      <div style={styles.header}>
        <h1 style={styles.title}>سجل المبيعات</h1>
        <button 
          className="btn btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'إلغاء' : '+ تسجيل عملية بيع'}
        </button>
      </div>

      {/* إحصائيات */}
      <div style={styles.statsGrid}>
        <div className="card" style={styles.statCard}>
          <div style={styles.statIcon}>📊</div>
          <div style={styles.statValue}>{sales.length}</div>
          <div style={styles.statLabel}>إجمالي المبيعات</div>
        </div>
        <div className="card" style={styles.statCard}>
          <div style={styles.statIcon}>💰</div>
          <div style={styles.statValue}>{getTotalSales().toFixed(2)} جنيه</div>
          <div style={styles.statLabel}>إجمالي الإيرادات</div>
        </div>
        <div className="card" style={styles.statCard}>
          <div style={styles.statIcon}>📦</div>
          <div style={styles.statValue}>{products.length}</div>
          <div style={styles.statLabel}>منتجات متاحة</div>
        </div>
      </div>

      {/* فورم إضافة عملية بيع */}
      {showForm && (
        <div className="card" style={styles.formCard}>
          <h2 style={styles.formTitle}>تسجيل عملية بيع جديدة</h2>
          <form onSubmit={handleSubmit}>
            <div style={styles.row}>
              <div style={styles.field}>
                <label style={styles.label}>اسم المشتري *</label>
                <input
                  type="text"
                  className="input"
                  value={formData.buyer_name}
                  onChange={(e) => setFormData({...formData, buyer_name: e.target.value})}
                  placeholder="أدخل اسم المشتري"
                  required
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>رقم الهاتف</label>
                <input
                  type="tel"
                  className="input"
                  value={formData.buyer_phone}
                  onChange={(e) => setFormData({...formData, buyer_phone: e.target.value})}
                  placeholder="01xxxxxxxxx"
                />
              </div>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>المنتج *</label>
              <select
                className="input"
                value={formData.product_id}
                onChange={(e) => {
                  const selectedProduct = products.find(p => p.id === e.target.value);
                  setFormData({
                    ...formData, 
                    product_id: e.target.value,
                    sale_price: selectedProduct?.final_price || ''
                  });
                }}
                required
              >
                <option value="">اختر المنتج</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.title} - {product.final_price} جنيه ({getCategoryName(product.category)})
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.row}>
              <div style={styles.field}>
                <label style={styles.label}>سعر البيع *</label>
                <input
                  type="number"
                  step="0.01"
                  className="input"
                  value={formData.sale_price}
                  onChange={(e) => setFormData({...formData, sale_price: e.target.value})}
                  placeholder="السعر بالجنيه"
                  required
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>تاريخ البيع</label>
                <input
                  type="datetime-local"
                  className="input"
                  value={formData.sale_date}
                  onChange={(e) => setFormData({...formData, sale_date: e.target.value})}
                />
              </div>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>ملاحظات</label>
              <textarea
                className="input"
                rows="3"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="أي ملاحظات إضافية..."
              />
            </div>

            <button type="submit" className="btn btn-primary" style={styles.submitBtn}>
              حفظ عملية البيع
            </button>
          </form>
        </div>
      )}

      {/* قائمة المبيعات */}
      <div style={styles.salesSection}>
        <h2 style={styles.subtitle}>سجل المبيعات ({sales.length})</h2>
        
        {sales.length === 0 ? (
          <div className="card" style={styles.empty}>
            <p>لا توجد عمليات بيع مسجلة</p>
          </div>
        ) : (
          <div style={styles.salesList}>
            {sales.map((sale) => (
              <div key={sale.id} className="card" style={styles.saleCard}>
                <div style={styles.saleHeader}>
                  <div>
                    <h3 style={styles.saleTitle}>{sale.title}</h3>
                    <span style={styles.saleCategory}>
                      {getCategoryName(sale.category)}
                    </span>
                  </div>
                  <div style={styles.salePrice}>
                    {sale.sale_price || sale.final_price} جنيه
                  </div>
                </div>

                <div style={styles.saleDetails}>
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>المشتري:</span>
                    <span style={styles.detailValue}>{sale.buyer_name || 'غير محدد'}</span>
                  </div>
                  {sale.buyer_phone && (
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>الهاتف:</span>
                      <span style={styles.detailValue}>{sale.buyer_phone}</span>
                    </div>
                  )}
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>تاريخ البيع:</span>
                    <span style={styles.detailValue}>
                      {sale.sale_date 
                        ? new Date(sale.sale_date).toLocaleDateString('ar-EG', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                        : new Date(sale.created_at).toLocaleDateString('ar-EG')}
                    </span>
                  </div>
                  {sale.sale_notes && (
                    <div style={styles.notesBox}>
                      <strong>ملاحظات:</strong> {sale.sale_notes}
                    </div>
                  )}
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
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    flexWrap: 'wrap',
    gap: '16px'
  },
  title: {
    fontSize: '32px',
    color: '#000000',
    margin: 0,
    fontWeight: '600'
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
    marginBottom: '40px'
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
    fontSize: '28px',
    fontWeight: '700',
    color: '#000000',
    marginBottom: '8px'
  },
  statLabel: {
    fontSize: '14px',
    color: '#000000',
    fontWeight: '500'
  },
  formCard: {
    marginBottom: '40px',
    padding: '32px'
  },
  formTitle: {
    fontSize: '24px',
    color: '#000000',
    marginBottom: '24px',
    fontWeight: '600'
  },
  field: {
    marginBottom: '20px'
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
  submitBtn: {
    width: '100%',
    padding: '14px',
    fontSize: '16px'
  },
  salesSection: {
    marginTop: '40px'
  },
  subtitle: {
    fontSize: '24px',
    color: '#000000',
    marginBottom: '24px',
    fontWeight: '600'
  },
  empty: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#000000'
  },
  salesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  saleCard: {
    padding: '24px'
  },
  saleHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '20px',
    paddingBottom: '16px',
    borderBottom: '2px solid #e5e7eb',
    gap: '16px',
    flexWrap: 'wrap'
  },
  saleTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#000000',
    marginBottom: '8px'
  },
  saleCategory: {
    display: 'inline-block',
    background: 'rgba(107, 124, 89, 0.1)',
    color: '#556b2f',
    padding: '6px 14px',
    borderRadius: '16px',
    fontSize: '13px',
    fontWeight: '500'
  },
  salePrice: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#6b7c59'
  },
  saleDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px',
    background: 'rgba(107, 124, 89, 0.05)',
    borderRadius: '8px'
  },
  detailLabel: {
    fontWeight: '600',
    color: '#000000',
    fontSize: '14px'
  },
  detailValue: {
    color: '#000000',
    fontWeight: '500',
    fontSize: '14px'
  },
  notesBox: {
    padding: '12px',
    background: 'rgba(139, 115, 85, 0.08)',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#000000',
    lineHeight: '1.6'
  }
};
