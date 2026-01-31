import React from 'react';

// Skeleton loading component for cards
export const CardSkeleton = ({ count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="card" style={styles.skeletonCard}>
          <div style={styles.skeletonImage}></div>
          <div style={styles.skeletonContent}>
            <div style={styles.skeletonTitle}></div>
            <div style={styles.skeletonText}></div>
            <div style={styles.skeletonTextShort}></div>
            <div style={styles.skeletonPrice}></div>
          </div>
        </div>
      ))}
    </>
  );
};

// Skeleton for product lists
export const ProductListSkeleton = ({ count = 6 }) => {
  return (
    <div style={styles.grid}>
      {Array.from({ length: count }).map((_, index) => (
        <CardSkeleton key={index} />
      ))}
    </div>
  );
};

// Skeleton for profile page
export const ProfileSkeleton = () => {
  return (
    <div className="container">
      {/* Stats cards skeleton */}
      <div style={styles.statsGrid}>
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="stats-card" style={styles.skeletonStat}>
            <div style={styles.skeletonIcon}></div>
            <div style={styles.skeletonStatContent}>
              <div style={styles.skeletonNumber}></div>
              <div style={styles.skeletonLabel}></div>
            </div>
          </div>
        ))}
      </div>

      <div className="glow-divider"></div>

      {/* Profile info skeleton */}
      <div className="card" style={styles.skeletonCard}>
        <div style={styles.skeletonHeader}>
          <div style={styles.skeletonTitleLarge}></div>
          <div style={styles.skeletonButton}></div>
        </div>
        <div style={styles.skeletonInfo}>
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} style={styles.skeletonInfoRow}>
              <div style={styles.skeletonLabelSmall}></div>
              <div style={styles.skeletonValue}></div>
            </div>
          ))}
        </div>
      </div>

      {/* Products section skeleton */}
      <div style={styles.productsSection}>
        <div style={styles.skeletonSubtitle}></div>
        <ProductListSkeleton count={3} />
      </div>
    </div>
  );
};

// Skeleton for browse page
export const BrowseSkeleton = () => {
  return (
    <div className="container">
      {/* Header skeleton */}
      <div style={styles.header}>
        <div style={styles.skeletonTitleContainer}>
          <div style={styles.skeletonIconLarge}></div>
          <div style={styles.skeletonTitleLarge}></div>
        </div>
        <div style={styles.skeletonSubtitle}></div>
      </div>

      {/* Category dropdown skeleton */}
      <div style={styles.categoriesBar}>
        <div style={styles.skeletonDropdown}></div>
      </div>

      {/* Products info skeleton */}
      <div style={styles.productsInfo}>
        <div style={styles.skeletonCount}></div>
      </div>

      {/* Product list skeleton */}
      <ProductListSkeleton count={8} />
    </div>
  );
};

