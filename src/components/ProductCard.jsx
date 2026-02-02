import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ImageLightbox from './ImageLightbox';

export default function ProductCard({ product, isAdmin, onDelete }) {
  const [showLightbox, setShowLightbox] = useState(false);
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/product/${product.id}`);
  };

  const handleImageClick = (e) => {
    e.stopPropagation(); // منع انتقال الحدث للكارد
    setShowLightbox(true);
  };

  const handleDelete = (e) => {
    e.stopPropagation(); // منع انتقال الحدث للكارد
    if (onDelete) {
      onDelete(product.id);
    }
  };

  return (
    <>
      <div className="card netflix-spotlight netflix-lift" style={styles.card} onClick={handleCardClick}>
        <div 
          style={styles.imageContainer}
          onClick={handleImageClick}
        >
          <img 
            src={product.images[0]} 
            alt={product.title}
            style={styles.image}
            loading="lazy"
            onError={(e) => {
              e.target.src = 'https://placehold.co/300x200/e2e8f0/64748b?text=Image+Not+Found';
            }}
          />
          {product.images.length > 1 && (
            <div style={styles.imageCount} className="netflix-badge">
              📷 {product.images.length}
            </div>
          )}
          {product.active_offer && (
            <div style={styles.offerOverlay} className="netflix-badge">
              🔥 خصم {product.active_offer.discount_percentage}%
            </div>
          )}
        </div>
      
      <div style={styles.content}>
        <h3 style={styles.title}>{product.title}</h3>
        <p style={styles.description}>{product.description}</p>
        
        {isAdmin && (
          <button
            onClick={handleDelete}
            style={styles.deleteButton}
            className="btn"
          >
            🗑️ حذف
          </button>
        )}
        
        <div style={styles.details}>
          <div style={styles.priceContainer}>
            {product.active_offer ? (
              <>
                <div style={styles.offerBadge}>
                  🎉 خصم {product.active_offer.discount_percentage}%
                </div>
                <div style={styles.priceWithDiscount}>
                  <span style={styles.oldPrice}>{product.original_final_price} جنيه</span>
                  <span style={styles.newPrice}>{product.final_price} جنيه</span>
                </div>
              </>
            ) : (
              <span style={styles.price}>{product.final_price} جنيه</span>
            )}
          </div>
          <span style={styles.condition}>{product.condition}</span>
        </div>

        <div style={styles.seller}>
          <span>البائع: {product.profiles?.username}</span>
          <span>📍 {product.profiles?.location}</span>
        </div>
      </div>
    </div>

    {showLightbox && (
      <ImageLightbox 
        images={product.images}
        onClose={() => setShowLightbox(false)}
      />
    )}
  </>
  );
}

const styles = {
  card: {
    overflow: 'hidden',
    transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'pointer',
    animation: 'fadeInUp 0.6s ease-out',
    position: 'relative'
  },
  imageContainer: {
    width: '100%',
    height: '320px',
    overflow: 'hidden',
    background: 'linear-gradient(135deg, #1a1f2e 0%, #2d3748 100%)',
    position: 'relative',
    cursor: 'pointer'
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
    filter: 'brightness(0.9) contrast(1.1) saturate(1.2)'
  },
  imageCount: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    zIndex: 2
  },
  offerOverlay: {
    position: 'absolute',
    top: '16px',
    left: '16px',
    zIndex: 2,
    animation: 'badge-pulse 2s ease-in-out infinite'
  },
  content: {
    padding: '32px',
    position: 'relative',
    zIndex: 1
  },
  title: {
    fontSize: '24px',
    fontWeight: '800',
    marginBottom: '14px',
    color: '#f9fafb',
    lineHeight: '1.3',
    letterSpacing: '-0.5px',
    textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
  },
  description: {
    color: '#d1d5db',
    fontSize: '15px',
    marginBottom: '24px',
    lineHeight: '1.7',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden'
  },
  details: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginBottom: '24px'
  },
  priceContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  offerBadge: {
    background: 'linear-gradient(135deg, #8b7355 0%, #6d5a42 100%)',
    color: 'white',
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '700',
    alignSelf: 'flex-start',
    boxShadow: '0 4px 12px rgba(139, 115, 85, 0.4), 0 0 20px rgba(139, 115, 85, 0.2)',
    animation: 'pulse 2s ease-in-out infinite',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  priceWithDiscount: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px'
  },
  oldPrice: {
    fontSize: '18px',
    color: '#6b7280',
    textDecoration: 'line-through',
    fontWeight: '500'
  },
  newPrice: {
    fontSize: '32px',
    fontWeight: '900',
    background: 'linear-gradient(135deg, #6b7c59 0%, #8b7355 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    letterSpacing: '-1px',
    textShadow: '0 0 20px rgba(107, 124, 89, 0.5)'
  },
  price: {
    fontSize: '30px',
    fontWeight: '900',
    background: 'linear-gradient(135deg, #6b7c59 0%, #8b7355 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    letterSpacing: '-1px'
  },
  condition: {
    background: 'rgba(107, 124, 89, 0.2)',
    color: '#a7f3d0',
    padding: '8px 18px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '700',
    alignSelf: 'flex-start',
    border: '1px solid rgba(107, 124, 89, 0.3)',
    boxShadow: '0 2px 8px rgba(107, 124, 89, 0.2)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  seller: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    color: '#9ca3af',
    paddingTop: '24px',
    borderTop: '2px solid rgba(107, 124, 89, 0.15)',
    fontWeight: '600'
  },
  deleteButton: {
    background: '#dc2626',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    marginBottom: '16px',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 12px rgba(220, 38, 38, 0.4)'
  }
};
