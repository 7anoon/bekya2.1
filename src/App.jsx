import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { supabase } from './lib/supabase';
import { log, logError } from './lib/utils';
import ErrorBoundary from './components/ErrorBoundary';
import OfflineDetector from './components/OfflineDetector';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Home from './pages/Home';
import Browse from './pages/Browse';
import AddProduct from './pages/AddProduct';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import ManageOffers from './pages/ManageOffers';
import Notifications from './pages/Notifications';
import ProductDetails from './pages/ProductDetails';
import SetAdminRole from './pages/SetAdminRole';
import Navbar from './components/Navbar';

function App() {
  const { user, profile, loadUser, isLoading } = useAuthStore();

  // Initialize auth on app start
  useEffect(() => {
    // Only clear cache on first visit or when explicitly needed
    const hasInitialized = sessionStorage.getItem('app-initialized');
    
    if (!hasInitialized) {
      sessionStorage.setItem('app-initialized', 'true');
      log('App initialized');
    }
  }, []);

  // Save current route to localStorage on route change
  useEffect(() => {
    const saveCurrentRoute = () => {
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/signup') {
        localStorage.setItem('lastVisitedPage', currentPath);
      }
    };

    // Save route when component mounts and on popstate events
    saveCurrentRoute();
    window.addEventListener('popstate', saveCurrentRoute);
    
    return () => {
      window.removeEventListener('popstate', saveCurrentRoute);
    };
  }, []);

  useEffect(() => {
    loadUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadUser();
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [loadUser]);

  // Wait for initial load before showing routes
  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <BrowserRouter basename="/bekya2.1">
      <OfflineDetector />
      {user && <Navbar />}
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        <Route path="/signup" element={!user ? <SignUp /> : <Navigate to="/" />} />
        <Route path="/" element={user ? <Home /> : <Navigate to="/login" />} />
        <Route path="/browse" element={user ? <Browse /> : <Navigate to="/login" />} />
        <Route path="/add-product" element={user ? <AddProduct /> : <Navigate to="/login" />} />
        <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
        <Route path="/notifications" element={user ? <Notifications /> : <Navigate to="/login" />} />
        <Route path="/product/:id" element={user ? <ProductDetails /> : <Navigate to="/login" />} />
        <Route 
          path="/admin" 
          element={user && profile?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/" />} 
        />
        <Route 
          path="/admin/offers" 
          element={user && profile?.role === 'admin' ? <ManageOffers /> : <Navigate to="/" />} 
        />
        <Route 
          path="/set-admin" 
          element={user ? <SetAdminRole /> : <Navigate to="/login" />} 
        />
      </Routes>
    </BrowserRouter>
  );
}

// Wrap App with ErrorBoundary
function AppWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}

export default AppWithErrorBoundary;
