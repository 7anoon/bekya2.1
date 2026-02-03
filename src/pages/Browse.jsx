import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProductStore } from '../store/productStore';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import ProductCard from '../components/ProductCard';
import { BrowseSkeleton } from '../components/Skeletons';

export default function Browse() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [offers, setOffers] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const { fetchProducts } = useProductStore();
  const { profile } = useAuthStore();

  // قراءة الفئة من URL عند تحميل الصفحة
  useEffect(() => {
    const categoryFromUrl = searchParams.get('category');
    if (categoryFromUrl) {
      setSelectedCategory(categoryFromUrl);
    }
  }, [searchParams]);

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

      // تحديث قائمة المنتجات مباشرة بحذف المنتج من الـ state
      setProducts(prevProducts => prevProducts.filter(p => p.id !== productId));
      
      alert('تم حذف المنتج بنجاح');
    } catch (err) {
      console.error('Error deleting product:', err);
      alert('خطأ في حذف المنتج: ' + err.message);
    }
  };

  useEffect(() => {
    loadOffers();
    
    const channel = supabase
      .channel('products-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products', filter: 'status=eq.approved' }, 
        (payload) => {
          console.log('Product changed:', payload);
          loadProducts(currentPage);
        }
      )
      .subscribe();

    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (isDropdownOpen && !event.target.closest('.dropdown-container')) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      supabase.removeChannel(channel);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen, currentPage]);

  useEffect(() => {
    if (offers.length >= 0) {
      loadProducts(currentPage);
    }
  }, [offers, currentPage, searchQuery]);

  const loadProducts = async (page = 1) => {
    try {
      const result = await fetchProducts(profile?.location, page, 20);
      let sellProducts = result.data.filter(product => 
        (!product.choice_type || product.choice_type === 'sell')
      );
      
      // تطبيق البحث
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        sellProducts = sellProducts.filter(product => 
          product.title?.toLowerCase().includes(query) ||
          product.description?.toLowerCase().includes(query) ||
          product.category?.toLowerCase().includes(query)
        );
      }
      
      const productsWithDiscounts = sellProducts.map(product => {
        const activeOffer = offers.find(offer => 
          offer.is_active && 
          offer.discount_percentage && 
          offer.category === product.category &&
          (!offer.end_date || new Date(offer.end_date) > new Date())
        );

        if (activeOffer) {
          const discountAmount = Math.round(product.final_price * (activeOffer.discount_percentage / 100));
          return {
            ...product,
            original_final_price: product.final_price,
            final_price: product.final_price - discountAmount,
            active_offer: activeOffer
          };
        }
        
        return product;
      });
      
      setProducts(productsWithDiscounts);
      setTotalPages(result.totalPages || 1);
      setTotalItems(result.count || 0);
    } catch (err) {
      console.error('Error loading products:', err);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const loadOffers = async () => {
    try {
      let query = supabase
        .from('offers')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      const { data, error } = await query;
      
      if (error) throw error;

      const filteredOffers = data?.filter(offer => 
        !offer.target_location || offer.target_location === profile?.location
      ) || [];

      setOffers(filteredOffers);
    } catch (err) {
      console.error('Error loading offers:', err);
    }
  };

  const categories = [
    { id: 'all', name: 'الكل' },
    { id: 'furniture', name: 'أثاث' },
    { id: 'clothes', name: 'ملابس' },
    { id: 'books', name: 'كتب' },
    { id: 'toys', name: 'ألعاب' },
    { id: 'appliances', name: 'أجهزة منزلية' },
    { id: 'sports', name: 'رياضة' },
    { id: 'jewelry', name: 'مجوهرات وإكسسوارات' },
    { id: 'other', name: 'أخرى' }
  ];

  // دالة لتغيير الفئة وتحديث URL
  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId);
    setIsDropdownOpen(false);
    
    // تحديث URL
    if (categoryId === 'all') {
      setSearchParams({});
    } else {
      setSearchParams({ category: categoryId });
    }
  };

  const selectedCategoryData = categories.find(cat => cat.id === selectedCategory) || categories[0];

  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  return (
    <div className="container">
      <div style={styles.header}>
        <div style={styles.titleContainer}>
          <h1 style={styles.title}>
            {selectedCategory === 'all' ? 'تصفح المنتجات' : `منتجات ${selectedCategoryData.name}`}
          </h1>
        </div>
        <p style={styles.subtitle}>
          {selectedCategory === 'all' 
            ? 'اكتشف أفضل العروض على المنتجات المستعملة'
            : `تصفح جميع منتجات ${selectedCategoryData.name} المتاحة`
          }
        </p>
        {selectedCategory !== 'all' && (
          <button
            className="btn btn-secondary"
            onClick={() => handleCategoryChange('all')}
            style={styles.showAllButton}
          >
            عرض جميع المنتجات
          </button>
        )}
      </div>

      {/* شريط البحث */}
      <div style={styles.searchContainer}>
        <div style={styles.searchBox}>
          <svg style={styles.searchIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          <input
            type="text"
            placeholder="ابحث عن منتج..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
            className="input"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={styles.clearButton}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div style={styles.categoriesBar}>
        <div style={styles.dropdownContainer} className="dropdown-container">
          <button 
            className="morph-button"
            style={styles.dropdownButton}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <span style={{fontSize: '18px', fontWeight: '700'}}>{selectedCategoryData.name}</span>
            <span style={{fontSize: '20px', marginRight: '12px', transition: 'transform 0.3s ease', transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)'}}>▼</span>
          </button>
          
          {isDropdownOpen && (
            <div style={styles.dropdownMenu} className="card">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  className="dropdown-item"
                  style={{
                    ...styles.dropdownItem,
                    background: selectedCategory === cat.id ? 'rgba(107, 124, 89, 0.3)' : 'transparent'
                  }}
                  onClick={() => handleCategoryChange(cat.id)}
                >
                  <span style={{fontSize: '16px', fontWeight: '600'}}>{cat.name}</span>
                  {selectedCategory === cat.id && (
                    <span style={{marginRight: 'auto', color: '#6b7c59', fontSize: '18px'}}>✓</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={styles.productsInfo}>
        <p style={styles.count}>
          {totalItems} منتج متاح - الصفحة {currentPage} من {totalPages}
        </p>
      </div>

      {filteredProducts.length === 0 ? (
        <div style={styles.empty}>
          <h3 style={styles.emptyTitle}>لا توجد منتجات</h3>
          <p style={styles.emptyText}>لا توجد منتجات في هذه الفئة حالياً</p>
        </div>
      ) : (
        <>
          <div style={styles.grid}>
            {filteredProducts.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product}
                isAdmin={profile?.role === 'admin'}
                onDelete={handleDeleteProduct}
              />
            ))}
          </div>
          
          {totalPages > 1 && (
            <div style={styles.pagination}>
              <button 
                className="btn btn-secondary"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                style={{...styles.pageButton, ...(currentPage === 1 ? styles.disabledButton : {})}}
              >
                السابق
              </button>
              
              <div style={styles.pageNumbers}>
                {[...Array(totalPages)].map((_, index) => {
                  const pageNum = index + 1;
                  if (
                    pageNum === 1 || 
                    pageNum === totalPages || 
                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={pageNum}
                        className="btn"
                        onClick={() => handlePageChange(pageNum)}
                        style={{
                          ...styles.pageNumber,
                          ...(currentPage === pageNum ? styles.activePage : {})
                        }}
                      >
                        {pageNum}
                      </button>
                    );
                  } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                    return <span key={pageNum} style={styles.ellipsis}>...</span>;
                  }
                  return null;
                })}
              </div>
              
              <button 
                className="btn btn-secondary"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                style={{...styles.pageButton, ...(currentPage === totalPages ? styles.disabledButton : {})}}
              >
                التالي
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const styles = {
  header: {
    textAlign: 'center',
    marginBottom: '48px',
    padding: '40px 20px'
  },
  titleContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '20px',
    marginBottom: '16px',
    flexWrap: 'wrap'
  },
  titleIcon: {
    fontSize: '64px',
    background: 'linear-gradient(135deg, rgba(107, 124, 89, 0.2) 0%, rgba(139, 115, 85, 0.2) 100%)',
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 20px 60px rgba(107, 124, 89, 0.4), 0 0 40px rgba(107, 124, 89, 0.3)',
    animation: 'pulse-glow 2s ease-in-out infinite',
    border: '3px solid rgba(107, 124, 89, 0.3)'
  },
  title: {
    fontSize: '48px',
    fontWeight: '900',
    color: '#f9fafb',
    margin: 0,
    textShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
    letterSpacing: '-1px'
  },
  subtitle: {
    fontSize: '18px',
    color: '#d1d5db'
  },
  showAllButton: {
    marginTop: '20px',
    padding: '12px 32px',
    fontSize: '16px',
    fontWeight: '600'
  },
  searchContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '32px',
    padding: '0 20px'
  },
  searchBox: {
    position: 'relative',
    width: '100%',
    maxWidth: '600px'
  },
  searchIcon: {
    position: 'absolute',
    right: '20px',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '20px',
    pointerEvents: 'none',
    zIndex: 1
  },
  searchInput: {
    width: '100%',
    padding: '16px 60px 16px 60px',
    fontSize: '16px',
    borderRadius: '50px',
    border: '2px solid rgba(107, 124, 89, 0.3)',
    background: 'rgba(45, 45, 45, 0.6)',
    color: '#f9fafb',
    transition: 'all 0.3s ease',
    outline: 'none'
  },
  clearButton: {
    position: 'absolute',
    left: '20px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'rgba(107, 124, 89, 0.3)',
    border: 'none',
    borderRadius: '50%',
    width: '28px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#f9fafb',
    fontSize: '16px',
    transition: 'all 0.3s ease'
  },
  categoriesBar: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '40px',
    padding: '0 20px'
  },
  dropdownContainer: {
    position: 'relative',
    width: '100%',
    maxWidth: '400px'
  },
  dropdownButton: {
    width: '100%',
    padding: '16px 24px',
    background: 'linear-gradient(135deg, #6b7c59 0%, #556b2f 100%)',
    border: 'none',
    borderRadius: '50px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: '0 8px 25px rgba(107, 124, 89, 0.4)'
  },
  dropdownMenu: {
    position: 'absolute',
    top: '70px',
    left: 0,
    right: 0,
    zIndex: 1000,
    maxHeight: '400px',
    overflowY: 'auto',
    borderRadius: '20px',
    animation: 'dropdown-fade-in 0.3s ease'
  },
  dropdownItem: {
    width: '100%',
    padding: '16px 24px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    fontSize: '16px',
    color: '#f9fafb',
    textAlign: 'right',
    borderBottom: '1px solid rgba(107, 124, 89, 0.1)'
  },
  productsInfo: {
    textAlign: 'center',
    marginBottom: '32px'
  },
  count: {
    fontSize: '16px',
    color: '#9ca3af',
    fontWeight: '600'
  },
  empty: {
    textAlign: 'center',
    padding: '80px 20px',
    color: '#9ca3af'
  },
  emptyTitle: {
    fontSize: '24px',
    color: '#d1d5db',
    marginBottom: '12px'
  },
  emptyText: {
    fontSize: '16px',
    color: '#9ca3af'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '40px',
    marginBottom: '60px'
  },
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '16px',
    marginTop: '40px',
    padding: '20px',
    flexWrap: 'wrap'
  },
  pageButton: {
    minWidth: '120px',
    padding: '12px 24px'
  },
  disabledButton: {
    opacity: 0.5,
    cursor: 'not-allowed'
  },
  pageNumbers: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  pageNumber: {
    minWidth: '40px',
    padding: '8px 12px',
    borderRadius: '8px'
  },
  activePage: {
    background: 'linear-gradient(135deg, #6b7c59 0%, #556b2f 100%)',
    color: 'white'
  },
  ellipsis: {
    padding: '8px',
    color: '#9ca3af'
  }
};
