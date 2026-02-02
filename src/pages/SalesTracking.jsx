import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { log, logError } from '../lib/utils';

export default function SalesTracking() {
  const { profile } = useAuthStore();
  const [sales, setSales] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    product_name: '',
    category: '',
    sold_to: '',
    sale_price: '',
    sale_date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // تحميل البيانات المطلوبة
  useEffect(() => {
    loadCategories();
    loadUsers();
    loadSalesHistory();
  }, []);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('category')
        .neq('status', 'sold')
        .group('category');
      
      if (error) throw error;
      
      const uniqueCategories = [...new Set(data.map(item => item.category))];
      setCategories(uniqueCategories);
    } catch (err) {
      logError('Error loading categories:', err);
    }
  };

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username')
        .order('username');
      
      if (error) throw error;
      setUsers(data);
    } catch (err) {
      logError('Error loading users:', err);
    }
  };

  const loadSalesHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('sales_tracking')
        .select(`
          *,
          sold_to_user:profiles!sold_to(username),
          recorded_by:profiles!user_id(username)
        `)
        .order('sale_date', { ascending: false });
      
      if (error) throw error;
      setSales(data || []);
    } catch (err) {
      logError('Error loading sales history:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const saleData = {
        product_name: formData.product_name,
        category: formData.category,
        sold_to: formData.sold_to,
        sale_price: parseFloat(formData.sale_price),
        sale_date: formData.sale_date,
        notes: formData.notes,
        user_id: profile.id
      };
      
      const { error } = await supabase
        .from('sales_tracking')
        .insert([saleData]);
      
      if (error) throw error;
      
      // إعادة تعيين النموذج
      setFormData({
        product_name: '',
        category: '',
        sold_to: '',
        sale_price: '',
        sale_date: new Date().toISOString().split('T')[0],
        notes: ''
      });
      
      // إعادة تحميل السجل
      await loadSalesHistory();
      
      log('Sale recorded successfully');
    } catch (err) {
      logError('Error recording sale:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (saleId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا السجل؟')) return;
    
    try {
      const { error } = await supabase
        .from('sales_tracking')
        .delete()
        .eq('id', saleId);
      
      if (error) throw error;
      await loadSalesHistory();
      log('Sale deleted successfully');
    } catch (err) {
      logError('Error deleting sale:', err);
      setError(err.message);
    }
  };

  if (profile?.role !== 'admin') {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '50px' }}>
        <h2>❌ الوصول مرفوض</h2>
        <p>هذه الصفحة متاحة للأدمن فقط</p>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ padding: '20px 0' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>
          📊 متابعة المبيعات
        </h1>
        
        {error && (
          <div className="error-message" style={{ marginBottom: '20px' }}>
            {error}
          </div>
        )}

        {/* نموذج تسجيل البيع */}
        <div className="card netflix-lift" style={{ marginBottom: '30px' }}>
          <h2>تسجيل عملية بيع جديدة</h2>
          <form onSubmit={handleSubmit} style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                اسم المنتج *
              </label>
              <input
                type="text"
                className="input"
                value={formData.product_name}
                onChange={(e) => setFormData({...formData, product_name: e.target.value})}
                required
                placeholder="مثال: سخونة شاي"
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                الفئة *
              </label>
              <select
                className="input"
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                required
              >
                <option value="">اختر الفئة</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                بيع إلى *
              </label>
              <select
                className="input"
                value={formData.sold_to}
                onChange={(e) => setFormData({...formData, sold_to: e.target.value})}
                required
              >
                <option value="">اختر المستخدم</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.username}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                سعر البيع (بالجنيه) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="input"
                value={formData.sale_price}
                onChange={(e) => setFormData({...formData, sale_price: e.target.value})}
                required
                placeholder="مثال: 500"
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                تاريخ البيع *
              </label>
              <input
                type="date"
                className="input"
                value={formData.sale_date}
                onChange={(e) => setFormData({...formData, sale_date: e.target.value})}
                required
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                ملاحظات
              </label>
              <textarea
                className="input"
                rows="3"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="أي ملاحظات إضافية..."
              />
            </div>

            <button 
              type="submit" 
              className="morph-button"
              disabled={loading}
              style={{ width: '100%', padding: '15px', fontSize: '18px' }}
            >
              {loading ? 'جارٍ التسجيل...' : 'تسجيل البيع'}
            </button>
          </form>
        </div>

        {/* سجل المبيعات */}
        <div className="card netflix-lift">
          <h2>سجل المبيعات ({sales.length} عملية)</h2>
          
          {sales.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '30px', color: '#666' }}>
              لم يتم تسجيل أي مبيعات بعد
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f5f5f5' }}>
                    <th style={{ padding: '12px', textAlign: 'right', border: '1px solid #ddd' }}>المنتج</th>
                    <th style={{ padding: '12px', textAlign: 'right', border: '1px solid #ddd' }}>الفئة</th>
                    <th style={{ padding: '12px', textAlign: 'right', border: '1px solid #ddd' }}>بيعت إلى</th>
                    <th style={{ padding: '12px', textAlign: 'right', border: '1px solid #ddd' }}>السعر</th>
                    <th style={{ padding: '12px', textAlign: 'right', border: '1px solid #ddd' }}>التاريخ</th>
                    <th style={{ padding: '12px', textAlign: 'right', border: '1px solid #ddd' }}>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map(sale => (
                    <tr key={sale.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '12px', border: '1px solid #ddd' }}>{sale.product_name}</td>
                      <td style={{ padding: '12px', border: '1px solid #ddd' }}>{sale.category}</td>
                      <td style={{ padding: '12px', border: '1px solid #ddd' }}>{sale.sold_to_user?.username || 'غير محدد'}</td>
                      <td style={{ padding: '12px', border: '1px solid #ddd' }}>{sale.sale_price} جنيه</td>
                      <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                        {new Date(sale.sale_date).toLocaleDateString('ar-EG')}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>
                        <button 
                          className="btn-danger"
                          onClick={() => handleDelete(sale.id)}
                          style={{ padding: '5px 10px', fontSize: '14px' }}
                        >
                          حذف
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}