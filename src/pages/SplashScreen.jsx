import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SplashScreen({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [textIndex, setTextIndex] = useState(0);
  const navigate = useNavigate();

  const messages = [
    { icon: '🛒', text: 'بيكيا', subtitle: 'الحاجة القديمة لسه ليها قيمة' },
    { icon: '💎', text: 'جودة عالية', subtitle: 'منتجات مفحوصة بعناية' },
    { icon: '🚀', text: 'بيع سريع', subtitle: 'وصول لآلاف المشترين' },
    { icon: '✨', text: 'تجربة فريدة', subtitle: 'تصميم عصري وسهل' }
  ];

  useEffect(() => {
    const duration = 8000; // 8 seconds
    const interval = 50;
    const steps = duration / interval;
    const increment = 100 / steps;

    const progressTimer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressTimer);
          setTimeout(() => {
            if (onComplete) onComplete();
          }, 500);
          return 100;
        }
        return prev + increment;
      });
    }, interval);

    // Text rotation
    const textTimer = setInterval(() => {
      setTextIndex(prev => (prev + 1) % messages.length);
    }, 2000);

    return () => {
      clearInterval(progressTimer);
      clearInterval(textTimer);
    };
  }, [onComplete]);

  return (
    <div style={styles.container}>
      {/* Animated Background */}
      <div style={styles.bgAnimation}>
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            style={{
              ...styles.particle,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div style={styles.content}>
        {/* Logo Animation */}
        <div style={styles.logoContainer} className="splash-logo">
          <div style={styles.iconCircle} className="icon-3d">
            {messages[textIndex].icon}
          </div>
        </div>

        {/* Text Animation */}
        <div style={styles.textContainer} key={textIndex}>
          <h1 style={styles.title} className="netflix-shimmer splash-fade-in">
            {messages[textIndex].text}
          </h1>
          <p style={styles.subtitle} className="splash-fade-in-delay">
            {messages[textIndex].subtitle}
          </p>
        </div>

        {/* Progress Bar */}
        <div style={styles.progressContainer}>
          <div style={styles.progressBar}>
            <div 
              style={{
                ...styles.progressFill,
                width: `${progress}%`
              }}
            />
          </div>
          <p style={styles.progressText}>{Math.round(progress)}%</p>
        </div>
      </div>

      {/* Glow Effects */}
      <div style={styles.glowTop} />
      <div style={styles.glowBottom} />
    </div>
  );
}

const styles = {
  container: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    overflow: 'hidden'
  },
  bgAnimation: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden'
  },
  particle: {
    position: 'absolute',
    width: '4px',
    height: '4px',
    background: 'rgba(107, 124, 89, 0.6)',
    borderRadius: '50%',
    animation: 'float-up 6s linear infinite',
    boxShadow: '0 0 10px rgba(107, 124, 89, 0.8)'
  },
  content: {
    position: 'relative',
    zIndex: 2,
    textAlign: 'center',
    padding: '40px'
  },
  logoContainer: {
    marginBottom: '40px'
  },
  iconCircle: {
    width: '120px',
    height: '120px',
    margin: '0 auto',
    fontSize: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, rgba(107, 124, 89, 0.3) 0%, rgba(139, 115, 85, 0.3) 100%)',
    borderRadius: '50%',
    boxShadow: '0 20px 60px rgba(107, 124, 89, 0.4), 0 0 40px rgba(107, 124, 89, 0.3)',
    animation: 'pulse-glow 2s ease-in-out infinite'
  },
  textContainer: {
    marginBottom: '60px',
    minHeight: '120px'
  },
  title: {
    fontSize: '56px',
    fontWeight: '900',
    marginBottom: '16px',
    letterSpacing: '-1px'
  },
  subtitle: {
    fontSize: '20px',
    color: '#d1d5db',
    fontWeight: '400'
  },
  progressContainer: {
    maxWidth: '400px',
    margin: '0 auto'
  },
  progressBar: {
    width: '100%',
    height: '6px',
    background: 'rgba(107, 124, 89, 0.2)',
    borderRadius: '10px',
    overflow: 'hidden',
    marginBottom: '12px',
    boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)'
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #6b7c59 0%, #8b7355 100%)',
    borderRadius: '10px',
    transition: 'width 0.3s ease',
    boxShadow: '0 0 20px rgba(107, 124, 89, 0.6)',
    position: 'relative'
  },
  progressText: {
    fontSize: '14px',
    color: '#9ca3af',
    fontWeight: '600'
  },
  glowTop: {
    position: 'absolute',
    top: '-50%',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '600px',
    height: '600px',
    background: 'radial-gradient(circle, rgba(107, 124, 89, 0.2) 0%, transparent 70%)',
    filter: 'blur(60px)',
    animation: 'pulse-slow 4s ease-in-out infinite'
  },
  glowBottom: {
    position: 'absolute',
    bottom: '-50%',
    right: '20%',
    width: '500px',
    height: '500px',
    background: 'radial-gradient(circle, rgba(139, 115, 85, 0.15) 0%, transparent 70%)',
    filter: 'blur(60px)',
    animation: 'pulse-slow 5s ease-in-out infinite reverse'
  }
};
