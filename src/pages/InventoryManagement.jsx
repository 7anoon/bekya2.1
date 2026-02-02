import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { log, logError } from '../lib/utils';

export default function InventoryManagement() {
  const { profile } = useAuthStore();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [lowStockCategories, setLowStockCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editForm, setEditForm] = useState({});

  // تحميل البيانات
  useEffect(() => {
    loadProducts();
    loadCategories();
    checkLowStock();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      logError('Error loading products:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('category')
        .group('category');
      
      if (error) throw error;
      
      const uniqueCategories = [...new Set(data.map(item => item.category))];
      setCategories(uniqueCategories);
    } catch (err) {
      logError('Error loading categories:', err);
    }
  };

  const checkLowStock = async () => {
    try {
      // حساب عدد المنتجات في كل فئة
      const categoryCounts = {};
      products.forEach(product => {
        categoryCounts[product.category] = (categoryCounts[product.category] || 0) + 1;
      });
      
      // تحديد الفئات التي تحتوي على أقل من 5 منتجات
      const lowStock = Object.entries(categoryCounts)
        .filter(([category, count]) => count < 5)
        .map(([category, count]) => ({ category, count }));
      
      setLowStockCategories(lowStock);
    } catch (err) {
      logError('Error checking low stock:', err);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product.id);
    setEditForm({
      name: product.name,
      category: product.category,
      description: product.description,
      price: product.price,
      status: product.status
    });
  };

  const handleUpdate = async (productId) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('products')
        .update({
          name: editForm.name,
          category: editForm.category,
          description: editForm.description,
          price: parseFloat(editForm.price),
          status: editForm.status
        })
        .eq('id', productId);
      
      if (error) throw error;
      
      setEditingProduct(null);
      setEditForm({});
      await loadProducts();
      checkLowStock();
      log('Product updated successfully');
    } catch (err) {
      logError('Error updating product:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;
    
    try {
      setLoading(true);
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);
      
      if (error) throw error;
      
      await loadProducts();
      checkLowStock();
      log('Product deleted successfully');
    } catch (err) {
      logError('Error deleting product:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (productId, newStatus) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ status: newStatus })
        .eq('id', productId);
      
      if (error) throw error;
      
      await loadProducts();
      log('Status updated successfully');
    } catch (err) {
      logError('Error updating status:', err);
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
          📦 إدارة المخزون
        </h1>
        
        {error && (
          <div className="error-message" style={{ marginBottom: '20px' }}>
            {error}
          </div>
        )}

        {/* تنبيهات الفئات الناقصة */}
        {lowStockCategories.length > 0 && (
          <div className="card netflix-lift" style={{ 
            backgroundColor: '#fff3cd', 
            border: '1px solid #ffeaa7',
            marginBottom: '30px'
          }}>
            <h2 style={{ color: '#856404' }}>⚠️ تنبيهات المخزون</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
              {lowStockCategories.map(({ category, count }) => (
                <div key={category} style={{ 
                  backgroundColor: '#fff', 
                  padding: '15px', 
                  borderRadius: '8px',
                  border: '1px solid #ffd700'
                }}>
                  <h3 style={{ margin: '0 0 10px 0', color: '#856404' }}>{category}</h3>
                  <p style={{ margin: '0', fontSize: '18px', fontWeight: 'bold', color: '#d35400' }}>
                    {count} منتج فقط
                  </p>
                  <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#856404' }}>
                    تحتاج إلى مزيد من المنتجات
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* إحصائيات سريعة */}
        <div className="stats-grid" style={{ marginBottom: '30px' }}>
          <div className="stats-card netflix-lift">
            <div className="icon-3d">📦</div>
            <h3>إجمالي المنتجات</h3>
            <p className="stats-number">{products.length}</p>
          </div>
          
          <div className="stats-card netflix-lift">
            <div className="icon-3d">✅</div>
            <h3>المنتجات المتاحة</h3>
            <p className="stats-number">{products.filter(p => p.status === 'available').length}</p>
          </div>
          
          <div className="stats-card netflix-lift">
            <div className="icon-3d">💰</div>
            <h3>المنتجات المباعة</h3>
            <p className="stats-number">{products.filter(p => p.status === 'sold').length}</p>
          </div>
          
          <div className="stats-card netflix-lift">
            <div className="icon-3d">⏸️</div>
            <h3>قيد المراجعة</h3>
            <p className="stats-number">{products.filter(p => p.status === 'pending').length}</p>
          </div>
        </div>

        {/* جدول المنتجات */}
        <div className="card netflix-lift">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2>جميع المنتجات ({products.length})</h2>
            <button 
              className="morph-button"
              onClick={loadProducts}
              disabled={loading}
            >
              {loading ? 'جارٍ التحديث...' : 'تحديث'}
            </button>
          </div>
          
          {products.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '30px', color: '#666' }}>
              لا توجد منتجات في المخزون
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f5f5f5' }}>
                    <th style={{ padding: '12px', textAlign: 'right', border: '1px solid #ddd' }}>المنتج</th>
                    <th style={{ padding: '12px', textAlign: 'right', border: '1px solid #ddd' }}>الفئة</th>
                    <th style={{ padding: '12px', textAlign: 'right', border: '1px solid #ddd' }}>السعر</th>
                    <th style={{ padding: '12px', textAlign: 'right', border: '1px solid #ddd' }}>الحالة</th>
                    <th style={{ padding: '12px', textAlign: 'right', border: '1px solid #ddd' }}>تاريخ الإضافة</th>
                    <th style={{ padding: '12px', textAlign: 'right', border: '1px solid #ddd' }}>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(product => (
                    <tr key={product.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                        {editingProduct === product.id ? (
                          <input
                            type="text"
                            className="input"
                            value={editForm.name}
                            onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                            style={{ width: '150px' }}
                          />
                        ) : (
                          product.name
                        )}
                      </td>
                      
                      <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                        {editingProduct === product.id ? (
                          <select
                            className="input"
                            value={editForm.category}
                            onChange={(e) => setEditForm({...editForm, category: e.target.value})}
                            style={{ width: '120px' }}
                          >
                            {categories.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        ) : (
                          product.category
                        )}
                      </td>
                      
                      <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                        {editingProduct === product.id ? (
                          <input
                            type="number"
                            className="input"
                            value={editForm.price}
                            onChange={(e) => setEditForm({...editForm, price: e.target.value})}
                            style={{ width: '80px' }}
                          />
                        ) : (
                          `${product.price} جنيه`
                        )}
                      </td>
                      
                      <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                        {editingProduct === product.id ? (
                          <select
                            className="input"
                            value={editForm.status}
                            onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                            style={{ width: '100px' }}
                          >
                            <option value="pending">قيد المراجعة</option>
                            <option value="available">متاح</option>
                            <option value="sold">مباع</option>
                            <option value="rejected">مرفوض</option>
                          </select>
                        ) : (
                          <span className={`status-badge ${product.status}`}>
                            {product.status === 'pending' && 'قيد المراجعة'}
                            {product.status === 'available' && 'متاح'}
                            {product.status === 'sold' && 'مباع'}
                            {product.status === 'rejected' && 'مرفوض'}
                          </span>
                        )}
                      </td>
                      
                      <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                        {new Date(product.created_at).toLocaleDateString('ar-EG')}
                      </td>
                      
                      <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>
                        {editingProduct === product.id ? (
                          <>
                            <button 
                              className="btn-success"
                              onClick={() => handleUpdate(product.id)}
                              style={{ padding: '5px 10px', fontSize: '12px', marginRight: '5px' }}
                            >
                              حفظ
                            </button>
                            <button 
                              className="btn-secondary"
                              onClick={() => setEditingProduct(null)}
                              style={{ padding: '5px 10px', fontSize: '12px' }}
                            >
                              إلغاء
                            </button>
                          </>
                        ) : (
                          <>
                            <button 
                              className="btn-primary"
                              onClick={() => handleEdit(product)}
                              style={{ padding: '5px 10px', fontSize: '12px', marginRight: '5px' }}
                            >
                              تعديل
                            </button>
                            <button 
                              className="btn-danger"
                              onClick={() => handleDelete(product.id)}
                              style={{ padding: '5px 10px', fontSize: '12px', marginRight: '5px' }}
                            >
                              حذف
                            </button>
                            {product.status !== 'sold' && (
                              <button 
                                className="btn-warning"
                                onClick={() => handleStatusChange(product.id, 'sold')}
                                style={{ padding: '5px 10px', fontSize: '12px' }}
                              >
                                بيع
                              </button>
                            )}
                          </>
                        )}
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