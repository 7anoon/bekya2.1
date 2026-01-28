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
      {/* Netflix Hero Section */}
      <div className="netflix-hero" style={styles.hero}>
        <h1 style={styles.title} className="netflix-shimmer">المنتجات المتاحة</h1>
        <p style={styles.heroSubtitle}>اكتشف أفضل العروض والمنتجات المميزة</p>
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
  hero: {
    textAlign: 'center',
    marginBottom: '60px',
    position: 'relative',
    zIndex: 2
  },
  title: {
    fontSize: '56px',
    marginBottom: '16px',
    fontWeight: '800',
    letterSpacing: '-1px'
  },
  heroSubtitle: {
    fontSize: '20px',
    color: '#d1d5db',
    fontWeight: '400'
  },
  header: {
    textAlign: 'center',
    marginBottom: '48px'
  },
  subtitle: {
    color: '#7a7a7a',
    fontSize: '18px',
    fontWeight: '400'
  },
  offersSection: {
    marginBottom: '80px',
    position: 'relative',
    zIndex: 2
  },
  offersTitle: {
    fontSize: '36px',
    color: '#f9fafb',
    marginBottom: '40px',
    textAlign: 'center',
    fontWeight: '700',
    textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)'
  },
  offersGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '32px'
  },
  offerCard: {
    background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.95) 0%, rgba(31, 41, 55, 0.95) 100%)',
    border: '1px solid rgba(107, 124, 89, 0.2)',
    overflow: 'hidden',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative'
  },
  offerImage: {
    width: '100%',
    height: '260px',
    objectFit: 'cover',
    transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
  },
  offerContent: {
    padding: '32px'
  },
  offerTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#f9fafb',
    marginBottom: '12px',
    textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
  },
  offerDesc: {
    color: '#d1d5db',
    marginBottom: '20px',
    lineHeight: '1.7',
    fontSize: '15px'
  },
  discountBadge: {
    display: 'inline-block',
    background: 'linear-gradient(135deg, #6b7c59 0%, #556b2f 100%)',
    color: 'white',
    padding: '10px 20px',
    borderRadius: '24px',
    fontSize: '15px',
    fontWeight: '700',
    marginBottom: '12px',
    boxShadow: '0 4px 15px rgba(107, 124, 89, 0.4), 0 0 20px rgba(107, 124, 89, 0.2)',
    textTransform: 'uppercase',
    letterSpacing: '1px'
  },
  offerDate: {
    fontSize: '13px',
    color: '#9ca3af',
    fontWeight: '500'
  },
  productsSection: {
    marginTop: '60px',
    position: 'relative',
    zIndex: 2
  },
  sectionTitle: {
    fontSize: '32px',
    color: '#f9fafb',
    marginBottom: '40px',
    fontWeight: '700',
    textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)'
  },
  empty: {
    textAlign: 'center',
    padding: '80px 20px',
    color: '#9ca3af',
    fontSize: '17px'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '40px'
  },
  '@media (max-width: 768px)': {
    title: {
      fontSize: '32px'
    },
    offersTitle: {
      fontSize: '26px'
    },
    offersGrid: {
      gridTemplateColumns: '1fr',
      gap: '24px'
    },
    grid: {
      gridTemplateColumns: '1fr',
      gap: '24px'
    },
    offerContent: {
      padding: '24px'
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