// Skeleton for notifications page
export const NotificationsSkeleton = ({ count = 5 }) => {
  return (
    <div className="container">
      {/* Header skeleton */}
      <div style={styles.header}>
        <div style={styles.skeletonTitleLarge}></div>
        <div style={styles.skeletonButtonSmall}></div>
      </div>

      {/* Notifications list skeleton */}
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="card" style={styles.skeletonNotification}>
          <div style={styles.skeletonNotificationContent}>
            <div style={styles.skeletonIconMedium}></div>
            <div style={styles.skeletonNotificationBody}>
              <div style={styles.skeletonText}></div>
              <div style={styles.skeletonTextShort}></div>
              <div style={styles.skeletonTime}></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const styles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '40px',
    marginBottom: '60px'
  },
  
  skeletonCard: {
    padding: '24px',
    background: 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(10px)',
    animation: 'skeleton-pulse 1.5s ease-in-out infinite'
  },
  
  skeletonImage: {
    width: '100%',
    height: '200px',
    background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
    backgroundSize: '200% 100%',
    borderRadius: '16px',
    marginBottom: '20px',
    animation: 'skeleton-shimmer 1.5s infinite'
  },
  
  skeletonContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  
  skeletonTitle: {
    height: '24px',
    background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
    backgroundSize: '200% 100%',
    borderRadius: '8px',
    maxWidth: '80%',
    animation: 'skeleton-shimmer 1.5s infinite'
  },
  
  skeletonText: {
    height: '16px',
    background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
    backgroundSize: '200% 100%',
    borderRadius: '6px',
    maxWidth: '90%',
    animation: 'skeleton-shimmer 1.5s infinite'
  },
  
  skeletonTextShort: {
    height: '16px',
    background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
    backgroundSize: '200% 100%',
    borderRadius: '6px',
    maxWidth: '60%',
    animation: 'skeleton-shimmer 1.5s infinite'
  },
  
  skeletonPrice: {
    height: '28px',
    background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
    backgroundSize: '200% 100%',
    borderRadius: '8px',
    maxWidth: '40%',
    animation: 'skeleton-shimmer 1.5s infinite'
  },
  
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '24px',
    marginBottom: '40px'
  },
  
  skeletonStat: {
    padding: '32px',
    background: 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(10px)',
    animation: 'skeleton-pulse 1.5s ease-in-out infinite'
  },
  
  skeletonIcon: {
    width: '60px',
    height: '60px',
    background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
    backgroundSize: '200% 100%',
    borderRadius: '50%',
    marginBottom: '16px',
    animation: 'skeleton-shimmer 1.5s infinite'
  },
  
  skeletonStatContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px'
  },
  
  skeletonNumber: {
    height: '32px',
    width: '60px',
    background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
    backgroundSize: '200% 100%',
    borderRadius: '8px',
    animation: 'skeleton-shimmer 1.5s infinite'
  },
  
  skeletonLabel: {
    height: '18px',
    width: '100px',
    background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
    backgroundSize: '200% 100%',
    borderRadius: '6px',
    animation: 'skeleton-shimmer 1.5s infinite'
  },
  
  skeletonHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
    flexWrap: 'wrap',
    gap: '16px'
  },
  
  skeletonTitleLarge: {
    height: '40px',
    width: '200px',
    background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
    backgroundSize: '200% 100%',
    borderRadius: '12px',
    animation: 'skeleton-shimmer 1.5s infinite'
  },
  
  skeletonButton: {
    height: '40px',
    width: '120px',
    background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
    backgroundSize: '200% 100%',
    borderRadius: '20px',
    animation: 'skeleton-shimmer 1.5s infinite'
  },
  
  skeletonInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  
  skeletonInfoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '16px',
    background: 'rgba(107, 124, 89, 0.04)',
    borderRadius: '16px'
  },
  
  skeletonLabelSmall: {
    height: '16px',
    width: '100px',
    background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
    backgroundSize: '200% 100%',
    borderRadius: '6px',
    animation: 'skeleton-shimmer 1.5s infinite'
  },
  
  skeletonValue: {
    height: '16px',
    width: '150px',
    background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
    backgroundSize: '200% 100%',
    borderRadius: '6px',
    animation: 'skeleton-shimmer 1.5s infinite'
  },
  
  productsSection: {
    marginTop: '48px'
  },
  
  skeletonSubtitle: {
    height: '32px',
    width: '180px',
    background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
    backgroundSize: '200% 100%',
    borderRadius: '12px',
    marginBottom: '32px',
    animation: 'skeleton-shimmer 1.5s infinite'
  },
  
  header: {
    textAlign: 'center',
    marginBottom: '48px',
    padding: '40px 20px'
  },
  
  skeletonTitleContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '20px',
    marginBottom: '16px'
  },
  
  skeletonIconLarge: {
    width: '100px',
    height: '100px',
    background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
    backgroundSize: '200% 100%',
    borderRadius: '50%',
    animation: 'skeleton-shimmer 1.5s infinite'
  },
  
  categoriesBar: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '40px'
  },
  
  skeletonDropdown: {
    width: '100%',
    maxWidth: '400px',
    height: '60px',
    background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
    backgroundSize: '200% 100%',
    borderRadius: '50px',
    animation: 'skeleton-shimmer 1.5s infinite'
  },
  
  productsInfo: {
    textAlign: 'center',
    marginBottom: '32px'
  },
  
  skeletonCount: {
    height: '20px',
    width: '150px',
    background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
    backgroundSize: '200% 100%',
    borderRadius: '8px',
    margin: '0 auto',
    animation: 'skeleton-shimmer 1.5s infinite'
  },
  
  skeletonNotification: {
    padding: '20px',
    marginBottom: '12px',
    animation: 'skeleton-pulse 1.5s ease-in-out infinite'
  },
  
  skeletonNotificationContent: {
    display: 'flex',
    gap: '16px',
    alignItems: 'flex-start'
  },
  
  skeletonIconMedium: {
    width: '50px',
    height: '50px',
    background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
    backgroundSize: '200% 100%',
    borderRadius: '50%',
    animation: 'skeleton-shimmer 1.5s infinite'
  },
  
  skeletonNotificationBody: {
    flex: '1',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  
  skeletonTime: {
    height: '14px',
    width: '80px',
    background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
    backgroundSize: '200% 100%',
    borderRadius: '6px',
    animation: 'skeleton-shimmer 1.5s infinite'
  },
  
  skeletonButtonSmall: {
    height: '36px',
    width: '160px',
    background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
    backgroundSize: '200% 100%',
    borderRadius: '18px',
    animation: 'skeleton-shimmer 1.5s infinite'
  }
};

// Add CSS animations
const skeletonStyles = `
  @keyframes skeleton-pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
  
  @keyframes skeleton-shimmer {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = skeletonStyles;
  document.head.appendChild(styleSheet);
}

export default {
  CardSkeleton,
  ProductListSkeleton,
  ProfileSkeleton,
  BrowseSkeleton,
  NotificationsSkeleton
};