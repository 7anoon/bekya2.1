import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProductStore } from '../store/productStore';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import ProductCard from '../components/ProductCard';

export default function Home() {
  const navigate = useNavigate();
  const [offers, setOffers] = useState([]);
  const [productsCount, setProductsCount] = useState(0);
  const { fetchProducts } = useProductStore();
  const { profile } = useAuthStore();

  useEffect(() => {
    loadOffers();
    loadProductsCount();
  }, []);

  const loadProductsCount = async () => {
    try {
      const data = await fetchProducts(profile?.location);
      const sellProducts = data.filter(product => 
        !product.choice_type || product.choice_type === 'sell'
      );
      setProductsCount(sellProducts.length);
    } catch (err) {
      console.error('Error loading products count:', err);
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

  return (
    <div className="container">
      {/* 🌟 Hero Section */}
      <div className="netflix-hero" style={styles.heroSection}>
        <div style={styles.heroContent}>
          <h1 style={styles.heroTitle} className="netflix-shimmer">
            🛒 بيكيا
          </h1>
          <p style={styles.heroSubtitle}>
            الحاجة القديمة لسه ليها قيمة
          </p>
          <p style={styles.heroDescription}>
            اكتشف أفضل العروض على المنتجات المستعملة بجودة عالية
          </p>
          <div style={styles.heroButtons}>
            <button className="morph-button" onClick={() => navigate('/add-product')}>
              🎯 ابدأ البيع الآن
            </button>
            <button 
              className="morph-button" 
              style={{background: 'linear-gradient(135deg, #8b7355 0%, #6d5a42 100%)'}}
              onClick={() => navigate('/browse')}
            >
              🔍 تصفح المنتجات
            </button>
          </div>
        </div>
        
        {/* Stats */}
        <div style={styles.statsRow}>
          <div className="stats-card" style={styles.statCard}>
            <div className="icon-3d">📦</div>
            <div className="stats-number">{productsCount}+</div>
            <div className="stats-label">منتج متاح</div>
          </div>
          <div className="stats-card" style={styles.statCard}>
            <div className="icon-3d">✅</div>
            <div className="stats-number">500+</div>
            <div className="stats-label">عملية بيع</div>
          </div>
          <div className="stats-card" style={styles.statCard}>
            <div className="icon-3d">⭐</div>
            <div className="stats-number">4.8</div>
            <div className="stats-label">تقييم العملاء</div>
          </div>
        </div>
      </div>

      <div className="glow-divider"></div>

      {/* 🎨 Categories Section */}
      <div style={styles.categoriesSection}>
        <h2 style={styles.sectionTitle}>
          <span className="icon-3d" style={{marginLeft: '16px'}}>🏷️</span>
          فئاتنا الموجودة
        </h2>
        <div style={styles.categoriesGrid}>
          {[
            {icon: '🪑', name: 'أثاث', count: '30+'},
            {icon: '👕', name: 'ملابس', count: '40+'},
            {icon: '📚', name: 'كتب', count: '25+'},
            {icon: '🎮', name: 'ألعاب', count: '20+'},
            {icon: '🏠', name: 'أجهزة منزلية', count: '35+'}
          ].map((cat, i) => (
            <div key={i} className="stats-card netflix-lift" style={styles.categoryCard}>
              <div className="icon-3d" style={{fontSize: '48px', marginBottom: '16px'}}>
                {cat.icon}
              </div>
              <h3 style={styles.categoryName}>{cat.name}</h3>
              <p style={styles.categoryCount}>{cat.count} منتج</p>
            </div>
          ))}
        </div>
      </div>

      <div className="glow-divider"></div>

      {/* قسم العروض */}
      {offers.length > 0 && (
        <div style={styles.offersSection}>
          <h2 style={styles.offersTitle}>
            <span className="icon-3d" style={{marginLeft: '16px'}}>🎉</span>
            العروض الحالية
          </h2>
          <div style={styles.offersGrid}>
            {offers.map((offer) => (
              <div key={offer.id} className="card netflix-spotlight netflix-lift" style={styles.offerCard}>
                {offer.image && (
                  <img src={offer.image} alt={offer.title} style={styles.offerImage} />
                )}
                
                <div style={styles.offerContent}>
                  <h3 style={styles.offerTitle}>{offer.title}</h3>
                  <p style={styles.offerDesc}>{offer.description}</p>
                  {offer.discount_percentage && (
                    <div style={styles.discountBadge} className="netflix-badge">
                      🔥 خصم {offer.discount_percentage}%
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

      <div className="glow-divider"></div>

      {/* 🎯 How It Works */}
      <div style={styles.howItWorksSection}>
        <h2 style={styles.sectionTitle}>
          <span className="icon-3d" style={{marginLeft: '16px'}}>🔄</span>
          كيف يعمل بيكيا؟
        </h2>
        <div style={styles.stepsGrid}>
          {[
            {icon: '📸', title: 'صور منتجك', desc: 'التقط صور واضحة للمنتج'},
            {icon: '💰', title: 'حدد السعر', desc: 'السعر يحدده المدير'},
            {icon: '✅', title: 'انتظر الموافقة', desc: 'سنراجع منتجك ونوافق عليه'},
            {icon: '🎉', title: 'ابدأ البيع', desc: 'منتجك متاح للبيع الآن!'}
          ].map((step, i) => (
            <div key={i} className="stats-card netflix-lift" style={styles.stepCard}>
              <div className="icon-3d" style={{fontSize: '56px', marginBottom: '20px'}}>
                {step.icon}
              </div>
              <div style={styles.stepNumber}>{i + 1}</div>
              <h3 style={styles.stepTitle}>{step.title}</h3>
              <p style={styles.stepDesc}>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 🎯 Final CTA */}
      <div style={styles.finalCTA}>
        <div className="stats-card" style={styles.ctaCard}>
          <div className="icon-3d" style={{fontSize: '64px', marginBottom: '24px'}}>🚀</div>
          <h2 style={styles.ctaTitle}>جاهز للبدء؟</h2>
          <p style={styles.ctaDesc}>انضم لآلاف البائعين الناجحين على بيكيا</p>
          <button className="morph-button" onClick={() => navigate('/add-product')} style={{marginTop: '24px'}}>
            ابدأ البيع الآن
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  heroSection: {
    textAlign: 'center',
    marginBottom: '60px',
    padding: '60px 20px'
  },
  heroContent: {
    marginBottom: '48px'
  },
  heroTitle: {
    fontSize: '72px',
    marginBottom: '16px',
    fontWeight: '900',
    letterSpacing: '-2px'
  },
  heroSubtitle: {
    fontSize: '28px',
    color: '#d1d5db',
    fontWeight: '600',
    marginBottom: '16px'
  },
  heroDescription: {
    fontSize: '18px',
    color: '#9ca3af',
    marginBottom: '32px',
    maxWidth: '600px',
    margin: '0 auto 32px'
  },
  heroButtons: {
    display: 'flex',
    gap: '20px',
    justifyContent: 'center',
    flexWrap: 'wrap'
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '24px',
    maxWidth: '900px',
    margin: '0 auto'
  },
  statCard: {
    textAlign: 'center'
  },
  categoriesSection: {
    marginBottom: '60px'
  },
  sectionTitle: {
    fontSize: '36px',
    color: '#f9fafb',
    marginBottom: '40px',
    fontWeight: '700',
    textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  categoriesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '24px'
  },
  categoryCard: {
    textAlign: 'center',
    cursor: 'pointer'
  },
  categoryName: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#f9fafb',
    marginBottom: '8px'
  },
  categoryCount: {
    fontSize: '14px',
    color: '#9ca3af'
  },
  offersSection: {
    marginBottom: '60px'
  },
  offersTitle: {
    fontSize: '36px',
    color: '#f9fafb',
    marginBottom: '40px',
    fontWeight: '700',
    textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  offersGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '32px'
  },
  offerCard: {
    overflow: 'hidden'
  },
  offerImage: {
    width: '100%',
    height: '260px',
    objectFit: 'cover'
  },
  offerContent: {
    padding: '32px'
  },
  offerTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#f9fafb',
    marginBottom: '12px'
  },
  offerDesc: {
    color: '#d1d5db',
    marginBottom: '20px',
    lineHeight: '1.7'
  },
  discountBadge: {
    display: 'inline-block',
    marginBottom: '12px'
  },
  offerDate: {
    fontSize: '13px',
    color: '#9ca3af'
  },
  howItWorksSection: {
    marginBottom: '60px'
  },
  stepsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '32px'
  },
  stepCard: {
    textAlign: 'center',
    position: 'relative'
  },
  stepNumber: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #6b7c59 0%, #556b2f 100%)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    fontWeight: '700',
    boxShadow: '0 4px 15px rgba(107, 124, 89, 0.4)'
  },
  stepTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#f9fafb',
    marginBottom: '12px'
  },
  stepDesc: {
    fontSize: '15px',
    color: '#d1d5db',
    lineHeight: '1.6'
  },
  productsSection: {
    marginBottom: '60px'
  },
  empty: {
    textAlign: 'center',
    padding: '80px 20px',
    color: '#9ca3af'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '40px'
  },
  finalCTA: {
    marginTop: '80px',
    marginBottom: '60px'
  },
  ctaCard: {
    textAlign: 'center',
    padding: '60px 40px',
    maxWidth: '600px',
    margin: '0 auto'
  },
  ctaTitle: {
    fontSize: '36px',
    fontWeight: '800',
    color: '#f9fafb',
    marginBottom: '16px'
  },
  ctaDesc: {
    fontSize: '18px',
    color: '#d1d5db',
    lineHeight: '1.6'
  }
};


// Responsive CSS
const responsiveStyles = `
  @media (max-width: 768px) {
    .netflix-hero {
      padding: 40px 16px !important;
    }
    
    .netflix-hero h1 {
      font-size: 48px !important;
    }
    
    .netflix-hero p {
      font-size: 16px !important;
    }
    
    .morph-button {
      width: 100%;
      margin-bottom: 12px;
    }
    
    .stats-card {
      padding: 20px !important;
    }
    
    .icon-3d {
      width: 48px !important;
      height: 48px !important;
      font-size: 24px !important;
    }
    
    .stats-number {
      font-size: 32px !important;
    }
    
    .category-card {
      padding: 20px !important;
    }
    
    .offer-card {
      margin-bottom: 16px;
    }
    
    .step-card {
      padding: 24px !important;
    }
  }
  
  @media (max-width: 480px) {
    .netflix-hero h1 {
      font-size: 36px !important;
    }
    
    .netflix-hero p {
      font-size: 14px !important;
    }
    
    .stats-number {
      font-size: 28px !important;
    }
    
    .sectionTitle {
      font-size: 24px !important;
    }
  }
`;

// Inject responsive styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = responsiveStyles;
  document.head.appendChild(styleElement);
}
