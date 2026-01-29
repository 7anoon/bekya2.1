import { useState } from 'react';

export default function Onboarding({ onComplete }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    { icon: '📸', title: 'صور منتجك', description: 'التقط صور واضحة لمنتجك من زوايا مختلفة. كل صورة تزيد من فرص البيع!', color: '#6b7c59', animation: 'bounce' },
    { icon: '🤖', title: 'الذكاء الاصطناعي يساعدك', description: 'نظامنا الذكي يقترح السعر المناسب ويحلل حالة المنتج تلقائياً', color: '#8b7355', animation: 'rotate' },
    { icon: '✅', title: 'موافقة سريعة', description: 'فريقنا يراجع منتجك بسرعة ويوافق عليه في أقل من 24 ساعة', color: '#10b981', animation: 'pulse' },
    { icon: '💰', title: 'ابدأ البيع', description: 'منتجك يظهر لآلاف المشترين. استقبل العروض وابدأ التفاوض!', color: '#f59e0b', animation: 'shake' }
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      if (onComplete) onComplete();
    }
  };

  const handleSkip = () => {
    if (onComplete) onComplete();
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.bgGradient} />
      <button style={styles.skipButton} onClick={handleSkip}>تخطي</button>
      <div style={styles.content}>
        <div style={{ ...styles.iconContainer, background: `linear-gradient(135deg, ${slides[currentSlide].color} 0%, ${slides[currentSlide].color}dd 100%)` }} className={`onboarding-icon-${slides[currentSlide].animation}`}>
          <div style={styles.icon} className="icon-3d">{slides[currentSlide].icon}</div>
        </div>
        <div style={styles.textContent} key={currentSlide}>
          <h1 style={styles.title} className="onboarding-fade-in">{slides[currentSlide].title}</h1>
          <p style={styles.description} className="onboarding-fade-in-delay">{slides[currentSlide].description}</p>
        </div>
        <div style={styles.dotsContainer}>
          {slides.map((_, index) => (
            <div key={index} style={{ ...styles.dot, ...(index === currentSlide ? styles.dotActive : {}), background: index === currentSlide ? `linear-gradient(90deg, ${slides[currentSlide].color} 0%, ${slides[currentSlide].color}aa 100%)` : 'rgba(107, 124, 89, 0.3)' }} onClick={() => setCurrentSlide(index)} />
          ))}
        </div>
        <div style={styles.buttonsContainer}>
          {currentSlide > 0 && (
            <button style={styles.prevButton} onClick={handlePrev} className="morph-button">السابق</button>
          )}
          <button style={{ ...styles.nextButton, background: `linear-gradient(135deg, ${slides[currentSlide].color} 0%, ${slides[currentSlide].color}dd 100%)`, flex: currentSlide === 0 ? 1 : 'initial' }} onClick={handleNext} className="morph-button">
            {currentSlide === slides.length - 1 ? 'ابدأ الآن' : 'التالي'}
          </button>
        </div>
      </div>
      <div style={styles.decorCircle1} />
      <div style={styles.decorCircle2} />
    </div>
  );
}

const styles = {
  container: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: '#0a0e27', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9998, overflow: 'hidden' },
  bgGradient: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(circle at 30% 50%, rgba(107, 124, 89, 0.15) 0%, transparent 50%), radial-gradient(circle at 70% 50%, rgba(139, 115, 85, 0.15) 0%, transparent 50%)', animation: 'pulse-bg 4s ease-in-out infinite' },
  skipButton: { position: 'absolute', top: '40px', left: '40px', background: 'rgba(107, 124, 89, 0.2)', color: '#d1d5db', border: 'none', padding: '12px 24px', borderRadius: '20px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s ease', backdropFilter: 'blur(10px)', zIndex: 10 },
  content: { position: 'relative', zIndex: 2, textAlign: 'center', padding: '40px', maxWidth: '600px', width: '100%' },
  iconContainer: { width: '200px', height: '200px', margin: '0 auto 60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 30px 80px rgba(0, 0, 0, 0.4), 0 0 60px rgba(107, 124, 89, 0.3)', position: 'relative' },
  icon: { fontSize: '100px', background: 'transparent', boxShadow: 'none' },
  textContent: { marginBottom: '60px', minHeight: '180px' },
  title: { fontSize: '48px', fontWeight: '900', color: '#f9fafb', marginBottom: '24px', letterSpacing: '-1px', textShadow: '0 4px 20px rgba(0, 0, 0, 0.5)' },
  description: { fontSize: '20px', color: '#d1d5db', lineHeight: '1.8', maxWidth: '500px', margin: '0 auto' },
  dotsContainer: { display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '40px' },
  dot: { width: '12px', height: '12px', borderRadius: '50%', cursor: 'pointer', transition: 'all 0.3s ease' },
  dotActive: { width: '40px', borderRadius: '6px', boxShadow: '0 0 20px rgba(107, 124, 89, 0.6)' },
  buttonsContainer: { display: 'flex', gap: '16px', justifyContent: 'center' },
  prevButton: { padding: '16px 32px', background: 'rgba(107, 124, 89, 0.2)', color: '#d1d5db', border: '2px solid rgba(107, 124, 89, 0.3)', borderRadius: '50px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.3s ease', backdropFilter: 'blur(10px)' },
  nextButton: { padding: '16px 48px', color: 'white', border: 'none', borderRadius: '50px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.3s ease', boxShadow: '0 8px 25px rgba(107, 124, 89, 0.4)' },
  decorCircle1: { position: 'absolute', top: '-100px', right: '-100px', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(107, 124, 89, 0.2) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(60px)', animation: 'float 6s ease-in-out infinite' },
  decorCircle2: { position: 'absolute', bottom: '-100px', left: '-100px', width: '250px', height: '250px', background: 'radial-gradient(circle, rgba(139, 115, 85, 0.2) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(60px)', animation: 'float 8s ease-in-out infinite reverse' }
};
