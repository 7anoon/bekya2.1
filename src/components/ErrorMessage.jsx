export default function ErrorMessage({ error, onRetry, onDismiss }) {
  if (!error) return null;

  const getErrorIcon = (errorMsg) => {
    if (errorMsg.includes('إنترنت') || errorMsg.includes('اتصال')) return '📡';
    if (errorMsg.includes('كلمة المرور')) return '🔒';
    if (errorMsg.includes('اسم المستخدم')) return '👤';
    if (errorMsg.includes('بريد')) return '📧';
    if (errorMsg.includes('صورة')) return '🖼️';
    if (errorMsg.includes('سعر')) return '💰';
    return '⚠️';
  };

  const getErrorSuggestion = (errorMsg) => {
    if (errorMsg.includes('إنترنت') || errorMsg.includes('اتصال') || errorMsg.includes('مهلة')) {
      return 'تأكد من اتصالك بالإنترنت وحاول مرة أخرى';
    }
    if (errorMsg.includes('كلمة المرور')) {
      return 'تأكد من كتابة كلمة المرور بشكل صحيح';
    }
    if (errorMsg.includes('اسم المستخدم موجود')) {
      return 'جرب اسم مستخدم آخر';
    }
    if (errorMsg.includes('اسم المستخدم غير موجود')) {
      return 'تأكد من كتابة اسم المستخدم بشكل صحيح';
    }
    if (errorMsg.includes('500 جنيه')) {
      return 'بيكيا تقبل فقط المنتجات التي سعرها الأصلي أقل من 500 جنيه';
    }
    return null;
  };

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.icon}>{getErrorIcon(error)}</div>
        <div style={styles.textContainer}>
          <div style={styles.errorText}>{error}</div>
          {getErrorSuggestion(error) && (
            <div style={styles.suggestion}>{getErrorSuggestion(error)}</div>
          )}
        </div>
      </div>
      <div style={styles.actions}>
        {onRetry && (
          <button onClick={onRetry} style={styles.retryButton}>
            إعادة المحاولة
          </button>
        )}
        {onDismiss && (
          <button onClick={onDismiss} style={styles.dismissButton}>
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '12px',
    animation: 'shake 0.5s ease-in-out'
  },
  content: {
    display: 'flex',
    gap: '12px',
    flex: 1
  },
  icon: {
    fontSize: '24px',
    flexShrink: 0
  },
  textContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    flex: 1
  },
  errorText: {
    color: '#fca5a5',
    fontSize: '14px',
    fontWeight: '600',
    lineHeight: '1.5'
  },
  suggestion: {
    color: '#fcd34d',
    fontSize: '13px',
    lineHeight: '1.4'
  },
  actions: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center'
  },
  retryButton: {
    background: 'rgba(239, 68, 68, 0.2)',
    border: '1px solid rgba(239, 68, 68, 0.4)',
    color: '#fca5a5',
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap'
  },
  dismissButton: {
    background: 'transparent',
    border: 'none',
    color: '#fca5a5',
    fontSize: '18px',
    cursor: 'pointer',
    padding: '4px 8px',
    opacity: 0.7,
    transition: 'opacity 0.2s ease'
  }
};
