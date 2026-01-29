import { useState } from 'react';

export default function ImageLightbox({ images, initialIndex = 0, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowRight') handlePrev();
    if (e.key === 'ArrowLeft') handleNext();
  };

  return (
    <div 
      style={styles.overlay} 
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <button 
        className="lightbox-close-btn"
        style={styles.closeBtn} 
        onClick={onClose}
      >
        ✕
      </button>

      <div style={styles.content} onClick={(e) => e.stopPropagation()}>
        <img 
          src={images[currentIndex]} 
          alt={`صورة ${currentIndex + 1}`}
          style={styles.image}
          className="lightbox-image"
        />

        {images.length > 1 && (
          <>
            <button 
              className="lightbox-nav-btn"
              style={{...styles.navBtn, ...styles.prevBtn}} 
              onClick={handlePrev}
            >
              ❮
            </button>
            <button 
              className="lightbox-nav-btn"
              style={{...styles.navBtn, ...styles.nextBtn}} 
              onClick={handleNext}
            >
              ❯
            </button>

            <div className="lightbox-counter" style={styles.counter}>
              {currentIndex + 1} / {images.length}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(10, 14, 39, 0.98) 100%)',
    backdropFilter: 'blur(20px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    cursor: 'pointer',
    animation: 'fadeIn 0.4s ease',
    padding: '20px'
  },
  content: {
    position: 'relative',
    maxWidth: '95vw',
    maxHeight: '95vh',
    cursor: 'default',
    animation: 'zoomIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  image: {
    maxWidth: '100%',
    maxHeight: '90vh',
    width: 'auto',
    height: 'auto',
    objectFit: 'contain',
    borderRadius: '20px',
    boxShadow: '0 30px 90px rgba(0, 0, 0, 0.8), 0 0 60px rgba(107, 124, 89, 0.3)',
    border: '3px solid rgba(107, 124, 89, 0.3)',
    transition: 'transform 0.3s ease'
  },
  closeBtn: {
    position: 'fixed',
    top: '30px',
    right: '30px',
    background: 'linear-gradient(135deg, rgba(107, 124, 89, 0.9) 0%, rgba(85, 107, 47, 0.9) 100%)',
    border: 'none',
    borderRadius: '50%',
    width: '56px',
    height: '56px',
    fontSize: '28px',
    color: 'white',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
    transition: 'all 0.3s ease',
    boxShadow: '0 8px 25px rgba(107, 124, 89, 0.5)',
    fontWeight: '300'
  },
  navBtn: {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'linear-gradient(135deg, rgba(107, 124, 89, 0.9) 0%, rgba(85, 107, 47, 0.9) 100%)',
    border: 'none',
    borderRadius: '50%',
    width: '64px',
    height: '64px',
    fontSize: '32px',
    color: 'white',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease',
    boxShadow: '0 8px 25px rgba(107, 124, 89, 0.5)',
    fontWeight: '700',
    zIndex: 10001
  },
  prevBtn: {
    right: '-80px'
  },
  nextBtn: {
    left: '-80px'
  },
  counter: {
    position: 'fixed',
    bottom: '40px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'linear-gradient(135deg, rgba(107, 124, 89, 0.95) 0%, rgba(85, 107, 47, 0.95) 100%)',
    backdropFilter: 'blur(10px)',
    padding: '12px 32px',
    borderRadius: '30px',
    fontSize: '16px',
    fontWeight: '700',
    color: 'white',
    boxShadow: '0 8px 25px rgba(107, 124, 89, 0.5)',
    border: '2px solid rgba(107, 124, 89, 0.3)',
    zIndex: 10000
  }
};
