import { useEffect, useState } from 'react';
import { useProductStore } from '../store/productStore';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import ProductCard from '../components/ProductCard';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { fetchProducts } = useProductStore();
  const { profile } = useAuthStore();

  useEffect(() => {
    loadOffers();
    
    // الاشتراك في تحديثات المنتجات الفورية
    const channel = supabase
      .channel('products-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
          filter: 'status=eq.approved'
        },
        (payload) => {
          console.log('Product changed:', payload);
          // إعادة تحميل المنتجات عند أي تغيير
          loadProducts();
        }
      )
      .subscribe();

    // تنظيف الاشتراك عند مغادرة الصفحة
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (offers.length >= 0) {
      loadProducts();
    }
  }, [offers]);

  const loadProducts = async () => {
    try {
      const data = await fetchProducts(profile?.location);
      // فلترة المنتجات: عرض منتجات البيع فقط (استبعاد إعادة التدوير)
      // إذا choice_type مش موجود أو null، نعتبره منتج بيع
      const sellProducts = data.filter(product => 
        !product.choice_type || product.choice_type === 'sell'
      );
      
      // تطبيق الخصومات من العروض النشطة
      const productsWithDiscounts = sellProducts.map(product => {
        // البحث عن عرض نشط يطابق فئة المنتج
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
    } catch (err) {
      console.error('Error loading products:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadOffers = async () => {
    try {
      let query = supabase
        .from('offers')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      // فلترة العروض حسب المنطقة
      const { data, error } = await query;
      
      if (error) throw error;

      // عرض العروض العامة أو الخاصة بمنطقة المستخدم
      const filteredOffers = data?.filter(offer => 
        !offer.target_location || offer.target_location === profile?.location
      ) || [];

      setOffers(filteredOffers);
    } catch (err) {
      console.error('Error loading offers:', err);
    }
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
      <div style={styles.header}>
        <h1 style={styles.title} className="home-title">المنتجات المتاحة</h1>
      </div>

      {/* قسم العروض */}
      {offers.length > 0 && (
        <div style={styles.offersSection}>
          <h2 style={styles.offersTitle} className="home-offers-title">🎉 العروض الحالية</h2>
          <div style={styles.offersGrid} className="home-offers-grid">
            {offers.map((offer) => (
              <div key={offer.id} className="card" style={styles.offerCard}>
                {offer.image && (
                  <img src={offer.image} alt={offer.title} style={styles.offerImage} />
                )}
                <div style={styles.offerContent}>
                  <h3 style={styles.offerTitle}>{offer.title}</h3>
                  <p style={styles.offerDesc}>{offer.description}</p>
                  {offer.discount_percentage && (
                    <div style={styles.discountBadge}>
                      خصم {offer.discount_percentage}%
                    </div>
                  )}
                  {offer.end_date && (
                    <p style={styles.offerDate}>
                      ⏰ ينتهي: {new Date(offer.end_date).toLocaleDateString('ar-EG')}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* قسم المنتجات */}
      <div style={styles.productsSection}>
        <h2 style={styles.sectionTitle} className="home-section-title">المنتجات</h2>
        {products.length === 0 ? (
          <div style={styles.empty}>
            <p>لا توجد منتجات متاحة حالياً</p>
          </div>
        ) : (
          <div style={styles.grid} className="home-products-grid">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  header: {
    textAlign: 'center',
    marginBottom: '40px'
  },
  title: {
    fontSize: '32px',
    color: '#000000',
    marginBottom: '8px'
  },
  subtitle: {
    color: '#000000',
    fontSize: '24px',
    fontWeight: '600'
  },
  offersSection: {
    marginBottom: '50px'
  },
  offersTitle: {
    fontSize: '28px',
    color: '#f59e0b',
    marginBottom: '20px',
    textAlign: 'center'
  },
  offersGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '20px'
  },
  offerCard: {
    background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
    border: '2px solid #f59e0b',
    overflow: 'hidden'
  },
  offerImage: {
    width: '100%',
    height: '200px',
    objectFit: 'cover'
  },
  offerContent: {
    padding: '20px'
  },
  offerTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#92400e',
    marginBottom: '12px'
  },
  offerDesc: {
    color: '#78350f',
    marginBottom: '12px',
    lineHeight: '1.6'
  },
  discountBadge: {
    display: 'inline-block',
    background: '#dc2626',
    color: 'white',
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '16px',
    fontWeight: '700',
    marginBottom: '8px'
  },
  offerDate: {
    fontSize: '14px',
    color: '#92400e',
    fontWeight: '600'
  },
  productsSection: {
    marginTop: '40px'
  },
  sectionTitle: {
    fontSize: '24px',
    color: '#374151',
    marginBottom: '20px'
  },
  empty: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#6b7280',
    fontSize: '18px'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '24px'
  },
  // Mobile responsive styles
  '@media (max-width: 768px)': {
    title: {
      fontSize: '24px'
    },
    offersTitle: {
      fontSize: '22px'
    },
    offersGrid: {
      gridTemplateColumns: '1fr',
      gap: '16px'
    },
    grid: {
      gridTemplateColumns: '1fr',
      gap: '16px'
    },
    offerContent: {
      padding: '16px'
    }
  }
};

// Add responsive CSS
if (typeof window !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @media (max-width: 768px) {
      .home-title {
        font-size: 24px !important;
      }
      .home-offers-title {
        font-size: 22px !important;
      }
      .home-offers-grid {
        grid-template-columns: 1fr !important;
        gap: 16px !important;
      }
      .home-products-grid {
        grid-template-columns: 1fr !important;
        gap: 16px !important;
      }
    }
    
    @media (max-width: 480px) {
      .home-title {
        font-size: 20px !important;
      }
      .home-offers-title {
        font-size: 18px !important;
      }
      .home-section-title {
        font-size: 18px !important;
      }
    }
  `;
  document.head.appendChild(style);
}
