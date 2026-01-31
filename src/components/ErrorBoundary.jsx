import { Component } from 'react';
import { logError } from '../lib/utils';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    logError('Error caught by boundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={styles.container}>
          <div style={styles.content}>
            <div style={styles.icon}>⚠️</div>
            <h1 style={styles.title}>عذراً، حدث خطأ</h1>
            <p style={styles.message}>
              حدث خطأ غير متوقع. يرجى تحديث الصفحة والمحاولة مرة أخرى.
            </p>
            <button 
              onClick={this.handleReset}
              style={styles.button}
              className="btn btn-primary"
            >
              تحديث الصفحة
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
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
    zIndex: 9999
  },
  content: {
    textAlign: 'center',
    padding: '40px',
    maxWidth: '500px'
  },
  icon: {
    fontSize: '80px',
    marginBottom: '24px'
  },
  title: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#f9fafb',
    marginBottom: '16px'
  },
  message: {
    fontSize: '18px',
    color: '#d1d5db',
    lineHeight: '1.6',
    marginBottom: '32px'
  },
  button: {
    padding: '16px 48px',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer'
  }
};

export default ErrorBoundary;
